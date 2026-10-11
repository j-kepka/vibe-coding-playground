#!/usr/bin/env python3
"""Check local recorded music, credits and browser controls without screenshots.

Run: python3 -B 02-wandmoss-journey/tests/music_check.py
Uses the standard-library Chrome driver from browser_check.py. Audio starts
through real DevTools input with Chrome's normal autoplay policy. The game
animation clock is controlled, while native MP3 decoding and media playback
use real time. These checks do not assess sound quality by listening.
"""

import hashlib
import json
import sys
import time

from browser_check import Browser, PROJECT, check, load_boss_checkpoint, load_chapter, set_locale


RESULTS = []
AUDIO = "[...document.querySelectorAll('audio[data-moss-track]')]"
ALL_PAUSED = f"{AUDIO}.every(a=>a.paused)"
TRACKS = {
    "fairytale": "fairytale-waltz.mp3",
    "forest": "folk-round.mp3",
    "dusk": "evening-fall-harp.mp3",
    "sky": "enchanted-journey.mp3",
    "boss": "call-to-adventure.mp3",
}


def checked(cdp, name, expression):
    try:
        check(cdp, name, expression)
    except AssertionError:
        detail = cdp.evaluate(f"({{mode:Wandmoss.state.mode,dialog:document.querySelector('#music-dialog').open,focus:document.activeElement.id,track:Wandmoss.music.currentTrack.id,status:Wandmoss.music.status,audio:{AUDIO}.map(a=>({{id:a.dataset.mossTrack,paused:a.paused,volume:a.volume}}))}})")
        raise AssertionError(f"{name}: {json.dumps(detail)}") from None
    RESULTS.append(name)


def wait_for(cdp, expression, timeout=10):
    deadline = time.monotonic() + timeout
    while not cdp.evaluate(expression):
        if time.monotonic() >= deadline:
            details = cdp.evaluate(f"({{mode:Wandmoss.state.mode,track:Wandmoss.music.currentTrack,status:Wandmoss.music.status,audio:{AUDIO}.map(a=>({{id:a.dataset.mossTrack,paused:a.paused,time:a.currentTime,duration:a.duration,ready:a.readyState,volume:a.volume,error:a.error?.message}}))}})")
            raise AssertionError(f"Timed out: {expression}\n{json.dumps(details)}")
        time.sleep(.025)


def click(cdp, selector):
    cdp.evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'center'}})")
    cdp.click(selector)
    if selector == "#close-music-credits":
        # The native dialog dispatches its close event asynchronously.
        cdp.frames(1)
        wait_for(cdp, "!document.querySelector('#music-dialog').open && document.activeElement.id==='music-credits'")


def tap(cdp, key, code, modifiers=0):
    cdp.key(key, code, modifiers=modifiers)
    cdp.key(key, code, False, modifiers=modifiers)


def track_playing(cdp, track, name, progress=False):
    cdp.frames(45)
    selector = f"audio[data-moss-track='{track}']"
    encoded = json.dumps(selector)
    wait_for(cdp, f"(() => {{const a=document.querySelector({encoded});return a && !a.paused && a.readyState>=2 && a.volume>0 && Number.isFinite(a.duration) && a.duration>30}})()")
    checked(cdp, name,
            f"(() => {{const a=document.querySelector({encoded});return Wandmoss.music.currentTrack.id==={json.dumps(track)} && a.currentSrc.startsWith('file:') && a.currentSrc.endsWith({json.dumps(TRACKS[track])}) && a.loop && !a.error && {AUDIO}.filter(a=>!a.paused).length===1}})()")
    if progress:
        before = cdp.evaluate(f"document.querySelector({encoded}).currentTime")
        time.sleep(.2)
        checked(cdp, f"{track}: native MP3 time advances without advancing the game clock",
                f"document.querySelector({encoded}).currentTime>{before + .05}")
        print("MP3 metadata", track, json.dumps(cdp.evaluate(f"(() => {{const a=document.querySelector({encoded});return {{duration:a.duration,readyState:a.readyState,currentTime:a.currentTime}}}})()")))


