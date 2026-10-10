(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = id => document.getElementById(id);
  const I = MossI18n;
  const t = (key, variables) => I.t(key, variables);
  const chapterName = index => t(`chapter.title.${index}`);
  let savedSnapshot = MossSave.read();
  let state = MossSave.restore(savedSnapshot) || MossEngine.createState();
  let warnedMemory = false;
  let last = 0, accumulator = 0, renderTime = 0, toastTime = 0;
  const keyboard = new Set();
  const touchPointers = new Map();
  let jumpPressed = false, castPressed = false, bootsPressed = false;
  let soundOn = false;
  const effects = MossEffects.create();
  const music = MossMusic.create(text => { $('music-status').textContent = text; });
  let overlayMode = '', overlayLocale = '', activeToast = null;
  let pausedMode = 'playing', observedMode = state.mode, observedLevel = state.levelIndex;
  const STEP = 1 / 120;
  const CHAPTERS = ['I', 'II', 'III', 'IV'];
  const gameView = $('game-view');
  const fullscreenButton = $('fullscreen');
  let fullscreenPending = false, wasFullscreen = false, pagePosition = null;

  function isGameFullscreen() {
    return (document.fullscreenElement || document.webkitFullscreenElement) === gameView;
  }
  function updateFullscreen() {
    const active = isGameFullscreen();
    const supported = !!(gameView.requestFullscreen || gameView.webkitRequestFullscreen) &&
      (document.fullscreenEnabled ?? document.webkitFullscreenEnabled) !== false;
    const label = t(active ? 'ui.exitFullscreen' : supported ? 'ui.fullscreen' : 'ui.fullscreenUnavailable');
    gameView.classList.toggle('is-fullscreen', active);
    fullscreenButton.disabled = fullscreenPending || (!active && !supported);
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.setAttribute('aria-label', label);
    fullscreenButton.title = active ? `${label} (Escape)` : label;
    if (state.mode === 'paused') $('overlay-hint').textContent =
      t(active ? 'screen.paused.fullscreenHint' : 'screen.paused.hint');
    if (active !== wasFullscreen) {
      clearInput();
      // Browsers may consume Escape before a modal receives its cancel event.
      if (!active && $('music-dialog').open) $('music-dialog').close();
      if (active && state.mode === 'playing') canvas.focus({ preventScroll: true });
      else if (!$('music-dialog').open) fullscreenButton.focus({ preventScroll: true });
      if (!active && pagePosition) {
        window.scrollTo(pagePosition.x, pagePosition.y);
        pagePosition = null;
      }
    }
    wasFullscreen = active;
  }
  async function toggleFullscreen() {
    if (fullscreenPending) return;
    const active = isGameFullscreen();
    const method = active ? (document.exitFullscreen || document.webkitExitFullscreen) :
      (gameView.requestFullscreen || gameView.webkitRequestFullscreen);
    if (!method) return;
    if (!active) pagePosition = { x: window.scrollX, y: window.scrollY };
    clearInput();
    fullscreenPending = true;
    updateFullscreen();
    try {
      await method.call(active ? document : gameView);
    } catch {
      if (!active) pagePosition = null;
      toast('toast.fullscreenFailed');
    } finally {
      fullscreenPending = false;
      updateFullscreen();
    }
  }
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreen);
  document.addEventListener('webkitfullscreenchange', updateFullscreen);
  updateFullscreen();

  function clearInput() {
    keyboard.clear(); touchPointers.clear(); jumpPressed = castPressed = bootsPressed = false;
    document.querySelectorAll('[data-control]').forEach(button => button.classList.remove('pressed'));
  }
  function held(action) {
    const keys = {
      left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
      jump: ['Space', 'ArrowUp', 'KeyW'], cast: ['KeyX', 'KeyJ'], boots: ['KeyC', 'KeyE', 'KeyK']
    };
    return keys[action].some(key => keyboard.has(key)) || [...touchPointers.values()].includes(action);
  }
  function toast(key, duration = 4, variables = {}) {
    activeToast = { key, variables };
    $('toast').textContent = t(key, variables); $('toast').classList.add('visible'); toastTime = duration;
  }
  function saveCurrent(kind = 'level') {
    const result = MossSave.write(state, kind);
    if (result.ok) savedSnapshot = result.snapshot;
    if (result.ok && !result.persistent && !warnedMemory) {
      warnedMemory = true;
      toast('toast.storageBlocked', 7);
    }
  }
  function canRetryBoss() {
    return state.levelIndex === 3 && !!state.boss &&
      (state.boss.active || state.checkpointIndex === state.checkpoints.length - 1);
  }
  function events() {
    effects.sync(state, document.hidden || $('music-dialog').open);
    if (state.events.some(event => ['respawn', 'level', 'retry', 'bossRetry'].includes(event))) effects.stop();
    const contact = state.events.includes('enemyContact') || state.events.includes('bossContact');
    if (observedLevel !== state.levelIndex || (observedMode !== state.mode && ['transition', 'bossDefeat'].includes(state.mode))) clearInput();
    observedLevel = state.levelIndex; observedMode = state.mode;
    for (const event of state.events) {
      if (event !== 'hurt' || !contact) effects.play(event);
      if (event === 'checkpoint') {
        if (state.levelIndex === 3 && state.checkpointIndex === state.checkpoints.length - 1) { saveCurrent('boss'); toast('toast.checkpointBoss', 8); }
        else toast('toast.checkpoint');
      }
      if (event === 'respawn') toast(state.checkpointIndex >= 0 ? 'toast.respawnCheckpoint' : 'toast.respawnStart');
      if (event === 'artifact') toast('toast.artifact', 8);
      if (event === 'boots') toast('toast.boots', 5);
      if (event === 'bootsReady') toast('toast.bootsReady');
      if (event === 'bossWake') toast('toast.bossWake', 9);
      if (event === 'bossDefeat') { $('toast').classList.remove('visible'); toastTime = 0; }
      if (event === 'level') {
        saveCurrent('level');
        if (state.levelIndex === 1) toast('toast.level.1', 5);
        if (state.levelIndex === 2) toast('toast.level.2', 7);
        if (state.levelIndex === 3) toast('toast.level.3', 7);
      }
    }
    state.events.length = 0;
  }
  const screenIcons = { ready: '✧', paused: '☾', won: '✦', lost: '♧' };
  const transitionIcons = { walk: '☾', launch: '↟', fall: '☁' };
  function screenFor(mode) {
    if (!(mode in screenIcons)) return null;
    return Object.assign({ icon: screenIcons[mode] }, Object.fromEntries(
      ['kicker', 'title', 'copy', 'button', 'hint'].map(field => [field, t(`screen.${mode}.${field}`)])));
  }
  function updateAbilities() {
    const boots = state.boots || { owned: false, active: 0, cooldown: 0 };
    const ready = boots.owned && boots.active <= 0 && boots.cooldown <= 0;
    const label = !boots.owned ? t('ability.boots.missing')
      : boots.active > 0 ? t('ability.boots.active', { seconds: Math.ceil(boots.active) })
      : boots.cooldown > 0 ? t('ability.boots.cooldown', { seconds: Math.ceil(boots.cooldown) })
      : t('ability.boots.ready');
    $('boots-label').textContent = label;
    $('boots-button').disabled = !ready || state.mode !== 'playing';
    $('boots-button').classList.toggle('active', boots.active > 0);
    $('boots-button').classList.toggle('ready', ready);
    $('boots-button').setAttribute('aria-label', t('ability.boots.aria', { label }));
    $('boots-button').title = t(!boots.owned ? 'ability.boots.titleMissing' : 'ability.boots.titleOwned');
    const touchBoots = document.querySelector('[data-control="boots"]');
    touchBoots.disabled = !ready || state.mode !== 'playing';
    touchBoots.classList.toggle('active', boots.active > 0);
    touchBoots.setAttribute('aria-label', label);
    const cooldown = state.player.castCooldown;
    $('spell-fill').style.width = `${100 * (1 - Math.min(1, cooldown / MossEngine.CAST_COOLDOWN))}%`;
    $('spell-status').classList.toggle('recovering', cooldown > 0);
    $('spell-label').textContent = cooldown > 0 ? t('ability.spell.cooldown', {
      seconds: I.formatNumber(cooldown, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    }) : t('ability.spell.ready');
  }
  function updateSaveHUD() {
    $('autosave-toggle').checked = MossSave.getEnabled();
    const point = savedSnapshot ? t('save.point', { chapter: savedSnapshot.levelIndex + 1 }) +
      (savedSnapshot.kind === 'boss' ? t('save.beforeBoss') : '') : t('save.default');
    const status = MossSave.status();
    $('save-status').textContent = status === 'off' ? t('save.off') :
      status === 'memory' ? t('save.memory', { point }) : point;
    $('resume-button').hidden = state.mode !== 'ready' || !savedSnapshot;
    $('primary').hidden = state.mode === 'ready' && !!savedSnapshot;
    $('new-game').hidden = !['ready', 'paused', 'lost'].includes(state.mode) ||
      (state.mode === 'ready' && !savedSnapshot);
    $('retry-boss').hidden = !canRetryBoss();
    document.body.dataset.saved = savedSnapshot ? 'yes' : 'no';
  }
  function updateHUD() {
    document.body.dataset.theme = state.theme || 'forest';
    document.body.dataset.mode = state.mode;
    const level = state.levelIndex || 0;
    $('level-number').innerHTML = `${String(level + 1).padStart(2, '0')}<span class="level-count">/04</span>`;
    $('level-name').textContent = chapterName(level);
    $('stage-caption').innerHTML = `<span class="caption-line"></span> ${t('hud.chapter', { chapter: CHAPTERS[level], caption: t(`chapter.caption.${level}`) })}`;
    $('collected').textContent = state.collected;
    $('total').textContent = state.totalFireflies || state.fireflies.length;
    $('score').textContent = state.score || 0;
    $('health').setAttribute('aria-label', t('hud.health', { health: state.health }));
    [...$('health').children].forEach((heart, i) => heart.classList.toggle('empty', i >= state.health));
    const stageProgress = Math.max(0, Math.min(1, (state.maxX - 110) / (state.goal.x - 110)));
    const progress = state.mode === 'won' ? 100 : Math.min(99, Math.round((level + stageProgress) / 4 * 100));
    $('progress-fill').style.width = progress + '%';
    $('progress').setAttribute('aria-valuenow', progress);
    $('journey').textContent = state.mode === 'won' ? t('hud.journeyWon') : state.checkpointIndex >= 0
      ? t('hud.journeyCheckpoint', { chapter: level + 1, checkpoint: state.checkpointIndex + 1, count: state.checkpoints.length })
      : t('hud.journeyFireflies', { chapter: level + 1, collected: state.stageCollected || 0, total: state.fireflies.length });
    $('end-label').innerHTML = t(level === 3 ? 'hud.endValley' : 'hud.endChapters') + ' <span aria-hidden="true">✧</span>';
    $('sound').setAttribute('aria-label', t(soundOn ? 'sound.disable' : 'sound.enable'));
    $('music-volume').setAttribute('aria-valuetext', t('music.volumeValue', { volume: $('music-volume').value }));
    updateAbilities(); updateSaveHUD();
    const boss = state.boss;
    const bossVisible = !!(boss && boss.active && state.mode !== 'won');
    $('boss-hud').hidden = !bossVisible;
    if (bossVisible) {
      $('boss-count').textContent = `${boss.health} / ${boss.maxHealth}`;
      $('boss-health').setAttribute('aria-valuenow', boss.health);
      [...$('boss-health').children].forEach((segment, i) => segment.classList.toggle('spent', i >= boss.health));
      $('boss-hud').dataset.phase = boss.phase;
      const aim = Math.sign(boss.x + boss.w / 2 - state.player.x - state.player.w / 2);
      const knownPhase = ['idle', 'telegraph', 'charge', 'recover', 'kneel', 'fall', 'defeated'].includes(boss.phase);
      const prompt = boss.health === 0 ? t(`boss.prompt.${knownPhase ? boss.phase : 'defeated'}`)
        : aim && state.player.facing !== aim ? t('boss.prompt.turn')
        : state.player.y + 24 < boss.y ? t('boss.prompt.aim')
        : t(`boss.prompt.${knownPhase ? boss.phase : 'idle'}`);
      if ($('boss-prompt').textContent !== prompt) $('boss-prompt').textContent = prompt;
    }
    const transition = state.mode === 'transition' ? state.transition : null;
    $('transition-card').hidden = !transition;
    if (transition) {
      const kind = transition.kind in transitionIcons ? transition.kind : 'walk';
      $('transition-icon').textContent = transitionIcons[kind];
      $('transition-title').textContent = t(`transition.${kind}.title`);
      $('transition-copy').textContent = t(`transition.${kind}.copy`);
    }
    $('pause').disabled = state.mode === 'ready' || state.mode === 'won' || state.mode === 'lost';
    $('pause').textContent = state.mode === 'paused' ? '▷' : 'Ⅱ';
    $('pause').setAttribute('aria-label', t(state.mode === 'paused' ? 'pause.resume' : 'pause.label'));
    if (state.mode === overlayMode && I.locale === overlayLocale) return;
    const modeChanged = state.mode !== overlayMode;
    overlayMode = state.mode; overlayLocale = I.locale;
    let screen = screenFor(state.mode);
    if (state.mode === 'ready' && savedSnapshot) {
      screen = { ...screenFor('ready'), kicker: t('save.overlayKicker'),
        title: t(savedSnapshot.kind === 'boss' ? 'save.overlayBossTitle' : 'save.overlayTitle'),
        copy: t('save.overlayCopy', { chapter: savedSnapshot.levelIndex + 1, name: chapterName(savedSnapshot.levelIndex) }) +
          t(savedSnapshot.kind === 'boss' ? 'save.overlayBossDetails' : 'save.overlayLevelDetails') };
    }
    if (state.mode === 'lost' && canRetryBoss()) screen = { ...screenFor('lost'),
      copy: t('retry.boss.copy'), button: t('retry.boss.button') };
    $('overlay').hidden = !screen;
    $('stage-caption').hidden = ['playing', 'transition', 'bossDefeat'].includes(state.mode);
    $('overlay').classList.toggle('ending', state.mode === 'won');
    $('ending-summary').hidden = state.mode !== 'won';
    if (!screen) return;
    $('overlay-icon').textContent = screen.icon;
    $('overlay-kicker').textContent = screen.kicker;
    $('overlay-title').innerHTML = screen.title;
    $('overlay-copy').innerHTML = screen.copy;
    if (state.mode === 'won') {
      $('ending-score').textContent = state.score || 0;
      $('ending-fireflies').textContent = `${state.collected} / ${state.totalFireflies}`;
      $('ending-time').textContent = `${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`;
    }
    $('primary').innerHTML = screen.button + ' <span aria-hidden="true">→</span>';
    $('overlay-hint').textContent = state.mode === 'paused' && isGameFullscreen()
      ? t('screen.paused.fullscreenHint') : screen.hint;
    if (modeChanged && (state.mode === 'won' || state.mode === 'lost')) { clearInput(); $('primary').focus({ preventScroll: true }); }
  }
  function render() {
    music.sync(state, document.hidden || $('music-dialog').open);
    effects.sync(state, document.hidden || $('music-dialog').open);
    if (window.MossRenderer) MossRenderer.render(ctx, state, renderTime);
    updateHUD();
  }
  function start() {
    if (state.mode !== 'ready') return;
    effects.stop();
    state.mode = 'playing'; saveCurrent(savedSnapshot?.kind || 'level'); clearInput(); canvas.focus({ preventScroll: true }); overlayMode = ''; render();
  }
  function restart() {
    effects.stop();
    clearInput(); MossSave.clear(); savedSnapshot = null;
    state = MossEngine.createState(); state.mode = 'playing'; saveCurrent('level');
    observedLevel = state.levelIndex; observedMode = state.mode;
    toastTime = 0; $('toast').classList.remove('visible'); overlayMode = '';
    canvas.focus({ preventScroll: true }); render();
  }
  function retry() {
    effects.stop();
    clearInput();
    const bossRetry = canRetryBoss();
    state = bossRetry ? MossEngine.retryBoss(state) : MossEngine.retryLevel(state);
    state.mode = 'playing'; saveCurrent(bossRetry ? 'boss' : 'level');
    toastTime = 0; $('toast').classList.remove('visible'); overlayMode = '';
    canvas.focus({ preventScroll: true }); render();
  }
  function resume() {
    const snapshot = MossSave.read(), restored = MossSave.restore(snapshot);
    if (!restored) { toast('toast.noSave'); return; }
    effects.stop();
    clearInput(); savedSnapshot = snapshot; state = restored; state.mode = 'playing';
    toastTime = 0; $('toast').classList.remove('visible'); overlayMode = '';
    observedLevel = state.levelIndex; observedMode = state.mode;
    canvas.focus({ preventScroll: true }); render();
  }
  function pause() {
    if (!['playing', 'transition', 'bossDefeat', 'paused'].includes(state.mode)) return;
    if (state.mode === 'paused') state.mode = pausedMode;
    else { pausedMode = state.mode; state.mode = 'paused'; }
    clearInput(); overlayMode = ''; render();
    if (state.mode !== 'paused') canvas.focus({ preventScroll: true });
    else $('primary').focus({ preventScroll: true });
  }
  function primary() {
    if (state.mode === 'ready') start();
    else if (state.mode === 'paused') pause();
    else if (state.mode === 'lost') retry();
    else restart();
  }
  $('primary').addEventListener('click', primary);
  $('pause').addEventListener('click', pause);
  $('restart').addEventListener('click', retry);
  $('resume-button').addEventListener('click', resume);
  $('new-game').addEventListener('click', restart);
  $('retry-boss').addEventListener('click', retry);
  $('autosave-toggle').addEventListener('change', event => {
    MossSave.setEnabled(event.target.checked);
    if (MossSave.getEnabled() && state.mode !== 'ready') saveCurrent(canRetryBoss() ? 'boss' : 'level');
    updateSaveHUD();
  });
  $('boots-button').addEventListener('click', () => {
    if (state.mode === 'playing') { bootsPressed = true; canvas.focus({ preventScroll: true }); }
  });
  $('sound').addEventListener('click', () => {
    soundOn = !soundOn;
    effects.setEnabled(soundOn);
    effects.sync(state, document.hidden || $('music-dialog').open);
    if (soundOn) {
      effects.unlock().then(available => {
        if (!soundOn) return;
        if (available) effects.play('enabled');
        else toast('toast.effectsUnavailable');
      });
    }
    music.setEnabled(soundOn);
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('sound').setAttribute('aria-label', t(soundOn ? 'sound.disable' : 'sound.enable'));
    if (state.mode === 'playing') canvas.focus({ preventScroll: true });
  });
  $('music-volume').addEventListener('input', event => {
    const volume = Number(event.target.value);
    music.setVolume(volume / 100);
    event.target.setAttribute('aria-valuetext', t('music.volumeValue', { volume }));
  });
  $('music-credits').addEventListener('click', () => {
    clearInput();
    if (['playing', 'transition', 'bossDefeat'].includes(state.mode)) pause();
    $('music-dialog').showModal();
    render();
  });
  $('close-music-credits').addEventListener('click', () => $('music-dialog').close());
  $('music-dialog').addEventListener('close', () => {
    render(); $('music-credits').focus({ preventScroll: true });
  });
  const controlCodes = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyX', 'KeyJ', 'KeyC', 'KeyE', 'KeyK', 'Escape', 'KeyP', 'KeyR']);
  window.addEventListener('keydown', event => {
    if ($('music-dialog').open) {
      if (event.code === 'Escape' && isGameFullscreen()) {
        event.preventDefault();
        if (!event.repeat) toggleFullscreen();
      }
      return;
    }
    if (event.code === 'Escape' && isGameFullscreen()) {
      event.preventDefault();
      if (!event.repeat) toggleFullscreen();
      return;
    }
    if (['SELECT', 'INPUT'].includes(event.target.tagName)) return;
    if (!controlCodes.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
    // Let keyboard users activate focused interface buttons with Space.
    if (event.code === 'Space' && event.target.tagName === 'BUTTON') return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'KeyP' || event.code === 'Escape') { pause(); return; }
    if (event.code === 'KeyR') { event.shiftKey ? restart() : retry(); return; }
    if (state.mode === 'ready' && ['Space', 'ArrowUp', 'KeyW'].includes(event.code)) { start(); return; }
    if (state.mode !== 'playing') return;
    const jumping = held('jump'), casting = held('cast'), boosting = held('boots');
    keyboard.add(event.code);
    if (!jumping && held('jump')) jumpPressed = true;
    if (!casting && held('cast')) castPressed = true;
    if (!boosting && held('boots')) bootsPressed = true;
  });
  window.addEventListener('keyup', event => keyboard.delete(event.code));
  window.addEventListener('blur', () => { clearInput(); if (['playing', 'transition', 'bossDefeat'].includes(state.mode)) pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInput(); if (['playing', 'transition', 'bossDefeat'].includes(state.mode)) pause(); }
    render();
  });
  document.querySelectorAll('[data-control]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (state.mode !== 'playing') return;
      const action = button.dataset.control, alreadyHeld = held(action);
      button.setPointerCapture(event.pointerId); touchPointers.set(event.pointerId, action); button.classList.add('pressed');
      if (action === 'jump' && !alreadyHeld) jumpPressed = true;
      if (action === 'cast' && !alreadyHeld) castPressed = true;
      if (action === 'boots' && !alreadyHeld) bootsPressed = true;
    });
    const release = event => {
      touchPointers.delete(event.pointerId);
      if (![...touchPointers.values()].includes(button.dataset.control)) button.classList.remove('pressed');
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  function frame(timestamp) {
    const dt = last ? Math.min((timestamp - last) / 1000, .1) : 0;
    last = timestamp;
    if (state.mode !== 'paused') renderTime += dt;
    if (toastTime > 0 && (state.mode === 'playing' || state.mode === 'transition')) {
      toastTime -= dt; if (toastTime <= 0) $('toast').classList.remove('visible');
    }
    accumulator += dt;
    while (accumulator >= STEP) {
      MossEngine.step(state, STEP, { left: held('left'), right: held('right'), jumpHeld: held('jump'), jumpPressed, castHeld: held('cast'), castPressed, bootsPressed });
      jumpPressed = castPressed = bootsPressed = false;
      accumulator -= STEP;
    }
    events(); render(); music.tick(dt); requestAnimationFrame(frame);
  }
  I.subscribe(() => {
    clearInput();
    updateFullscreen();
    if (activeToast) $('toast').textContent = t(activeToast.key, activeToast.variables);
    render();
  });
  window.Wandmoss = {
    get state() { return state; }, music, effects, start, restart, pause, retry, resume,
    advance(dt, input = {}) { MossEngine.step(state, dt, input); renderTime += dt; events(); render(); },
    render
  };
  render(); requestAnimationFrame(frame);
})();
