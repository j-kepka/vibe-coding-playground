#!/usr/bin/env python3
"""Exercise language selection and testing-shortcut removal without screenshots.

Run: python3 -B 02-wandmoss-journey/tests/language_check.py
Uses local Chrome, actual keyboard/pointer input and the standard-library CDP
driver. Explicit state fixtures isolate interface branches; these are not
reported as independent campaign playthroughs. Renderer checks inspect pixels
in memory only. Physical-device testing and other browser engines remain out
of scope.
"""

import argparse
import json
import sys
import time

from browser_check import Browser, PROJECT, check, load_boss_checkpoint, load_chapter, reload_game


RESULTS = []
LANGUAGES = ("en", "de", "pl")
LANGUAGE_KEY = "mosslight.language.v1"
NO_SELECTOR = "!document.querySelector('#level-picker,#debug-level,#start-level,#level-picker-note,#practice-boss') && !('startLevel' in Wandmoss) && !('practiceBoss' in Wandmoss)"
STATE = "JSON.stringify(Wandmoss.state)"
OTHER_STORAGE = "JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='mosslight.language.v1').sort().map(k=>[k,localStorage.getItem(k)])))"
CANVAS_HASH = """(() => {
  const canvas=document.querySelector('#game');
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let hash=2166136261;
  for (const value of pixels) hash=Math.imul(hash^value,16777619);
  return hash>>>0;
})()"""


def verified(cdp, name, expression):
    check(cdp, name, expression)
    RESULTS.append(name)


def tap(cdp, key, code):
    cdp.key(key, code)
    cdp.key(key, code, False)


def select_language(cdp, locale):
    """Exercise the native select rather than calling the translation API."""
    cdp.evaluate("document.querySelector('#language-select').focus({preventScroll:true})")
    tap(cdp, "Home", "Home")
    for _ in range(LANGUAGES.index(locale)):
        tap(cdp, "ArrowDown", "ArrowDown")
    verified(cdp, f"Native keyboard selection applies {locale} immediately",
             f"MossI18n.locale==={json.dumps(locale)} && document.documentElement.lang==={json.dumps(locale)} && document.querySelector('#language-select').value==={json.dumps(locale)}")


def stable_switch(cdp, locale, context):
    before = cdp.evaluate(STATE)
    storage = cdp.evaluate(OTHER_STORAGE)
    music = cdp.evaluate("JSON.stringify({enabled:Wandmoss.music.enabled,volume:Wandmoss.music.volume,track:Wandmoss.music.currentTrack.id,effects:Wandmoss.effects.enabled})")
    pixels = cdp.evaluate(CANVAS_HASH)
    select_language(cdp, locale)
    verified(cdp, f"{context}: {locale} preserves the complete game state and autosave",
             f"{STATE}==={json.dumps(before)} && {OTHER_STORAGE}==={json.dumps(storage)}")
    verified(cdp, f"{context}: {locale} preserves audio settings, selected recording and artwork",
             "JSON.stringify({enabled:Wandmoss.music.enabled,volume:Wandmoss.music.volume,track:Wandmoss.music.currentTrack.id,effects:Wandmoss.effects.enabled})===" + json.dumps(music) +
             f" && {CANVAS_HASH}==={pixels}")


