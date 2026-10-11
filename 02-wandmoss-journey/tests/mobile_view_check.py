#!/usr/bin/env python3
"""Focused ordinary-page mobile layout/input checks in local Chrome, sans screenshots.

Run: python3 -B 02-wandmoss-journey/tests/mobile_view_check.py
Optional: --url https://example.invalid/02-wandmoss-journey/index.html
Uses the standard-library CDP helper with a manually advanced animation clock.
Device metrics and touch input are emulated; this is not a physical-phone check
or a campaign playthrough. Fixture placement does not add production shortcuts.
"""

import argparse
import json
import time

from browser_check import Browser, PROJECT, reload_game


RESULTS = []
SIZES = ((390, 844), (320, 740), (844, 390), (915, 412), (844, 320))
ACTIONS = ("left", "right", "boots", "cast", "jump")
STORAGE = "JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))"


def passed(name, detail=None):
    RESULTS.append(name)
    print("PASS", name, json.dumps(detail) if detail is not None else "", flush=True)


def verified(cdp, name, expression):
    value = cdp.evaluate(expression)
    assert value is True, f"{name}: {value!r}"
    passed(name)


def wait_for(cdp, expression, description, timeout=5):
    deadline = time.monotonic() + timeout
    while not cdp.evaluate(expression):
        assert time.monotonic() < deadline, description
        time.sleep(.02)


def resize(cdp, width, height, mobile=True):
    cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
             deviceScaleFactor=1, mobile=mobile,
             screenOrientation={"type": "portraitPrimary" if height >= width else "landscapePrimary",
                                "angle": 0 if height >= width else 90})
    cdp.call("Emulation.setTouchEmulationEnabled", enabled=mobile, maxTouchPoints=5)
    wait_for(cdp, f"innerWidth==={width} && innerHeight==={height}",
             "The emulated ordinary page must adopt its new viewport")
    # Allow resize/orientation tasks and CSS layout to settle without advancing
    # the injected animation clock or changing the simulation's time/camera.
    time.sleep(.1)
    cdp.evaluate("Wandmoss.render()")


def observe_storage(cdp):
    cdp.evaluate("""window.__mobileWrites=[];
      for(const method of ['setItem','removeItem','clear']) {
        const native=Storage.prototype[method];
        Storage.prototype[method]=function(...args) {
          if(this===localStorage) window.__mobileWrites.push([method,...args]);
          return native.apply(this,args);
        };
      }""")


def capture(cdp):
    cdp.evaluate(f"""window.__mobileBefore={{state:JSON.stringify(Wandmoss.state),
      storage:{STORAGE},writes:JSON.stringify(window.__mobileWrites)}};void 0""")


def unchanged(cdp, context):
    verified(cdp, context + " preserves every state field and storage bytes/writes", f"""
      JSON.stringify(Wandmoss.state)===window.__mobileBefore.state &&
      {STORAGE}===window.__mobileBefore.storage &&
      JSON.stringify(window.__mobileWrites)===window.__mobileBefore.writes
    """)


def fits(cdp, context, selectors, within_stage=False):
    failures = cdp.evaluate(f"""(() => {{
      const stage=document.querySelector('#stage').getBoundingClientRect();
      return {json.dumps(selectors)}.map(selector=>{{
        const e=document.querySelector(selector),r=e.getBoundingClientRect(),s=getComputedStyle(e);
        const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
        return {{selector,ok:!e.hidden && s.display!=='none' && s.visibility!=='hidden' &&
          r.width>0 && r.height>0 && r.left>=-1 && r.right<=innerWidth+1 &&
          r.top>=-1 && r.bottom<=innerHeight+1 &&
          (!{json.dumps(within_stage)} || r.left>=stage.left-1 &&
            r.right<=stage.right+1 && r.top>=stage.top-1 && r.bottom<=stage.bottom+1) &&
          !!hit && (!e.matches('button,input,select,a') || e===hit || e.contains(hit)),
          rect:{{x:r.x,y:r.y,width:r.width,height:r.height}}}};
      }}).filter(r=>!r.ok);
    }})()""")
    assert not failures, f"{context}: {json.dumps(failures)}"
    passed(context)


