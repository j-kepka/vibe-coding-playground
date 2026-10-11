#!/usr/bin/env python3
"""Run Wandmoss browser checks with Python's standard library and local Chrome.

Run: python3 02-wandmoss-journey/tests/browser_check.py
Requires Linux, Python 3.10+, and google-chrome or chromium on PATH.
No Python packages are required. DevTools drives real browser input;
An injected animation clock makes physics reproducible. Checks do not create
or overwrite presentation screenshots.
"""

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request


PROJECT = Path(__file__).resolve().parents[1]
ANIMATION_CLOCK = """
(() => {
  let time = 0, nextId = 1;
  const callbacks = new Map();
  window.requestAnimationFrame = cb => {
    const id = nextId++; callbacks.set(id, cb); return id;
  };
  window.cancelAnimationFrame = id => callbacks.delete(id);
  window.__testFrames = (count = 1, interval = 1000 / 60) => {
    for (let frame = 0; frame < count; frame++) {
      time += interval;
      const active = [...callbacks.values()]; callbacks.clear();
      active.forEach(cb => cb(time));
    }
  };
  window.__testAudio = [];
  const NativeAudioContext = window.AudioContext;
  if (NativeAudioContext) window.AudioContext = class extends NativeAudioContext {
    constructor(...args) { super(...args); window.__testAudio.push(this); }
  };
})();
"""