def static_content(cdp, locale, context):
    # Checking all tagged elements detects an omitted apply() branch while the
    # independent literal/local-language assertions below catch wrong locale.
    details = cdp.evaluate(r"""(() => {
      const normalize=text=>text.replace(/\s+/g,' ').trim();
      const failures=[];
      const skip=new Set(['boots-button','pause','sound']);
      for(const element of document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-aria-label],[data-i18n-title],[data-i18n-content]')) {
        for(const [attribute,value] of Object.entries(element.dataset)) {
          if(!attribute.startsWith('i18n')) continue;
          const expected=MossI18n.t(value);
          if(expected===value || typeof expected!=='string') {failures.push({value,reason:'missing'});continue;}
          if(attribute==='i18n' && normalize(element.textContent)!==normalize(expected)) failures.push({value,reason:'text'});
          if(attribute==='i18nHtml') {
            const template=document.createElement('template');template.innerHTML=expected;
            if(normalize(element.textContent)!==normalize(template.content.textContent)) failures.push({value,reason:'html'});
          }
          const target={'i18nAriaLabel':'aria-label','i18nTitle':'title','i18nContent':'content'}[attribute];
          if(target && !skip.has(element.id) && element.getAttribute(target)!==expected) failures.push({value,reason:target});
        }
      }
      return failures;
    })()""")
    assert not details, f"{context} {locale}: {json.dumps(details)}"
    RESULTS.append(f"{context}: {locale} translates every tagged static text and accessible attribute")
    print("PASS", RESULTS[-1])
    verified(cdp, f"{context}: {locale} translates the page metadata and accessible game instructions",
             f"document.documentElement.lang==={json.dumps(locale)} && document.title===MossI18n.t('page.title') && document.querySelector('meta[name=description]').content===MossI18n.t('page.description') && document.querySelector('#game').getAttribute('aria-label').length>100")
    verified(cdp, f"{context}: {locale} retains all recording credits and license links",
             "(() => {const d=document.querySelector('#music-dialog');return d.textContent.includes('Kevin MacLeod') && d.textContent.includes('CC BY 4.0') && d.textContent.includes('MIT') && d.querySelectorAll('.music-track-list li').length===5 && d.querySelector('a[href=\"LICENSE\"]') && d.querySelector('a[href=\"THIRD_PARTY_NOTICES.md\"]') && !!d.querySelector('a[href=\"assets/music/CC-BY-4.0.txt\"]')})()")
    if locale == "en":
        verified(cdp, f"{context}: English DOM and accessible attributes contain no leftover Polish game text",
                 "(() => {const text=document.body.textContent+' '+[...document.querySelectorAll('[aria-label],[title]')].map(e=>(e.getAttribute('aria-label')||'')+' '+(e.getAttribute('title')||'')).join(' ');return !/Różdżka|Świetliki|Mchowa|Mchowej|Latarnia|ZMIERZCH|Strażnik|Próba bossa|Autozapis|Wyrusz|BUTY/.test(text)})()")


def fits(cdp, selectors):
    return cdp.evaluate(rf"""(() => {{
      const tolerance=1;
      return document.documentElement.scrollWidth<=innerWidth+tolerance &&
        {json.dumps(selectors)}.every(selector=>{{const element=document.querySelector(selector);
          const r=element.getBoundingClientRect();return !element.hidden &&
          r.width>0 && r.height>0 && r.left>=-tolerance && r.right<=innerWidth+tolerance;
        }});
    }})()""")


def overlay_fits(cdp):
    return cdp.evaluate("""(() => {
      const stage=document.querySelector('#stage').getBoundingClientRect();
      const action=document.querySelector('#primary').hidden?'#resume-button':'#primary';
      const buttons=['#new-game'].filter(selector=>!document.querySelector(selector).hidden);
      return ['.overlay-card',action,...buttons].every(selector=>{
        const r=document.querySelector(selector).getBoundingClientRect();
        return r.width>0 && r.height>0 && r.left>=stage.left-1 && r.right<=stage.right+1 &&
          r.top>=stage.top-1 && r.bottom<=stage.bottom+1 &&
          r.top>=-1 && r.bottom<=innerHeight+1;
      });
    })()""")


