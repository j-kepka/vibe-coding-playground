/* Local recordings: Kevin MacLeod, CC BY 4.0. See THIRD_PARTY_NOTICES.md.
 * Playback controller: MIT, like the original game code. */
(() => {
  'use strict';
  const tracks = Object.freeze({
    fairytale: { id: 'fairytale', title: 'Fairytale Waltz', src: 'assets/music/fairytale-waltz.mp3' },
    forest: { id: 'forest', title: 'Folk Round', src: 'assets/music/folk-round.mp3' },
    dusk: { id: 'dusk', title: 'Evening Fall (Harp)', src: 'assets/music/evening-fall-harp.mp3' },
    sky: { id: 'sky', title: 'Enchanted Journey', src: 'assets/music/enchanted-journey.mp3' },
    boss: { id: 'boss', title: 'Call to Adventure', src: 'assets/music/call-to-adventure.mp3' }
  });
  const chapters = ['forest', 'dusk', 'sky', 'forest'];

  function create(onStatus = () => {}) {
    const entries = new Map();
    let enabled = false, volume = .4, selected = 'fairytale';
    let suspended = false, failed = false, lastStatus = '';
    function status() {
      if (!enabled) return MossI18n.t('audio.off');
      if (suspended) return MossI18n.t('audio.paused');
      if (failed) return MossI18n.t('audio.unavailable');
      if (volume === 0) return MossI18n.t('audio.muted');
      return MossI18n.t('audio.playing', { title: tracks[selected].title });
    }
    function publish() {
      const text = status();
      if (text !== lastStatus) { lastStatus = text; onStatus(text); }
    }
    function stopAll() {
      for (const entry of entries.values()) {
        entry.epoch++; entry.requested = false; entry.gain = entry.target = 0;
        entry.audio.pause(); entry.audio.volume = 0;
      }
    }
    function failure(entry, epoch) {
      if (entry.epoch !== epoch || !enabled || suspended || selected !== entry.id) return;
      failed = true; stopAll(); publish();
    }
    function getEntry(id) {
      if (entries.has(id)) return entries.get(id);
      const audio = document.createElement('audio');
      audio.dataset.mossTrack = id; audio.hidden = true;
      audio.preload = 'none'; audio.loop = true; audio.volume = 0;
      audio.src = tracks[id].src;
      document.body.append(audio);
      const entry = { id, audio, gain: 0, target: 0, epoch: 0, requested: false };
      audio.addEventListener('error', () => failure(entry, entry.epoch));
      entries.set(id, entry);
      return entry;
    }
    function play(entry) {
      const epoch = ++entry.epoch;
      entry.requested = true;
      // HTML audio works through file:// too, without fetch or CORS-dependent
      // Web Audio media sources. Invoke play synchronously in the sound click.
      try {
        Promise.resolve(entry.audio.play()).then(() => {
          if (entry.epoch !== epoch) return;
          if (!enabled || suspended || entry.target === 0) {
            entry.audio.pause(); entry.requested = false;
          }
        }).catch(() => failure(entry, epoch));
      } catch { failure(entry, epoch); }
    }
    function reconcile() {
      if (!enabled || suspended) { stopAll(); publish(); return; }
      if (failed) { publish(); return; }
      const current = getEntry(selected);
      for (const entry of entries.values()) entry.target = entry === current ? 1 : 0;
      if (!current.requested && current.audio.paused) play(current);
      publish();
    }
    MossI18n.subscribe(publish);
    return {
      get enabled() { return enabled; },
      get volume() { return volume; },
      get currentTrack() { return tracks[selected]; },
      get status() { return status(); },
      setEnabled(value) {
        enabled = !!value; failed = false; reconcile();
      },
      setVolume(value) {
        if (!Number.isFinite(value)) return;
        volume = Math.max(0, Math.min(1, value));
        for (const entry of entries.values()) entry.audio.volume = volume * entry.gain;
        publish();
      },
      sync(state, hidden = false) {
        const next = ['ready', 'won'].includes(state.mode) ? 'fairytale'
          : state.mode === 'bossDefeat' || state.boss?.active ? 'boss'
          : chapters[state.levelIndex] || 'forest';
        const stopped = hidden || ['paused', 'lost'].includes(state.mode);
        if (next === selected && stopped === suspended) return;
        if (next !== selected) failed = false;
        selected = next; suspended = stopped; reconcile();
      },
      tick(dt) {
        if (!enabled || suspended || failed) return;
        const step = Math.max(0, Math.min(dt, .1)) / .65;
        for (const entry of entries.values()) {
          entry.gain += Math.sign(entry.target - entry.gain) * Math.min(step, Math.abs(entry.target - entry.gain));
          entry.audio.volume = volume * entry.gain;
          if (entry.target === 0 && entry.gain === 0 && entry.requested) {
            entry.epoch++; entry.requested = false; entry.audio.pause();
            entry.audio.currentTime = 0;
          }
        }
      }
    };
  }
  window.MossMusic = Object.freeze({ tracks, create });
})();