class DevTools:
    """Small uncompressed RFC 6455 client for the local DevTools WebSocket."""

    def __init__(self, url):
        from urllib.parse import urlsplit
        address = urlsplit(url)
        self.socket = socket.create_connection((address.hostname, address.port), 10)
        self.socket.settimeout(15)
        key = base64.b64encode(os.urandom(16)).decode()
        path = address.path + ("?" + address.query if address.query else "")
        request = (f"GET {path} HTTP/1.1\r\nHost: {address.netloc}\r\n"
                   "Upgrade: websocket\r\nConnection: Upgrade\r\n"
                   f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.socket.sendall(request.encode())
        header = bytearray()
        while not header.endswith(b"\r\n\r\n"):
            header.extend(self.socket.recv(1))
        expected = base64.b64encode(hashlib.sha1(
            (key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest())
        if b" 101 " not in header or expected not in header:
            raise RuntimeError("Chrome rejected the DevTools WebSocket handshake")
        self.next_id = 0
        self.events = []

    def read(self, size):
        chunks = bytearray()
        while len(chunks) < size:
            chunk = self.socket.recv(size - len(chunks))
            if not chunk:
                raise RuntimeError("Chrome closed the DevTools connection")
            chunks.extend(chunk)
        return bytes(chunks)

    def send(self, payload, opcode=1):
        data = payload.encode() if isinstance(payload, str) else payload
        length = len(data)
        header = bytes([0x80 | opcode])
        if length < 126:
            header += bytes([0x80 | length])
        elif length < 65536:
            header += bytes([0x80 | 126]) + struct.pack("!H", length)
        else:
            header += bytes([0x80 | 127]) + struct.pack("!Q", length)
        mask = os.urandom(4)
        self.socket.sendall(header + mask + bytes(
            byte ^ mask[index % 4] for index, byte in enumerate(data)))

    def receive(self):
        parts = bytearray()
        while True:
            first, second = self.read(2)
            opcode, length = first & 15, second & 127
            if length == 126:
                length = struct.unpack("!H", self.read(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", self.read(8))[0]
            mask = self.read(4) if second & 128 else None
            data = self.read(length)
            if mask:
                data = bytes(byte ^ mask[index % 4] for index, byte in enumerate(data))
            if opcode == 8:
                raise RuntimeError("Chrome closed the DevTools connection")
            if opcode == 9:
                self.send(data, 10)
                continue
            if opcode in (0, 1):
                parts.extend(data)
                if first & 128:
                    return json.loads(parts)

    def call(self, method, **params):
        self.next_id += 1
        request_id = self.next_id
        self.send(json.dumps({"id": request_id, "method": method, "params": params}))
        while True:
            message = self.receive()
            if message.get("id") == request_id:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
            self.events.append(message)

    def evaluate(self, expression):
        result = self.call("Runtime.evaluate", expression=expression,
                           returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in result:
            raise AssertionError(json.dumps(result["exceptionDetails"]))
        return result.get("result", {}).get("value")

    def frames(self, count=1):
        self.evaluate(f"window.__testFrames({count})")

    def key(self, key, code, down=True, modifiers=0):
        key_code = {"ArrowLeft": 37, "ArrowUp": 38, "ArrowRight": 39, "ArrowDown": 40,
                    "Home": 36, "End": 35, "Enter": 13, "Tab": 9,
                    "Escape": 27, "Space": 32}.get(code, ord(key.upper()) if len(key) == 1 else 0)
        self.call("Input.dispatchKeyEvent", type="keyDown" if down else "keyUp",
                  key=key, code=code, windowsVirtualKeyCode=key_code,
                  nativeVirtualKeyCode=key_code, modifiers=modifiers)

    def click(self, selector):
        box = self.evaluate(f"(() => {{const r=document.querySelector({json.dumps(selector)}).getBoundingClientRect(); return {{x:r.x+r.width/2,y:r.y+r.height/2}};}})()")
        self.call("Input.dispatchMouseEvent", type="mousePressed", button="left", clickCount=1, **box)
        self.call("Input.dispatchMouseEvent", type="mouseReleased", button="left", clickCount=1, **box)

class Browser:
    def __init__(self, width=1440, height=900):
        executable = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
        if not executable:
            raise RuntimeError("Install Chrome/Chromium or add its executable to PATH")
        self.profile = tempfile.TemporaryDirectory(prefix="wandmoss-browser-", ignore_cleanup_errors=True)
        self.process = subprocess.Popen([
            executable, "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
            "--remote-debugging-port=0", f"--user-data-dir={self.profile.name}",
            f"--window-size={width},{height}", "--no-first-run", "--no-default-browser-check",
            "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            start_new_session=True,
            env=os.environ | {"XDG_DATA_HOME": str(Path(self.profile.name) / "xdg"),
                              "XDG_CACHE_HOME": str(Path(self.profile.name) / "cache"),
                              "XDG_CONFIG_HOME": str(Path(self.profile.name) / "config")})
        active_port = Path(self.profile.name) / "DevToolsActivePort"
        deadline = time.monotonic() + 15
        while not active_port.exists():
            if self.process.poll() is not None or time.monotonic() > deadline:
                self.close()
                raise RuntimeError("Headless Chrome did not start")
            time.sleep(.05)
        port = int(active_port.read_text().splitlines()[0])
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list") as response:
            tabs = json.load(response)
        self.cdp = DevTools(next(tab["webSocketDebuggerUrl"] for tab in tabs if tab["type"] == "page"))
        self.cdp.call("Page.enable")
        self.cdp.call("Runtime.enable")
        self.cdp.call("Log.enable")
        self.cdp.call("Network.enable")
        self.cdp.call("Page.addScriptToEvaluateOnNewDocument", source=ANIMATION_CLOCK)
        self.cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                      deviceScaleFactor=1, mobile=False)

    def open(self, url):
        self.cdp.events.clear()
        self.cdp.call("Page.navigate", url=url)
        deadline = time.monotonic() + 10
        while not self.cdp.evaluate("document.readyState === 'complete' && !!window.Wandmoss"):
            if time.monotonic() > deadline:
                raise AssertionError("Wandmoss did not initialize within 10 seconds")
            time.sleep(.02)
        self.cdp.frames(2)

    def errors(self):
        errors = []
        for event in self.cdp.events:
            method, params = event.get("method"), event.get("params", {})
            if method == "Runtime.exceptionThrown":
                errors.append(params.get("exceptionDetails", {}))
            elif method == "Log.entryAdded" and params.get("entry", {}).get("level") == "error":
                errors.append(params["entry"])
            elif method == "Network.loadingFailed" and not params.get("canceled"):
                errors.append(params)
        return errors

    def close(self):
        if getattr(self, "process", None):
            if self.process.poll() is None:
                os.killpg(self.process.pid, signal.SIGTERM)
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(self.process.pid, signal.SIGKILL)
                self.process.wait()
        if getattr(self, "profile", None):
            self.profile.cleanup()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inspect", action="store_true", help="Print current engine state and page controls")
    parser.add_argument("--rules-only", action="store_true", help="Run isolated rules, renderer and save fixtures without interface checks")
    parser.add_argument("--followup-only", action="store_true", help="Run quota fallback, earned boss-retry input and mobile campaign ending regressions")
    parser.add_argument("--sky-only", action="store_true", help="Check stable sky rendering and desktop/mobile pause in the cloud chapter")
    parser.add_argument("--url", default=(PROJECT / "index.html").as_uri())
    args = parser.parse_args()
    if args.sky_only:
        sky_browser_checks(args.url)
        return
    if args.followup_only:
        with Browser(width=390, height=844) as browser:
            browser.cdp.call("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=1, mobile=True)
            browser.open(args.url)
            cdp = browser.cdp
            cdp.evaluate("window.__wandmossSaveFilter='A quota failure keeps the newest temporary checkpoint ahead of a readable older save'")
            for result in cdp.evaluate((PROJECT / "tests/save_checks.js").read_text()):
                print("PASS", result["name"], json.dumps(result["detail"]))
            mobile_boss_retry_checks(cdp)
            assert not browser.errors(), json.dumps(browser.errors(), indent=2)
            print("All targeted Wandmoss follow-up checks passed without JavaScript or resource errors.")
        return
    with Browser(height=1200) as browser:
        browser.open(args.url)
        cdp = browser.cdp
        if args.inspect:
            print(json.dumps(cdp.evaluate("({state:Wandmoss.state,api:Object.keys(Wandmoss),engine:Object.keys(MossEngine),buttons:[...document.querySelectorAll('button')].map(b=>({id:b.id,text:b.textContent}))})"), indent=2))
        else:
            results = cdp.evaluate((PROJECT / "tests/gameplay_checks.js").read_text())
            results += cdp.evaluate((PROJECT / "tests/campaign_route.js").read_text())
            results += cdp.evaluate((PROJECT / "tests/renderer_checks.js").read_text())
            results += cdp.evaluate((PROJECT / "tests/boss_checks.js").read_text())
            results += cdp.evaluate((PROJECT / "tests/save_checks.js").read_text())
            for result in results:
                print("PASS", result["name"], json.dumps(result["detail"]))
            if not args.rules_only:
                desktop_checks(cdp)
                desktop_campaign_checks(cdp)
                autosave_browser_checks(cdp)
                verify_desktop_start(cdp)
                verify_campaign_ending(cdp)
        assert not browser.errors(), json.dumps(browser.errors(), indent=2)
        print("PASS Desktop boot and scenarios without JavaScript or resource errors")
    if not args.inspect and not args.rules_only:
        mobile_checks(args.url)
        print("All Wandmoss browser checks passed.")


def set_locale(cdp, locale):
    """Set a regression suite's explicit locale without simulating acceptance."""
    cdp.evaluate(f"MossI18n.setLocale({json.dumps(locale)})")


def load_chapter(cdp, index):
    """Tests-only fresh chapter fixture; no production chapter-selection API."""
    assert index in range(4)
    cdp.evaluate(f"""(() => {{
      Wandmoss.restart();
      const s=Wandmoss.state;
      s.boots.owned={json.dumps(index > 2)};
      MossEngine.loadLevel(s,{index});
      s.events.push('level');
      Wandmoss.advance(0);
      document.querySelector('#game').focus({{preventScroll:true}});
    }})()""")


def load_boss_checkpoint(cdp):
    """Tests-only chapter fixture that triggers the real final lantern.

    This placement isolates earned retry/audio/interface behavior; it does not
    claim a campaign playthrough or expose a shortcut in the shipped game.
    """
    load_chapter(cdp, 3)
    cdp.evaluate("""(() => {
      const s=Wandmoss.state,lantern=s.checkpoints[s.checkpoints.length-1];
      Object.assign(s.player,{x:lantern.x,y:lantern.y-s.player.h,vx:0,vy:0,grounded:true});
      Wandmoss.advance(1/120);
      if(s.checkpointIndex!==s.checkpoints.length-1) throw new Error('Final lantern was not lit');
      Wandmoss.retry();
    })()""")


def check(cdp, name, expression):
    result = cdp.evaluate(expression)
    assert result, f"{name}: {result!r}"
    print("PASS", name)


def reload_game(cdp):
    """Wait for a new document rather than inspecting the old ready screen."""
    cdp.evaluate("window.__beforeReload = true")
    cdp.call("Page.reload")
    deadline = time.monotonic() + 10
    while not cdp.evaluate("!window.__beforeReload && document.readyState==='complete' && !!window.Wandmoss"):
        assert time.monotonic() < deadline, "Reload must initialize a new game document"
        time.sleep(.02)
    cdp.frames(2)


def sky_browser_checks(url):
    """Focused visual checks; chapter fixtures place Mch on real cloud surfaces."""
    for width, height, mobile in ((1440, 1200, False), (390, 844, True)):
        with Browser(width=width, height=height) as browser:
            cdp = browser.cdp
            cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                     deviceScaleFactor=1, mobile=mobile)
            browser.open(url)
            cdp.click("#primary")
            if not mobile:
                for result in cdp.evaluate((PROJECT / "tests/renderer_checks.js").read_text()):
                    print("PASS", result["name"], json.dumps(result["detail"]))
            for camera, player_x in ((200, 350), (1700, 1990), (2918, 3450)):
                cdp.evaluate(f"""(() => {{
                  const s=Wandmoss.state; MossEngine.loadLevel(s,2);
                  const support=s.platforms.filter(p=>{player_x}>p.x&&{player_x}<p.x+p.w)
                    .sort((a,b)=>b.y-a.y)[0];
                  Object.assign(s.player,{{x:{player_x},y:support.y-s.player.h,vx:0,vy:0,grounded:true}});
                  s.camera={camera}; Wandmoss.advance(0); Wandmoss.render();
                }})()""")
                check(cdp, f"{width}x{height} sky fixture at camera {camera} stands on a real cloud",
                      "Wandmoss.state.levelIndex===2 && Wandmoss.state.mode==='playing' && Wandmoss.state.platforms.some(p=>p.kind==='cloud' && Wandmoss.state.player.x>p.x && Wandmoss.state.player.x<p.x+p.w && Wandmoss.state.player.y+Wandmoss.state.player.h===p.y)")
                check(cdp, f"{width}x{height} sky fits horizontally at camera {camera}",
                      "document.documentElement.scrollWidth<=innerWidth && document.querySelector('#overlay').hidden")
                cdp.key("p", "KeyP"); cdp.key("p", "KeyP", False)
                frozen = cdp.evaluate("JSON.stringify({time:Wandmoss.state.time,camera:Wandmoss.state.camera,player:Wandmoss.state.player})")
                cdp.frames(120)
                check(cdp, f"{width}x{height} sky pause freezes the scene at camera {camera}",
                      "Wandmoss.state.mode==='paused' && JSON.stringify({time:Wandmoss.state.time,camera:Wandmoss.state.camera,player:Wandmoss.state.player})===" + json.dumps(frozen))
                check(cdp, f"{width}x{height} sky pause and resume button fit in the viewport",
                      "(() => {const card=document.querySelector('.overlay-card').getBoundingClientRect(),button=document.querySelector('#primary').getBoundingClientRect();return !document.querySelector('#overlay').hidden && document.documentElement.scrollWidth<=innerWidth && card.left>=0 && card.right<=innerWidth && card.top>=0 && card.bottom<=innerHeight && button.width>0 && button.top>=0 && button.bottom<=innerHeight})()")
                cdp.click("#primary")
                check(cdp, f"{width}x{height} sky pause menu resumes through its button",
                      "Wandmoss.state.mode==='playing' && document.querySelector('#overlay').hidden && document.activeElement.id==='game'")
            assert not browser.errors(), json.dumps(browser.errors(), indent=2)
            print(f"PASS {width}x{height} focused sky checks without JavaScript or resource errors")
    print("All focused Wandmoss sky checks passed.")


def desktop_checks(cdp):
    set_locale(cdp, "pl")
    check(cdp, "Initial start screen and Polish interface",
          "Wandmoss.state.mode==='ready' && !document.querySelector('#overlay').hidden && document.documentElement.lang==='pl'")
    cdp.click("#primary")
    check(cdp, "Start button begins the run", "Wandmoss.state.mode==='playing' && document.querySelector('#overlay').hidden")
    cdp.key("ArrowRight", "ArrowRight"); cdp.frames(30)
    right_x = cdp.evaluate("Wandmoss.state.player.x")
    assert right_x > 220, "Keyboard right must move the wizard"
    cdp.key("ArrowRight", "ArrowRight", False); cdp.frames(15)
    cdp.key("ArrowLeft", "ArrowLeft"); cdp.frames(15)
    check(cdp, "Keyboard left and right move the wizard", f"Wandmoss.state.player.x < {right_x}")
    cdp.key("ArrowLeft", "ArrowLeft", False); cdp.frames(15)
    cdp.key(" ", "Space"); cdp.frames(12)
    check(cdp, "Space starts a jump", "Wandmoss.state.player.y < 450 && !Wandmoss.state.player.grounded")
    cdp.key(" ", "Space", False); cdp.frames(60)
    check(cdp, "Keyboard jump lands on the floor", "Wandmoss.state.player.grounded && Wandmoss.state.player.y===480")
    cdp.key("p", "KeyP"); cdp.key("p", "KeyP", False)
    frozen = cdp.evaluate("JSON.stringify({x:Wandmoss.state.player.x,y:Wandmoss.state.player.y,time:Wandmoss.state.time})")
    cdp.frames(120)
    check(cdp, "P pauses movement and the timer",
          "Wandmoss.state.mode==='paused' && JSON.stringify({x:Wandmoss.state.player.x,y:Wandmoss.state.player.y,time:Wandmoss.state.time})===" + json.dumps(frozen))
    cdp.click("#primary")
    check(cdp, "Pause overlay resumes the run", "Wandmoss.state.mode==='playing'")
    cdp.click("#restart")
    check(cdp, "Restart button retries the current chapter with fresh hearts, items and checkpoints",
          "Wandmoss.state.mode==='playing' && Wandmoss.state.player.x===110 && Wandmoss.state.health===3 && Wandmoss.state.collected===0 && Wandmoss.state.checkpointIndex===-1")
    cdp.evaluate("Wandmoss.state.player.x=700;Wandmoss.render()")
    cdp.key("x", "KeyX"); cdp.frames(15); cdp.key("x", "KeyX", False)
    check(cdp, "X casts a spell through the keyboard handler", "!Wandmoss.state.enemies[0].alive")
    cdp.key("r", "KeyR"); cdp.key("r", "KeyR", False)
    check(cdp, "R retries the current chapter", "Wandmoss.state.player.x===110 && Wandmoss.state.enemies[0].alive")
    cdp.click("#sound")
    check(cdp, "Sound toggle creates a running Web Audio context",
          "document.querySelector('#sound').getAttribute('aria-pressed')==='true' && __testAudio.length===1 && __testAudio[0].state==='running'")
    check(cdp, "Sound toggle returns keyboard focus to the game", "document.activeElement.id==='game'")
    cdp.key(" ", "Space"); cdp.frames(10); cdp.key(" ", "Space", False)
    check(cdp, "Space still jumps after enabling sound", "Wandmoss.state.player.y<450 && document.querySelector('#sound').getAttribute('aria-pressed')==='true'")
    cdp.click("#sound")
    check(cdp, "Sound toggle returns to muted", "document.querySelector('#sound').getAttribute('aria-pressed')==='false'")
    cdp.key("r", "KeyR"); cdp.key("r", "KeyR", False)
    cdp.key("x", "KeyX"); cdp.frames(1); cdp.key("x", "KeyX", False)
    check(cdp, "First keyboard spell starts a one-second recovery shown by the HUD",
          "Wandmoss.state.spells.length===1 && Wandmoss.state.player.castCooldown>.97 && document.querySelector('#spell-status').classList.contains('recovering') && document.querySelector('#spell-label').textContent.includes('s') && parseFloat(document.querySelector('#spell-fill').style.width)<3")
    for _ in range(5):
        cdp.key("x", "KeyX"); cdp.frames(5); cdp.key("x", "KeyX", False)
    check(cdp, "Repeated early X taps cannot bypass wand recovery",
          "Wandmoss.state.spells.length===1 && Wandmoss.state.player.castCooldown>.55")
    cdp.frames(5)
    check(cdp, "The wand recovery indicator reaches halfway after half a second",
          "(() => {const width=parseFloat(document.querySelector('#spell-fill').style.width);return width>47 && width<53 && Wandmoss.state.player.castCooldown>.47 && Wandmoss.state.player.castCooldown<.53})()")
    cdp.frames(35)
    check(cdp, "A full second restores the wand and its HUD", "Wandmoss.state.player.castCooldown===0 && document.querySelector('#spell-label').textContent.includes('gotowa') && parseFloat(document.querySelector('#spell-fill').style.width)===100")
    cdp.key("x", "KeyX"); cdp.frames(1)
    check(cdp, "Holding X starts another spell when recovery has finished", "Wandmoss.state.spells.length===1")
    cdp.frames(50)
    check(cdp, "Held casting cannot fire a second spell before one second elapses", "Wandmoss.state.spells.length===0")
    cdp.frames(15)
    check(cdp, "Holding X repeats casting after the one-second interval", "Wandmoss.state.spells.length===1 && Wandmoss.state.spells[0].life>.65 && Wandmoss.state.player.castCooldown>.85")
    cdp.key("x", "KeyX", False); cdp.frames(65)
    check(cdp, "Releasing X stops repeated casting", "Wandmoss.state.spells.length===0 && Wandmoss.state.player.castCooldown===0")


def verify_desktop_start(cdp):
    reload_game(cdp)
    cdp.click("#resume-button" if cdp.evaluate("!document.querySelector('#resume-button').hidden") else "#primary")
    check(cdp, "Desktop start or continuation begins an actual playable run", "Wandmoss.state.mode==='playing' && document.querySelector('#overlay').hidden")


def desktop_campaign_checks(cdp):
    cdp.evaluate("(() => {MossEngine.loadLevel(Wandmoss.state,2);Wandmoss.state.mode='playing';const a=Wandmoss.state.artifact;Object.assign(Wandmoss.state.player,{x:a.x,y:a.y-Wandmoss.state.player.h+16,vy:0,grounded:false});Wandmoss.advance(1/120)})()")
    check(cdp, "Sky artifact is acquired without activating boots",
          "Wandmoss.state.boots.owned && Wandmoss.state.boots.active===0 && document.querySelector('#level-number').textContent.includes('3')")
    cdp.key("c", "KeyC"); cdp.frames(2); cdp.key("c", "KeyC", False)
    check(cdp, "C activates boots through real keyboard input and updates their HUD",
          "Wandmoss.state.boots.active>29.8 && document.querySelector('#boots-label').textContent.includes('30')")
    cdp.key("p", "KeyP"); cdp.key("p", "KeyP", False)
    active = cdp.evaluate("Wandmoss.state.boots.active")
    cdp.frames(180)
    check(cdp, "Pause freezes the active boot timer in the browser", f"Wandmoss.state.mode==='paused' && Wandmoss.state.boots.active==={active}")
    cdp.click("#primary"); cdp.frames(120)
    check(cdp, "Boot countdown resumes and appears in the HUD",
          "Wandmoss.state.boots.active>27.8 && Wandmoss.state.boots.active<28.1 && document.querySelector('#boots-label').textContent.includes('28')")
    cdp.evaluate("Wandmoss.state.boots.active=.05")
    cdp.frames(5)
    cdp.key("k", "KeyK"); cdp.frames(2); cdp.key("k", "KeyK", False)
    check(cdp, "Cooldown appears in the HUD and blocks K activation",
          "Wandmoss.state.boots.active===0 && Wandmoss.state.boots.cooldown>14 && document.querySelector('#boots-label').textContent.includes('odnawiają')")
    cdp.evaluate("Wandmoss.state.boots.cooldown=0")
    cdp.key("e", "KeyE"); cdp.frames(2); cdp.key("e", "KeyE", False)
    check(cdp, "E remains a compatible alias for ready boots", "Wandmoss.state.boots.active>29.8")
    cdp.evaluate("Wandmoss.state.boots.active=0;Wandmoss.state.boots.cooldown=0")
    cdp.key("k", "KeyK"); cdp.frames(2); cdp.key("k", "KeyK", False)
    check(cdp, "K also activates ready boots", "Wandmoss.state.boots.active>29.8")
    cdp.evaluate("MossEngine.loadLevel(Wandmoss.state,3);Wandmoss.state.mode='playing';Wandmoss.state.boots.owned=true;Wandmoss.state.player.x=4050;Wandmoss.advance(1/120)")
    cdp.click("#boots-button"); cdp.frames(2)
    check(cdp, "Desktop boots button prepares the wizard for the final arena",
          "Wandmoss.state.boots.active>29.8 && document.activeElement.id==='game'")
    cdp.evaluate("(() => {const s=Wandmoss.state;s.enemies.forEach(e=>e.alive=false);Object.assign(s.player,{x:s.boss.x-180,y:480,facing:1,invulnerable:100});s.boss.active=true;s.boss.phase='recover';s.boss.phaseTime=100;Wandmoss.render()})()")
    check(cdp, "Final boss health and attack hint are visible",
          "!document.querySelector('#boss-hud').hidden && document.querySelector('#boss-count').textContent.includes('10 / 10') && document.querySelector('#boss-prompt').textContent.length>0")
    for hit in range(1, 11):
        cdp.key("x", "KeyX"); cdp.frames(1); cdp.key("x", "KeyX", False); cdp.frames(64 if hit < 10 else 17)
        check(cdp, f"Keyboard spell {hit} updates boss health", f"Wandmoss.state.boss.health==={10-hit}")
        if hit < 10:
            check(cdp, "Boss health meter matches accepted hits",
                  f"document.querySelector('#boss-health').getAttribute('aria-valuenow')==='{10-hit}' && Wandmoss.state.mode==='playing'")
    boss_defeat_browser_checks(cdp)
    cdp.evaluate("(() => {MossEngine.loadLevel(Wandmoss.state,1);const s=Wandmoss.state;s.mode='playing';Object.assign(s.player,{x:s.goal.x+35,y:480,vx:0,vy:0,grounded:true});Wandmoss.advance(1/120)})()")
    check(cdp, "Launch transition shows its story card", "Wandmoss.state.mode==='transition' && !document.querySelector('#transition-card').hidden")
    cdp.key("p", "KeyP"); cdp.key("p", "KeyP", False)
    transition_time = cdp.evaluate("Wandmoss.state.transition.time")
    cdp.frames(120)
    check(cdp, "P freezes the launch transition", f"Wandmoss.state.mode==='paused' && Wandmoss.state.transition.time==={transition_time}")
    cdp.click("#primary"); cdp.frames(180)
    check(cdp, "Resuming a paused launch still reaches the cloud stage",
          "Wandmoss.state.levelIndex===2 && Wandmoss.state.mode==='playing' && document.querySelector('#transition-card').hidden")
    cdp.evaluate("(() => {MossEngine.loadLevel(Wandmoss.state,3);const s=Wandmoss.state;s.boots.owned=true;s.boots.cooldown=15;s.boss.health=2;s.health=0;s.mode='lost';Wandmoss.render()})()")
    cdp.click("#primary")
    check(cdp, "Lost-screen button retries this chapter with fresh boss and usable boots",
          "Wandmoss.state.levelIndex===3 && Wandmoss.state.mode==='playing' && Wandmoss.state.health===3 && Wandmoss.state.boss.health===10 && Wandmoss.state.boots.owned && Wandmoss.state.boots.cooldown===0")
    cdp.key("R", "KeyR", modifiers=8); cdp.key("R", "KeyR", False)
    check(cdp, "Shift+R restarts the full campaign and clears acquired boots",
          "Wandmoss.state.levelIndex===0 && !Wandmoss.state.boots.owned && Wandmoss.state.score===0 && Wandmoss.state.collected===0")


def boss_defeat_browser_checks(cdp):
    """Check the live UI after a tenth real keyboard projectile in a fixture."""
    check(cdp, "The tenth keyboard hit begins kneeling before any victory overlay",
          "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.boss.phase==='kneel' && Wandmoss.state.boss.hits===10 && document.querySelector('#overlay').hidden && document.querySelector('#ending-summary').hidden")
    score = cdp.evaluate("Wandmoss.state.score")
    cdp.frames(max(1, int((.65 - cdp.evaluate("Wandmoss.state.boss.defeatTime")) * 60)))
    frozen_player = cdp.evaluate("JSON.stringify({x:Wandmoss.state.player.x,health:Wandmoss.state.health,cast:Wandmoss.state.player.castCooldown,boots:Wandmoss.state.boots})")
    cdp.key("ArrowRight", "ArrowRight"); cdp.key("x", "KeyX"); cdp.key("c", "KeyC")
    cdp.frames(8)
    check(cdp, "Movement, spells and boot activation are ignored during the defeat animation",
          "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.spells.length===0 && JSON.stringify({x:Wandmoss.state.player.x,health:Wandmoss.state.health,cast:Wandmoss.state.player.castCooldown,boots:Wandmoss.state.boots})===" + json.dumps(frozen_player))
    cdp.key("ArrowRight", "ArrowRight", False); cdp.key("x", "KeyX", False); cdp.key("c", "KeyC", False)
    cdp.key("p", "KeyP"); cdp.key("p", "KeyP", False)
    frozen = cdp.evaluate("JSON.stringify({time:Wandmoss.state.time,death:Wandmoss.state.boss.defeatTime,phase:Wandmoss.state.boss.phase,score:Wandmoss.state.score})")
    cdp.frames(180)
    check(cdp, "P freezes the defeat animation and delays its victory",
          "Wandmoss.state.mode==='paused' && JSON.stringify({time:Wandmoss.state.time,death:Wandmoss.state.boss.defeatTime,phase:Wandmoss.state.boss.phase,score:Wandmoss.state.score})===" + json.dumps(frozen))
    cdp.click("#primary")
    check(cdp, "The pause overlay resumes the unfinished defeat animation",
          "Wandmoss.state.mode==='bossDefeat' && document.querySelector('#overlay').hidden")
    cdp.frames(25)
    check(cdp, "The boss falls forward before the ending screen",
          "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.boss.phase==='fall' && document.querySelector('#overlay').hidden")
    cdp.frames(45)
    check(cdp, "The fallen boss stays visible on the ground before congratulations",
          "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.boss.phase==='defeated' && document.querySelector('#overlay').hidden && Wandmoss.state.boss.defeatTime<2.2")
    cdp.frames(45)
    check(cdp, "The completed 2.2-second animation opens congratulations and awards 500 points",
          f"Wandmoss.state.mode==='won' && Wandmoss.state.score==={score+500} && !document.querySelector('#overlay').hidden && !document.querySelector('#ending-summary').hidden && document.querySelector('#ending-score').textContent===String(Wandmoss.state.score) && document.activeElement.id==='primary'")
    cdp.frames(180)
    check(cdp, "Waiting at the ending cannot duplicate the victory reward",
          f"Wandmoss.state.mode==='won' && Wandmoss.state.score==={score+500} && Wandmoss.state.completedLevels.filter(level=>level===3).length===1")
    cdp.evaluate("(() => {const s=Wandmoss.state;MossEngine.loadLevel(s,3);s.completedLevels=s.completedLevels.filter(level=>level!==3);s.checkpointIndex=1;s.boots.owned=true;Object.assign(s.player,{x:4600,y:480,facing:1,invulnerable:100});Object.assign(s.boss,{active:true,health:1,hits:9,phase:'recover',phaseTime:100});Wandmoss.render()})()")
    retry_score = cdp.evaluate("Wandmoss.state.score")
    cdp.key("x", "KeyX"); cdp.frames(18); cdp.key("x", "KeyX", False)
    check(cdp, "A fresh fatal hit also waits in the defeat animation",
          "Wandmoss.state.mode==='bossDefeat' && Wandmoss.state.boss.health===0")
    cdp.key("r", "KeyR"); cdp.key("r", "KeyR", False)
    check(cdp, "R can interrupt defeat without awarding victory or leaving a stale animation",
          f"Wandmoss.state.mode==='playing' && Wandmoss.state.player.x===4075 && Wandmoss.state.health===3 && Wandmoss.state.boss.health===10 && Wandmoss.state.boss.hits===0 && Wandmoss.state.boss.defeatTime===0 && Wandmoss.state.boss.phase==='idle' && Wandmoss.state.score==={retry_score} && !Wandmoss.state.completedLevels.includes(3) && document.querySelector('#overlay').hidden")


def route_live_until(cdp, level, pre_boss=False):
    """Drive the live game's rules with input only; flush milestone UI events.

    No teleports, invulnerability or boss-phase overrides are used here.
    Keyboard and touch paths are separately checked through DevTools input.
    """
    result = cdp.evaluate("""(() => {
      const target = """ + str(level) + ", preBoss = " + json.dumps(pre_boss) + """;
      const s = Wandmoss.state;
      for (let frame=0; frame<24000; frame++) {
        if (s.levelIndex===target && (!preBoss || s.checkpointIndex===s.checkpoints.length-1)) {
          Wandmoss.advance(0);
          return {level:s.levelIndex,score:s.score,collected:s.collected,time:s.time,
            owned:s.boots.owned,health:s.health,checkpoint:s.checkpointIndex,x:s.player.x};
        }
        if (!['playing','transition'].includes(s.mode)) throw new Error('Route stopped: '+s.mode);
        const p=s.player;
        const support=s.platforms.find(q=>p.x+p.w>q.x+1&&p.x<q.x+q.w-1&&Math.abs(p.y+p.h-q.y)<3);
        const edge=support&&p.x>support.x+support.w-(s.theme==='sky'?70:72);
        const log=s.platforms.some(q=>!q.oneWay&&q.kind==='log'&&q.x-p.x>0&&q.x-p.x<75);
        let jump=p.grounded&&(edge||log), right=true, left=false;
        if(s.boss&&s.boss.active) {
          const aim=Math.sign(s.boss.x+s.boss.w/2-p.x-p.w/2);
          right=aim>0&&p.facing!==aim;left=aim<0&&p.facing!==aim;
          jump=p.grounded&&s.boss.phase==='telegraph'&&s.boss.phaseTime<.65;
        }
        const bootsPressed=s.levelIndex===3&&p.x>4100&&s.boots.owned&&s.boots.active===0&&s.boots.cooldown===0;
        const castHeld=(s.boss&&s.boss.active)||s.enemies.some(e=>e.alive&&e.x>p.x&&e.x-p.x<450&&Math.abs(e.y+e.h/2-p.y-24)<24);
        MossEngine.step(s,1/120,{right,left,jumpPressed:jump,jumpHeld:true,castHeld,bootsPressed});
        if(s.events.some(event=>['level','checkpoint','artifact'].includes(event))) Wandmoss.advance(0);
      }
      throw new Error('Live route did not reach its milestone');
    })()""")
    assert result["level"] == level
    return result


def autosave_browser_checks(cdp):
    cdp.evaluate("Wandmoss.restart()")
    for level in (1, 2, 3):
        before = route_live_until(cdp, level)
        check(cdp, f"Chapter {level+1} starts with a persistent autosave",
              f"MossSave.read().levelIndex==={level} && MossSave.read().kind==='level' && MossSave.status()==='persistent'")
        reload_game(cdp)
        check(cdp, f"Reload offers continuation in chapter {level+1} without overwriting it",
              f"Wandmoss.state.mode==='ready' && MossSave.read().levelIndex==={level} && !document.querySelector('#resume-button').hidden")
        cdp.click("#resume-button")
        check(cdp, f"Continue restores chapter {level+1}, prior points and ready boots",
              f"Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex==={level} && Wandmoss.state.score==={before['score']} && Wandmoss.state.collected==={before['collected']} && Wandmoss.state.boots.owned==={json.dumps(before['owned'])} && Wandmoss.state.health===3 && Wandmoss.state.boots.active===0 && Wandmoss.state.boots.cooldown===0 && Wandmoss.state.player.x===Wandmoss.state.spawn.x")
    before = route_live_until(cdp, 3, True)
    check(cdp, "Reaching the final lantern persists a pre-boss checkpoint",
          "MossSave.read().kind==='boss' && MossSave.read().levelIndex===3 && Wandmoss.state.boots.owned")
    saved = cdp.evaluate("localStorage.getItem(MossSave.KEY)")
    reload_game(cdp)
    check(cdp, "The pre-boss save survives a browser reload",
          "MossSave.read().kind==='boss' && Wandmoss.state.mode==='ready'")
    cdp.click("#resume-button")
    check(cdp, "Continue resumes at the final lantern with full boss health and ready boots",
          f"Wandmoss.state.checkpointIndex===1 && Wandmoss.state.player.x===4075 && Wandmoss.state.health===3 && Wandmoss.state.boss.health===10 && !Wandmoss.state.boss.active && Wandmoss.state.boots.owned && Wandmoss.state.boots.active===0 && Wandmoss.state.boots.cooldown===0 && Wandmoss.state.score==={before['score']} && Wandmoss.state.collected==={before['collected']}")
    cdp.evaluate("Wandmoss.state.health=0;Wandmoss.state.boss.health=2;Wandmoss.state.mode='lost';Wandmoss.render()")
    cdp.click("#primary")
    check(cdp, "Lost-screen retry returns to the boss instead of replaying previous obstacles",
          "Wandmoss.state.levelIndex===3 && Wandmoss.state.player.x===4075 && Wandmoss.state.health===3 && Wandmoss.state.boss.health===10 && Wandmoss.state.boots.cooldown===0")
    cdp.key("r", "KeyR"); cdp.key("r", "KeyR", False)
    check(cdp, "R retries the saved boss checkpoint and preserves the artifact",
          "Wandmoss.state.levelIndex===3 && Wandmoss.state.player.x===4075 && Wandmoss.state.boss.health===10 && Wandmoss.state.boots.owned")
    cdp.click("#autosave-toggle")
    check(cdp, "Disabling autosave preserves the existing pre-boss continuation",
          "!MossSave.getEnabled() && MossSave.read().kind==='boss' && !document.querySelector('#autosave-toggle').checked")
    cdp.evaluate("MossEngine.loadLevel(Wandmoss.state,2);Wandmoss.state.events.push('level');Wandmoss.advance(0)")
    check(cdp, "Disabled autosave does not replace an earlier saved boss checkpoint",
          "localStorage.getItem(MossSave.KEY)===" + json.dumps(saved))
    reload_game(cdp)
    check(cdp, "Disabled setting persists while manual Continue remains available",
          "!MossSave.getEnabled() && !document.querySelector('#autosave-toggle').checked && !document.querySelector('#resume-button').hidden && MossSave.read().kind==='boss'")
    cdp.click("#resume-button")
    check(cdp, "Continue can restore an earlier save while autosave is disabled",
          "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===3 && Wandmoss.state.player.x===4075")
    boss_keyboard_checks(cdp)
    won_score = cdp.evaluate("Wandmoss.state.score")
    cdp.key("r", "KeyR"); cdp.key("r", "KeyR", False)
    check(cdp, "Retrying an earned boss victory removes its reward and restores the fight",
          f"Wandmoss.state.mode==='playing' && Wandmoss.state.player.x===4075 && Wandmoss.state.boss.health===10 && Wandmoss.state.boss.hits===0 && Wandmoss.state.score==={won_score-500} && !Wandmoss.state.completedLevels.includes(3) && Wandmoss.state.boots.active===0 && Wandmoss.state.boots.cooldown===0")
    cdp.click("#autosave-toggle")
    check(cdp, "Autosave can be re-enabled through the browser control", "MossSave.getEnabled()")
    cdp.evaluate("localStorage.setItem(MossSave.KEY,'{corrupt')")
    reload_game(cdp)
    check(cdp, "A corrupt persisted save does not prevent a fresh game",
          "Wandmoss.state.mode==='ready' && Wandmoss.state.levelIndex===0 && MossSave.read()===null && document.querySelector('#resume-button').hidden")
    cdp.click("#primary")
    check(cdp, "Start remains playable after rejecting a corrupt save", "Wandmoss.state.mode==='playing'")
    script = cdp.call("Page.addScriptToEvaluateOnNewDocument", source="Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")["identifier"]
    reload_game(cdp)
    cdp.click("#primary")
    check(cdp, "A browser that blocks storage can still start and explains temporary saves",
          "Wandmoss.state.mode==='playing' && MossSave.status()==='memory' && document.querySelector('#save-status').textContent.length>0")
    cdp.call("Page.removeScriptToEvaluateOnNewDocument", identifier=script)
    reload_game(cdp)
    legacy = json.loads(saved)
    legacy["practice"] = False
    cdp.evaluate("localStorage.setItem(MossSave.KEY," + json.dumps(json.dumps(legacy)) + ")")
    reload_game(cdp)
    check(cdp, "A legacy normal version-one boss save remains resumable without a testing shortcut",
          "MossSave.read().kind==='boss' && !document.querySelector('#resume-button').hidden && !document.querySelector('#practice-boss') && !('practiceBoss' in Wandmoss)")
    cdp.click("#resume-button")
    check(cdp, "Legacy normal continuation returns to its earned final lantern with ready equipment",
          "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===3 && Wandmoss.state.player.x===4075 && Wandmoss.state.boots.owned && Wandmoss.state.boss.health===10 && !('practice' in Wandmoss.state)")
    legacy["practice"] = True
    legacy_raw = json.dumps(legacy)
    cdp.evaluate("localStorage.setItem(MossSave.KEY," + json.dumps(legacy_raw) + ")")
    reload_game(cdp)
    check(cdp, "A legacy testing save is ignored without exposing a boss continuation or deleting storage",
          "Wandmoss.state.mode==='ready' && Wandmoss.state.levelIndex===0 && MossSave.read()===null && document.querySelector('#resume-button').hidden && localStorage.getItem(MossSave.KEY)===" + json.dumps(legacy_raw))
    cdp.click("#primary")
    check(cdp, "Starting after an ignored testing save begins a normal forest campaign",
          "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===0 && MossSave.read().kind==='level' && !('practice' in Wandmoss.state)")
    cdp.evaluate("Wandmoss.restart()")
    print("PASS Autosave milestones reached with live gameplay input and restored through real browser reloads")


def boss_keyboard_checks(cdp):
    """Win a restored boss fight using actual keyboard events and frame time."""
    held = {"right": False, "left": False, "jump": False, "cast": False}
    key_map = {"right": ("ArrowRight", "ArrowRight"), "left": ("ArrowLeft", "ArrowLeft"),
               "jump": (" ", "Space"), "cast": ("x", "KeyX")}
    jump_direction = 0
    cdp.key("c", "KeyC"); cdp.frames(1); cdp.key("c", "KeyC", False)
    for _ in range(750):
        state = cdp.evaluate("({mode:Wandmoss.state.mode,p:Wandmoss.state.player,b:Wandmoss.state.boss,health:Wandmoss.state.health,boots:Wandmoss.state.boots})")
        if state["mode"] == "won":
            break
        if state["mode"] == "bossDefeat":
            for action, value in held.items():
                if value:
                    cdp.key(*key_map[action], down=False)
                    held[action] = False
            cdp.frames(8)
            continue
        assert state["mode"] == "playing", "Normal keyboard boss route must survive"
        p, boss = state["p"], state["b"]
        difference = boss["x"] + boss["w"] / 2 - p["x"] - p["w"] / 2
        aim = (difference > 0) - (difference < 0)
        gap = boss["x"] - p["x"] - p["w"] if aim > 0 else p["x"] - boss["x"] - boss["w"]
        right, left, jump = not boss["active"], False, False
        if boss["active"]:
            if p["grounded"]:
                jump_direction = 0
                jump = boss["phase"] == "charge" and 0 < gap < 280
                if jump:
                    jump_direction = aim
            if jump_direction:
                passed = p["x"] > boss["x"] + boss["w"] + 55 if jump_direction > 0 else p["x"] + p["w"] < boss["x"] - 55
                if passed:
                    jump_direction = 0
                else:
                    right, left = jump_direction > 0, jump_direction < 0
            if not jump_direction:
                right = aim > 0 and p["facing"] != aim
                left = aim < 0 and p["facing"] != aim
        desired = {"right": right, "left": left, "jump": jump or (held["jump"] and not p["grounded"]),
                   "cast": boss["active"] and p["grounded"]}
        for action, value in desired.items():
            if bool(value) != held[action]:
                cdp.key(*key_map[action], down=bool(value))
                held[action] = bool(value)
        cdp.frames(4)
    for action, value in held.items():
        if value:
            cdp.key(*key_map[action], down=False)
    check(cdp, "A restored boss fight can be won using real keyboard input and normal hearts",
          "Wandmoss.state.mode==='won' && Wandmoss.state.health>0 && Wandmoss.state.boss.health===0 && Wandmoss.state.boss.hits===10 && Wandmoss.state.boots.active>0")
    print("Keyboard boss result", json.dumps(cdp.evaluate("({hearts:Wandmoss.state.health,hits:Wandmoss.state.boss.hits,bootsRemaining:Wandmoss.state.boots.active})")))


def verify_campaign_ending(cdp):
    cdp.evaluate((PROJECT / "tests/campaign_route.js").read_text())
    cdp.evaluate("Wandmoss.restart();Object.assign(Wandmoss.state,window.__wandmossRouteResult);Wandmoss.render()")
    check(cdp, "Ending summary displays the real completed four-stage input route",
          "Wandmoss.state.mode==='won' && Wandmoss.state.completedLevels.length===4 && Wandmoss.state.boss.hits===10 && document.querySelector('#ending-score').textContent===String(Wandmoss.state.score)")


def mobile_checks(url):
    with Browser(width=390, height=844) as browser:
        cdp = browser.cdp
        cdp.call("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=1, mobile=True)
        cdp.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        browser.open(url)
        cdp.click("#primary")
        check(cdp, "390x844 mobile layout fits horizontally and exposes controls",
              "document.documentElement.scrollWidth<=innerWidth && getComputedStyle(document.querySelector('.touch-controls')).display==='flex' && document.querySelector('.touch-controls').getBoundingClientRect().bottom<innerHeight")
        positions = cdp.evaluate("Object.fromEntries([...document.querySelectorAll('[data-control]')].map(b=>{const r=b.getBoundingClientRect();return [b.dataset.control,{x:r.x+r.width/2,y:r.y+r.height/2}]}))")
        right = positions["right"] | {"id": 1}
        jump = positions["jump"] | {"id": 2}
        cast = positions["cast"] | {"id": 3}
        cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[right])
        cdp.frames(20)
        check(cdp, "Touch right moves the wizard", "Wandmoss.state.player.x>170")
        cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[right, jump, cast])
        cdp.frames(10)
        check(cdp, "Simultaneous touch movement, jump and spell work",
              "Wandmoss.state.player.x>200 && Wandmoss.state.player.y<450 && Wandmoss.state.spells.length>0")
        cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
        cdp.frames(60)
        check(cdp, "Canceled touch input clears controls and lands safely",
              "Wandmoss.state.player.vx===0 && Wandmoss.state.player.grounded && !document.querySelector('[data-control].pressed')")
        cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[cast])
        cdp.frames(75)
        check(cdp, "Holding the touch spell button repeats casting", "Wandmoss.state.spells.some(s=>s.life>.4)")
        cdp.call("Input.dispatchTouchEvent", type="touchEnd", touchPoints=[])
        cdp.frames(65)
        check(cdp, "Releasing the touch spell button stops repeated casting", "Wandmoss.state.spells.every(s=>s.life<.6) && !document.querySelector('[data-control].pressed')")
        cdp.evaluate("(() => {MossEngine.loadLevel(Wandmoss.state,2);const s=Wandmoss.state;s.mode='playing';Object.assign(s.player,{x:s.artifact.x,y:s.artifact.y-s.player.h+16,vy:0,grounded:false});Wandmoss.advance(1/120);Object.assign(s.player,{x:s.spawn.x,y:s.spawn.y,vx:0,vy:0,grounded:true});Wandmoss.render()})()")
        check(cdp, "Mobile boots button becomes available after finding the artifact",
              "Wandmoss.state.boots.owned && !document.querySelector('[data-control=boots]').disabled && Wandmoss.state.boots.active===0")
        positions = cdp.evaluate("Object.fromEntries([...document.querySelectorAll('[data-control]')].map(b=>{const r=b.getBoundingClientRect();return [b.dataset.control,{x:r.x+r.width/2,y:r.y+r.height/2}]}))")
        right = positions["right"] | {"id": 4}
        jump = positions["jump"] | {"id": 5}
        boots = positions["boots"] | {"id": 6}
        cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[boots])
        cdp.frames(2)
        cdp.call("Input.dispatchTouchEvent", type="touchStart", touchPoints=[boots, right, jump])
        cdp.frames(14)
        check(cdp, "Mobile boots, movement and jumping work with simultaneous touches",
              "Wandmoss.state.boots.active>29.5 && Wandmoss.state.player.vy < -600 && Wandmoss.state.player.x>Wandmoss.state.spawn.x+25")
        cdp.call("Input.dispatchTouchEvent", type="touchCancel", touchPoints=[])
        cdp.frames(3)
        check(cdp, "Canceling mobile touches clears every pressed control",
              "!document.querySelector('[data-control].pressed')")
        mobile_ending_checks(cdp)
        mobile_boss_retry_checks(cdp)
        assert not browser.errors(), json.dumps(browser.errors(), indent=2)
        print("PASS Mobile scenarios without JavaScript or resource errors")


def mobile_ending_checks(cdp):
    cdp.evaluate((PROJECT / "tests/campaign_route.js").read_text())
    cdp.evaluate("Wandmoss.restart();Object.assign(Wandmoss.state,window.__wandmossRouteResult);Wandmoss.render()")
    check(cdp, "Mobile ending stage stays inside the visible game shell",
          "(() => {const stage=document.querySelector('#stage').getBoundingClientRect(),shell=document.querySelector('.game-shell').getBoundingClientRect();return stage.left>=shell.left-.5 && stage.right<=shell.right+.5 && stage.left>=0 && stage.right<=innerWidth})()")
    check(cdp, "Mobile congratulations card and replay button fit inside the ending stage",
          "(() => {const stage=document.querySelector('#stage').getBoundingClientRect();return ['.overlay-card','#primary','#ending-summary'].every(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return r.left>=stage.left-.5 && r.right<=stage.right+.5 && r.top>=stage.top-.5 && r.bottom<=stage.bottom+.5})})()")
    check(cdp, "Mobile ending summary and replay remain visible in the viewport",
          "(() => {const card=document.querySelector('.overlay-card').getBoundingClientRect(),button=document.querySelector('#primary').getBoundingClientRect();return card.left>=0 && card.right<=innerWidth && card.top>=0 && card.bottom<=innerHeight && button.top>=0 && button.bottom<=innerHeight && !document.querySelector('#ending-summary').hidden})()")


def mobile_boss_retry_checks(cdp):
    cdp.evaluate("Wandmoss.restart()")
    check(cdp, "Mobile campaign has no chapter selector, boss-practice button or direct launcher",
          "!document.querySelector('#level-picker,#practice-boss') && !('startLevel' in Wandmoss) && !('practiceBoss' in Wandmoss) && document.querySelector('#retry-boss').hidden")
    cdp.click("#pause")
    check(cdp, "Pausing before boss progress does not offer a boss shortcut",
          "Wandmoss.state.mode==='paused' && !document.querySelector('#practice-boss') && document.querySelector('#retry-boss').hidden")
    load_boss_checkpoint(cdp)
    cdp.key("ArrowRight", "ArrowRight")
    cdp.frames(12)
    check(cdp, "Immediate movement after an earned boss retry survives its first animation frame",
          "Wandmoss.state.levelIndex===3 && Wandmoss.state.checkpointIndex===1 && Wandmoss.state.player.x>4110 && Wandmoss.state.player.vx===310")
    for _ in range(12):
        if cdp.evaluate("Wandmoss.state.boss.active"):
            break
        cdp.frames(4)
    cdp.key("ArrowRight", "ArrowRight", False)
    check(cdp, "Entering the earned encounter exposes its actual mobile Retry fight control",
          "Wandmoss.state.boss.active && !document.querySelector('#boss-hud').hidden && document.querySelector('#retry-boss').getBoundingClientRect().width>0")
    cdp.click("#retry-boss")
    check(cdp, "The earned mobile Retry fight button returns to the lantern with ready equipment",
          "Wandmoss.state.player.x===4075 && Wandmoss.state.health===3 && Wandmoss.state.boss.health===10 && Wandmoss.state.boots.cooldown===0")
    boss_keyboard_checks(cdp)
    check(cdp, "Mobile boss victory retains the campaign route and congratulations",
          "!document.querySelector('.ending-route').hidden && getComputedStyle(document.querySelector('.ending-route')).display!=='none' && !('practice' in Wandmoss.state)")
    check(cdp, "Mobile victory replay action fits inside the card and viewport",
          "(() => {const button=document.querySelector('#primary'),r=button.getBoundingClientRect(),card=document.querySelector('.overlay-card').getBoundingClientRect();return !button.hidden && getComputedStyle(button).display!=='none' && r.width>0 && r.height>0 && r.left>=card.left && r.right<=card.right && r.top>=card.top && r.bottom<=card.bottom && r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight})()")
    cdp.click("#primary")
    check(cdp, "Mobile victory replay starts the full campaign instead of skipping back to the boss",
          "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===0 && Wandmoss.state.score===0 && !Wandmoss.state.boots.owned && Wandmoss.state.completedLevels.length===0 && MossSave.read().kind==='level' && !('practice' in Wandmoss.state)")


if __name__ == "__main__":
    main()