def layout_checks(url):
    for width, height, mobile in ((1440,1200,False),(390,844,True),(320,740,True)):
        with Browser(width=width,height=height) as browser:
            cdp=browser.cdp
            cdp.call("Emulation.setDeviceMetricsOverride",width=width,height=height,deviceScaleFactor=1,mobile=mobile)
            browser.open(url)
            context=f"{width}x{height} opening"
            verified(cdp, f"{context}: a fresh profile defaults to English with all three choices",
                     "MossI18n.locale==='en' && document.documentElement.lang==='en' && document.querySelector('#language-select').value==='en' && [...document.querySelector('#language-select').options].map(o=>o.value).join(',')==='en,de,pl'")
            verified(cdp,f"{context}: temporary chapter and boss launchers and their production APIs are absent",NO_SELECTOR)
            for locale in LANGUAGES:
                stable_switch(cdp,locale,context)
                static_content(cdp,locale,context)
                verified(cdp,f"{context}: {locale} fits language, opening actions and audio controls",
                         json.dumps(fits(cdp,["#language-select",".overlay-card","#primary","#music-credits","#music-volume"])) + " && " + NO_SELECTOR + " && document.querySelector('#retry-boss').hidden")
            select_language(cdp,"de")
            reload_game(cdp)
            verified(cdp,f"{width}x{height}: German survives reload independently of autosave",
                     "MossI18n.locale==='de' && document.documentElement.lang==='de' && Wandmoss.state.mode==='ready' && MossSave.read()===null && document.querySelector('#language-select').value==='de'")
            cdp.click("#primary")
            for locale in LANGUAGES:
                stable_switch(cdp,locale,f"{width}x{height} playing")
                verified(cdp,f"{width}x{height}: {locale} remains playable with no horizontal overflow",
                         "Wandmoss.state.mode==='playing' && document.querySelector('#overlay').hidden && document.documentElement.scrollWidth<=innerWidth+1 && " + NO_SELECTOR)
            # Language input preserves its native keyboard handling even for
            # the same letters used for game controls.
            before=cdp.evaluate(STATE)
            for key,code in (("p","KeyP"),("r","KeyR"),("c","KeyC"),("x","KeyX"),(" ","Space"),("ArrowRight","ArrowRight")):
                tap(cdp,key,code)
            verified(cdp,f"{width}x{height}: focused language selection never jumps, casts, retries or pauses",
                     f"{STATE}==={json.dumps(before)}")
            tap(cdp,"Escape","Escape")
            cdp.evaluate("document.querySelector('#game').focus()")
            tap(cdp,"p","KeyP")
            for locale in LANGUAGES:
                stable_switch(cdp,locale,f"{width}x{height} paused")
                verified(cdp,f"{width}x{height}: {locale} pause actions remain usable",
                         json.dumps(fits(cdp,["#language-select",".overlay-card","#primary","#new-game"])) + " && " + NO_SELECTOR + " && document.querySelector('#retry-boss').hidden")
            verified(cdp,f"{width}x{height}: no JavaScript or resource errors",json.dumps(not browser.errors()))


def storage_checks(url):
    with Browser(height=1200) as browser:
        cdp=browser.cdp
        browser.open(url)
        cdp.evaluate("localStorage.setItem('mosslight.language.v1','unsupported')")
        reload_game(cdp)
        verified(cdp,"An unsupported persisted language falls back to English without breaking the game",
                 "MossI18n.locale==='en' && document.documentElement.lang==='en' && Wandmoss.state.mode==='ready'")
        cdp.click("#primary")
        save=cdp.evaluate("localStorage.getItem(MossSave.KEY)")
        cdp.click("#autosave-toggle")
        select_language(cdp,"pl")
        reload_game(cdp)
        verified(cdp,"Language, disabled autosave and the single continuation coexist after reload",
                 "MossI18n.locale==='pl' && !MossSave.getEnabled() && !document.querySelector('#resume-button').hidden && localStorage.getItem(MossSave.KEY)==="+json.dumps(save))
        cdp.click("#resume-button")
        verified(cdp,"Resuming restores gameplay while retaining the independently chosen language",
                 "Wandmoss.state.mode==='playing' && Wandmoss.state.levelIndex===0 && MossI18n.locale==='pl' && !MossSave.getEnabled()")
        script=cdp.call("Page.addScriptToEvaluateOnNewDocument",source="Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")["identifier"]
        reload_game(cdp)
        verified(cdp,"Blocked browser storage defaults to English and leaves the picker usable",
                 "MossI18n.locale==='en' && document.querySelector('#language-select').value==='en' && Wandmoss.state.mode==='ready'")
        select_language(cdp,"de")
        cdp.click("#primary")
        verified(cdp,"Blocked storage still permits German play with a temporary autosave",
                 "MossI18n.locale==='de' && Wandmoss.state.mode==='playing' && MossSave.status()==='memory' && document.querySelector('#save-status').textContent.length>0")
        cdp.call("Page.removeScriptToEvaluateOnNewDocument",identifier=script)
        verified(cdp,"Invalid and blocked storage tests produce no JavaScript or resource errors",json.dumps(not browser.errors()))


def translated(cdp, selector, key, variables=None):
    """Compare human-visible wording, including the catalog's trusted markup."""
    return cdp.evaluate(rf"""(() => {{
      const expected=MossI18n.t({json.dumps(key)},{json.dumps(variables or {})});
      const template=document.createElement('template');template.innerHTML=expected;
      const normalize=text=>text.replace(/\s+/g,' ').trim();
      return expected!=={json.dumps(key)} &&
        normalize(document.querySelector({json.dumps(selector)}).textContent)===normalize(template.content.textContent);
    }})()""")


