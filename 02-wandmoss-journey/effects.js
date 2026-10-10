/* Original synthesized Wandmoss Journey effects. MIT; no samples or external assets. */
(() => {
  'use strict';

  function create() {
    let context = null, output = null, noiseBuffer = null;
    let enabled = false, blocked = false, stride = 0;
    const voices = new Set();
    const MAX_VOICES = 32;

    function updateGain() {
      if (output) output.gain.setValueAtTime(enabled && !blocked ? .7 : 0, context.currentTime);
    }
    function release(voice) {
      voice.source.disconnect();
      voice.nodes.forEach(node => node.disconnect());
      voices.delete(voice);
    }
    function stop() {
      for (const voice of voices) {
        voice.source.stop(context.currentTime);
        release(voice);
      }
    }
    function unlock() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return Promise.resolve(false);
        if (!context) {
          context = new AudioContext();
          output = context.createGain();
          output.connect(context.destination);
          updateGain();
        }
        return context.resume().then(() => true, () => false);
      } catch { return Promise.resolve(false); }
    }
    function envelope(source, length, volume, delay, nodes = [], hold = 0) {
      const gain = context.createGain();
      const start = context.currentTime + delay;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + .004);
      if (hold > 0) gain.gain.setValueAtTime(volume, start + Math.min(.004 + hold, length - .01));
      gain.gain.exponentialRampToValueAtTime(.0001, start + length);
      source.connect(nodes[0] || gain);
      nodes.forEach((node, index) => node.connect(nodes[index + 1] || gain));
      gain.connect(output);
      const voice = { source, nodes: [...nodes, gain] };
      voices.add(voice);
      source.onended = () => release(voice);
      source.start(start);
      source.stop(start + length);
      return start;
    }
    function tone(frequency, length, type = 'sine', volume = .025, slide = 1, delay = 0, hold = 0) {
      if (voices.size >= MAX_VOICES) return;
      const oscillator = context.createOscillator();
      oscillator.type = type;
      const start = context.currentTime + delay;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * slide), start + length);
      envelope(oscillator, length, volume, delay, [], hold);
    }
    function noise(length, volume, frequency, endFrequency, type = 'lowpass', hold = 0) {
      if (voices.size >= MAX_VOICES) return;
      if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * .35), context.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        let seed = 4217;
        for (let i = 0; i < samples.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          samples[i] = seed / 2147483648 - 1;
        }
      }
      const source = context.createBufferSource(), filter = context.createBiquadFilter();
      source.buffer = noiseBuffer;
      filter.type = type;
      filter.Q.value = .7;
      filter.frequency.setValueAtTime(frequency, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + length);
      envelope(source, length, volume, 0, [filter], hold);
    }
    function play(event) {
      if (!enabled || blocked || !context || context.state !== 'running' || document.hidden) return;
      switch (event) {
        case 'step':
          noise(.055, .018, ++stride % 2 ? 460 : 380, 170);
          tone(stride % 2 ? 105 : 95, .055, 'sine', .011, .7);
          break;
        case 'jump':
          tone(1180, .16, 'sine', .018, 1.2);
          tone(1770, .12, 'sine', .007, .95, .015);
          break;
        case 'rocketJump':
          noise(.30, .075, 1600, 550, 'bandpass', .07);
          tone(180, .28, 'triangle', .045, 2.2, 0, .06);
          break;
        case 'enemyContact':
          noise(.085, .027, 680, 200);
          tone(170, .12, 'triangle', .023, .5);
          break;
        case 'bossContact':
          noise(.15, .035, 750, 160);
          tone(82, .19, 'triangle', .033, .5);
          break;
        case 'bossCharge':
          noise(.34, .08, 1300, 380, 'bandpass', .08);
          tone(200, .32, 'triangle', .05, .5, 0, .07);
          break;
        case 'spell': tone(780, .22, 'sine', .035, .4); break;
        case 'collect':
          tone(880, .25); tone(1320, .3, 'sine', .015);
          break;
        case 'enemy': tone(260, .16, 'triangle', .03, .4); break;
        case 'hurt': tone(140, .22, 'triangle', .026, .5); break;
        case 'boots': tone(260, .4, 'triangle', .025, 3); break;
        case 'bossHit':
          tone(110, .16, 'triangle', .032, .5);
          tone(430, .1, 'sine', .014, .7);
          break;
        case 'launch': tone(180, 1, 'sine', .035, 5); break;
        case 'descent': tone(640, .8, 'sine', .022, .3); break;
        case 'enabled': tone(659, .15, 'sine', .018); break;
        case 'checkpoint': case 'artifact': case 'bootsReady': case 'win':
          [523, 659, 784, 1046].forEach((frequency, i) => tone(frequency, .35, 'sine', .025, 1, i * .1));
          break;
      }
    }

    return {
      get context() { return context; },
      get enabled() { return enabled; },
      get activeVoices() { return voices.size; },
      unlock, play, stop,
      setEnabled(value) {
        enabled = !!value;
        if (!enabled) stop();
        updateGain();
      },
      sync(state, hidden = false) {
        const next = hidden || ['paused', 'lost'].includes(state.mode);
        if (next === blocked) return;
        blocked = next;
        if (blocked) stop();
        updateGain();
      }
    };
  }
  window.MossEffects = Object.freeze({ create });
})();
