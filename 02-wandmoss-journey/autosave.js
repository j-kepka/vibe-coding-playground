/* Versioned chapter/pre-boss saves. Only this game's two local keys are used. */
(() => {
  'use strict';
  // Retain the original keys so the title change preserves existing progress.
  const KEY = 'mosslight.autosave.v1';
  const SETTINGS_KEY = 'mosslight.settings.v1';
  const finite = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  const integer = (n, max) => Number.isInteger(n) && finite(n, max);

  function validate(save) {
    // Ignore snapshots from the retired testing shortcut, while accepting
    // normal v1 saves that still carry its old false flag.
    if (!save || save.version !== 1 || !['level', 'boss'].includes(save.kind) ||
        !integer(save.levelIndex, 3) || (save.kind === 'boss' && save.levelIndex !== 3) ||
        !integer(save.score, 1000000) || !integer(save.collected, MossLevels.totalFireflies) ||
        !finite(save.time, 10000000) || !integer(save.deaths, 1000000) ||
        typeof save.bootsOwned !== 'boolean' || ('practice' in save && save.practice !== false) ||
        !Array.isArray(save.completedLevels) || save.completedLevels.length > 3 ||
        !save.completedLevels.every(n => integer(n, 2) && n < save.levelIndex) ||
        new Set(save.completedLevels).size !== save.completedLevels.length ||
        !save.stageStart || !integer(save.stageStart.score, save.score) ||
        !integer(save.stageStart.collected, save.collected)) return false;
    const level = MossLevels.create(save.levelIndex);
    if (save.kind === 'boss') {
      if (!Array.isArray(save.fireflies) || save.fireflies.length !== level.fireflies.length ||
          !save.fireflies.every(flag => typeof flag === 'boolean') ||
          !Array.isArray(save.enemies) || save.enemies.length !== level.enemies.length ||
          !save.enemies.every(flag => typeof flag === 'boolean') ||
          save.collected - save.stageStart.collected !== save.fireflies.filter(Boolean).length) return false;
    } else if (save.score !== save.stageStart.score || save.collected !== save.stageStart.collected) return false;
    return true;
  }

  function capture(state, kind = 'level') {
    const boss = kind === 'boss' && state.levelIndex === 3;
    // A continuation starts a fresh fight; its previous victory reward belongs
    // to the completed attempt and must not be banked again on each replay.
    const bossReward = boss && state.completedLevels.includes(3) ? 500 : 0;
    const saved = {
      version: 1, kind: boss ? 'boss' : 'level', levelIndex: state.levelIndex,
      score: boss ? state.score - bossReward : state.stageStart.score,
      collected: boss ? state.collected : state.stageStart.collected,
      time: state.time, deaths: state.deaths, bootsOwned: !!state.boots.owned,
      completedLevels: [...state.completedLevels].filter(i => i < state.levelIndex),
      stageStart: { score: state.stageStart.score, collected: state.stageStart.collected }
    };
    if (boss) {
      saved.fireflies = state.fireflies.map(firefly => !!firefly.collected);
      saved.enemies = state.enemies.map(enemy => !!enemy.alive);
    }
    return saved;
  }

  function restore(save) {
    if (!validate(save)) return null;
    const state = MossEngine.createState(save.levelIndex);
    Object.assign(state, { score: save.score, collected: save.collected, time: save.time,
      deaths: save.deaths, completedLevels: [...save.completedLevels] });
    state.boots.owned = save.bootsOwned;
    state.stageStart = { ...save.stageStart };
    if (state.artifact && state.boots.owned) state.artifact.collected = true;
    if (save.kind === 'boss') {
      state.fireflies.forEach((firefly, i) => firefly.collected = save.fireflies[i]);
      state.enemies.forEach((enemy, i) => enemy.alive = save.enemies[i]);
      state.stageCollected = save.fireflies.filter(Boolean).length;
      state.checkpoints.forEach(checkpoint => checkpoint.active = true);
      state.checkpointIndex = state.checkpoints.length - 1;
      MossEngine.retryBoss(state);
      state.events.length = 0;
    }
    state.mode = 'ready';
    return state;
  }

  function create(storage) {
    let memory = null, persistent = true, enabled = true;
    const target = () => storage === undefined ? window.localStorage : storage;
    let settingsText = null;
    try { settingsText = target().getItem(SETTINGS_KEY); }
    catch { persistent = false; }
    try {
      const settings = JSON.parse(settingsText || 'null');
      if (settings && typeof settings.autosave === 'boolean') enabled = settings.autosave;
    } catch { /* Invalid preferences leave autosave enabled. */ }
    const read = () => {
      if (!persistent && memory && validate(memory)) return memory;
      let raw = null;
      try { raw = target().getItem(KEY); }
      catch { persistent = false; }
      try {
        const data = JSON.parse(raw || 'null');
        if (validate(data)) { memory = data; return data; }
      } catch { /* Malformed data is ignored without treating storage as blocked. */ }
      return memory && validate(memory) ? memory : null;
    };
    const write = (state, kind = 'level') => {
      if (!enabled) return { ok: false, persistent, snapshot: read() };
      const snapshot = capture(state, kind);
      if (!validate(snapshot)) return { ok: false, persistent, snapshot: null };
      memory = snapshot;
      try { target().setItem(KEY, JSON.stringify(snapshot)); persistent = true; }
      catch { persistent = false; }
      return { ok: true, persistent, snapshot };
    };
    return {
      read, write, capture, restore, validate,
      clear() { memory = null; try { target().removeItem(KEY); } catch { persistent = false; } },
      getEnabled() { return enabled; },
      setEnabled(value) {
        enabled = !!value;
        try { target().setItem(SETTINGS_KEY, JSON.stringify({ autosave: enabled })); }
        catch { persistent = false; }
        return enabled;
      },
      status() { return !enabled ? 'off' : persistent ? 'persistent' : 'memory'; }
    };
  }
  window.MossSave = Object.assign(create(), { create, KEY, SETTINGS_KEY });
})();