def file_checks():
    music_dir = PROJECT / "assets/music"
    provenance = json.loads((music_dir / "provenance.json").read_text())
    assert provenance["license"] == "CC BY 4.0"
    assert len(provenance["files"]) == 5
    notices = (PROJECT / "THIRD_PARTY_NOTICES.md").read_text()
    for item in provenance["files"]:
        path = music_dir / item["file"]
        assert path.stat().st_size == item["bytes"], item["file"]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], item["file"]
        assert item["title"] in notices and item["source"] in notices, item["title"]
        name = f"{item['title']}: bundled bytes match provenance and notices include its source"
        print("PASS", name)
        RESULTS.append(name)
    assert "Kevin MacLeod" in notices and "creativecommons.org/licenses/by/4.0/" in notices
    assert "MIT License" in (PROJECT / "LICENSE").read_text()
    assert len((music_dir / "CC-BY-4.0.txt").read_text()) > 10000
    name = "Original MIT license and the complete offline CC BY license are retained"
    print("PASS", name)
    RESULTS.append(name)


def credit_content(cdp):
    checked(cdp, "Credits name the author, five recordings and CC BY 4.0",
            "(() => {const d=document.querySelector('#music-dialog');return d.textContent.includes('Kevin MacLeod') && d.textContent.includes('CC BY 4.0') && d.querySelectorAll('.music-track-list li').length===5 && d.querySelector('a[href=\"https://creativecommons.org/licenses/by/4.0/\"]') && d.textContent.includes('MIT')})()")
    expected = [item["source"] for item in json.loads((PROJECT / "assets/music/provenance.json").read_text())["files"]]
    checked(cdp, "Each recording has its official source link in the game credits",
            f"{json.dumps(expected)}.every(url=>[...document.querySelectorAll('#music-dialog a')].some(a=>a.href===url))")
    local_links = cdp.evaluate("[...document.querySelectorAll('#music-dialog a')].filter(a=>a.protocol==='file:').map(a=>a.getAttribute('href'))")
    assert {"LICENSE", "THIRD_PARTY_NOTICES.md", "assets/music/CC-BY-4.0.txt"}.issubset(local_links)
    assert all((PROJECT / href).is_file() for href in local_links)
    name = "Credits' MIT, notices and CC BY text links resolve to bundled local files"
    print("PASS", name)
    RESULTS.append(name)
    checked(cdp, "External credit links use separate tabs and noopener protection",
            "[...document.querySelectorAll('#music-dialog a')].filter(a=>a.protocol==='https:').every(a=>a.target==='_blank' && a.relList.contains('noopener'))")


