#!/usr/bin/env python3
"""Verify physical SFX events and native browser audio without screenshots.

Run: python3 -B 02-wandmoss-journey/tests/effects_check.py
Uses the existing standard-library Chrome driver. Native nodes remain connected
to their normal output; additional analysers measure the final effects signal.
Real browser input unlocks audio under Chrome's normal autoplay policy. Physics
uses a controlled animation clock, and sound samples use actual audio time.
Listening quality, physical devices and other browser engines are not assessed.
"""

import json
import sys
import time

from browser_check import Browser, PROJECT, check, load_boss_checkpoint, reload_game


RESULTS = []
EVENTS = ["step", "jump", "rocketJump", "enemyContact", "bossContact", "bossCharge"]
INSTRUMENT_AUDIO = r"""
(() => {
  window.__sfxNodes = [];
  window.__sfxOutputs = [];
  const records = new WeakMap();
  const originalConnect = AudioNode.prototype.connect;
  const originalDisconnect = AudioNode.prototype.disconnect;
  AudioNode.prototype.connect = function(destination, ...args) {
    const result = originalConnect.call(this, destination, ...args);
    if (destination === this.context.destination) {
      const analyser = this.context.createAnalyser();
      analyser.fftSize = 256;
      originalConnect.call(this, analyser);
      window.__sfxOutputs.push({context:this.context, node:this, analyser});
    }
    return result;
  };
  AudioNode.prototype.disconnect = function(...args) {
    const record = records.get(this);
    if (record) record.disconnects++;
    return originalDisconnect.apply(this, args);
  };
  for (const [method, kind] of [['createOscillator','tone'], ['createBufferSource','noise']]) {
    const native = AudioContext.prototype[method];
    AudioContext.prototype[method] = function(...args) {
      const source = native.apply(this, args);
      const record = {source, kind, starts:[], stops:[], disconnects:0, ended:false};
      records.set(source, record); window.__sfxNodes.push(record);
      const start = source.start, stop = source.stop;
      source.start = function(...values) {
        record.starts.push({time:values[0] ?? this.context.currentTime,
          type:this.type, duration:this.buffer?.duration});
        return start.apply(this, values);
      };
      source.stop = function(...values) {
        record.stops.push(values[0] ?? this.context.currentTime);
        return stop.apply(this, values);
      };
      source.addEventListener('ended', () => {record.ended=true;});
      return source;
    };
  }
  window.__sampleEffects = (duration=.25) => new Promise(resolve => {
    const end = performance.now()+duration*1000;
    let peak=0, rms=0, samples=0;
    const timer = setInterval(() => {
      for (const output of window.__sfxOutputs) {
        if (output.context !== Wandmoss.effects.context) continue;
        const data = new Float32Array(output.analyser.fftSize);
        output.analyser.getFloatTimeDomainData(data);
        let square=0;
        for(const value of data) {peak=Math.max(peak,Math.abs(value));square+=value*value;}
        rms=Math.max(rms,Math.sqrt(square/data.length)); samples++;
      }
      if (performance.now()>=end) {clearInterval(timer);resolve({peak,rms,samples});}
    }, 4);
  });
})();
"""

