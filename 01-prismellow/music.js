/* Original, locally synthesized soundtrack. No downloads or audio files. */
(() => {
  const button = document.querySelector('#music');
  const { t } = MinesI18n;
  const tempo = 92;
  const stepDuration = 60 / tempo / 2;
  const chords = [
    [57, 60, 64, 67], [53, 57, 60, 64],
    [60, 64, 67, 71], [55, 59, 62, 67],
    [57, 60, 64, 69], [53, 57, 60, 65],
    [50, 57, 60, 65], [52, 59, 62, 67],
  ];
  const melody = [76, null, 79, null, 81, 79, 76, null, 74, null, 72, null, 74, 76, null, null,
    72, null, 76, null, 77, 76, 72, null, 69, null, 72, null, 74, 72, null, null,
    79, null, 83, null, 84, 83, 79, null, 76, null, 79, null, 76, 74, null, null,
    74, null, 79, null, 81, 79, 74, null, 71, null, 74, null, 76, 74, null, null];
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  let context, master, echo, timer, nextTime, step = 0, enabled = false, request = 0;
  const voices = new Set();

  function initialize() {
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(context.destination);
    echo = context.createDelay(1);
    echo.delayTime.value = stepDuration * 1.5;
    const echoVolume = context.createGain();
    echoVolume.gain.value = .16;
    echo.connect(echoVolume).connect(master);
  }

  function note(midi, time, duration, volume, type = 'sine', shimmer = false) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + .025);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(envelope).connect(master);
    if (shimmer) envelope.connect(echo);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(time);
    oscillator.stop(time + duration + .02);
  }

  function schedule() {
    if (!enabled || document.hidden) return;
    // A throttled tab must never schedule a backlog of notes.
    if (nextTime < context.currentTime) nextTime = context.currentTime + .05;
    while (nextTime < context.currentTime + .25) {
      const position = step % 16;
      const chord = chords[Math.floor(step / 16) % chords.length];
      const arpeggio = [0, 2, 1, 3, 2, 1, 3, 2][position % 8];
      note(chord[arpeggio] + 12, nextTime, .85, .075, 'sine', true);
      if (position % 4 === 0) note(chord[0] - 24, nextTime, 1.1, .16, 'triangle');
      if (position === 0) chord.forEach(pitch => note(pitch, nextTime, 4.9, .035, 'sine'));
      const pitch = melody[step % melody.length];
      if (pitch !== null) {
        note(pitch, nextTime, 1.3, .095, 'sine', true);
        note(pitch + 12, nextTime, .45, .018, 'sine', true);
      }
      step++;
      nextTime += stepDuration;
    }
  }

  function start() {
    if (!enabled || document.hidden) return;
    clearInterval(timer);
    nextTime = context.currentTime + .08;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(.55, context.currentTime, .12);
    schedule();
    timer = setInterval(schedule, 100);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    if (!context) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0, context.currentTime, .035);
    for (const oscillator of voices) {
      try { oscillator.stop(context.currentTime + .15); } catch {}
    }
  }

  function showState() {
    button.setAttribute('aria-pressed', String(enabled));
    const key = enabled ? 'musicOff' : 'musicOn';
    button.dataset.i18nAriaLabel = key;
    button.dataset.i18nTitle = key;
    button.setAttribute('aria-label', t(key));
    button.title = t(key);
  }

  button.addEventListener('click', async () => {
    const currentRequest = ++request;
    enabled = !enabled;
    showState();
    if (!enabled) { stop(); return; }
    try {
      if (!context) initialize();
      await context.resume();
      if (enabled && currentRequest === request) start();
    } catch {
      if (currentRequest !== request) return;
      enabled = false; stop(); showState();
      const status = document.querySelector('#status');
      status.dataset.statusKey = 'musicError';
      status.dataset.statusParams = '{}';
      status.textContent = t('musicError');
    }
  });
  document.addEventListener('languagechange', showState);
  showState();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (enabled) context.resume().then(start).catch(() => { enabled = false; stop(); showState(); });
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', () => { if (enabled && context) context.resume().then(start).catch(() => {}); });
})();