def mobile_layout(cdp, context, fullscreen=False):
    metrics = cdp.evaluate("""(() => {
      const v=document.querySelector('#game-view'),r=v.getBoundingClientRect();
      const st=document.querySelector('#stage'),s=st.getBoundingClientRect();
      const c=document.querySelector('#game'),cr=c.getBoundingClientRect();
      const sx=cr.width/c.width,sy=cr.height/c.height;
      return {ok:v.classList.contains('is-mobile-page') &&
        (document.fullscreenElement===v)===FULLSCREEN &&
        document.documentElement.scrollWidth<=innerWidth+1 &&
        r.top>=-1 && r.bottom<=innerHeight+1 && r.left>=-1 && r.right<=innerWidth+1 &&
        r.height<=innerHeight+1 && s.width>0 && s.height>=100 &&
        s.left>=r.left-1 && s.right<=r.right+1 && s.top>=r.top-1 && s.bottom<=r.bottom+1 &&
        c.width===1152 && c.height===648 && MossEngine.WIDTH===1152 && MossEngine.HEIGHT===648 &&
        Math.abs(sx-sy)<.0001 && sx>=.5999 &&
        cr.left<=s.left+1 && cr.right>=s.right-1 && cr.top<=s.top+1 && cr.bottom>=s.bottom-1 &&
        getComputedStyle(st).overflow==='hidden',
        viewport:[innerWidth,innerHeight],panel:[r.x,r.y,r.width,r.height],
        stage:[s.x,s.y,s.width,s.height],canvas:[cr.x,cr.y,cr.width,cr.height],scale:sx};
    })()""".replace("FULLSCREEN", json.dumps(fullscreen)))
    assert metrics["ok"], f"{context}: {json.dumps(metrics)}"
    passed(context + " bounds the panel and crops a uniformly scaled fixed-resolution canvas", metrics)
    fits(cdp, context + " keeps the stage, HUD and browser controls visible",
         ["#stage", "#sound", "#pause", "#fullscreen", "#health", "#collected"])
    fits(cdp, context + " keeps all five touch buttons visible and reachable",
         [f'[data-control="{action}"]' for action in ACTIONS])
    verified(cdp, context + " retains usable touch hit areas", """[...document.querySelectorAll('[data-control]')]
      .every(b=>{const r=b.getBoundingClientRect();return r.width>=44 && r.height>=44})""")


def player_visible(cdp, context):
    result = cdp.evaluate("""(() => {
      const c=document.querySelector('#game'),r=c.getBoundingClientRect();
      const st=document.querySelector('#stage').getBoundingClientRect();
      const p=Wandmoss.state.player,scale=r.width/c.width;
      const x=r.left+(p.x-Wandmoss.state.camera)*scale,y=r.top+p.y*scale;
      return {ok:x>=st.left-1 && x+p.w*scale<=st.right+1 &&
        y-26*scale>=st.top-1 && y+(p.h+5)*scale<=st.bottom+1 &&
        p.h*scale>=29.99,player:[x,y,p.w*scale,p.h*scale],
        stage:[st.left,st.top,st.right,st.bottom],camera:Wandmoss.state.camera};
    })()""")
    assert result["ok"], f"{context}: {json.dumps(result)}"
    passed(context + " keeps the wizard's hat and feet in the cropped play window", result)


def place(cdp, location):
    cdp.evaluate(f"""(() => {{
      const s=Wandmoss.state;MossEngine.loadLevel(s,0);s.events.length=0;s.mode='playing';
      const where={json.dumps(location)};
      const x=where==='start'?s.spawn.x:where==='end'?s.worldWidth-180:s.worldWidth/2;
      Object.assign(s.player,{{x,y:where==='high jump'?42:480,vx:0,vy:0,
        grounded:where!=='high jump',invulnerable:100}});
      s.camera=Math.max(0,Math.min(s.worldWidth-MossEngine.WIDTH,x-MossEngine.WIDTH*.32));
      s.boots.owned=where==='high jump';s.boots.active=where==='high jump'?29:0;
      Wandmoss.render();
    }})()""")


def reach(cdp, selector):
    cdp.evaluate(f"document.querySelector({json.dumps(selector)}).scrollIntoView({{block:'nearest',inline:'nearest'}})")
    fits(cdp, selector + " remains reachable through bounded card scrolling", [selector], True)


def overlay(cdp, mode):
    cdp.evaluate(f"""(() => {{
      const s=Wandmoss.state;MossEngine.loadLevel(s,0);s.events.length=0;s.mode={json.dumps(mode)};
      if(s.mode==='won') {{s.score=1670;s.collected=52;s.completedLevels=[0,1,2,3];s.time=201;}}
      Wandmoss.render();
    }})()""")


def menus(cdp, context):
    for locale in ("en", "de", "pl"):
        cdp.evaluate(f"MossI18n.setLocale({json.dumps(locale)})")
        for mode in ("paused", "lost", "won"):
            overlay(cdp, mode)
            verified(cdp, f"{context} {locale} {mode} constrains its menu to the stage", """(() => {
              const r=document.querySelector('.overlay-card').getBoundingClientRect();
              const s=document.querySelector('#stage').getBoundingClientRect();
              return r.width>0 && r.height>0 && r.left>=s.left-1 && r.right<=s.right+1 &&
                r.top>=s.top-1 && r.bottom<=s.bottom+1 &&
                document.querySelector('#overlay-title').textContent.trim().length>0 &&
                document.querySelector('#primary').textContent.trim().length>0;
            })()""")
            reach(cdp, "#primary")
            if cdp.evaluate("!document.querySelector('#new-game').hidden"):
                reach(cdp, "#new-game")
    cdp.evaluate("MossI18n.setLocale('en')")
    place(cdp, "start")