def dynamic_checks(url):
    with Browser(height=1200) as browser:
        cdp=browser.cdp
        browser.open(url)
        verified(cdp,"All three language catalogs cover the same complete set of strings",
                 "(() => {const catalogs=MossI18n.catalogs;const keys=Object.keys(catalogs.en).sort();return keys.length>100 && ['de','pl'].every(locale=>JSON.stringify(Object.keys(catalogs[locale]).sort())===JSON.stringify(keys) && keys.every(key=>typeof catalogs[locale][key]==='string' && catalogs[locale][key].length>0))})()")
        verified(cdp,"The unchanged four chapters still provide exactly eight lanterns",
                 "[0,1,2,3].map(i=>MossLevels.create(i).checkpoints.length).join(',')==='2,2,2,2'")
        for chapter in range(4):
            load_chapter(cdp,chapter)
            for locale in LANGUAGES:
                select_language(cdp,locale)
                verified(cdp,f"Chapter {chapter+1}: {locale} localizes its live title, caption and progress",
                         f"document.querySelector('#level-name').textContent===MossI18n.t('chapter.title.{chapter}') && document.querySelector('#stage-caption').textContent.includes(MossI18n.t('chapter.caption.{chapter}')) && document.querySelector('#journey').textContent===MossI18n.t('hud.journeyFireflies',{{chapter:{chapter+1},collected:0,total:Wandmoss.state.fireflies.length}})")
        load_chapter(cdp,2)
        cdp.evaluate("Wandmoss.state.health=2;Wandmoss.state.player.castCooldown=.6;Wandmoss.render()")
        for state,key,seconds in (("missing","missing",None),("ready","ready",None),("active","active",30),("cooldown","cooldown",15)):
            cdp.evaluate("Object.assign(Wandmoss.state.boots,"+json.dumps({"owned":state!="missing","active":29.2 if state=="active" else 0,"cooldown":14.2 if state=="cooldown" else 0})+");Wandmoss.render()")
            for locale in LANGUAGES:
                stable_switch(cdp,locale,f"{state} boots")
                args={"seconds":seconds} if seconds is not None else {}
                verified(cdp,f"{locale}: {state} boot wording, buttons and wand recovery follow live state",
                         json.dumps(translated(cdp,"#boots-label",f"ability.boots.{key}",args))+" && document.querySelector('#health').getAttribute('aria-label')===MossI18n.t('hud.health',{health:2}) && document.querySelector('#spell-label').textContent===MossI18n.t('ability.spell.cooldown',{seconds:MossI18n.formatNumber(.6,{minimumFractionDigits:1,maximumFractionDigits:1})}) && document.querySelector('#boots-button').disabled==="+json.dumps(state!="ready"))
        cdp.evaluate("Wandmoss.state.player.castCooldown=0;Wandmoss.render()")
        verified(cdp,"The translated ready wand returns after recovery",
                 "document.querySelector('#spell-label').textContent===MossI18n.t('ability.spell.ready')")

        # Every announcement is a real controller event. Fixtures isolate the
        # event under test instead of claiming the whole scene was played.
        for event,key in (("checkpoint","checkpoint"),("respawn","respawnStart"),("artifact","artifact"),("boots","boots"),("bootsReady","bootsReady"),("bossWake","bossWake")):
            cdp.evaluate(f"Wandmoss.state.events.push({json.dumps(event)});Wandmoss.advance(0)")
            for locale in LANGUAGES:
                select_language(cdp,locale)
                verified(cdp,f"{event}: a visible announcement changes live to {locale}",
                         "document.querySelector('#toast').classList.contains('visible') && "+json.dumps(translated(cdp,"#toast",f"toast.{key}")))
        cdp.evaluate("Wandmoss.state.checkpointIndex=0;Wandmoss.state.events.push('respawn');Wandmoss.advance(0)")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: checkpoint announcement and journey identify the lit lantern",
                     json.dumps(translated(cdp,"#toast","toast.respawnCheckpoint"))+" && document.querySelector('#journey').textContent===MossI18n.t('hud.journeyCheckpoint',{chapter:3,checkpoint:1,count:2})")

        for chapter,kind in ((0,"walk"),(1,"launch"),(2,"fall")):
            load_chapter(cdp,chapter)
            cdp.evaluate("(() => {const s=Wandmoss.state;Object.assign(s.player,{x:s.goal.x+35,y:480,vx:0,vy:0,grounded:true});Wandmoss.advance(1/120)})()")
            verified(cdp,f"Chapter {chapter+1} fixture enters the real {kind} transition",
                     f"Wandmoss.state.mode==='transition' && Wandmoss.state.transition.kind==={json.dumps(kind)}")
            for locale in LANGUAGES:
                stable_switch(cdp,locale,f"{kind} transition")
                verified(cdp,f"{locale}: {kind} transition translates its story without advancing it",
                         "!document.querySelector('#transition-card').hidden && "+json.dumps(translated(cdp,"#transition-title",f"transition.{kind}.title") and translated(cdp,"#transition-copy",f"transition.{kind}.copy")))

        load_chapter(cdp,3)
        cdp.evaluate("(() => {const s=Wandmoss.state;s.enemies.forEach(e=>e.alive=false);Object.assign(s.player,{x:4400,y:480,facing:1,invulnerable:100});Object.assign(s.boss,{active:true,phaseTime:100});Wandmoss.render()})()")
        for phase in ("idle","telegraph","charge","recover","kneel","fall","defeated"):
            cdp.evaluate("Wandmoss.state.mode="+json.dumps("bossDefeat" if phase in ("kneel","fall","defeated") else "playing")+";Object.assign(Wandmoss.state.boss,"+json.dumps({"phase":phase,"health":0 if phase in ("kneel","fall","defeated") else 10})+");Wandmoss.render()")
            for locale in LANGUAGES:
                select_language(cdp,locale)
                verified(cdp,f"{locale}: the live boss {phase} prompt is localized",
                         "!document.querySelector('#boss-hud').hidden && "+json.dumps(translated(cdp,"#boss-prompt",f"boss.prompt.{phase}")))
        cdp.evaluate("Wandmoss.state.mode='playing';Wandmoss.state.boss.health=10;Wandmoss.state.boss.phase='recover';Wandmoss.state.player.facing=-1;Wandmoss.render()")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: facing away from the Guardian translates its turning advice",
                     json.dumps(translated(cdp,"#boss-prompt","boss.prompt.turn")))
        cdp.evaluate("Wandmoss.state.player.facing=1;Wandmoss.state.player.y=100;Wandmoss.render()")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: an elevated wizard sees localized horizontal-aim advice",
                     json.dumps(translated(cdp,"#boss-prompt","boss.prompt.aim")))

        for mode in ("lost","won"):
            cdp.evaluate(f"Wandmoss.state.boss.active=false;Wandmoss.state.checkpointIndex=-1;Wandmoss.state.mode={json.dumps(mode)};Wandmoss.render()")
            for locale in LANGUAGES:
                stable_switch(cdp,locale,f"{mode} fixture")
                verified(cdp,f"{locale}: the {mode} screen and its action translate without changing the result",
                         json.dumps(translated(cdp,"#overlay-title",f"screen.{mode}.title"))+" && document.querySelector('#primary').textContent.includes(MossI18n.t("+json.dumps(f"screen.{mode}.button")+")) && document.activeElement.id==='language-select'")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: victory uses the campaign congratulations with no testing route",
                     "!document.querySelector('.ending-route').hidden && !('practice' in Wandmoss.state) && " + NO_SELECTOR + " && " + json.dumps(translated(cdp,"#overlay-title","screen.won.title")))

        # Test every dialog language using ordinary pointer input. The native
        # modal makes the external language picker inert while it is open.
        load_chapter(cdp,0)
        for locale in LANGUAGES:
            select_language(cdp,locale)
            cdp.click("#music-credits")
            before=cdp.evaluate(STATE)
            verified(cdp,f"{locale}: music credits pause safely with a localized dialog and close action",
                     "Wandmoss.state.mode==='paused' && document.querySelector('#music-dialog').open && "+json.dumps(translated(cdp,"#music-dialog-title","credits.title")))
            static_content(cdp,locale,f"{locale} modal")
            cdp.click("#close-music-credits")
            deadline=time.monotonic()+3
            while not cdp.evaluate("!document.querySelector('#music-dialog').open && document.activeElement.id==='music-credits'"):
                assert time.monotonic()<deadline,"Credits must close normally"
                time.sleep(.01)
            verified(cdp,f"{locale}: closing translated credits leaves the encounter safely paused",
                     f"{STATE}==={json.dumps(before)} && Wandmoss.state.mode==='paused'")
            cdp.click("#primary")
        verified(cdp,"Dynamic localization fixtures produce no JavaScript or resource errors",json.dumps(not browser.errors()))


