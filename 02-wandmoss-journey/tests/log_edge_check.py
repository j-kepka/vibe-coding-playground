#!/usr/bin/env python3
"""Focused solid-log edge regression with real Chrome keyboard/touch input.

Run: python3 02-wandmoss-journey/tests/log_edge_check.py
Requires the standard-library Browser helper and its local Chrome requirements.
No screenshots or recordings are captured. The existing gameplay fixtures and
campaign model route run as collision integration checks. --rules-only skips native input;
--engine-file evaluates an archived engine in memory to demonstrate the failure
without modifying the shipped game files.
"""

import argparse
import json
from pathlib import Path

from browser_check import Browser, PROJECT, load_chapter


def install_engine(cdp, engine_file):
    if engine_file:
        cdp.evaluate(engine_file.read_text())


def edge_fixture(cdp, direction, overlap, speed=50):
    """Place the live wizard on the actual first final-chapter log."""
    load_chapter(cdp, 3)
    return cdp.evaluate(f"""(() => {{
      const s=Wandmoss.state,p=s.player;
      const log=s.platforms.find(q=>q.kind==='log'&&!q.oneWay);
      s.enemies=[];s.checkpoints=[];s.fireflies=[];s.boss=null;
      Object.assign(p,{{
        x:{direction}>0?log.x+log.w-{overlap}:log.x-p.w+{overlap},
        y:log.y-p.h,vx:{direction}*{speed},vy:0,grounded:true,coyote:.11
      }});
      s.camera=Math.max(0,p.x-MossEngine.WIDTH*.32);
      Wandmoss.render();
      document.querySelector('#game').focus({{preventScroll:true}});
      return {{x:p.x,time:s.time,top:log.y,left:log.x,right:log.x+log.w}};
    }})()""")


def snapshot(cdp, frames=1):
    return cdp.evaluate(f"""(() => {{
      window.__testFrames({frames});
      const s=Wandmoss.state,p=s.player;
      return {{x:p.x,time:s.time,y:p.y,w:p.w,h:p.h,vx:p.vx,vy:p.vy,grounded:p.grounded,
        health:s.health,deaths:s.deaths,mode:s.mode}};
    }})()""")


def verify_motion(before, current, direction, context):
    distance = (current["x"] - before["x"]) * direction
    # Use elapsed simulation time: a fractional clock accumulator can alternate
    # between one, two or three 120 Hz steps in a 60 Hz animation frame.
    elapsed = current["time"] - before["time"]
    assert elapsed > 0 and -1e-6 <= distance <= 310 * elapsed + 1e-6, f"{context}: discontinuous movement {before} -> {current}"
    assert current["health"] == 3 and current["deaths"] == 0 and current["mode"] == "playing", f"{context}: walk-off must preserve all hearts and the run: {current}"


def native_edge_walk(cdp, direction, braking, press, release, context):
    log = edge_fixture(cdp, direction, .9 if braking else 1.5, 0 if braking else 50)
    before = log
    if braking:
        # Build velocity through real input before releasing it. One frame from
        # rest leaves a subpixel sliver of support; braking must stop on it.
        press()
        try:
            current = snapshot(cdp)
            verify_motion(before, current, direction, context)
            assert current["grounded"] and current["y"] + current["h"] == log["top"], f"{context}: native input must retain fractional top support: {current}"
            before = current
        finally:
            release()
        for _ in range(10):
            current = snapshot(cdp)
            verify_motion(before, current, direction, context)
            assert current["grounded"] and current["y"] + current["h"] == log["top"], f"{context}: braking must retain fractional top support: {current}"
            before = current
        assert current["vx"] == 0, f"{context}: release must finish braking"
    press()
    left_log = fell = landed = False
    try:
        for _ in range(90):
            current = snapshot(cdp)
            verify_motion(before, current, direction, context)
            before = current
            supported = current["x"] + current["w"] > log["left"] and current["x"] < log["right"]
            if supported:
                assert current["grounded"] and current["y"] + current["h"] == log["top"], f"{context}: remaining overlap must stay on top: {current}"
            else:
                left_log = True
                fell |= not current["grounded"] and current["vy"] > 0
            if left_log and current["grounded"]:
                assert fell and current["y"] == 480, f"{context}: the edge must fall normally onto the floor: {current}"
                landed = True
                break
        assert landed, f"{context}: did not land on the floor"
    finally:
        release()
    print("PASS", context, json.dumps({"x": current["x"], "y": current["y"], "health": current["health"]}))


def keyboard_checks(cdp):
    count = 0
    for direction, key in ((-1, "ArrowLeft"), (1, "ArrowRight")):
        for braking in (False, True):
            native_edge_walk(cdp, direction, braking,
                             lambda: cdp.key(key, key),
                             lambda: cdp.key(key, key, False),
                             f"Native keyboard finale log, {'left' if direction < 0 else 'right'}, {'brake and resume' if braking else 'slow edge walk'}")
            count += 1
    return count


def touch_checks(cdp):
    count = 0
    for direction, action in ((-1, "left"), (1, "right")):
        def press():
            point = cdp.evaluate(f"""(() => {{
              const button=document.querySelector('[data-control={action}]');
              button.scrollIntoView({{block:'nearest'}});
              const r=button.getBoundingClientRect();
              return {{x:r.x+r.width/2,y:r.y+r.height/2,id:1}};
            }})()""")
            cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[point])

        def release():
            cdp.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])

        for braking in (False, True):
            native_edge_walk(cdp, direction, braking, press, release,
                             f"Native touch finale log, {action}, {'brake and resume' if braking else 'slow edge walk'}")
            count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rules-only", action="store_true", help="Run focused engine scenarios without native input")
    parser.add_argument("--engine-file", type=Path, help="Evaluate an archived engine in memory instead of the current engine")
    parser.add_argument("--url", default=(PROJECT / "index.html").as_uri())
    args = parser.parse_args()
    native_count = 0
    with Browser(height=1200) as browser:
        browser.open(args.url)
        cdp = browser.cdp
        install_engine(cdp, args.engine_file)
        results = cdp.evaluate((PROJECT / "tests/log_edge_checks.js").read_text())
        for result in results:
            print("PASS", result["name"], json.dumps(result["detail"]))
        integration = []
        for name in ("gameplay_checks.js", "campaign_route.js"):
            integration.extend(cdp.evaluate((PROJECT / "tests" / name).read_text()))
        for result in integration:
            print("PASS", result["name"], json.dumps(result["detail"]))
        if not args.rules_only:
            native_count += keyboard_checks(cdp)
        assert not browser.errors(), json.dumps(browser.errors(), indent=2)
    if not args.rules_only:
        with Browser(width=390, height=844) as browser:
            cdp = browser.cdp
            cdp.call("Emulation.setDeviceMetricsOverride", width=390, height=844,
                     deviceScaleFactor=1, mobile=True)
            cdp.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
            browser.open(args.url)
            install_engine(cdp, args.engine_file)
            native_count += touch_checks(cdp)
            assert not browser.errors(), json.dumps(browser.errors(), indent=2)
    scenarios = sum(result["detail"]["scenarios"] for result in results)
    print(f"All {len(results)} focused collision groups ({scenarios} engine scenarios), {len(integration)} retained gameplay/campaign integration groups and {native_count} native keyboard/touch edge walks passed without JavaScript or resource errors.")


if __name__ == "__main__":
    main()
