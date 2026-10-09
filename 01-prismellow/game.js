(() => {
  const { t } = MinesI18n;
  const { SIZE, adjacent, matches, move, create, collapse } = Mines;
  const boardElement = document.querySelector('#board');
  const scoreElement = document.querySelector('#score');
  const status = document.querySelector('#status');
  const hintButton = document.querySelector('#hint');
  const restartButton = document.querySelector('#new-game');
  const finishButton = document.querySelector('#finish-game');
  const leaderboardButton = document.querySelector('#leaderboard-open');
  const dialog = document.querySelector('#restart-dialog');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const colors = [
    ['Rubin', '#ff627b', '#bd244b', '#ffb4b9'],
    ['Szafir', '#61b4ff', '#3461bd', '#b6e0ff'],
    ['Szmaragd', '#6ce0a5', '#229a74', '#b6ffce'],
    ['Topaz', '#ffd46b', '#c58427', '#fff1b0'],
    ['Ametyst', '#b891ff', '#7955bc', '#e1c7ff'],
    ['Diament', '#75e3e5', '#329aa9', '#cdffff'],
  ];
  const shapes = [
    ['20,6 44,6 58,20 58,44 44,58 20,58 6,44 6,20', '22,21 42,21 44,43 21,43'],
    ['32,3 60,32 32,61 4,32', '32,19 45,32 32,46 19,32'],
    ['17,6 47,6 55,17 55,47 47,58 17,58 9,47 9,17', '22,19 42,19 43,45 21,45'],
    ['32,4 60,53 4,53', '32,22 44,45 19,45'],
    ['17,5 47,5 61,32 47,59 17,59 3,32', '23,20 42,20 47,32 41,45 23,45 17,32'],
    ['16,10 48,10 60,27 32,59 4,27', '24,25 40,25 32,48'],
  ];
  let board, selected = null, score = 0, best = 0, busy = false, ended = false, runId;
  let hintTimer, pointerStart = null, suppressClick = false, soundEnabled = false, audio, soundOutput, soundEcho;
  let soundRequest = 0;
  const soundVoices = new Set();
  try {
    const savedBest = Number(localStorage.getItem('diamond-mines-best'));
    if (Number.isSafeInteger(savedBest) && savedBest >= 0) best = savedBest;
  } catch {}
  const cells = Array.from({ length: 64 }, (_, index) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.dataset.index = index;
    cell.tabIndex = index === 0 ? 0 : -1;
    boardElement.append(cell);
    return cell;
  });
  const number = value => value.toLocaleString(MinesI18n.language);
  function setStatus(key, params = {}) {
    status.dataset.statusKey = key;
    status.dataset.statusParams = JSON.stringify(params);
    const formatted = Object.fromEntries(Object.entries(params).map(([name, value]) => [name, typeof value === 'number' ? number(value) : value]));
    status.textContent = t(key, formatted);
  }
  function updateCellLabels() {
    cells.forEach((cell, i) => cell.setAttribute('aria-label', t('cellLabel', { gem: t(`gem${board[i]}`), row: Math.floor(i / SIZE) + 1, col: i % SIZE + 1 })));
  }
  function updateSoundLabel() {
    const button = document.querySelector('#sound');
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.dataset.i18nAriaLabel = soundEnabled ? 'soundOff' : 'soundOn';
    button.dataset.i18nTitle = soundEnabled ? 'soundOffTitle' : 'soundOnTitle';
    button.setAttribute('aria-label', t(button.dataset.i18nAriaLabel));
    button.title = t(button.dataset.i18nTitle);
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : ms));
  function gem(type, index) {
    const [, light, dark, shine] = colors[type];
    const [outline] = shapes[type];
    const vertices = outline.split(' ').map(point => point.split(',').map(Number));
    const inner = vertices.map(([x, y]) => [32 + (x - 32) * .55, 30 + (y - 32) * .55]);
    const center = inner.map(point => point.join(',')).join(' ');
    const facets = vertices.map((point, i) => {
      const next = (i + 1) % vertices.length;
      const middleY = (point[1] + vertices[next][1]) / 2;
      return `<polygon points="${point} ${vertices[next]} ${inner[next]} ${inner[i]}" fill="${middleY < 25 ? shine : i % 2 ? dark : light}" opacity="${middleY < 25 ? '.85' : '.7'}" stroke="${shine}" stroke-opacity=".16" stroke-width=".45"/>`;
    }).join('');
    const glintX = type === 3 ? 30 : type === 1 ? 28 : 19;
    const glintY = type === 3 ? 18 : 17;
    return `<svg class="gem" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="body-${index}" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="${shine}"/><stop offset=".32" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="face-${index}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${shine}"/><stop offset=".28" stop-color="${light}"/><stop offset=".7" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="sheen-${index}" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="white" stop-opacity=".55"/><stop offset=".45" stop-color="white" stop-opacity=".07"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><clipPath id="cut-${index}"><polygon points="${outline}"/></clipPath></defs><ellipse cx="32" cy="58" rx="20" ry="3" fill="#000" opacity=".22"/><polygon points="${outline}" fill="url(#body-${index})" stroke="${shine}" stroke-opacity=".7" stroke-width=".8"/>${facets}<polygon points="${center}" fill="url(#face-${index})" stroke="${shine}" stroke-opacity=".55" stroke-width=".7"/><g clip-path="url(#cut-${index})"><path d="M-5 15 51 2 35 32 8 41Z" fill="url(#sheen-${index})"/><path d="M-4 14 62 0" stroke="white" stroke-opacity=".5" stroke-width="1"/></g><path d="M${glintX - 4} ${glintY}h8m-4-4v8" stroke="white" stroke-width=".75" opacity=".7"/><circle cx="${glintX}" cy="${glintY}" r="1.2" fill="white" opacity=".9"/></svg>`;
  }
  function render() {
    cells.forEach((cell, i) => {
      cell.innerHTML = gem(board[i], i);
      cell.style.setProperty('--gem-color', colors[board[i]][1]);
      cell.classList.toggle('selected', selected === i);
      cell.setAttribute('aria-pressed', String(selected === i));
      cell.dataset.gem = board[i];
    });
    updateCellLabels();
  }
  function updateScore() {
    best = Math.max(best, score);
    try { localStorage.setItem('diamond-mines-best', String(best)); } catch {}
    scoreElement.textContent = number(score);
    document.querySelector('#best').textContent = number(best);
    document.querySelector('#level').textContent = Math.floor(score / 1000) + 1;
    document.querySelector('#progress').value = score % 1000;
    document.querySelector('#progress-label').textContent = `${number(score % 1000)} / ${number(1000)}`;
  }
  function lock(value) {
    busy = value;
    hintButton.disabled = value || ended;
    finishButton.disabled = value || ended;
    boardElement.dataset.ended = String(ended);
    cells.forEach(cell => cell.setAttribute('aria-disabled', String(value || ended)));
    restartButton.disabled = value;
    leaderboardButton.disabled = value;
    boardElement.setAttribute('aria-busy', String(value));
  }
  function clearHint() {
    clearTimeout(hintTimer);
    cells.forEach(cell => cell.classList.remove('hint'));
  }
  function initializeEffects() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    try {
      const output = context.createGain();
      output.gain.value = .85;
      output.connect(context.destination);
      const echo = context.createDelay(.5);
      echo.delayTime.value = .09;
      const echoGain = context.createGain();
      echoGain.gain.value = .15;
      echo.connect(echoGain).connect(output);
      audio = context; soundOutput = output; soundEcho = echo;
    } catch (error) {
      try { context.close().catch(() => {}); } catch {}
      throw error;
    }
  }
  async function tone(chain = 1, invalid = false) {
    if (!soundEnabled) return;
    const currentRequest = soundRequest;
    try {
      if (!audio || audio.state === 'closed') initializeEffects();
      if (audio.state !== 'running') await audio.resume();
      // An old resume must not play a chime or change a newer switch setting.
      if (!soundEnabled || currentRequest !== soundRequest) return;
      soundOutput.gain.cancelScheduledValues(audio.currentTime);
      soundOutput.gain.setTargetAtTime(.85, audio.currentTime, .01);
      const start = audio.currentTime + .005;
      // Bell overtones: a clear strike, soft shimmer, and a lingering glass tail.
      const semitones = [0, 3, 5, 7, 10, 12, 15];
      const pitch = 880 * 2 ** (semitones[Math.min(Math.max(chain - 1, 0), 6)] / 12);
      const partials = invalid ? [[180, .035, .13]] : [
        [pitch, .09, .8], [pitch * 2, .025, .45],
        [pitch * 2.76, .012, .28], [pitch * 4.07, .006, .18],
      ];
      for (const [frequency, volume, duration] of partials) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + .004);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(gain).connect(soundOutput);
        if (!invalid) gain.connect(soundEcho);
        soundVoices.add(oscillator);
        oscillator.onended = () => { soundVoices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + duration + .02);
      }
    } catch {
      if (currentRequest !== soundRequest) return;
      soundRequest++;
      soundEnabled = false;
      silenceEffects(); updateSoundLabel();
      setStatus('soundError');
    }
  }
  function silenceEffects() {
    if (!audio) return;
    try {
      soundOutput.gain.cancelScheduledValues(audio.currentTime);
      soundOutput.gain.setTargetAtTime(0, audio.currentTime, .01);
    } catch {}
    for (const oscillator of soundVoices) {
      try { oscillator.stop(audio.currentTime + .04); } catch {}
    }
  }
  function burst(indices, points, chain) {
    if (reducedMotion) return;
    const rect = cells[indices[Math.floor(indices.length / 2)]].getBoundingClientRect();
    const label = document.createElement('span');
    label.className = 'points-popup';
    label.textContent = `${chain > 1 ? `×${number(chain)}  ` : ''}+${number(points)}`;
    Object.assign(label.style, { left: `${rect.x + rect.width / 2}px`, top: `${rect.y}px` });
    document.body.append(label);
    label.animate([{ transform: 'translate(-50%,0) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,-15px) scale(1.1)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-65px) scale(1)', opacity: 0 }], { duration: 1000 }).finished.then(() => label.remove());
    indices.forEach(index => {
      const r = cells[index].getBoundingClientRect();
      for (let n = 0; n < 6; n++) {
        const particle = document.createElement('span');
        particle.className = 'gem-particle';
        Object.assign(particle.style, { left: `${r.x + r.width / 2}px`, top: `${r.y + r.height / 2}px`, background: colors[board[index]][1], color: colors[board[index]][3] });
        document.body.append(particle);
        const angle = n * Math.PI / 3 + Math.random() * .5;
        const distance = 25 + Math.random() * 35;
        particle.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) rotate(120deg) scale(0)`, opacity: 0 }], { duration: 420 + Math.random() * 180 }).finished.then(() => particle.remove());
      }
    });
  }
  async function animateSwap(a, b, drag = null) {
    if (reducedMotion) return;
    const first = cells[a].getBoundingClientRect();
    const second = cells[b].getBoundingClientRect();
    const dx = second.x - first.x, dy = second.y - first.y;
    await Promise.all([
      cells[a].firstElementChild.animate([{ transform: `translate(${drag?.dx || 0}px,${drag?.dy || 0}px) scale(${drag ? 1.12 : 1})` }, { transform: `translate(${dx}px,${dy}px) scale(1)` }], { duration: 170, easing: 'ease-in-out' }).finished,
      cells[b].firstElementChild.animate([{ transform: `translate(${-(drag?.dx || 0) * .45}px,${-(drag?.dy || 0) * .45}px)` }, { transform: `translate(${-dx}px,${-dy}px)` }], { duration: 170, easing: 'ease-in-out' }).finished,
    ]);
  }
  async function swap(a, b, drag = null) {
    if (busy || ended || !adjacent(a, b)) return;
    lock(true); selected = null; clearHint(); render();
    await animateSwap(a, b, drag);
    [board[a], board[b]] = [board[b], board[a]];
    render();
    if (!matches(board).length) {
      tone(1, true);
      setStatus('invalidSwap');
      await wait(120);
      await animateSwap(a, b);
      [board[a], board[b]] = [board[b], board[a]];
      render(); lock(false); return;
    }
    let chain = 0, total = 0, found;
    while ((found = matches(board)).length) {
      chain++;
      const gained = found.length * 10 * chain;
      total += gained; score += gained; updateScore(); tone(chain);
      burst(found, gained, chain);
      setStatus(chain > 1 ? 'cascadePoints' : 'matchPoints', { chain, points: gained });
      if (!reducedMotion) await Promise.all(found.map(i => cells[i].firstElementChild.animate([
        { transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 1, offset: .35 }, { transform: 'scale(0)', opacity: 0 },
      ], { duration: 260, fill: 'forwards' }).finished));
      found.forEach(i => { board[i] = null; });
      const drops = collapse(board);
      render();
      const step = cells[8].getBoundingClientRect().y - cells[0].getBoundingClientRect().y;
      if (!reducedMotion) await Promise.all(drops.filter(d => d.distance).map(d => cells[d.index].firstElementChild.animate([
        { transform: `translateY(${-d.distance * step}px)`, opacity: .3 }, { transform: 'translateY(0)', opacity: 1 },
      ], { duration: 320 + d.distance * 35, easing: 'cubic-bezier(.25,.7,.4,1)' }).finished));
      await wait(100);
    }
    setStatus(chain > 1 ? 'cascadeTotal' : 'moveTotal', { chain, points: total });
    if (!move(board)) { endGame(); return; }
    lock(false);
  }
  function choose(index) {
    if (busy || ended || pointerStart?.dragged) return;
    clearHint();
    if (selected === index) { selected = null; render(); return; }
    if (selected !== null && adjacent(selected, index)) { swap(selected, index); return; }
    selected = index; render();
  }
  function focusCell(index) {
    cells.forEach((cell, i) => { cell.tabIndex = i === index ? 0 : -1; });
    cells[index].focus({ preventScroll: true });
  }
  boardElement.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    const cell = event.target.closest('.cell');
    if (cell) { const index = Number(cell.dataset.index); focusCell(index); choose(index); }
  });
  function dragDestination(start, dx, dy) {
    const next = start.index + (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? SIZE : -SIZE));
    return next >= 0 && next < 64 && adjacent(start.index, next) ? next : null;
  }
  function clearDrag() {
    if (!pointerStart) return;
    const start = pointerStart;
    pointerStart = null;
    start.ghost?.remove();
    cells.forEach(cell => {
      cell.classList.remove('dragging', 'drop-target');
      cell.firstElementChild.style.transform = '';
    });
    if (cells[start.index].hasPointerCapture(start.id)) cells[start.index].releasePointerCapture(start.id);
  }
  boardElement.addEventListener('pointerdown', event => {
    const cell = event.target.closest('.cell');
    if (!cell || busy || ended || pointerStart || !event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    pointerStart = { index: Number(cell.dataset.index), x: event.clientX, y: event.clientY, id: event.pointerId, dragged: false, dx: 0, dy: 0 };
    cell.setPointerCapture(event.pointerId);
  });
  boardElement.addEventListener('pointermove', event => {
    const start = pointerStart;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.dragged && Math.hypot(dx, dy) < 7) return;
    if (!start.dragged) {
      start.dragged = true;
      clearHint(); selected = null; render();
      const rect = cells[start.index].getBoundingClientRect();
      const svgRect = cells[start.index].firstElementChild.getBoundingClientRect();
      start.step = cells[1].getBoundingClientRect().x - cells[0].getBoundingClientRect().x;
      start.threshold = Math.max(12, rect.width * .24);
      start.ghost = document.createElement('div');
      start.ghost.className = 'drag-ghost';
      start.ghost.setAttribute('aria-hidden', 'true');
      // Prefix gradient IDs so the floating copy remains a valid SVG.
      start.ghost.innerHTML = cells[start.index].innerHTML.replaceAll(`-${start.index}`, `-drag-${start.index}`);
      Object.assign(start.ghost.style, { left: `${svgRect.x}px`, top: `${svgRect.y}px`, width: `${svgRect.width}px`, height: `${svgRect.height}px`, '--gem-color': colors[board[start.index]][1] });
      document.body.append(start.ghost);
      cells[start.index].classList.add('dragging');
    }
    const next = dragDestination(start, dx, dy);
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const distance = Math.min(Math.max(Math.abs(dx), Math.abs(dy)), start.step) * (next === null ? .2 : 1);
    start.dx = horizontal ? Math.sign(dx) * distance : 0;
    start.dy = horizontal ? 0 : Math.sign(dy) * distance;
    start.ghost.style.transform = `translate(${start.dx}px, ${start.dy}px) scale(1.12)`;
    cells.forEach(cell => { cell.classList.remove('drop-target'); cell.firstElementChild.style.transform = ''; });
    if (next !== null) {
      cells[next].classList.add('drop-target');
      cells[next].firstElementChild.style.transform = `translate(${-start.dx * .45}px,${-start.dy * .45}px)`;
    }
    event.preventDefault();
  });
  boardElement.addEventListener('pointerup', event => {
    const start = pointerStart;
    if (!start || event.pointerId !== start.id) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    const next = dragDestination(start, dx, dy);
    const commit = start.dragged && Math.max(Math.abs(dx), Math.abs(dy)) >= start.threshold && next !== null;
    suppressClick = start.dragged;
    const offset = { dx: start.dx, dy: start.dy };
    clearDrag();
    if (commit) { focusCell(next); swap(start.index, next, offset); }
  });
  boardElement.addEventListener('pointercancel', () => { suppressClick = true; clearDrag(); });
  boardElement.addEventListener('lostpointercapture', clearDrag);
  window.addEventListener('blur', clearDrag);
  boardElement.addEventListener('keydown', event => {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    const i = Number(cell.dataset.index);
    const next = { ArrowLeft: i % SIZE ? i - 1 : i, ArrowRight: i % SIZE < 7 ? i + 1 : i, ArrowUp: i >= SIZE ? i - SIZE : i, ArrowDown: i < 56 ? i + SIZE : i }[event.key];
    if (next !== undefined) { event.preventDefault(); focusCell(next); }
    if (event.key === 'Escape') clearDrag();
    if (event.key === 'Escape' && !busy) { selected = null; render(); }
  });
  hintButton.addEventListener('click', () => {
    if (busy || ended || pointerStart?.dragged) return;
    clearHint(); selected = null; render();
    const suggestion = move(board);
    if (suggestion) {
      suggestion.forEach(i => cells[i].classList.add('hint'));
      setStatus('hintStatus');
      hintTimer = setTimeout(clearHint, 4000);
    }
  });
  function endGame() {
    if (ended) return;
    ended = true; clearDrag(); clearHint(); selected = null; render(); lock(false);
    setStatus('gameOverStatus', { points: score });
    MinesLeaderboard.open(score, runId, true);
  }
  function newGame() {
    ended = false;
    runId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    clearDrag(); clearHint(); selected = null; score = 0; board = create(); render(); updateScore();
    setStatus('initialStatus');
    lock(false);
  }
  restartButton.addEventListener('click', () => {
    if (ended || !score) newGame();
    else { dialog.returnValue = 'cancel'; dialog.showModal(); }
  });
  dialog.addEventListener('close', () => { if (dialog.returnValue === 'restart') endGame(); });
  finishButton.addEventListener('click', () => { if (!busy) endGame(); });
  document.addEventListener('leaderboard-new-game', newGame);
  leaderboardButton.addEventListener('click', () => {
    if (busy) return;
    clearDrag();
    MinesLeaderboard.open(score, runId, ended);
  });
  document.querySelector('#sound').addEventListener('click', () => {
    soundRequest++;
    soundEnabled = !soundEnabled;
    updateSoundLabel();
    if (soundEnabled) tone(); else silenceEffects();
  });
  document.addEventListener('languagechange', () => {
    clearDrag();
    updateCellLabels();
    updateScore();
    updateSoundLabel();
    setStatus(status.dataset.statusKey || 'initialStatus', JSON.parse(status.dataset.statusParams || '{}'));
  });
  newGame();
  updateSoundLabel();
})();