def save_interface_checks(url):
    with Browser(height=1200) as browser:
        cdp=browser.cdp
        browser.open(url)
        load_chapter(cdp,1)
        reload_game(cdp)
        for locale in LANGUAGES:
            stable_switch(cdp,locale,"saved chapter opening")
            verified(cdp,f"{locale}: chapter continuation translates the saved chapter and resume action",
                     "!document.querySelector('#resume-button').hidden && document.querySelector('#primary').hidden && document.querySelector('#save-status').textContent===MossI18n.t('save.point',{chapter:2}) && document.querySelector('#overlay-copy').textContent.includes(MossI18n.t('chapter.title.1')) && "+json.dumps(translated(cdp,"#overlay-title","save.overlayTitle")))
        load_boss_checkpoint(cdp)
        reload_game(cdp)
        for locale in LANGUAGES:
            stable_switch(cdp,locale,"saved boss opening")
            verified(cdp,f"{locale}: pre-boss continuation distinguishes the lantern and ready equipment",
                     "MossSave.read().kind==='boss' && document.querySelector('#save-status').textContent===MossI18n.t('save.point',{chapter:4})+MossI18n.t('save.beforeBoss') && "+json.dumps(translated(cdp,"#overlay-title","save.overlayBossTitle")))
        cdp.click("#resume-button")
        cdp.evaluate("Wandmoss.state.mode='lost';Wandmoss.render()")
        for locale in LANGUAGES:
            stable_switch(cdp,locale,"boss retry screen")
            verified(cdp,f"{locale}: the boss-loss screen translates its direct retry details",
                     json.dumps(translated(cdp,"#overlay-copy","retry.boss.copy"))+" && document.querySelector('#primary').textContent.includes(MossI18n.t('retry.boss.button'))")
        verified(cdp,"Saved-language interface checks produce no JavaScript or resource errors",json.dumps(not browser.errors()))


