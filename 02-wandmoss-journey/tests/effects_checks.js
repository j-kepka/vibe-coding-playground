/* Physical sound-event regressions. Fixtures use the real rules and layouts. */
(() => {
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const fixture = (level = 0) => {
    const s = MossEngine.createState(level); s.mode = 'playing'; return s;
  };
  const tick = (s, input = {}, count = 1, dt = 1 / 120) => {
    for (let i = 0; i < count; i++) MossEngine.step(s, dt, input);
  };
  const count = (s, name) => s.events.filter(event => event === name).length;
  const test = (name, run) => results.push({ name, detail: run() });

  test('Footsteps follow grounded distance at both 120 and 60 simulation ticks per second', () => {
    const walks = [120, 60].map(rate => {
      const s = fixture(); tick(s, { right: true }, rate, 1 / rate);
      const distance = s.player.x - 110, steps = count(s, 'step');
      assert(distance > 275 && distance < 300 && s.player.grounded,
        'The fixture must walk on the original clear forest floor');
      assert(steps === 4, 'One second of actual grounded walking must yield four spaced steps');
      return { ticksPerSecond: rate, distance, steps };
    });
    return walks;
  });

  test('Idle, solid wall contact and airborne movement produce no footsteps', () => {
    const idle = fixture(); tick(idle, {}, 120);
    const wall = fixture(); wall.player.x = 530; tick(wall, { right: true }, 240);
    const air = fixture();
    tick(air, { right: true, jumpPressed: true, jumpHeld: true });
    tick(air, { right: true, jumpHeld: true }, 45);
    assert(!air.player.grounded && air.player.x > 160, 'Airborne fixture must move horizontally');
    assert(wall.player.x === 530 && wall.player.grounded, 'Wall fixture must remain against the original log');
    assert([idle, wall, air].every(s => count(s, 'step') === 0),
      'Time, attempted walking and airborne travel must not create steps');
    return { idleSteps: count(idle, 'step'), wallSteps: count(wall, 'step'), airSteps: count(air, 'step') };
  });

  test('Fall respawn and chapter/boss retry discard accumulated footstep distance', () => {
    const s = fixture(); tick(s, { right: true }, 27);
    assert(count(s, 'step') === 0, 'The short walk must stop before its first step');
    Object.assign(s.player, { x: 1100, y: 740, vx: 310, vy: 400, grounded: false, coyote: 0 });
    tick(s, { right: true });
    assert(s.events.includes('respawn') && s.player.x === s.spawn.x && count(s, 'step') === 0,
      'Respawn displacement must not make a step');
    s.events.length = 0; tick(s, { right: true }, 5);
    assert(count(s, 'step') === 0, 'Respawn must clear the earlier near-step distance');
    MossEngine.retryLevel(s); tick(s, { right: true }, 5);
    assert(count(s, 'step') === 0 && s.events.includes('retry'), 'Chapter retry must also reset step distance');
    const boss = fixture(3); boss.player.x = boss.checkpoints.at(-1).x;
    tick(boss); tick(boss, { right: true }, 15); MossEngine.retryBoss(boss);
    tick(boss, { right: true }, 5);
    assert(count(boss, 'step') === 0 && boss.events.includes('bossRetry'), 'Boss retry must start with fresh step distance');
    return { respawnX: s.spawn.x, chapterSteps: count(s, 'step'), bossRetrySteps: count(boss, 'step') };
  });

  test('Ordinary, owned inactive and expired boots use the ordinary jump; active boots use rocketJump once', () => {
    const variants = ['ordinary', 'owned', 'boosted', 'expired'].map(kind => {
      const s = fixture();
      s.boots.owned = kind !== 'ordinary';
      if (kind === 'boosted') tick(s, { bootsPressed: true });
      if (kind === 'expired') s.boots.active = .001;
      s.events.length = 0;
      tick(s, { jumpPressed: true, jumpHeld: true });
      tick(s, { jumpPressed: true, jumpHeld: true }, 20);
      const rocket = kind === 'boosted';
      assert(count(s, rocket ? 'rocketJump' : 'jump') === 1 && count(s, rocket ? 'jump' : 'rocketJump') === 0,
        `${kind}: the accepted takeoff must select exactly one jump sound`);
      return { kind, jumpEvents: s.events.filter(event => ['jump', 'rocketJump'].includes(event)) };
    });
    return variants;
  });

  test('Enemy contact emits one distinct cue only when damage is accepted', () => {
    const s = fixture(), enemy = s.enemies[0];
    s.enemies.slice(1).forEach(e => { e.alive = false; }); enemy.vx = 0;
    Object.assign(s.player, { x: enemy.x - 20, y: 480 }); tick(s);
    assert(s.health === 2 && count(s, 'enemyContact') === 1 && count(s, 'hurt') === 1,
      'Accepted enemy side contact must identify its source');
    for (let i = 0; i < 20; i++) {
      Object.assign(s.player, { x: enemy.x - 20, y: 480, vy: 0 }); tick(s);
    }
    assert(s.health === 2 && count(s, 'enemyContact') === 1,
      'Overlapping an enemy during invulnerability must not replay the injury cue');
    s.player.invulnerable = 0;
    Object.assign(s.player, { x: enemy.x - 20, y: 480, vy: 0 }); tick(s);
    assert(s.health === 1 && count(s, 'enemyContact') === 2 && count(s, 'hurt') === 2,
      'The next accepted injury must have its own cue');
    return { hearts: s.health, contacts: count(s, 'enemyContact'), genericDamageEvents: count(s, 'hurt') };
  });

  test('Stomping and projectile kills retain their existing enemy cue without a damage-contact cue', () => {
    const stomp = fixture();
    Object.assign(stomp.player, { x: 754, y: 430, vy: 280, grounded: false, coyote: 0 });
    tick(stomp, { jumpHeld: true }, 8);
    const spell = fixture(); spell.player.x = 700;
    tick(spell, { castPressed: true }); tick(spell, {}, 30);
    assert([stomp, spell].every(s => !s.enemies[0].alive && s.health === 3 && count(s, 'enemy') === 1 && count(s, 'enemyContact') === 0),
      'Enemy defeats must remain distinct from harmful physical contact');
    return { stompCue: count(stomp, 'enemy'), spellCue: count(spell, 'enemy') };
  });

  test('Boss contact identifies accepted damage and respects the same invulnerability window', () => {
    const s = fixture(3), b = s.boss;
    s.enemies.forEach(e => { e.alive = false; });
    Object.assign(b, { active: true, phase: 'recover', phaseTime: 100, vx: 0 });
    Object.assign(s.player, { x: b.x - 20, y: 480 }); tick(s);
    for (let i = 0; i < 20; i++) {
      Object.assign(s.player, { x: b.x - 20, y: 480, vy: 0 }); tick(s);
    }
    assert(s.health === 2 && count(s, 'bossContact') === 1 && count(s, 'hurt') === 1 && count(s, 'enemyContact') === 0,
      'Boss contact must have its own once-per-accepted-injury cue');
    return { hearts: s.health, contacts: count(s, 'bossContact'), invulnerable: s.player.invulnerable };
  });

  test('Fatal contact emits a single source cue and a fall never impersonates enemy/boss contact', () => {
    const fatal = fixture(); fatal.health = 1; fatal.player.x = 746; tick(fatal);
    tick(fatal, {}, 120);
    const fall = fixture();
    Object.assign(fall.player, { x: 1100, y: 740, vy: 400, grounded: false }); tick(fall);
    assert(fatal.mode === 'lost' && count(fatal, 'enemyContact') === 1 && count(fatal, 'hurt') === 1,
      'Fatal damage must not duplicate its source cue');
    assert(count(fall, 'hurt') === 1 && count(fall, 'enemyContact') === 0 && count(fall, 'bossContact') === 0,
      'Falls must retain only their generic injury cue');
    return { fatalMode: fatal.mode, fatalContacts: count(fatal, 'enemyContact'), fallContacts: 0 };
  });

  test('Boss charge cue occurs once per actual telegraph-to-charge transition', () => {
    const s = fixture(3), b = s.boss;
    s.enemies.forEach(e => { e.alive = false; });
    Object.assign(s.player, { x: 4380, y: 480, invulnerable: 100 }); tick(s);
    assert(b.active && b.phase === 'telegraph' && count(s, 'bossCharge') === 0,
      'Wake and warning must not start the charge sound');
    let transitions = 0;
    for (let i = 0; i < 1000; i++) {
      const phase = b.phase; tick(s);
      if (phase === 'telegraph' && b.phase === 'charge') transitions++;
    }
    assert(transitions >= 2 && count(s, 'bossCharge') === transitions,
      'Holding a charge phase must not replay its initial cue each physics tick');
    return { actualCharges: transitions, soundEvents: count(s, 'bossCharge') };
  });

  test('Pause, retries and boss defeat never generate new charge or footstep cues', () => {
    const s = fixture(3), b = s.boss;
    s.enemies.forEach(e => { e.alive = false; });
    Object.assign(s.player, { x: 4380, y: 480, invulnerable: 100 });
    Object.assign(b, { active: true, phase: 'telegraph', phaseTime: .001 });
    s.mode = 'paused'; tick(s, { right: true }, 240);
    assert(count(s, 'bossCharge') === 0 && b.phase === 'telegraph', 'Pause must freeze the pending charge');
    MossEngine.retryBoss(s);
    assert(s.events.join(',') === 'bossRetry' && b.phase === 'idle', 'Retry must discard the pending charge');
    Object.assign(s.player, { x: 4600, y: 480, facing: 1, invulnerable: 100 });
    Object.assign(b, { active: true, health: 1, hits: 9, phase: 'recover', phaseTime: 100 });
    s.spells.push({ x: b.x - 5, y: 504, vx: 640, life: .8 }); tick(s);
    assert(s.mode === 'bossDefeat', 'A real tenth projectile must begin defeat');
    tick(s, { right: true, jumpPressed: true, jumpHeld: true }, 300);
    assert(s.mode === 'won' && count(s, 'bossCharge') === 0 && count(s, 'step') === 0,
      'The cinematic and ending must not create movement/attack cues');
    return { mode: s.mode, hits: b.hits, charges: count(s, 'bossCharge'), steps: count(s, 'step') };
  });

  return results;
})()