# The reference retains the two pre-tuning recipes and their shared native
# synthesis, captured before the owner's audibility-feedback correction. Render
# it and today's production controller in the same browser at a fixed rate.
# This measures a signal increase, not whether a listener perceives the result.
AUDIBILITY_REFERENCE = r"""
window.__compareEffectsAudibility = async event => {
  const metrics = buffer => {
    const data=buffer.getChannelData(0);
    let peak=0, energy=0, active=0;
    for(const x of data) {
      peak=Math.max(peak,Math.abs(x)); energy+=x*x;
      if(Math.abs(x)>.0001) active++;
    }
    return {peak,rms:Math.sqrt(energy/data.length),energy,
      activeSeconds:active/buffer.sampleRate};
  };
  const oldContext=new OfflineAudioContext(1,44100,44100);
  const output=oldContext.createGain();
  output.gain.value=.7; output.connect(oldContext.destination);
  const envelope=(source,length,volume,filter) => {
    const gain=oldContext.createGain();
    gain.gain.setValueAtTime(.0001,0);
    gain.gain.linearRampToValueAtTime(volume,.004);
    gain.gain.exponentialRampToValueAtTime(.0001,length);
    source.connect(filter||gain);
    if(filter) filter.connect(gain);
    gain.connect(output); source.start(0); source.stop(length);
  };
  const noise=(length,volume,frequency,endFrequency) => {
    const buffer=oldContext.createBuffer(1,Math.ceil(44100*.35),44100);
    const samples=buffer.getChannelData(0); let seed=4217;
    for(let i=0;i<samples.length;i++) {
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      samples[i]=seed/2147483648-1;
    }
    const source=oldContext.createBufferSource(),filter=oldContext.createBiquadFilter();
    source.buffer=buffer; filter.type='bandpass'; filter.Q.value=.7;
    filter.frequency.setValueAtTime(frequency,0);
    filter.frequency.exponentialRampToValueAtTime(endFrequency,length);
    envelope(source,length,volume,filter);
  };
  const tone=(frequency,length,volume,slide) => {
    const source=oldContext.createOscillator(); source.type='triangle';
    source.frequency.setValueAtTime(frequency,0);
    source.frequency.exponentialRampToValueAtTime(Math.max(30,frequency*slide),length);
    envelope(source,length,volume);
  };
  if(event==='rocketJump') {
    noise(.22,.03,760,210); tone(95,.18,.021,2.2);
  } else if(event==='bossCharge') {
    noise(.27,.03,620,170); tone(120,.23,.022,.6);
  } else throw new Error('Only the two reported effects have archived references');
  const old=metrics(await oldContext.startRendering());
  const NativeContext=window.AudioContext;
  let currentContext;
  // The adapter permits scheduling before native offline rendering starts.
  // It changes only the offline context's state/resume gate; its graph, sample
  // generation, filters, automation and final mix are native Web Audio.
  window.AudioContext=function() {
    currentContext=new OfflineAudioContext(1,44100,44100);
    Object.defineProperty(currentContext,'state',{get:()=> 'running'});
    currentContext.resume=()=>Promise.resolve();
    return currentContext;
  };
  try {
    const effects=MossEffects.create(); effects.setEnabled(true);
    if(!await effects.unlock()) throw new Error('Offline effects adapter failed');
    effects.play(event);
    return {old,current:metrics(await currentContext.startRendering())};
  } finally {window.AudioContext=NativeContext;}
};
"""


def checked(cdp, name, expression):
    check(cdp, name, expression)
    RESULTS.append(name)


def wait_for(cdp, expression, timeout=5):
    deadline = time.monotonic() + timeout
    while not cdp.evaluate(expression):
        if time.monotonic() >= deadline:
            detail = cdp.evaluate("({mode:Wandmoss.state.mode,enabled:Wandmoss.effects.enabled,voices:Wandmoss.effects.activeVoices,context:Wandmoss.effects.context?.state,nodes:__sfxNodes.slice(-12).map(n=>({kind:n.kind,starts:n.starts,stops:n.stops,disconnects:n.disconnects,ended:n.ended}))})")
            raise AssertionError(f"Timed out: {expression}\n{json.dumps(detail)}")
        time.sleep(.01)


def click(cdp, selector):
    cdp.evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'center'}})")
    cdp.click(selector)


def tap(cdp, key, code):
    cdp.key(key, code)
    cdp.key(key, code, False)


def finish_audio(cdp):
    wait_for(cdp, "Wandmoss.effects.activeVoices===0", timeout=3)
    # The analyser retains one recent audio block after a source ends.
    time.sleep(.03)


def capture_events(cdp):
    cdp.evaluate("window.__playedEffects=[];const nativePlay=Wandmoss.effects.play;Wandmoss.effects.play=function(event){__playedEffects.push(event);return nativePlay.call(this,event)}")


def seed_jingle(cdp):
    cdp.evaluate("Wandmoss.effects.stop();window.__cancelFrom=__sfxNodes.length;Wandmoss.effects.play('checkpoint');window.__cancelUntil=__sfxNodes.length")
    checked(cdp, "Checkpoint fixture starts cancellable native sources", "Wandmoss.effects.activeVoices>0 && __sfxNodes.length>__cancelFrom")