def desktop_checks(url):
    with Browser(height=1200) as browser:
        browser.open(url)
        cdp = browser.cdp
        set_locale(cdp, "pl")
        checked(cdp, "Fresh opening menu is silent and retains a 40-percent music setting",
                f"Wandmoss.state.mode==='ready' && !Wandmoss.music.enabled && Wandmoss.music.volume===.4 && document.querySelector('#sound').getAttribute('aria-pressed')==='false' && document.querySelector('#music-volume').value==='40' && {ALL_PAUSED}")
        checked(cdp, "Muted opening menu does not request any music recording",
                "!performance.getEntriesByType('resource').some(r=>r.name.endsWith('.mp3'))")
        credit_content(cdp)

        click(cdp, "#music-credits")
        checked(cdp, "Credits open as a modal dialog with a focused close button",
                "document.querySelector('#music-dialog').open && document.querySelector('#music-dialog').matches(':modal') && document.activeElement.id==='close-music-credits' && Wandmoss.state.mode==='ready'")
        # Space activates the focused close button normally. Move focus to a
        # credit link when checking that it cannot also start the game.
        cdp.evaluate("document.querySelector('#music-dialog a').focus()")
        for key, code in [("r", "KeyR"), ("p", "KeyP"), (" ", "Space"), ("ArrowRight", "ArrowRight")]:
            tap(cdp, key, code)
        cdp.frames(10)
        checked(cdp, "Gameplay shortcuts cannot start or restart the game behind credits",
                "document.querySelector('#music-dialog').open && Wandmoss.state.mode==='ready' && Wandmoss.state.levelIndex===0")
        tap(cdp, "Tab", "Tab", modifiers=8)
        checked(cdp, "Reverse Tab remains inside the native modal dialog",
                "document.querySelector('#music-dialog').contains(document.activeElement)")
        tap(cdp, "Escape", "Escape")
        checked(cdp, "Escape closes credits and returns focus without starting the game",
                "!document.querySelector('#music-dialog').open && document.activeElement.id==='music-credits' && Wandmoss.state.mode==='ready'")

        click(cdp, "#sound")
        checked(cdp, "A real sound-button click enables music and synthesized effects",
                "Wandmoss.music.enabled && document.querySelector('#sound').getAttribute('aria-pressed')==='true' && window.__testAudio.some(a=>a.state==='running')")
        track_playing(cdp, "fairytale", "Opening menu plays only Fairytale Waltz", progress=True)
        click(cdp, "#primary")
        track_playing(cdp, "forest", "Starting chapter one switches to the local Folk Round recording", progress=True)

        load_chapter(cdp, 1)
        track_playing(cdp, "dusk", "Chapter two uses Evening Fall (Harp)", progress=True)
        load_chapter(cdp, 2)
        track_playing(cdp, "sky", "Chapter three uses Enchanted Journey", progress=True)
        load_chapter(cdp, 3)
        track_playing(cdp, "forest", "Chapter four approach returns to Folk Round")
        cdp.evaluate("Wandmoss.state.player.x=4300;Wandmoss.advance(1/120)")
        checked(cdp, "Crossing the boss approach activates its real engine encounter",
                "Wandmoss.state.boss.active && Wandmoss.state.mode==='playing'")
        track_playing(cdp, "boss", "The awakened boss switches to Call to Adventure", progress=True)

        click(cdp, "#pause")
        checked(cdp, "Pause immediately stops every recording and retains the boss selection",
                f"Wandmoss.state.mode==='paused' && Wandmoss.music.currentTrack.id==='boss' && {ALL_PAUSED}")
        paused_time = cdp.evaluate("document.querySelector('audio[data-moss-track=boss]').currentTime")
        time.sleep(.2)
        cdp.frames(120)
        checked(cdp, "Music playhead remains frozen throughout pause",
                f"Math.abs(document.querySelector('audio[data-moss-track=boss]').currentTime-{paused_time})<.025")
        click(cdp, "#primary")
        track_playing(cdp, "boss", "Resuming the encounter restores the selected boss recording")
        checked(cdp, "Resuming preserves the paused recording's playhead",
                f"document.querySelector('audio[data-moss-track=boss]').currentTime>={paused_time}")

        click(cdp, "#music-credits")
        checked(cdp, "Opening credits during play pauses the encounter and music",
                f"Wandmoss.state.mode==='paused' && document.querySelector('#music-dialog').open && {ALL_PAUSED}")
        before = cdp.evaluate("JSON.stringify({level:Wandmoss.state.levelIndex,x:Wandmoss.state.player.x,time:Wandmoss.state.time,health:Wandmoss.state.health})")
        for key, code in [("r", "KeyR"), ("p", "KeyP"), ("c", "KeyC"), ("x", "KeyX")]:
            tap(cdp, key, code)
        cdp.frames(60)
        checked(cdp, "Credits intercept retry, pause, boots and spell shortcuts",
                "document.querySelector('#music-dialog').open && JSON.stringify({level:Wandmoss.state.levelIndex,x:Wandmoss.state.player.x,time:Wandmoss.state.time,health:Wandmoss.state.health})===" + json.dumps(before))
        click(cdp, "#close-music-credits")
        checked(cdp, "Closing credits leaves the encounter safely paused",
                f"!document.querySelector('#music-dialog').open && Wandmoss.state.mode==='paused' && document.activeElement.id==='music-credits' && {ALL_PAUSED}")
        click(cdp, "#primary")
        track_playing(cdp, "boss", "Explicit resume after credits restores boss music")

        # The range input must retain its native keyboard behavior instead of
        # moving, retrying or restarting the wizard through the global handler.
        cdp.evaluate("document.querySelector('#music-volume').focus()")
        tap(cdp, "End", "End")
        cdp.frames(45)
        checked(cdp, "End sets the native volume slider and actual recording to 100 percent",
                "document.querySelector('#music-volume').value==='100' && Wandmoss.music.volume===1 && document.querySelector('audio[data-moss-track=boss]').volume>.99 && document.querySelector('#music-volume').getAttribute('aria-valuetext').includes('100')")
        before_x = cdp.evaluate("Wandmoss.state.player.x")
        tap(cdp, "ArrowLeft", "ArrowLeft")
        checked(cdp, "ArrowLeft changes the slider while leaving the wizard in place",
                f"document.querySelector('#music-volume').value==='99' && Wandmoss.music.volume===.99 && Wandmoss.state.player.x==={before_x}")
        tap(cdp, "Home", "Home")
        cdp.frames(45)
        checked(cdp, "Zero music volume keeps the global sound toggle enabled for effects",
                "document.querySelector('#music-volume').value==='0' && Wandmoss.music.volume===0 && document.querySelector('audio[data-moss-track=boss]').volume===0 && Wandmoss.music.enabled && document.querySelector('#sound').getAttribute('aria-pressed')==='true'")
        tap(cdp, "End", "End")
        cdp.frames(45)

        click(cdp, "#sound")
        checked(cdp, "The global sound toggle immediately silences every recording",
                f"!Wandmoss.music.enabled && document.querySelector('#sound').getAttribute('aria-pressed')==='false' && {ALL_PAUSED}")
        for index in (1, 2, 3):
            load_chapter(cdp, index)
        cdp.frames(120)
        checked(cdp, "Muted chapter changes cannot restart stale playback",
                f"!Wandmoss.music.enabled && {ALL_PAUSED}")
        click(cdp, "#sound")
        track_playing(cdp, "forest", "Re-enabling sound selects the current chapter instead of the previous boss")
        for index in (1, 2, 1, 0):
            load_chapter(cdp, index)
        track_playing(cdp, "forest", "Rapid chapter switches settle on one current recording without overlap")

        # A second actual Chrome tab changes Page Visibility; no mocked audio or
        # visibility properties are used by this scenario.
        original = cdp.call("Target.getTargetInfo")["targetInfo"]["targetId"]
        background = cdp.call("Target.createTarget", url="about:blank")["targetId"]
        try:
            cdp.call("Target.activateTarget", targetId=background)
            wait_for(cdp, "document.hidden", timeout=3)
            checked(cdp, "Moving to another real tab pauses gameplay and all recordings",
                    f"document.hidden && Wandmoss.state.mode==='paused' && {ALL_PAUSED}")
        finally:
            cdp.call("Target.activateTarget", targetId=original)
            cdp.call("Target.closeTarget", targetId=background)
        wait_for(cdp, "!document.hidden", timeout=3)
        checked(cdp, "Returning to the tab leaves gameplay and music paused",
                f"Wandmoss.state.mode==='paused' && {ALL_PAUSED}")
        click(cdp, "#primary")
        track_playing(cdp, "forest", "Explicit resume after returning to the tab restores music")

        # The fixture prepares the tenth hit, then a real keyboard spell drives
        # the normal engine death animation and victory transition.
        load_boss_checkpoint(cdp)
        cdp.evaluate("const s=Wandmoss.state;s.enemies.forEach(e=>e.alive=false);Object.assign(s.player,{x:4600,y:480,facing:1,invulnerable:100});Object.assign(s.boss,{active:true,health:1,hits:9,phase:'recover',phaseTime:100});Wandmoss.render()")
        track_playing(cdp, "boss", "A fresh boss attempt begins with encounter music")
        cdp.evaluate("document.querySelector('#game').focus()")
        tap(cdp, "x", "KeyX")
        cdp.frames(18)
        checked(cdp, "The tenth spell keeps boss music during the kneeling animation",
                "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.boss.health===0 && Wandmoss.music.currentTrack.id==='boss' && !document.querySelector('audio[data-moss-track=boss]').paused")
        cdp.frames(150)
        track_playing(cdp, "fairytale", "Victory switches to Fairytale Waltz after the death animation")
        checked(cdp, "Victory remains the normal completed engine state",
                "Wandmoss.state.mode==='won' && Wandmoss.state.boss.hits===10")
        click(cdp, "#primary")
        track_playing(cdp, "forest", "The victory action begins a new campaign with forest music")
        checked(cdp, "Victory replay starts chapter one with no boss-testing shortcut",
                "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===0 && Wandmoss.state.boss===null && !('practiceBoss' in Wandmoss) && !document.querySelector('#practice-boss')")
        cdp.evaluate("Wandmoss.state.health=0;Wandmoss.state.mode='lost';Wandmoss.render()")
        checked(cdp, "A lost run immediately stops music",
                f"Wandmoss.state.mode==='lost' && {ALL_PAUSED}")
        click(cdp, "#primary")
        track_playing(cdp, "forest", "Retrying from a loss restores the current chapter recording")
        cdp.evaluate("document.querySelector('audio[data-moss-track=forest]').dispatchEvent(new Event('error'))")
        checked(cdp, "A simulated media error stops actual playback and exposes a recovery message",
                f"Wandmoss.music.enabled && Wandmoss.music.status.includes('niedostępna') && {ALL_PAUSED}")
        cdp.frames(120)
        checked(cdp, "A failed recording remains stopped until explicit recovery",
                f"Wandmoss.music.status.includes('niedostępna') && {ALL_PAUSED}")
        click(cdp, "#sound")
        click(cdp, "#sound")
        track_playing(cdp, "forest", "A real off/on interaction recovers from the simulated media error")
        checked(cdp, "Music and the game request no remote resources during offline play",
                "performance.getEntriesByType('resource').every(r=>r.name.startsWith('file:'))")
        checked(cdp, "Desktop music checks produce no browser JavaScript or resource errors",
                json.dumps(not browser.errors()))


