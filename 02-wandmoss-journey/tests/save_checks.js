/* Browser-executed save fixtures; these isolate persistence and validation rules.
   The separate browser route checks exercise real progress and page reloads. */
(() => {
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const test = (name, run) => {
    if (!window.__wandmossSaveFilter || window.__wandmossSaveFilter === name) results.push({ name, detail: run() });
  };
  const storage = () => {
    const data = new Map();
    return {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: key => data.delete(key)
    };
  };

  test('Chapter autosave banks completed progress and restores a fresh chapter', () => {
    const store = storage(), save = MossSave.create(store);
    const s = MossEngine.createState(2);
    Object.assign(s, { score: 1230, collected: 47, time: 38, deaths: 2,
      completedLevels: [0, 1], stageStart: { score: 1100, collected: 40 } });
    s.health = 1; s.player.x += 250; s.boots.owned = true;
    s.boots.active = 17; s.boots.cooldown = 12;
    const written = save.write(s, 'level');
    assert(written.ok && written.persistent, 'Usable storage must persist the chapter save');
    const fresh = MossSave.create(store), restored = fresh.restore(fresh.read());
    assert(restored.levelIndex === 2 && restored.score === 1100 && restored.collected === 40,
      'A chapter save must bank completed-chapter totals without duplicating the replayed chapter');
    assert(restored.health === 3 && restored.player.x === restored.spawn.x && restored.checkpointIndex === -1,
      'Chapter restoration must begin with fresh hearts and the chapter layout');
    assert(restored.boots.owned && restored.boots.active === 0 && restored.boots.cooldown === 0,
      'The artifact must survive restoration and wait for manual activation');
    assert(restored.time === 38 && restored.deaths === 2 && restored.completedLevels.join(',') === '0,1',
      'Prior play time, falls and completed chapters must survive restoration');
    return { level: restored.levelIndex + 1, score: restored.score, collected: restored.collected,
      hearts: restored.health, bootsReady: restored.boots.owned && restored.boots.cooldown === 0 };
  });

  test('Pre-boss autosave preserves collected rewards and resets the fight', () => {
    const save = MossSave.create(storage()), s = MossEngine.createState(3);
    Object.assign(s, { score: 1730, collected: 52, time: 58, completedLevels: [0, 1, 2],
      stageStart: { score: 1450, collected: 43 }, checkpointIndex: 1 });
    s.fireflies.slice(0, 9).forEach(f => { f.collected = true; });
    s.enemies.slice(0, 3).forEach(e => { e.alive = false; });
    s.boss.health = 2; s.boss.hits = 8; s.boss.active = true;
    s.boots.active = 1; s.boots.cooldown = 15; s.health = 0;
    save.write(s, 'boss');
    const restored = save.restore(save.read());
    assert(restored.levelIndex === 3 && restored.checkpointIndex === restored.checkpoints.length - 1,
      'Pre-boss restoration must return directly to the final lantern');
    assert(restored.player.x === restored.checkpoints.at(-1).x + 25 && restored.health === 3,
      'Restoration must not send the wizard back through earlier obstacles');
    assert(restored.score === 1730 && restored.collected === 52 && restored.stageCollected === 9,
      'Saved chapter collectibles and points must remain consistent');
    assert(restored.fireflies.filter(f => f.collected).length === 9 && restored.enemies.filter(e => !e.alive).length === 3,
      'Replaying the boss must not duplicate saved collectibles or enemy rewards');
    assert(restored.boss.health === 10 && restored.boss.hits === 0 && !restored.boss.active && restored.boots.owned && restored.boots.active === 0 && restored.boots.cooldown === 0,
      'Boss, hearts and manually activated boots must be ready for another attempt');
    return { checkpoint: restored.checkpointIndex + 1, score: restored.score,
      collected: restored.collected, bossHealth: restored.boss.health, spawnX: restored.player.x };
  });

  test('Saving a completed boss fight does not carry its victory reward into a retry', () => {
    const save = MossSave.create(storage()), s = MossEngine.createState(3);
    s.checkpointIndex = 1;
    s.score = 600;
    s.stageStart = { score: 100, collected: 0 };
    s.completedLevels = [0, 1, 2, 3];
    s.boss.health = 0;
    s.mode = 'won';
    const written = save.write(s, 'boss'), restored = save.restore(save.read());
    assert(written.ok && restored.score === 100 && restored.boss.health === 10,
      'A saved completed fight must restore the pre-reward score and a fresh boss');
    assert(!restored.completedLevels.includes(3) && s.score === 600,
      'Restoration must omit the final completion without changing the visible winning score');
    return { winningScore: s.score, resumedScore: restored.score, bossHealth: restored.boss.health };
  });

  test('Normal legacy saves remain compatible while retired testing saves are ignored', () => {
    let accepted = 0, rejected = 0;
    for (const [level, kind] of [[0, 'level'], [1, 'level'], [2, 'level'], [3, 'level'], [3, 'boss']]) {
      const store = storage(), save = MossSave.create(store);
      const current = save.capture(MossEngine.createState(level), kind);
      assert(!('practice' in current), 'New campaign saves must omit the retired testing flag');
      const legacy = { ...current, practice: false };
      store.setItem(MossSave.KEY, JSON.stringify(legacy));
      const restored = save.restore(save.read());
      assert(restored && restored.levelIndex === level && !('practice' in restored),
        'Normal v1 saves must preserve their chapter without restoring a practice mode');
      if (kind === 'boss') assert(restored.checkpointIndex === 1 && restored.boss.health === 10,
        'A normal legacy pre-boss save must retain its earned continuation');
      accepted++;

      const obsolete = { ...current, practice: true }, raw = JSON.stringify(obsolete);
      store.setItem(MossSave.KEY, raw);
      const fresh = MossSave.create(store);
      assert(fresh.read() === null && fresh.restore(obsolete) === null,
        'Retired testing saves must not offer a continuation shortcut');
      assert(store.getItem(MossSave.KEY) === raw,
        'Ignoring an obsolete save must not delete storage');
      assert(!fresh.validate({ ...current, practice: 'false' }) &&
        !fresh.validate({ ...current, practice: null }), 'Malformed legacy flags must remain invalid');
      rejected++;
    }
    return { normalContinuationPointsAccepted: accepted, testingSnapshotsIgnored: rejected,
      storagePreserved: true };
  });

  test('Corrupt or unsupported saves are rejected without stopping the game', () => {
    const store = storage(), save = MossSave.create(store);
    const valid = save.capture(MossEngine.createState(1), 'level');
    for (const value of ['{broken', 'null', JSON.stringify({ ...valid, version: 999 }),
      JSON.stringify({ ...valid, levelIndex: 4 }), JSON.stringify({ ...valid, score: -20 }),
      JSON.stringify({ ...valid, time: null })]) {
      store.setItem(MossSave.KEY, value);
      assert(save.read() === null, 'Malformed or incompatible save data must be ignored');
    }
    assert(save.restore({ version: 999 }) === null, 'Restoring unsupported data must fail safely');
    const boss = save.capture(MossEngine.createState(3), 'boss');
    assert(!save.validate({ ...boss, fireflies: boss.fireflies.slice(1) }) &&
      !save.validate({ ...boss, enemies: boss.enemies.map(() => 'alive') }) &&
      !save.validate({ ...boss, collected: boss.collected + 1 }),
      'Pre-boss flag arrays and collectible totals must agree with the current layout');
    return { rejectedFixtures: 9 };
  });

  test('Autosave can be disabled while an earlier save remains available', () => {
    const store = storage(), save = MossSave.create(store);
    save.write(MossEngine.createState(1), 'level');
    const saved = store.getItem(MossSave.KEY);
    save.setEnabled(false);
    save.write(MossEngine.createState(2), 'level');
    assert(store.getItem(MossSave.KEY) === saved && save.read().levelIndex === 1,
      'Turning autosave off must preserve the last manual continuation point');
    assert(!MossSave.create(store).getEnabled(), 'The autosave setting must persist across visits');
    save.setEnabled(true);
    save.write(MossEngine.createState(2), 'level');
    assert(save.read().levelIndex === 2, 'Re-enabling autosave must allow the next checkpoint to replace it');
    return { disabledPreservesSave: true, enabledLevel: save.read().levelIndex + 1 };
  });

  test('Blocked browser storage keeps a temporary checkpoint without throwing', () => {
    const blocked = {
      getItem() { throw new DOMException('Blocked', 'SecurityError'); },
      setItem() { throw new DOMException('Blocked', 'SecurityError'); },
      removeItem() { throw new DOMException('Blocked', 'SecurityError'); }
    };
    const save = MossSave.create(blocked), s = MossEngine.createState(3);
    const result = save.write(s, 'level');
    assert(result.ok && !result.persistent && save.status() === 'memory',
      'A blocked browser must preserve an in-memory checkpoint and report its limitation');
    assert(save.restore(save.read()).levelIndex === 3,
      'In-memory continuation must remain usable during this visit');
    save.clear();
    assert(save.read() === null, 'Clearing blocked storage must still clear the in-memory save');
    return { persistent: result.persistent, status: save.status() };
  });

  test('A quota failure keeps the newest temporary checkpoint ahead of a readable older save', () => {
    const store = storage();
    const originalWrite = store.setItem;
    let blocked = false;
    store.setItem = (key, value) => {
      if (blocked) throw new DOMException('Full', 'QuotaExceededError');
      originalWrite(key, value);
    };
    const save = MossSave.create(store);
    save.write(MossEngine.createState(1), 'level');
    const oldRaw = store.getItem(MossSave.KEY);
    blocked = true;
    const latest = save.write(MossEngine.createState(3), 'level');
    assert(latest.ok && !latest.persistent && save.status() === 'memory',
      'A failed write must retain the newer checkpoint in memory');
    assert(store.getItem(MossSave.KEY) === oldRaw && JSON.parse(oldRaw).levelIndex === 1,
      'The regression must leave an older valid persistent record readable');
    assert(save.read().levelIndex === 3 && save.restore(save.read()).levelIndex === 3,
      'Reading the old persistent data must not overwrite the newer temporary continuation');
    assert(MossSave.create(store).read().levelIndex === 1,
      'Only this visit can access the temporary checkpoint; another visit sees the last persisted one');
    return { temporaryLevel: save.read().levelIndex + 1, persistedLevel: JSON.parse(oldRaw).levelIndex + 1 };
  });

  return results;
})()
