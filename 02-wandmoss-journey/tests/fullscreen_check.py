#!/usr/bin/env python3
"""Focused native-fullscreen browser checks, without screenshots.

Run: python3 -B 02-wandmoss-journey/tests/fullscreen_check.py
Optional: --url http://127.0.0.1:8000/02-wandmoss-journey/index.html
Uses the standard-library Chrome/CDP driver and a manual animation clock.
Overlay and unavailable/rejected-API fixtures isolate interface branches;
they do not represent a campaign playthrough or physical-device testing.
"""

import argparse
import json
import sys
import time

from browser_check import Browser, PROJECT, reload_game


RESULTS = []
LANGUAGES = ("en", "de", "pl")
SIZES = ((1440, 900, False), (390, 844, True), (320, 740, True), (844, 390, True))
LABELS = {
    "en": ("Full screen", "Exit full screen"),
    "de": ("Vollbild", "Vollbild verlassen"),
    "pl": ("Pełny ekran", "Wyjdź z pełnego ekranu"),
}
ACTIVE = "document.fullscreenElement===document.querySelector('#game-view')"
INACTIVE = "!document.fullscreenElement"
STORAGE = "JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))"
AUDIO = """JSON.stringify({enabled:Wandmoss.music.enabled,volume:Wandmoss.music.volume,
  track:Wandmoss.music.currentTrack.id,effects:Wandmoss.effects.enabled,
  sound:document.querySelector('#sound').getAttribute('aria-pressed'),
  slider:document.querySelector('#music-volume').value,
  media:[...document.querySelectorAll('audio[data-moss-track]')].map(a=>({
    track:a.dataset.mossTrack,src:a.src,paused:a.paused,loop:a.loop,volume:a.volume}))})"""


def verified(cdp, name, expression):
    result = cdp.evaluate(expression)
    assert result is True, f"{name}: {result!r}"
    RESULTS.append(name)
    print("PASS", name)


def wait_for(cdp, expression, description, timeout=5):
    deadline = time.monotonic() + timeout
    while not cdp.evaluate(expression):
        assert time.monotonic() < deadline, description
        time.sleep(.02)


def tap(cdp, key, code):
    cdp.key(key, code)
    cdp.key(key, code, False)


def wait_fullscreen(cdp, active, description):
    # Native API promises can settle before fullscreenchange updates the HUD.
    wait_for(cdp, (ACTIVE if active else INACTIVE) +
             f" && document.querySelector('#fullscreen').getAttribute('aria-pressed')==={json.dumps(str(active).lower())}" +
             f" && document.querySelector('#game-view').classList.contains('is-fullscreen')==={json.dumps(active)}" +
             " && !document.querySelector('#fullscreen').disabled", description)


def enter(cdp):
    cdp.evaluate("document.querySelector('#fullscreen').scrollIntoView({block:'nearest'})")
    cdp.click("#fullscreen")
    wait_fullscreen(cdp, True, "A real button click must enter native fullscreen")


def leave(cdp, method="button"):
    if method == "button":
        cdp.click("#fullscreen")
    elif method == "escape":
        tap(cdp, "Escape", "Escape")
    elif method == "external":
        cdp.evaluate("document.exitFullscreen()")
    else:
        raise ValueError(method)
    wait_fullscreen(cdp, False, f"{method} must exit native fullscreen")


def capture(cdp):
    """Capture all gameplay, storage bytes/writes and selected audio, sans frames."""
    cdp.evaluate(f"""window.__fullscreenBefore={{state:JSON.stringify(Wandmoss.state),
      storage:{STORAGE},writes:JSON.stringify(window.__fullscreenStorageWrites),audio:{AUDIO},
      media:[...document.querySelectorAll('audio[data-moss-track]')],
      times:[...document.querySelectorAll('audio[data-moss-track]')].map(a=>a.currentTime)}};void 0""")