def touch_point(cdp, action, pointer_id):
    point = cdp.evaluate(f"""(() => {{const r=document.querySelector('[data-control={action}]')
      .getBoundingClientRect();return {{x:r.x+r.width/2,y:r.y+r.height/2}}}})()""")
    return point | {"id": pointer_id}


def native_touch(cdp):
    place(cdp, "start")
    right, jump, cast = [touch_point(cdp, action, i + 1)
                         for i, action in enumerate(("right", "jump", "cast"))]
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[right])
    cdp.frames(15)
    verified(cdp, "A native touch on right moves the wizard in the cropped view",
             "Wandmoss.state.player.x>155 && !!document.querySelector('[data-control=right].pressed')")
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[right, jump, cast])
    cdp.frames(6)
    verified(cdp, "Simultaneous native movement, jump and magic remain playable", """
      Wandmoss.state.player.x>170 && Wandmoss.state.player.y<450 &&
      Wandmoss.state.player.vy<0 && Wandmoss.state.spells.length>0
    """)
    player_visible(cdp, "Native jumping")
    cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
    place(cdp, "start")
    cdp.evaluate("Wandmoss.state.boots.owned=true;Wandmoss.render()")
    boots = touch_point(cdp, "boots", 4)
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[boots])
    cdp.frames(2)
    verified(cdp, "Native touch activates the acquired boots without remapping them",
             "Wandmoss.state.boots.active>29.9 && document.querySelector('[data-control=boots]').disabled")
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[boots, jump])
    cdp.frames(8)
    verified(cdp, "Native touch starts a boosted jump", "Wandmoss.state.player.vy<-800 && Wandmoss.state.player.y<360")
    player_visible(cdp, "Native boosted jumping")
    cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
    place(cdp, "start")
    right = touch_point(cdp, "right", 5)
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[right])
    verified(cdp, "A held touch is present before rotating", "!!document.querySelector('[data-control=right].pressed')")
    capture(cdp)
    resize(cdp, 390, 844)
    unchanged(cdp, "Rotation while touching a control")
    verified(cdp, "Rotation releases held touch actions", "!document.querySelector('[data-control].pressed')")
    cdp.frames(20)
    verified(cdp, "Cleared touch input cannot resume movement after rotation", "Wandmoss.state.player.x===Wandmoss.state.spawn.x && Wandmoss.state.player.vx===0")
    cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
    mobile_layout(cdp, "After native-touch rotation")


def native_pinch(cdp, context):
    """Touch the canvas itself; verify zoom without advancing game physics."""
    points = cdp.evaluate("""(() => {
      const r=document.querySelector('#stage').getBoundingClientRect();
      const x=r.x+r.width/2,y=r.y+r.height/2;
      return {near:[{x:x-35,y,id:71},{x:x+35,y,id:72}],
        far:[{x:x-70,y,id:71},{x:x+70,y,id:72}],
        scale:document.querySelector('#game').getBoundingClientRect().width/1152};
    })()""")
    capture(cdp)
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=points["near"])
    cdp.call("Input.dispatchTouchEvent", type="touchMove", touchPoints=points["far"])
    cdp.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
    wait_for(cdp, f"document.querySelector('#game').getBoundingClientRect().width/1152>{points['scale'] * 1.8}",
             context + " must enlarge the readable view through a native two-finger gesture")
    unchanged(cdp, context + " pinch-out")
    player_visible(cdp, context + " pinch-out")
    mobile_layout(cdp, context + " zoomed view", fullscreen=cdp.evaluate("!!document.fullscreenElement"))
    cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=points["far"])
    cdp.call("Input.dispatchTouchEvent", type="touchMove", touchPoints=points["near"])
    cdp.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
    wait_for(cdp, f"Math.abs(document.querySelector('#game').getBoundingClientRect().width/1152-{points['scale']})<.01",
             context + " must restore its readable minimum through a native pinch-in")
    unchanged(cdp, context + " pinch-in")
    player_visible(cdp, context + " pinch-in")
    verified(cdp, context + " pinch cannot leave gameplay touch buttons held", "!document.querySelector('[data-control].pressed')")