def cancelled(cdp, name, require_silent=True):
    checked(cdp, name,
            ("Wandmoss.effects.activeVoices===0 && " if require_silent else "") +
            "__sfxNodes.slice(__cancelFrom,__cancelUntil).every(n=>n.disconnects>0 && n.stops.some(t=>t<=n.source.context.currentTime+.02))")


def desktop_checks(url):
    with Browser(height=1200) as browser:
        cdp = browser.cdp
        cdp.call("Page.addScriptToEvaluateOnNewDocument", source=INSTRUMENT_AUDIO)
        browser.open(url)
        for result in cdp.evaluate((PROJECT / "tests/effects_checks.js").read_text()):
            print("PASS", result["name"], json.dumps(result["detail"]))
            RESULTS.append(result["name"])
        checked(cdp, "Fresh page has effects muted, no audio context and no synthesized sources",
                "!Wandmoss.effects.enabled && Wandmoss.effects.context===null && Wandmoss.effects.activeVoices===0 && __sfxNodes.length===0")
        click(cdp, "#primary")
        tap(cdp, " ", "Space"); cdp.frames(12)
        checked(cdp, "Muted gameplay never creates native effects nodes",
                "Wandmoss.state.player.y<480 && __sfxNodes.length===0 && Wandmoss.effects.context===null")
        click(cdp, "#sound")
        wait_for(cdp, "Wandmoss.effects.context?.state==='running'")
        checked(cdp, "Real sound-button gesture unlocks a native AudioContext and effects output",
                "Wandmoss.effects.enabled && Wandmoss.music.enabled && __testAudio.includes(Wandmoss.effects.context) && __sfxOutputs.some(o=>o.context===Wandmoss.effects.context)")
        cdp.evaluate("Wandmoss.restart();Wandmoss.effects.stop()")
        finish_audio(cdp)

        cdp.evaluate(AUDIBILITY_REFERENCE)
        for event in ["rocketJump", "bossCharge"]:
            comparison = cdp.evaluate(f"__compareEffectsAudibility({json.dumps(event)})")
            previous, current = comparison["old"], comparison["current"]
            checked(cdp, f"{event}: native rendered RMS is at least twice its pre-tuning reference",
                    json.dumps(current["rms"] >= previous["rms"] * 2))
            checked(cdp, f"{event}: effective signal lasts longer than its pre-tuning reference without clipping",
                    json.dumps(current["activeSeconds"] > previous["activeSeconds"] * 1.2 and current["peak"] < .25))
            print("Native audibility comparison", event, json.dumps(comparison))

        signatures = {}
        for event in EVENTS:
            cdp.evaluate(f"Wandmoss.effects.stop();window.__signalFrom=__sfxNodes.length;Wandmoss.effects.play({json.dumps(event)})")
            signal = cdp.evaluate("__sampleEffects(.4)")
            checked(cdp, f"{event}: native final output contains a finite signal below clipping",
                    json.dumps(signal["samples"] > 0 and 0 < signal["rms"] <= signal["peak"] < .25))
            finish_audio(cdp)
            checked(cdp, f"{event}: ended native sources are stopped and disconnected",
                    "__sfxNodes.length>__signalFrom && __sfxNodes.slice(__signalFrom).every(n=>n.starts.length===1 && n.stops.length>=1 && n.ended && n.disconnects>0)")
            signatures[event] = cdp.evaluate("__sfxNodes.slice(__signalFrom).map(n=>({kind:n.kind,start:n.starts[0],length:Number((n.stops[0]-n.starts[0].time).toFixed(5))}))")
            # Compare design signatures without context-relative absolute times.
            for item in signatures[event]:
                item["start"].pop("time", None)
            print("Native effects signal", event, json.dumps(signal), json.dumps(signatures[event]))
        checked(cdp, "Ordinary and rocket jumps have distinct native source signatures",
                json.dumps(signatures["jump"] != signatures["rocketJump"]))
        checked(cdp, "Enemy and boss contact have distinct native source signatures",
                json.dumps(signatures["enemyContact"] != signatures["bossContact"]))
        silence = cdp.evaluate("__sampleEffects(.1)")
        checked(cdp, "Finished effects return to an actually silent final output",
                json.dumps(silence["peak"] == 0))

        capture_events(cdp)
        cdp.evaluate("Wandmoss.restart();__playedEffects.length=0")
        cdp.key("ArrowRight", "ArrowRight"); cdp.frames(32); cdp.key("ArrowRight", "ArrowRight", False)
        checked(cdp, "Real keyboard walking dispatches grounded footsteps through the live controller",
                "Wandmoss.state.player.grounded && Wandmoss.state.player.x>220 && __playedEffects.filter(e=>e==='step').length>=2")
        cdp.evaluate("Wandmoss.effects.stop();__playedEffects.length=0")
        tap(cdp, " ", "Space"); cdp.frames(1)
        checked(cdp, "Real keyboard ordinary jump reaches the live sound controller once",
                "__playedEffects.filter(e=>e==='jump').length===1 && !__playedEffects.includes('rocketJump') && Wandmoss.effects.activeVoices>0")
        cdp.evaluate("Wandmoss.restart();Wandmoss.state.boots.owned=true;Wandmoss.render();__playedEffects.length=0")
        tap(cdp, "c", "KeyC"); cdp.frames(1)
        finish_audio(cdp)
        tap(cdp, " ", "Space"); cdp.frames(1)
        checked(cdp, "Real C-plus-jump selects the rocket cue rather than ordinary jump",
                "Wandmoss.state.boots.active>29 && __playedEffects.filter(e=>e==='rocketJump').length===1 && !__playedEffects.includes('jump')")
        signal = cdp.evaluate("__sampleEffects(.4)")
        wait_for(cdp, "document.querySelector('audio[data-moss-track=forest]')?.readyState>=2 && !document.querySelector('audio[data-moss-track=forest]').paused")
        checked(cdp, "Live rocket jump produces native output while default 40-percent forest music plays",
                json.dumps(signal["peak"] > 0) + " && Wandmoss.music.volume===.4 && Wandmoss.music.enabled && !document.querySelector('audio[data-moss-track=forest]').paused")

        cdp.evaluate("Wandmoss.restart();Wandmoss.state.player.x=746;__playedEffects.length=0;Wandmoss.advance(1/120)")
        checked(cdp, "Live enemy injury uses its contact cue without layering generic hurt",
                "Wandmoss.state.health===2 && __playedEffects.filter(e=>e==='enemyContact').length===1 && !__playedEffects.includes('hurt')")
        cdp.frames(8)
        checked(cdp, "Continuing after enemy contact does not repeat its cue during invulnerability",
                "__playedEffects.filter(e=>e==='enemyContact').length===1")
        load_boss_checkpoint(cdp)
        cdp.evaluate("(() => {const s=Wandmoss.state;s.enemies.forEach(e=>e.alive=false);Object.assign(s.boss,{active:true,phase:'recover',phaseTime:100});Object.assign(s.player,{x:s.boss.x-20,y:480});__playedEffects.length=0;Wandmoss.advance(1/120)})()")
        checked(cdp, "Live boss injury uses its own contact cue without generic hurt",
                "Wandmoss.state.health===2 && __playedEffects.filter(e=>e==='bossContact').length===1 && !__playedEffects.includes('hurt')")
        load_boss_checkpoint(cdp)
        cdp.evaluate("(() => {const s=Wandmoss.state;s.enemies.forEach(e=>e.alive=false);Object.assign(s.player,{x:4380,y:480,invulnerable:100});Wandmoss.advance(1/120);__playedEffects.length=0})()")
        checked(cdp, "Entering the actual boss encounter warns before its charge sound",
                "Wandmoss.state.boss.phase==='telegraph' && !__playedEffects.includes('bossCharge')")
        cdp.frames(70)
        signal = cdp.evaluate("__sampleEffects(.4)")
        checked(cdp, "Live boss phase entry dispatches one charge cue across subsequent ticks",
                "Wandmoss.state.boss.phase==='charge' && __playedEffects.filter(e=>e==='bossCharge').length===1")
        wait_for(cdp, "document.querySelector('audio[data-moss-track=boss]')?.readyState>=2 && !document.querySelector('audio[data-moss-track=boss]').paused")
        checked(cdp, "Natural boss warning-to-charge transition produces native output with default music playing",
                json.dumps(signal["peak"] > 0) + " && Wandmoss.music.volume===.4 && Wandmoss.music.enabled && !document.querySelector('audio[data-moss-track=boss]').paused")

        cdp.evaluate("Wandmoss.restart();Wandmoss.effects.stop();window.__effectGain=__sfxOutputs.find(o=>o.context===Wandmoss.effects.context).node.gain.value;document.querySelector('#music-volume').focus()")
        tap(cdp, "Home", "Home")
        checked(cdp, "Music volume zero leaves effects enabled and their actual master gain unchanged",
                "Wandmoss.music.volume===0 && Wandmoss.effects.enabled && __sfxOutputs.find(o=>o.context===Wandmoss.effects.context).node.gain.value===__effectGain")
        cdp.evaluate("Wandmoss.effects.play('bossCharge')")
        signal = cdp.evaluate("__sampleEffects(.2)")
        checked(cdp, "Synthesized effects remain audible in measured PCM when music is zero",
                json.dumps(signal["peak"] > 0))

        seed_jingle(cdp); click(cdp, "#pause")
        cancelled(cdp, "Pause immediately cancels and disconnects pending jingle sources")
        click(cdp, "#primary")
        baseline = cdp.evaluate("__sfxNodes.length")
        time.sleep(.7)
        checked(cdp, "Resume never replays the cancelled pending jingle",
                f"Wandmoss.effects.activeVoices===0 && __sfxNodes.length==={baseline}")

        seed_jingle(cdp); click(cdp, "#sound")
        cancelled(cdp, "Mute immediately cancels and disconnects all effects sources")
        checked(cdp, "Muted requested effects are dropped instead of buffered for later",
                "(() => {const before=__sfxNodes.length;Wandmoss.effects.play('bossCharge');return __sfxNodes.length===before && !Wandmoss.effects.enabled})()")
        click(cdp, "#sound"); finish_audio(cdp)
        baseline = cdp.evaluate("__sfxNodes.length"); time.sleep(.7)
        checked(cdp, "Enabling again does not replay previously muted effect requests",
                f"__sfxNodes.length==={baseline} && Wandmoss.effects.activeVoices===0")

        seed_jingle(cdp); click(cdp, "#music-credits")
        cancelled(cdp, "Credits pause cancels pending effects and blocks future ones")
        before = cdp.evaluate("__sfxNodes.length")
        cdp.evaluate("Wandmoss.effects.play('jump')")
        checked(cdp, "Open credits cannot create effect sources",
                f"document.querySelector('#music-dialog').open && __sfxNodes.length==={before}")
        click(cdp, "#close-music-credits")
        wait_for(cdp, "!document.querySelector('#music-dialog').open")
        click(cdp, "#primary")

        seed_jingle(cdp)
        original = cdp.call("Target.getTargetInfo")["targetInfo"]["targetId"]
        background = cdp.call("Target.createTarget", url="about:blank")["targetId"]
        try:
            cdp.call("Target.activateTarget", targetId=background)
            wait_for(cdp, "document.hidden")
            cancelled(cdp, "Moving to a real second tab cancels all current and scheduled effects")
            before = cdp.evaluate("__sfxNodes.length")
            cdp.evaluate("Wandmoss.effects.play('bossCharge')")
            checked(cdp, "Hidden tab effect requests are dropped",
                    f"Wandmoss.state.mode==='paused' && __sfxNodes.length==={before}")
        finally:
            cdp.call("Target.activateTarget", targetId=original)
            cdp.call("Target.closeTarget", targetId=background)
        wait_for(cdp, "!document.hidden")
        click(cdp, "#primary")

        seed_jingle(cdp); click(cdp, "#restart")
        cancelled(cdp, "Retry cancels pending sounds from the previous attempt")
        baseline = cdp.evaluate("__sfxNodes.length"); time.sleep(.7)
        checked(cdp, "Retried game stays silent until a fresh gameplay event",
                f"__sfxNodes.length==={baseline} && Wandmoss.effects.activeVoices===0")
        seed_jingle(cdp)
        cdp.evaluate("Object.assign(Wandmoss.state.player,{x:1100,y:740,vy:400,grounded:false});Wandmoss.advance(1/120)")
        cancelled(cdp, "Checkpoint respawn cancels earlier sounds before starting its fresh feedback", require_silent=False)
        seed_jingle(cdp)
        cdp.evaluate("Wandmoss.state.health=0;Wandmoss.state.mode='lost';Wandmoss.render()")
        cancelled(cdp, "Loss immediately cancels active and scheduled effects")
        checked(cdp, "Lost state blocks attempted sound playback",
                "(() => {const before=__sfxNodes.length;Wandmoss.effects.play('step');return __sfxNodes.length===before})()")
        click(cdp, "#primary")
        cdp.evaluate("Wandmoss.effects.stop();window.__unknownFrom=__sfxNodes.length;Wandmoss.effects.play('notAnEffect')")
        checked(cdp, "Unknown events create no audio nodes", "__sfxNodes.length===__unknownFrom")
        checked(cdp, "Effects and the game request only bundled local resources",
                "performance.getEntriesByType('resource').every(r=>r.name.startsWith('file:'))")
        reload_game(cdp)
        checked(cdp, "Reload begins muted again without an audio context or source nodes",
                "!Wandmoss.effects.enabled && Wandmoss.effects.context===null && __sfxNodes.length===0")
        checked(cdp, "Desktop SFX checks produce no JavaScript or resource errors", json.dumps(not browser.errors()))