def observe_storage(cdp):
    cdp.evaluate("""window.__fullscreenStorageWrites=[];
      for(const method of ['setItem','removeItem','clear']) {
        const native=Storage.prototype[method];
        Storage.prototype[method]=function(...args) {
          if(this===localStorage) window.__fullscreenStorageWrites.push([method,...args]);
          return native.apply(this,args);
        };
      }""")


def unchanged(cdp, context):
    verified(cdp, context + " preserves the complete state, storage bytes/writes and audio", f"""
      JSON.stringify(Wandmoss.state)===window.__fullscreenBefore.state &&
      {STORAGE}===window.__fullscreenBefore.storage &&
      JSON.stringify(window.__fullscreenStorageWrites)===window.__fullscreenBefore.writes &&
      {AUDIO}===window.__fullscreenBefore.audio &&
      window.__fullscreenBefore.media.every((a,i)=>a.isConnected &&
        a===document.querySelectorAll('audio[data-moss-track]')[i] &&
        a.currentTime>=window.__fullscreenBefore.times[i]-.05)
    """)


def button_state(cdp, locale, active, context):
    label = LABELS[locale][bool(active)]
    verified(cdp, context + " synchronizes the translated button with native state", f"""(() => {{
      const b=document.querySelector('#fullscreen'),v=document.querySelector('#game-view');
      return {ACTIVE if active else INACTIVE} && !b.disabled &&
        b.getAttribute('aria-pressed')==={json.dumps(str(active).lower())} &&
        b.getAttribute('aria-label')==={json.dumps(label)} &&
        b.title==={json.dumps(label + (' (Escape)' if active else ''))} &&
        v.classList.contains('is-fullscreen')==={json.dumps(active)};
    }})()""")


def fits(cdp, context, selectors, within_stage=False):
    """Assert visible rectangles and hit targets; allow bounded card scrolling."""
    result = cdp.evaluate(f"""(() => {{
      const stage=document.querySelector('#stage').getBoundingClientRect();
      return {json.dumps(selectors)}.map(selector=>{{
        const e=document.querySelector(selector),r=e.getBoundingClientRect(),s=getComputedStyle(e);
        const x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
        const inside={json.dumps(within_stage)} ? r.left>=stage.left-1 &&
          r.right<=stage.right+1 && r.top>=stage.top-1 && r.bottom<=stage.bottom+1 : true;
        return {{selector,ok:!e.hidden && s.display!=='none' && s.visibility!=='hidden' &&
          r.width>0 && r.height>0 && r.left>=-1 && r.right<=innerWidth+1 &&
          r.top>=-1 && r.bottom<=innerHeight+1 && inside && !!hit &&
          (!e.matches('button,input,select,a') || e===hit || e.contains(hit)),
          rect:{{x:r.x,y:r.y,w:r.width,h:r.height}}}};
      }}).filter(r=>!r.ok);
    }})()""")
    assert not result, f"{context}: {json.dumps(result)}"
    RESULTS.append(context)
    print("PASS", context)


def fullscreen_layout(cdp, context, mobile):
    verified(cdp, context + " keeps the wrapper and 16:9 simulation bounds intact", """(() => {
      const view=document.querySelector('#game-view'),stage=document.querySelector('#stage');
      const r=view.getBoundingClientRect(),s=stage.getBoundingClientRect(),c=document.querySelector('#game');
      return document.fullscreenElement===view && r.left>=-1 && r.top>=-1 &&
        r.right<=innerWidth+1 && r.bottom<=innerHeight+1 &&
        view.scrollWidth<=view.clientWidth+1 && view.scrollHeight<=view.clientHeight+1 &&
        s.width>0 && s.height>0 && s.left>=r.left-1 && s.right<=r.right+1 &&
        s.top>=r.top-1 && s.bottom<=r.bottom+1 &&
        c.width===1152 && c.height===648 && MossEngine.WIDTH===1152 && MossEngine.HEIGHT===648 &&
        getComputedStyle(c).objectFit===OBJECT_FIT &&
        view.contains(document.querySelector('.game-shell')) &&
        view.contains(document.querySelector('.touch-controls')) &&
        view.contains(document.querySelector('#music-dialog'));
    })()""".replace('OBJECT_FIT', json.dumps('fill' if mobile else 'contain')))
    fits(cdp, context + " exposes exit and gameplay HUD", ["#fullscreen", "#health", "#collected", "#score"])
    if mobile:
        fits(cdp, context + " exposes all touch controls", [f'[data-control="{action}"]' for action in ("left", "right", "boots", "cast", "jump")])


