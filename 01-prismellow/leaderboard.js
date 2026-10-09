/* Browser Top 10: works directly from index.html, without a server. */
(() => {
  const { t } = MinesI18n;
  const storageKey = 'diamond-mines-top10';
  const dialog = document.querySelector('#leaderboard-dialog');
  const rows = document.querySelector('#leaderboard-rows');
  const form = document.querySelector('#leaderboard-form');
  const input = document.querySelector('#player-name');
  const feedback = document.querySelector('#leaderboard-feedback');
  const retryButton = document.querySelector('#leaderboard-retry');
  const newGameButton = document.querySelector('#leaderboard-new-game');
  const note = document.querySelector('#leaderboard-note');
  let scores = [], currentScore = 0, currentRun = '', finished = false;
  let persistent = true, failed = false, saved = false, message = '';
  const number = value => value.toLocaleString(MinesI18n.language);
  const cleanName = value => value.normalize('NFC').replace(/\s+/g, ' ').trim();
  const validId = value => typeof value === 'string' && value.trim() && value.length <= 120;
  const qualifies = () => Number.isSafeInteger(currentScore) && currentScore > 0 && validId(currentRun)
    && (scores.length < 10 || currentScore > scores[scores.length - 1].score);
  const sorted = entries => entries.sort((a, b) => b.score - a.score || a.createdAt - b.createdAt);

  function readEntries() {
    if (!persistent) return scores.map(entry => ({ ...entry }));
    let raw;
    try { raw = localStorage.getItem(storageKey); }
    catch { persistent = false; return scores.map(entry => ({ ...entry })); }
    if (raw === null) return [];
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length > 10) throw new Error('Invalid leaderboard');
    const ids = new Set();
    return sorted(entries.map(entry => {
      if (!entry || typeof entry !== 'object' || !validId(entry.id) || ids.has(entry.id)
          || typeof entry.name !== 'string' || !Number.isSafeInteger(entry.score) || entry.score <= 0
          || !Number.isSafeInteger(entry.createdAt) || entry.createdAt < 0) throw new Error('Invalid score');
      const name = cleanName(entry.name);
      if (!name || [...name].length > 24) throw new Error('Invalid name');
      ids.add(entry.id);
      return { id: entry.id, name, score: entry.score, createdAt: entry.createdAt };
    }));
  }

  function render() {
    rows.replaceChildren();
    scores.forEach((entry, i) => {
      const row = document.createElement('tr');
      row.classList.toggle('current-player', entry.id === currentRun);
      for (const value of [number(i + 1), entry.name, number(entry.score)]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      rows.append(row);
    });
    document.querySelector('#leaderboard-empty').hidden = scores.length > 0 || failed;
    const current = document.querySelector('#leaderboard-current');
    current.hidden = !finished;
    current.textContent = t('currentScore', { points: number(currentScore) });
    form.hidden = !finished || failed || saved || !qualifies();
    retryButton.hidden = !failed;
    newGameButton.hidden = !finished;
    note.dataset.i18n = persistent ? 'leaderboardLocalNote' : 'storageUnavailable';
    note.textContent = t(note.dataset.i18n);
    const key = message || (failed ? 'storageReadError' : finished ? saved ? 'scoreAlreadySaved' : currentScore <= 0 ? 'scoreUnavailable' : qualifies() ? 'gameOverQualified' : 'gameOverNotQualified' : '');
    feedback.textContent = key ? t(key) : '';
  }

  function load() {
    failed = false;
    try {
      scores = readEntries();
      saved = scores.some(entry => entry.id === currentRun);
    } catch { failed = true; message = 'storageReadError'; }
    render();
  }

  function open(score, runId, isFinished = false) {
    currentScore = score; currentRun = runId; finished = isFinished;
    saved = false; message = ''; input.value = ''; input.setCustomValidity('');
    const title = document.querySelector('#leaderboard-title');
    title.dataset.i18n = finished ? 'gameOver' : 'leaderboardTitle';
    title.textContent = t(title.dataset.i18n);
    load();
    if (!dialog.open) dialog.showModal();
    if (!form.hidden) input.focus();
  }

  function submit() {
    if (!finished || saved || failed || !qualifies()) return;
    const name = cleanName(input.value);
    if (!name || [...name].length > 24) {
      input.setCustomValidity(t('nameRequired')); input.reportValidity(); return;
    }
    try {
      // Read again so another tab's newer scores participate in qualification.
      scores = readEntries();
      if (scores.some(entry => entry.id === currentRun)) {
        saved = true; message = 'scoreAlreadySaved'; render(); return;
      }
      if (!qualifies()) { message = 'scoreNoLongerQualifies'; render(); return; }
      const next = sorted([...scores, { id: currentRun, name, score: currentScore, createdAt: Date.now() }]).slice(0, 10);
      if (persistent) {
        try { localStorage.setItem(storageKey, JSON.stringify(next)); }
        catch { persistent = false; }
      }
      scores = next; saved = true; message = 'scoreSaved';
    } catch { failed = true; message = 'storageReadError'; }
    render();
  }

  form.addEventListener('submit', event => { event.preventDefault(); submit(); });
  input.addEventListener('input', () => input.setCustomValidity(''));
  document.querySelector('#leaderboard-close').addEventListener('click', () => dialog.close());
  retryButton.addEventListener('click', () => { message = ''; load(); });
  newGameButton.addEventListener('click', () => {
    dialog.close();
    document.dispatchEvent(new CustomEvent('leaderboard-new-game'));
  });
  window.addEventListener('storage', event => {
    if (persistent && dialog.open && (event.key === storageKey || event.key === null)) { message = ''; load(); }
  });
  document.addEventListener('languagechange', () => {
    if (input.validity.customError) input.setCustomValidity(t('nameRequired'));
    render();
  });
  window.MinesLeaderboard = { open, getEntries: () => scores.map(entry => ({ ...entry })) };
  render();
})();