def audio_status_checks(url):
    with Browser(height=1200) as browser:
        cdp=browser.cdp
        browser.open(url)
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: muted startup translates the music status and enable action",
                     "document.querySelector('#music-status').textContent===MossI18n.t('audio.off') && document.querySelector('#sound').getAttribute('aria-label')===MossI18n.t('sound.enable')")
        cdp.click("#primary")
        cdp.click("#sound")
        deadline=time.monotonic()+10
        while not cdp.evaluate("document.querySelector('audio[data-moss-track=forest]')?.readyState>=2 && !document.querySelector('audio[data-moss-track=forest]').paused"):
            assert time.monotonic()<deadline,"Native local recording must begin after the sound gesture"
            time.sleep(.025)
        cdp.frames(45)
        for locale in LANGUAGES:
            stable_switch(cdp,locale,"native music playing")
            verified(cdp,f"{locale}: switching language keeps the recording playing and translates the disable action",
                     "document.querySelector('#music-status').textContent===MossI18n.t('audio.playing',{title:'Folk Round'}) && document.querySelector('#sound').getAttribute('aria-label')===MossI18n.t('sound.disable') && !document.querySelector('audio[data-moss-track=forest]').paused")
        cdp.evaluate("document.querySelector('#music-volume').focus()")
        tap(cdp,"Home","Home")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: zero music volume translates its status and accessible percentage",
                     "Wandmoss.music.volume===0 && document.querySelector('#music-status').textContent===MossI18n.t('audio.muted') && document.querySelector('#music-volume').getAttribute('aria-valuetext')===MossI18n.t('music.volumeValue',{volume:0}) && Wandmoss.effects.enabled")
        cdp.click("#pause")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: pausing translates the suspended music and resume action",
                     "document.querySelector('#music-status').textContent===MossI18n.t('audio.paused') && document.querySelector('#pause').getAttribute('aria-label')===MossI18n.t('pause.resume') && document.querySelector('audio[data-moss-track=forest]').paused")
        cdp.click("#primary")
        cdp.evaluate("document.querySelector('#music-volume').focus()")
        tap(cdp,"End","End")
        cdp.frames(45)
        cdp.evaluate("document.querySelector('audio[data-moss-track=forest]').dispatchEvent(new Event('error'))")
        for locale in LANGUAGES:
            select_language(cdp,locale)
            verified(cdp,f"{locale}: the simulated media failure exposes translated recovery instructions",
                     "document.querySelector('#music-status').textContent===MossI18n.t('audio.unavailable') && document.querySelector('audio[data-moss-track=forest]').paused")
        verified(cdp,"Localized native audio status checks produce no JavaScript or resource errors",json.dumps(not browser.errors()))