def clear_errors(browser, context):
    # Flush pending DevTools events before examining the driver's error queue.
    browser.cdp.evaluate("true")
    errors = browser.errors()
    assert not errors, f"{context}: {json.dumps(errors, indent=2)}"
    RESULTS.append(context + " has no JavaScript or resource errors")
    print("PASS", RESULTS[-1])


def native_checks(url):
    with Browser(width=1440, height=900) as browser:
        browser.open(url)
        cdp = browser.cdp
        observe_storage(cdp)
        button_state(cdp, "en", False, "Opening menu")
        capture(cdp)
        enter(cdp)
        button_state(cdp, "en", True, "Opening menu entry")
        unchanged(cdp, "Opening menu entry")
        fits(cdp, "The fullscreen opening menu can start a game", ["#primary"], True)
        leave(cdp)
        unchanged(cdp, "Opening menu entry and button exit")
        cdp.click("#primary")
        verified(cdp, "Starting retains the normal version-one chapter-start save",
                 "Wandmoss.state.mode==='playing' && MossSave.read().version===1 && MossSave.read().kind==='level' && MossSave.read().levelIndex===0")
        cdp.click("#sound")
        cdp.evaluate("const slider=document.querySelector('#music-volume');slider.value='37';slider.dispatchEvent(new Event('input',{bubbles:true}))")
        wait_for(cdp, "Wandmoss.music.enabled && document.querySelector('audio[data-moss-track=forest]')?.readyState>=2 && !document.querySelector('audio[data-moss-track=forest]').paused",
                 "The native selected recording must remain available for the toggle check", timeout=10)
        capture(cdp)
        enter(cdp)
        button_state(cdp, "en", True, "Playing entry")
        unchanged(cdp, "Playing entry with enabled audio")
        leave(cdp)
        button_state(cdp, "en", False, "Button exit")
        unchanged(cdp, "Playing entry and button exit with enabled audio")
        for method in ("escape", "external"):
            capture(cdp)
            enter(cdp)
            leave(cdp, method)
            button_state(cdp, "en", False, method + " exit")
            unchanged(cdp, method + " entry and exit")
        cdp.evaluate("window.scrollTo(0,160);window.__fullscreenScroll={x:scrollX,y:scrollY}")
        verified(cdp, "The normal page is scrolled before the fullscreen restoration check", "window.__fullscreenScroll.y>0")
        capture(cdp)
        cdp.evaluate("document.querySelector('#fullscreen').focus({preventScroll:true})")
        tap(cdp, " ", "Space")
        wait_fullscreen(cdp, True, "Native Space must activate the focused fullscreen button")
        button_state(cdp, "en", True, "Native Space entry")
        unchanged(cdp, "Native Space entry")
        cdp.evaluate("document.querySelector('#fullscreen').focus({preventScroll:true})")
        tap(cdp, " ", "Space")
        wait_fullscreen(cdp, False, "Native Space must activate the focused exit button")
        button_state(cdp, "en", False, "Native Space exit")
        unchanged(cdp, "Native Space entry and exit")
        verified(cdp, "Exiting fullscreen restores the previous normal-page scroll position",
                 "scrollX===window.__fullscreenScroll.x && scrollY===window.__fullscreenScroll.y")
        enter(cdp)
        tap(cdp, "p", "KeyP")
        verified(cdp, "P pauses in fullscreen without leaving it", ACTIVE + " && Wandmoss.state.mode==='paused'")
        verified(cdp, "The fullscreen pause hint explains the fullscreen Escape action",
                 "document.querySelector('#overlay-hint').textContent===MossI18n.t('screen.paused.fullscreenHint')")
        capture(cdp)
        leave(cdp, "escape")
        unchanged(cdp, "Escape leaves an already-paused game paused")
        verified(cdp, "Exiting fullscreen immediately restores the normal pause hint",
                 "document.querySelector('#overlay-hint').textContent===MossI18n.t('screen.paused.hint')")
        capture(cdp)
        enter(cdp)
        leave(cdp)
        unchanged(cdp, "Entering and exiting an already-paused game")
        tap(cdp, "Escape", "Escape")
        verified(cdp, "Normal-page Escape resumes an already-paused game", "Wandmoss.state.mode==='playing' && " + INACTIVE)
        tap(cdp, "Escape", "Escape")
        verified(cdp, "Normal-page Escape still pauses gameplay", "Wandmoss.state.mode==='paused' && " + INACTIVE)
        tap(cdp, "p", "KeyP")
        enter(cdp)
        fits(cdp, "Music credits remain reachable in fullscreen", ["#music-credits"])
        cdp.click("#music-credits")
        verified(cdp, "Opening fullscreen credits pauses and retains native fullscreen",
                 ACTIVE + " && document.querySelector('#music-dialog').open && Wandmoss.state.mode==='paused'")
        fits(cdp, "Fullscreen credits and their close action remain visible", ["#music-dialog", "#close-music-credits"])
        verified(cdp, "Fullscreen credits retain all recordings and license links",
                 "document.querySelectorAll('#music-dialog .music-track-list li').length===5 && !!document.querySelector('#music-dialog a[href=\"assets/music/CC-BY-4.0.txt\"]')")
        tap(cdp, "Escape", "Escape")
        wait_fullscreen(cdp, False, "Native Escape must exit fullscreen even while credits are open")
        wait_for(cdp, "!document.querySelector('#music-dialog').open && document.activeElement===document.querySelector('#music-credits')",
                 "Fullscreen exit must close credits and restore focus to their action")
        verified(cdp, "Native Escape exits fullscreen, closes credits and leaves play paused",
                 INACTIVE + " && !document.querySelector('#music-dialog').open && Wandmoss.state.mode==='paused'")
        verified(cdp, "Closing credits on native exit returns focus to the credits action",
                 "document.activeElement===document.querySelector('#music-credits')")
        verified(cdp, "Native exit from credits immediately restores the normal pause hint",
                 "document.querySelector('#overlay-hint').textContent===MossI18n.t('screen.paused.hint')")
        reload_game(cdp)
        verified(cdp, "The unchanged fullscreen-era save remains resumable after reload",
                 "Wandmoss.state.mode==='ready' && MossSave.read().version===1 && MossSave.read().kind==='level' && !document.querySelector('#resume-button').hidden")
        cdp.click("#resume-button")
        verified(cdp, "Continue still restores the chapter start normally",
                 "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===0 && Wandmoss.state.player.x===Wandmoss.state.spawn.x")
        clear_errors(browser, "Native entry, all exit paths, pause, credits and save continuation")