def touch_checks(url):
    with Browser(width=390, height=844) as browser:
        cdp = browser.cdp
        cdp.call("Page.addScriptToEvaluateOnNewDocument", source=INSTRUMENT_AUDIO)
        cdp.call("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=1, mobile=True)
        cdp.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        browser.open(url)

        def touch(selector, frames=1):
            point = cdp.evaluate(f"(() => {{const r=document.querySelector({json.dumps(selector)}).getBoundingClientRect();return {{x:r.x+r.width/2,y:r.y+r.height/2,id:1}}}})()")
            cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[point])
            cdp.frames(frames)
            cdp.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])

        touch("#sound")
        wait_for(cdp, "Wandmoss.effects.context?.state==='running'")
        checked(cdp, "390px touch gesture enables native effects and the sound toggle",
                "Wandmoss.effects.enabled && document.querySelector('#sound').getAttribute('aria-pressed')==='true'")
        touch("#primary")
        capture_events(cdp)
        touch("[data-control=right]", 32)
        checked(cdp, "Touch walking drives the same grounded footstep events",
                "Wandmoss.state.player.x>220 && __playedEffects.filter(e=>e==='step').length>=2")
        cdp.evaluate("Wandmoss.restart();__playedEffects.length=0")
        touch("[data-control=jump]", 2)
        checked(cdp, "Touch ordinary jump dispatches one ordinary cue",
                "__playedEffects.filter(e=>e==='jump').length===1 && !__playedEffects.includes('rocketJump')")
        cdp.evaluate("Wandmoss.restart();Wandmoss.state.boots.owned=true;Wandmoss.render();__playedEffects.length=0")
        touch("[data-control=boots]", 1); touch("[data-control=jump]", 2)
        checked(cdp, "Touch boots and jump dispatch the distinct rocket cue once",
                "Wandmoss.state.boots.active>29 && __playedEffects.filter(e=>e==='rocketJump').length===1 && !__playedEffects.includes('jump')")
        cdp.evaluate("Wandmoss.effects.stop();Wandmoss.effects.play('bossCharge')")
        signal = cdp.evaluate("__sampleEffects(.2)")
        checked(cdp, "Touch-unlocked effects produce actual nonzero native output", json.dumps(signal["peak"] > 0))
        touch("#pause")
        checked(cdp, "Touch pause immediately clears the effects voices", "Wandmoss.state.mode==='paused' && Wandmoss.effects.activeVoices===0")
        touch("#sound")
        checked(cdp, "Touch mute remains immediate in the paused narrow layout", "!Wandmoss.effects.enabled && Wandmoss.effects.activeVoices===0")
        checked(cdp, "390px SFX checks create no horizontal page overflow", "document.documentElement.scrollWidth<=innerWidth")
        checked(cdp, "Touch checks produce no JavaScript or resource errors", json.dumps(not browser.errors()))


def main():
    sys.stdout.reconfigure(line_buffering=True)
    url = (PROJECT / "index.html").as_uri()
    desktop_checks(url)
    touch_checks(url)
    print(f"All {len(RESULTS)} physical-event, native-effects and desktop/touch assertions passed.")
    print("Native PCM and lifecycle verified; perceptual listening, physical devices and other browser engines remain owner review.")


if __name__ == "__main__":
    main()