def fullscreen_roundtrip(cdp):
    capture(cdp)
    cdp.click("#fullscreen")
    wait_for(cdp, "document.fullscreenElement===document.querySelector('#game-view') && document.querySelector('#game-view').classList.contains('is-fullscreen')",
             "Native fullscreen must still enter from the mobile page")
    verified(cdp, "Mobile native fullscreen retains the fixed-resolution scene and wrapper", """(() => {
      const c=document.querySelector('#game'),v=document.querySelector('#game-view');
      return c.width===1152 && c.height===648 && v.classList.contains('is-mobile-page') &&
        v.contains(document.querySelector('.touch-controls')) &&
        v.contains(document.querySelector('#music-dialog'));
    })()""")
    mobile_layout(cdp, "Native phone fullscreen", fullscreen=True)
    player_visible(cdp, "Native phone fullscreen")
    unchanged(cdp, "Entering native phone fullscreen")
    resize(cdp, 844, 390)
    unchanged(cdp, "Rotating inside native phone fullscreen")
    mobile_layout(cdp, "Landscape native phone fullscreen", fullscreen=True)
    player_visible(cdp, "Landscape native phone fullscreen")
    native_pinch(cdp, "Landscape native phone fullscreen")
    fits(cdp, "Native fullscreen exposes its exit and all touch controls",
         ["#fullscreen"] + [f'[data-control="{action}"]' for action in ACTIONS])
    cdp.click("#fullscreen")
    wait_for(cdp, "!document.fullscreenElement && !document.querySelector('#game-view').classList.contains('is-fullscreen')",
             "The fullscreen button must restore the ordinary mobile page")
    unchanged(cdp, "Native fullscreen entry and exit")
    mobile_layout(cdp, "Returned from native fullscreen")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=(PROJECT / "index.html").as_uri())
    args = parser.parse_args()
    with Browser(width=390, height=844) as browser:
        cdp = browser.cdp
        cdp.call("Emulation.setDeviceMetricsOverride", width=390, height=844,
                 deviceScaleFactor=1, mobile=True,
                 screenOrientation={"type": "portraitPrimary", "angle": 0})
        cdp.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        browser.open(args.url)
        reach(cdp, "#primary")
        cdp.click("#primary")
        verified(cdp, "Starting on a phone starts gameplay with the chapter-start autosave",
                 "Wandmoss.state.mode==='playing' && MossSave.read().kind==='level'")
        observe_storage(cdp)
        for width, height in SIZES:
            capture(cdp)
            resize(cdp, width, height)
            unchanged(cdp, f"Resizing the playing page to {width}x{height}")
            mobile_layout(cdp, f"{width}x{height} ordinary page")
            for location in ("start", "middle", "end", "high jump"):
                place(cdp, location)
                player_visible(cdp, f"{width}x{height} {location}")
        # Explicit landscape -> portrait -> landscape with the same progress,
        # active boot timer and camera; no physics frame advances during it.
        capture(cdp)
        resize(cdp, 390, 844)
        unchanged(cdp, "Mid-game landscape to portrait")
        mobile_layout(cdp, "Mid-game portrait")
        resize(cdp, 844, 390)
        unchanged(cdp, "Mid-game portrait back to landscape")
        mobile_layout(cdp, "Mid-game landscape")
        native_touch(cdp)
        native_pinch(cdp, "Ordinary portrait page")
        fullscreen_roundtrip(cdp)
        for width, height in ((390, 844), (844, 320)):
            resize(cdp, width, height)
            menus(cdp, f"{width}x{height}")
        # The serialized normal autosave must remain usable after these view
        # changes. A reload reconstructs the production opening/resume menu.
        reload_game(cdp)
        reach(cdp, "#resume-button")
        cdp.click("#resume-button")
        verified(cdp, "Saved-game continuation still starts at the chapter spawn",
                 "Wandmoss.state.mode==='playing' && Wandmoss.state.player.x===Wandmoss.state.spawn.x")
        mobile_layout(cdp, "Resumed game on short landscape viewport")
        cdp.evaluate("true")
        assert not browser.errors(), json.dumps(browser.errors(), indent=2)
        passed("Mobile layout, rotation, native input, overlays and fullscreen have no browser errors")
    with Browser(width=1440, height=900) as browser:
        browser.open(args.url)
        cdp = browser.cdp
        verified(cdp, "Desktop ordinary-page rendering retains the full 16:9 scene", """(() => {
          const v=document.querySelector('#game-view'),c=document.querySelector('#game');
          const r=c.getBoundingClientRect();
          return !v.classList.contains('is-mobile-page') && !document.fullscreenElement &&
            c.width===1152 && c.height===648 && Math.abs(r.width/r.height-1152/648)<.001 &&
            document.documentElement.scrollWidth<=innerWidth+1;
        })()""")
        assert not browser.errors(), json.dumps(browser.errors(), indent=2)
        passed("Desktop layout has no browser errors")
    print(f"All {len(RESULTS)} focused mobile-view checks passed. No screenshots were captured.")


if __name__ == "__main__":
    main()