def overlay_fixture(cdp, mode):
    """Test-only state placement; no shortcuts are added to production UI."""
    cdp.evaluate(f"""(() => {{
      const s=Wandmoss.state;
      MossEngine.loadLevel(s,{3 if mode in ('boss', 'won') else 0});
      s.events.length=0;s.mode={json.dumps('playing' if mode == 'boss' else mode)};
      if(s.mode==='transition') s.transition={{kind:'walk',time:.3,duration:1.35,nextLevel:1}};
      if({json.dumps(mode)}==='boss') {{s.boss.active=true;s.boss.phase='telegraph';
        s.checkpointIndex=1;s.player.x=4400;s.camera=4050;}}
      if(s.mode==='won') {{s.score=1670;s.collected=52;s.completedLevels=[0,1,2,3];s.time=201;}}
      Wandmoss.render();
    }})()""")


def layout_checks(url):
    with Browser(width=1440, height=900) as browser:
        browser.open(url)
        cdp = browser.cdp
        # One native fullscreen session is resized through all four geometries.
        enter(cdp)
        for width, height, mobile in SIZES:
            cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                     deviceScaleFactor=1, mobile=mobile)
            cdp.call("Emulation.setTouchEmulationEnabled", enabled=mobile, maxTouchPoints=5)
            wait_for(cdp, f"innerWidth==={width} && innerHeight==={height}", "Fullscreen must adopt the resized viewport")
            for locale in LANGUAGES:
                cdp.evaluate(f"MossI18n.setLocale({json.dumps(locale)})")
                context = f"{width}x{height} {locale}"
                button_state(cdp, locale, True, context)
                overlay_fixture(cdp, "playing")
                fullscreen_layout(cdp, context, mobile)
                for mode in ("ready", "paused", "won"):
                    overlay_fixture(cdp, mode)
                    if mode == "paused":
                        verified(cdp, context + " pause hint describes fullscreen Escape",
                                 "document.querySelector('#overlay-hint').textContent===MossI18n.t('screen.paused.fullscreenHint')")
                    action = "#resume-button" if mode == "ready" and cdp.evaluate("!document.querySelector('#resume-button').hidden") else "#primary"
                    fits(cdp, context + f" {mode} card stays inside the stage", [".overlay-card"], True)
                    cdp.evaluate(f"document.querySelector({json.dumps(action)}).scrollIntoView({{block:'nearest'}})")
                    fits(cdp, context + f" {mode} action is reachable", [action], True)
                overlay_fixture(cdp, "transition")
                fits(cdp, context + " story transition stays inside the stage", ["#transition-card"], True)
                overlay_fixture(cdp, "boss")
                fits(cdp, context + " boss health, prompt and earned retry stay usable", ["#boss-hud", "#boss-health", "#boss-prompt", "#retry-boss"], True)
                overlay_fixture(cdp, "paused" if mobile else "playing")
                cdp.click("#music-credits")
                fits(cdp, context + " credits dialog and close button fit", ["#music-dialog", "#close-music-credits"])
                cdp.click("#close-music-credits")
                wait_for(cdp, "!document.querySelector('#music-dialog').open", "The close button must dismiss credits")
                verified(cdp, context + " credits close preserves pause and fullscreen", ACTIVE + " && Wandmoss.state.mode==='paused'")
            if mobile:
                overlay_fixture(cdp, "playing")
                start = cdp.evaluate("Wandmoss.state.player.x")
                points = cdp.evaluate("""Object.fromEntries(['right','cast'].map(action=>{
                  const r=document.querySelector(`[data-control=${action}]`).getBoundingClientRect();
                  return [action,{x:r.x+r.width/2,y:r.y+r.height/2}];}))""")
                cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[points["right"] | {"id": 1}, points["cast"] | {"id": 2}])
                cdp.frames(12)
                verified(cdp, f"{width}x{height} resized fullscreen accepts native movement and casting touches",
                         f"Wandmoss.state.player.x>{start}+20 && Wandmoss.state.spells.length>0 && {ACTIVE}")
                cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
                # Movement decelerates normally after release; it is not an instant stop.
                cdp.frames(12)
                verified(cdp, f"{width}x{height} touch cancellation releases fullscreen controls",
                         "Wandmoss.state.player.vx===0 && !document.querySelector('[data-control].pressed')")
        leave(cdp)
        button_state(cdp, "pl", False, "Resized session exit")
        clear_errors(browser, "Three-language fullscreen layouts, overlay fixtures and resized touch input")