def mobile_checks(url, width, height):
    with Browser(width=width, height=height) as browser:
        cdp = browser.cdp
        cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                 deviceScaleFactor=1, mobile=True)
        browser.open(url)
        set_locale(cdp, "pl")
        label = f"{width}px mobile"
        checked(cdp, f"{label}: the music bar fits without horizontal page overflow",
                "(() => {const b=document.querySelector('.sound-bar').getBoundingClientRect();return b.left>=0 && b.right<=innerWidth+1 && document.documentElement.scrollWidth<=innerWidth+1 && [...document.querySelectorAll('.sound-bar input,.sound-bar button')].every(e=>{const r=e.getBoundingClientRect();return r.width>0 && r.left>=0 && r.right<=innerWidth+1})})()")
        click(cdp, "#music-credits")
        checked(cdp, f"{label}: the modal fits the viewport and permits scrolling when needed",
                "(() => {const d=document.querySelector('#music-dialog'),r=d.getBoundingClientRect();return d.open && r.left>=0 && r.right<=innerWidth+1 && r.top>=0 && r.bottom<=innerHeight+1 && d.scrollWidth<=d.clientWidth+1 && getComputedStyle(d).overflowY==='auto'})()")
        cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=400,
                 deviceScaleFactor=1, mobile=True)
        checked(cdp, f"{label}: credits remain contained and scroll in a short 400px viewport",
                "(() => {const d=document.querySelector('#music-dialog'),r=d.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1 && d.scrollHeight>d.clientHeight && d.scrollWidth<=d.clientWidth+1})()")
        cdp.evaluate("document.querySelector('#music-dialog').scrollTop=10000")
        checked(cdp, f"{label}: the offline license and notices can be reached by scrolling",
                "(() => {const d=document.querySelector('#music-dialog'),a=d.querySelector('a[href=\"assets/music/CC-BY-4.0.txt\"]'),r=a.getBoundingClientRect(),b=d.getBoundingClientRect();return r.top>=b.top && r.bottom<=b.bottom})()")
        cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                 deviceScaleFactor=1, mobile=True)
        click(cdp, "#close-music-credits")
        checked(cdp, f"{label}: closing credits returns to the untouched ready menu",
                "!document.querySelector('#music-dialog').open && Wandmoss.state.mode==='ready' && document.activeElement.id==='music-credits'")
        click(cdp, "#sound")
        track_playing(cdp, "fairytale", f"{label}: a real pointer click enables the local menu recording")
        click(cdp, "#music-credits")
        checked(cdp, f"{label}: opening credits suspends menu music too",
                f"document.querySelector('#music-dialog').open && {ALL_PAUSED}")
        tap(cdp, "Escape", "Escape")
        track_playing(cdp, "fairytale", f"{label}: closing ready-menu credits resumes its music")
        click(cdp, "#sound")
        checked(cdp, f"{label}: muting remains immediate on the narrow layout",
                f"!Wandmoss.music.enabled && {ALL_PAUSED}")
        checked(cdp, f"{label}: no browser JavaScript or resource errors",
                json.dumps(not browser.errors()))


def main():
    sys.stdout.reconfigure(line_buffering=True)
    file_checks()
    url = (PROJECT / "index.html").as_uri()
    desktop_checks(url)
    mobile_checks(url, 390, 844)
    mobile_checks(url, 320, 740)
    print(f"All {len(RESULTS)} music, attribution and desktop/mobile browser assertions passed.")
    print("Native MP3 decoding and time progression checked; listening quality and other browser engines remain owner review.")


if __name__ == "__main__":
    main()