def card_checks(url):
    """Focused vertical fit of the longer translated desktop/mobile cards."""
    for width,height,mobile in ((1440,1200,False),(390,844,True),(320,740,True)):
        with Browser(width=width,height=height) as browser:
            cdp=browser.cdp
            cdp.call("Emulation.setDeviceMetricsOverride",width=width,height=height,deviceScaleFactor=1,mobile=mobile)
            browser.open(url)

            def card(context,transition=False):
                for locale in LANGUAGES:
                    state=cdp.evaluate(STATE)
                    save=cdp.evaluate(OTHER_STORAGE)
                    select_language(cdp,locale)
                    if transition:
                        fit=cdp.evaluate("""(() => {
                          const r=document.querySelector('#transition-card').getBoundingClientRect();
                          const stage=document.querySelector('#stage').getBoundingClientRect();
                          return r.width>0 && r.height>0 && r.left>=stage.left-1 &&
                            r.right<=stage.right+1 && r.top>=stage.top-1 &&
                            r.bottom<=stage.bottom+1 && r.top>=-1 && r.bottom<=innerHeight+1;
                        })()""")
                    else:
                        fit=overlay_fits(cdp)
                    verified(cdp,f"{width}x{height}: {locale} {context} fits vertically without changing gameplay or its save",
                             json.dumps(fit)+f" && {STATE}==={json.dumps(state)} && {OTHER_STORAGE}==={json.dumps(save)} && document.documentElement.scrollWidth<=innerWidth+1")

            card("opening")
            load_chapter(cdp,2)
            reload_game(cdp)
            card("chapter continuation")
            load_boss_checkpoint(cdp)
            reload_game(cdp)
            card("boss continuation")
            cdp.click("#resume-button")
            cdp.click("#pause")
            card("pause")
            cdp.evaluate("Wandmoss.state.mode='lost';Wandmoss.render()")
            card("boss retry")
            load_chapter(cdp,3)
            cdp.evaluate("Wandmoss.state.mode='lost';Wandmoss.render()")
            card("chapter loss")
            cdp.evaluate("Wandmoss.state.mode='won';Wandmoss.state.score=1670;Wandmoss.state.collected=52;Wandmoss.state.completedLevels=[0,1,2,3];Wandmoss.render()")
            card("campaign victory")
            for chapter,kind in ((0,"walk"),(1,"launch"),(2,"fall")):
                load_chapter(cdp,chapter)
                cdp.evaluate("(() => {const s=Wandmoss.state;Object.assign(s.player,{x:s.goal.x+35,y:480,vx:0,vy:0,grounded:true});Wandmoss.advance(1/120)})()")
                card(f"{kind} transition",transition=True)
            verified(cdp,f"{width}x{height}: translated card fixtures produce no JavaScript or resource errors",json.dumps(not browser.errors()))


def main():
    sys.stdout.reconfigure(line_buffering=True)
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cards-only",action="store_true",help="Check vertical translated menus, results and transitions in desktop/mobile layouts")
    args=parser.parse_args()
    url=(PROJECT/"index.html").as_uri()
    if args.cards_only:
        card_checks(url)
        print(f"All {len(RESULTS)} focused translated-card assertions passed.")
        return
    layout_checks(url)
    storage_checks(url)
    dynamic_checks(url)
    save_interface_checks(url)
    audio_status_checks(url)
    print(f"All {len(RESULTS)} localization and testing-shortcut removal assertions passed.")
    print("State fixtures, native input, local storage and in-memory canvas stability checked; no screenshots created.")


if __name__=="__main__":
    main()