def failure_checks(url):
    missing = """for(const method of ['requestFullscreen','webkitRequestFullscreen'])
      Object.defineProperty(Element.prototype,method,{configurable:true,value:undefined});"""
    rejected = """Object.defineProperty(Element.prototype,'requestFullscreen',{
      configurable:true,value(){return Promise.reject(new DOMException('Test fixture rejection','NotAllowedError'));}});"""
    with Browser(width=1440, height=900) as browser:
        cdp = browser.cdp
        browser.open(url)
        for fixture, source in (("unavailable", missing), ("rejected", rejected)):
            script = cdp.call("Page.addScriptToEvaluateOnNewDocument", source=source)["identifier"]
            browser.cdp.events.clear()
            reload_game(cdp)
            observe_storage(cdp)
            for locale in LANGUAGES:
                cdp.evaluate(f"MossI18n.setLocale({json.dumps(locale)})")
                before = cdp.evaluate(f"JSON.stringify({{state:Wandmoss.state,storage:{STORAGE},audio:{AUDIO}}})")
                if fixture == "unavailable":
                    verified(cdp, locale + " missing API disables the translated entry control",
                             "document.querySelector('#fullscreen').disabled && document.querySelector('#fullscreen').getAttribute('aria-pressed')==='false' && document.querySelector('#fullscreen').getAttribute('aria-label')===MossI18n.t('ui.fullscreenUnavailable') && " + INACTIVE)
                    cdp.click("#fullscreen")
                else:
                    cdp.click("#fullscreen")
                    wait_for(cdp, "document.querySelector('#toast').classList.contains('visible') && !document.querySelector('#fullscreen').disabled", "A rejected request must recover its button and expose a toast")
                    verified(cdp, locale + " rejected API exposes a translated toast and recovers entry",
                             "document.querySelector('#toast').textContent===MossI18n.t('toast.fullscreenFailed') && document.querySelector('#fullscreen').getAttribute('aria-label')===MossI18n.t('ui.fullscreen') && document.querySelector('#fullscreen').getAttribute('aria-pressed')==='false' && !document.querySelector('#game-view').classList.contains('is-fullscreen') && " + INACTIVE)
                verified(cdp, locale + " " + fixture + " preserves ready state, storage and audio",
                         f"JSON.stringify({{state:Wandmoss.state,storage:{STORAGE},audio:{AUDIO}}})==={json.dumps(before)}")
            if fixture == "rejected":
                cdp.click("#primary")
                capture(cdp)
                for attempt in range(2):
                    cdp.click("#fullscreen")
                    wait_for(cdp, "!document.querySelector('#fullscreen').disabled", "Rejected requests must permit another attempt")
                    unchanged(cdp, f"Playing request rejection {attempt+1}")
                    verified(cdp, f"Playing request rejection {attempt+1} remains recoverable",
                             "Wandmoss.state.mode==='playing' && document.querySelector('#toast').textContent===MossI18n.t('toast.fullscreenFailed') && " + INACTIVE)
            clear_errors(browser, fixture + " API fixture")
            cdp.call("Page.removeScriptToEvaluateOnNewDocument", identifier=script)
            reload_game(cdp)
        enter(cdp)
        leave(cdp)
        button_state(cdp, "pl", False, "Native API restored after fixture reloads")
        clear_errors(browser, "Native API restoration")


def main():
    sys.stdout.reconfigure(line_buffering=True)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=(PROJECT / "index.html").as_uri())
    args = parser.parse_args()
    native_checks(args.url)
    layout_checks(args.url)
    failure_checks(args.url)
    print(f"All {len(RESULTS)} focused fullscreen assertions passed.")
    print("Native Chrome/CDP input, state/storage/audio preservation, four resized viewports and three languages checked; no screenshots created.")


if __name__ == "__main__":
    main()
