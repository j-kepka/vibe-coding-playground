/* Boss regressions, evaluated alongside gameplay_checks.js by the browser.
   Fixtures isolate projectile timing and the cinematic; the input route uses the real arena
   from its final lantern with normal hearts, enemies, boots and input only. */
(() => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const tick = (s, input) => MossEngine.step(s, 1 / 120, input);
  const results = [];

  {
    const s = MossEngine.createState(3); s.mode = 'playing';
    s.boots.owned = false;
    s.player.x = s.checkpoints.at(-1).x;
    tick(s, {});
    assert(s.boots.owned && s.boots.active === 0 && s.events.includes('artifact'),
      'The final lantern must supply manually ready boots if the sky artifact was skipped');
    results.push({ name: 'Final lantern supplies skipped boots before the boss',
      detail: { checkpoint: s.checkpointIndex, bootsOwned: s.boots.owned, active: s.boots.active } });
  }

  {
    const s = MossEngine.createState(3); s.mode = 'playing';
    s.player.x = s.checkpoints.at(-1).x; tick(s, {});
    s.fireflies[0].collected = true; s.enemies[0].alive = false;
    s.collected = 8; s.stageCollected = 2; s.score = 155; s.time = 12;
    s.health = 0; s.mode = 'lost'; s.boots.active = 7; s.boots.cooldown = 15;
    Object.assign(s.boss, { active: true, health: 2, hits: 8, phase: 'charge', vx: 430 });
    s.spells.push({ x: 4700, y: 504, vx: 640, life: .8 });
    MossEngine.retryBoss(s);
    assert(s.mode === 'playing' && s.player.x === 4075 && s.player.y === 480 && s.spawn.x === 4075,
      'Boss retry must start at the last lantern rather than the beginning of the chapter');
    assert(s.health === 3 && s.boss.health === 10 && s.boss.hits === 0 && !s.boss.active,
      'Boss retry must reset hearts and the complete ten-hit fight');
    assert(s.boots.owned && s.boots.active === 0 && s.boots.cooldown === 0 && s.spells.length === 0,
      'Retry must provide manually ready boots and discard prior projectiles');
    assert(s.fireflies[0].collected && !s.enemies[0].alive && s.collected === 8 && s.stageCollected === 2 && s.score === 155 && s.time === 12,
      'Retry must preserve collected points, defeated regular enemies and play time');
    assert(s.checkpointIndex === 1 && s.checkpoints[1].active && s.events.join(',') === 'bossRetry',
      'Retry must retain the pre-boss checkpoint and emit its own feedback');
    results.push({ name: 'Boss retry restores a fresh fight at the last lantern and retains chapter progress',
      detail: { x: s.player.x, health: s.health, bossHealth: s.boss.health,
        score: s.score, collected: s.collected, bootsReady: s.boots.active === 0 && s.boots.cooldown === 0 } });
  }

  {
    const s = MossEngine.createState(3); s.mode = 'playing';
    s.enemies.forEach(enemy => { enemy.alive = false; });
    Object.assign(s.player, { x: 4380, y: 480, invulnerable: 100 });
    Object.assign(s.boss, { active: true, phase: 'recover', phaseTime: 100, vx: 0 });
    s.spells.push({ x: s.boss.x - 40, y: 504, vx: 640, life: .8 },
      { x: s.boss.x - 120, y: 504, vx: 640, life: .8 });
    const hitTimes = [];
    for (let frame = 0; frame < 22; frame++) {
      const before = s.boss.hits;
      tick(s, {});
      if (s.boss.hits > before) hitTimes.push(s.time);
    }
    const shortestGap = Math.min(...hitTimes.slice(1).map((time, i) => time - hitTimes[i]));
    assert(s.boss.hits === 2 && s.boss.health === 8,
      'Two distinct arriving projectiles must both count regardless of the hit flash');
    assert(shortestGap < .22,
      'The regression must exercise arrivals closer together than the visual hit flash');
    results.push({ name: 'Boss hit flash never rejects closely arriving projectiles',
      detail: { projectiles: 2, acceptedHits: s.boss.hits, shortestHitGap: shortestGap } });
  }

  {
    const s = MossEngine.createState(3); s.mode = 'playing';
    const b = s.boss;
    Object.assign(s.player, { x: 4600, y: 480, facing: 1, castCooldown: .3 });
    Object.assign(b, { active: true, health: 1, hits: 9, phase: 'recover', phaseTime: 100 });
    s.score = 155; s.completedLevels = [0, 1, 2]; s.boots.active = 12;
    s.spells.push({ x: b.x - 5, y: 504, vx: 640, life: .8 });
    tick(s, {});
    assert(s.mode === 'bossDefeat' && b.phase === 'kneel' && b.defeatTime === 0 && b.health === 0 && b.hits === 10,
      'The tenth hit must begin kneeling, with its own cinematic clock');
    assert(s.score === 155 && s.completedLevels.length === 3 && !s.events.includes('win') && s.spells.length === 0,
      'Defeat must clear spells while delaying the reward and completion');
    const frozen = { health: s.health, x: s.player.x, bossX: b.x,
      boots: JSON.stringify(s.boots), cast: s.player.castCooldown,
      enemies: s.enemies.map(enemy => enemy.x).join(',') };
    Object.assign(s.player, { y: 300, vy: -200, grounded: false });
    const noise = { right: true, jumpPressed: true, jumpHeld: true, castPressed: true, castHeld: true, bootsPressed: true };
    for (let frame = 0; frame < 84; frame++) tick(s, noise);
    assert(b.phase === 'kneel' && s.mode === 'bossDefeat', 'The first 0.75 seconds must show the kneeling pose');
    assert(s.health === frozen.health && s.player.x === frozen.x && b.x === frozen.bossX && s.player.grounded,
      'The wizard must settle safely while movement and boss attacks remain frozen');
    assert(JSON.stringify(s.boots) === frozen.boots && s.player.castCooldown === frozen.cast &&
      s.enemies.map(enemy => enemy.x).join(',') === frozen.enemies && s.spells.length === 0,
      'The cinematic must ignore casting and boot input, and freeze enemy and skill clocks');
    s.mode = 'paused';
    const paused = JSON.stringify(s);
    for (let frame = 0; frame < 240; frame++) tick(s, noise);
    assert(JSON.stringify(s) === paused, 'Pausing during the cinematic must freeze its clock and every game object');
    s.mode = 'bossDefeat';
    for (let frame = 0; frame < 12; frame++) tick(s, noise);
    assert(b.phase === 'fall' && s.mode === 'bossDefeat', 'The boss must fall forward after kneeling');
    for (let frame = 0; frame < 84; frame++) tick(s, noise);
    assert(b.phase === 'defeated' && s.mode === 'bossDefeat', 'The fallen body must stay visible before victory');
    for (let frame = 0; frame < 83; frame++) tick(s, noise);
    assert(s.mode === 'bossDefeat' && s.score === 155 && !s.events.includes('win'),
      'The victory overlay must wait for the entire 2.2-second animation');
    tick(s, noise);
    assert(s.mode === 'won' && b.defeatTime === 2.2 && s.score === 655 && s.completedLevels.length === 4,
      'Completion must award exactly 500 points after the cinematic');
    for (let frame = 0; frame < 300; frame++) tick(s, noise);
    assert(s.events.filter(event => event === 'win').length === 1 && s.score === 655,
      'Further input must never repeat victory or its reward');
    MossEngine.retryBoss(s);
    assert(s.mode === 'playing' && s.score === 155 && b.defeatTime === 0 && b.phase === 'idle' && b.health === 10,
      'Retrying a completed fight must remove its prior reward and reset its animation');
    results.push({ name: 'Boss kneels, falls and settles before one delayed victory; pause and inputs are safe',
      detail: { durationSeconds: 2.2, phases: ['kneel', 'fall', 'defeated'], reward: 500,
        pauseFreezesAnimation: true, retryScore: s.score } });
  }

  {
    const s = MossEngine.createState(3); s.mode = 'playing'; s.score = 155;
    Object.assign(s.player, { x: 4600, y: 480, facing: 1 });
    Object.assign(s.boss, { active: true, health: 1, hits: 9, phase: 'recover', phaseTime: 100 });
    s.spells.push({ x: s.boss.x - 5, y: 504, vx: 640, life: .8 });
    tick(s, {});
    assert(s.mode === 'bossDefeat', 'Fixture must reach the cinematic through a real projectile');
    MossEngine.retryBoss(s);
    assert(s.mode === 'playing' && s.score === 155 && s.boss.defeatTime === 0 && s.boss.health === 10 &&
      !s.completedLevels.includes(3) && !s.events.includes('win'),
      'Retrying before victory must cancel the animation without subtracting an unawarded reward');
    results.push({ name: 'Retry during the boss cinematic preserves banked points and cancels pending victory',
      detail: { score: s.score, bossHealth: s.boss.health, mode: s.mode } });
  }

  {
    const s = MossEngine.createState(3); s.mode = 'playing';
    s.player.x = s.checkpoints.at(-1).x;
    let jumpDirection = 0, jumps = 0, crossings = 0;
    for (let frame = 0; frame < 15000 && ['playing', 'bossDefeat'].includes(s.mode); frame++) {
      const p = s.player, boss = s.boss;
      const aim = Math.sign(boss.x + boss.w / 2 - p.x - p.w / 2);
      const gap = aim > 0 ? boss.x - p.x - p.w : p.x - boss.x - boss.w;
      let right = !boss.active, left = false, jump = false;
      if (boss.active) {
        if (p.grounded) {
          jumpDirection = 0;
          jump = boss.phase === 'charge' && gap > 0 && gap < 280;
          if (jump) { jumpDirection = aim; jumps++; }
        }
        if (jumpDirection) {
          const passed = jumpDirection > 0 ? p.x > boss.x + boss.w + 55 : p.x + p.w < boss.x - 55;
          if (passed) { jumpDirection = 0; crossings++; }
          else { right = jumpDirection > 0; left = jumpDirection < 0; }
        }
        if (!jumpDirection) {
          right = aim > 0 && p.facing !== aim;
          left = aim < 0 && p.facing !== aim;
        }
      }
      tick(s, { right, left, jumpPressed: jump, jumpHeld: true,
        castHeld: boss.active && p.grounded,
        bootsPressed: p.x > 4100 && s.boots.owned && s.boots.active === 0 && s.boots.cooldown === 0 });
      if (s.boss.hits < 10) assert(s.mode !== 'won', 'Victory must wait for the tenth hit');
    }
    const fired = s.events.filter(event => event === 'spell').length;
    assert(s.mode === 'won' && s.boss.hits === 10 && s.boss.health === 0 && fired >= 10,
      'Jumping over the charge, turning and firing after landing must defeat the boss with ten accepted spells');
    assert(s.health === 3 && jumps > 0 && crossings > 0 && s.deaths === 0,
      'Normal hearts, manual boots and the real arena must permit a clean victory');
    assert(s.boots.active > 0 && s.events.filter(event => event === 'boots').length === 1,
      'The fight must finish inside one manually activated thirty-second boost');
    results.push({ name: 'Jump past the charging boss and shoot after landing with normal gameplay input',
      detail: { seconds: s.time, hearts: s.health, projectiles: fired,
        bossHits: s.boss.hits, jumps, crossings, bootSecondsRemaining: s.boots.active } });
  }
  return results;
})()
