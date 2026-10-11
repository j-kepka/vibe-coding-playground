/* Browser-executed physics scenarios. Setups isolate hazards; no game assets change. */
(() => {
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const fixture = (level = 0) => { const s = MossEngine.createState(level); s.mode = 'playing'; return s; };
  const tick = (s, input = {}, count = 1) => {
    for (let i = 0; i < count; i++) MossEngine.step(s, 1 / 120, input);
  };
  const test = (name, run) => { const detail = run(); results.push({ name, detail }); };

  test('Ground landing and solid-log side collision', () => {
    const s = fixture(); s.player.x = 500;
    tick(s, { right: true }, 160);
    assert(s.player.x <= 530.001 && s.player.grounded && s.player.y === 480,
      'The player must stop at the solid log rather than penetrate it');
    return { x: s.player.x, y: s.player.y };
  });

  test('Holding jump produces a higher arc than releasing it', () => {
    const arc = held => {
      const s = fixture(); let highest = s.player.y;
      for (let i = 0; i < 120; i++) {
        tick(s, { jumpPressed: i === 0, jumpHeld: held || i === 0 });
        highest = Math.min(highest, s.player.y);
      }
      assert(s.player.grounded && s.player.y === 480, 'Jump must land on the forest floor');
      return 480 - highest;
    };
    const full = arc(true), short = arc(false);
    assert(full > 100 && short < 55 && full > short + 60, 'Variable jump height must be substantial');
    return { fullHeight: full, shortHeight: short };
  });

  test('One-way mushroom allows ascent and supports the landing', () => {
    const s = fixture(); s.player.x = 860; let highest = 480;
    for (let i = 0; i < 120; i++) {
      tick(s, { jumpPressed: i === 0, jumpHeld: true });
      highest = Math.min(highest, s.player.y);
    }
    assert(highest < 377 && s.player.grounded && s.player.y === 377,
      'Jump must pass up through the mushroom and land on its top');
    return { highest, landedY: s.player.y };
  });

  test('A jump shortly after leaving an edge still works', () => {
    const s = fixture(); Object.assign(s.player, { x: 1038, vx: 310 });
    tick(s, { right: true });
    assert(!s.player.grounded, 'Setup must leave the floor');
    tick(s, { right: true, jumpPressed: true, jumpHeld: true });
    assert(s.player.vy < -600, 'Coyote time must allow the edge jump');
    return { upwardSpeed: s.player.vy };
  });

  test('A jump pressed just before landing is buffered', () => {
    const s = fixture();
    Object.assign(s.player, { y: 445, vy: 250, grounded: false, coyote: 0 });
    tick(s, { jumpPressed: true, jumpHeld: true });
    tick(s, { jumpHeld: true }, 15);
    assert(s.events.includes('jump') && s.player.vy < 0, 'Buffered input must jump after the landing');
    return { upwardSpeed: s.player.vy };
  });

  test('A wand spell defeats a thorn creature', () => {
    const s = fixture(); s.player.x = 700;
    tick(s, { castPressed: true });
    tick(s, {}, 30);
    assert(!s.enemies[0].alive && s.health === 3, 'Spell must defeat the creature without contact damage');
    return { enemyAlive: s.enemies[0].alive, health: s.health };
  });

  test('Landing on a creature defeats it and bounces the wizard', () => {
    const s = fixture();
    Object.assign(s.player, { x: 754, y: 430, vy: 280, grounded: false, coyote: 0 });
    tick(s, { jumpHeld: true }, 8);
    assert(!s.enemies[0].alive && s.player.vy < 0 && s.health === 3,
      'Stomp must defeat the creature and bounce without losing a heart');
    return { upwardSpeed: s.player.vy, health: s.health };
  });

  test('Side contact loses one heart and grants temporary protection', () => {
    const s = fixture(); s.player.x = 746;
    tick(s); tick(s, {}, 10);
    assert(s.health === 2 && s.player.invulnerable > 0 && s.enemies[0].alive,
      'One contact should remove one heart and avoid repeated immediate damage');
    return { health: s.health, protectionSeconds: s.player.invulnerable };
  });

  test('Falling loses a heart and returns to the start', () => {
    const s = fixture();
    Object.assign(s.player, { x: 1100, y: 640, vy: 400, grounded: false, coyote: 0 });
    tick(s, {}, 35);
    assert(s.health === 2 && s.deaths === 1 && s.player.x === s.spawn.x && s.player.grounded,
      'A fall should return to the saved position');
    return { health: s.health, deaths: s.deaths, respawnX: s.player.x };
  });

  test('A lantern restores hearts and saves the fall respawn', () => {
    const s = fixture(); s.health = 1; s.player.x = s.checkpoints[0].x;
    tick(s);
    assert(s.checkpointIndex === 0 && s.health === 3, 'Lantern must activate and restore hearts');
    Object.assign(s.player, { x: 2340, y: 740, vy: 400, grounded: false });
    tick(s);
    assert(s.health === 2 && s.player.x === s.spawn.x && s.player.x === 1973,
      'A later fall must return to the activated lantern');
    return { checkpoint: s.checkpointIndex, respawnX: s.player.x, health: s.health };
  });

  test('Three falls end the run', () => {
    const s = fixture();
    for (let i = 0; i < 3; i++) {
      Object.assign(s.player, { x: 1100, y: 740, vy: 400, grounded: false }); tick(s);
    }
    assert(s.mode === 'lost' && s.health === 0, 'The third lost heart must end the run');
    return { mode: s.mode, health: s.health };
  });

  test('Ready, paused, won and lost states freeze the simulation', () => {
    for (const mode of ['ready', 'paused', 'won', 'lost']) {
      const s = fixture(); s.mode = mode;
      tick(s, { right: true, jumpPressed: true, castPressed: true }, 120);
      assert(s.player.x === 110 && s.time === 0 && s.spells.length === 0,
        `${mode} must freeze movement, time and casting`);
    }
    return { modes: ['ready', 'paused', 'won', 'lost'] };
  });

  test('Fatal contact near a lantern cannot restore a finished run', () => {
    const s = fixture(); s.health = 1;
    s.player.x = 3690; s.enemies[4].x = 3690;
    tick(s);
    assert(s.mode === 'lost' && s.health === 0 && s.checkpointIndex === -1,
      'Fatal contact must stop simulation before the nearby lantern restores hearts');
    return { mode: s.mode, health: s.health, checkpoint: s.checkpointIndex };
  });

  test('Backtracking cannot replace a later saved lantern', () => {
    const s = fixture(); s.player.x = s.checkpoints[1].x; tick(s);
    const laterSpawn = s.spawn.x;
    s.player.x = s.checkpoints[0].x; tick(s);
    assert(s.checkpointIndex === 1 && s.spawn.x === laterSpawn,
      'The furthest activated lantern must remain the respawn point');
    return { checkpoint: s.checkpointIndex, respawnX: s.spawn.x };
  });

  test('Complete original forest route using movement, jumps and spells', () => {
    const s = fixture(); let jumps = 0;
    for (let i = 0; i < 12000 && s.mode === 'playing' && s.levelIndex === 0; i++) {
      const p = s.player;
      const support = s.platforms.find(q => p.x + p.w > q.x + 1 &&
        p.x < q.x + q.w - 1 && Math.abs(p.y + p.h - q.y) < 3);
      const wall = s.platforms.some(q => !q.oneWay && q.y < p.y + p.h - 3 &&
        q.x > p.x + p.w && q.x - p.x - p.w < 80);
      const edge = support && support.x + support.w - p.x - p.w < 68;
      const jump = p.grounded && (wall || edge);
      tick(s, { right: true, jumpPressed: jump, jumpHeld: true, castPressed: i % 36 === 0 });
      if (jump) jumps++;
    }
    assert(s.mode === 'transition' && s.transition.nextLevel === 1 && s.deaths === 0 && s.checkpointIndex === 1 && s.health === 3,
      'The unmodified level must be traversable from start to gate without teleporting or dying');
    assert(s.checkpoints.every(c => c.active) && s.collected > 0,
      'The route must activate both lanterns and collect optional fireflies');
    return { mode: s.mode, seconds: s.time, health: s.health, deaths: s.deaths,
      collected: s.collected, total: s.fireflies.length, checkpoints: s.checkpoints.filter(c => c.active).length, jumps };
  });

  test('Four distinct campaign stages use forest, dusk, sky and return themes', () => {
    const stages = [0, 1, 2, 3].map(level => {
      const s = fixture(level);
      assert(s.levelIndex === level && s.levelCount === 4 && s.worldWidth > MossEngine.WIDTH,
        'Every stage must load its own world with the campaign index');
      assert(s.platforms.length > 8 && s.fireflies.length > 0 && s.enemies.length > 0,
        'Each stage needs platforms, optional collectibles and enemies');
      return { level: level + 1, theme: s.theme, platforms: s.platforms.length, enemies: s.enemies.length };
    });
    assert(stages.map(s => s.theme).join(',') === 'forest,dusk,sky,return', 'Campaign theme order must match the story');
    assert(fixture(2).enemies.every(enemy => enemy.kind === 'phoenix'), 'Cloud enemies must be miniature phoenixes');
    assert(fixture(3).boss.health === 10, 'Final stage must begin with a ten-hit boss');
    return stages;
  });

  test('Walking, launch and falling transitions advance automatically and preserve the run', () => {
    const transitions = [];
    const s = fixture(); s.collected = 7; s.score = 70;
    for (let level = 0; level < 3; level++) {
      if (level === 2) s.boots.owned = true;
      Object.assign(s.player, { x: s.goal.x + 35, y: s.goal.y + s.goal.h - s.player.h, vx: 0, vy: 0, grounded: true });
      tick(s);
      const kind = ['walk', 'launch', 'fall'][level];
      assert(s.mode === 'transition' && s.transition.kind === kind && s.transition.nextLevel === level + 1,
        `Stage ${level + 1} must trigger the ${kind} story event`);
      const carriedItems = s.collected, carriedScore = s.score;
      const initialY = s.player.y;
      tick(s, {}, 45);
      if (kind === 'launch') assert(s.player.y < initialY - 40, 'The launching event must visibly lift the wizard');
      if (kind === 'fall') assert(s.player.y > initialY + 40, 'The returning event must visibly drop the wizard');
      tick(s, {}, 600);
      assert(s.levelIndex === level + 1 && s.mode === 'playing', 'The next chapter must start without a button click');
      assert(s.collected === carriedItems && s.score === carriedScore, 'Story transitions must retain collected points');
      transitions.push({ kind, nextLevel: s.levelIndex + 1 });
    }
    assert(s.boots.owned, 'Boot ownership must travel back from the clouds');
    return transitions;
  });

  test('Finding jet boots unlocks manual activation without starting the timer', () => {
    const s = fixture(2);
    assert(!s.boots.owned && s.artifact && !s.artifact.collected, 'Boots must be a discoverable sky artifact');
    tick(s, { bootsPressed: true });
    assert(s.boots.active === 0, 'Boot activation must fail before finding the artifact');
    Object.assign(s.player, { x: s.artifact.x, y: s.artifact.y, grounded: false, vy: 0 });
    tick(s);
    assert(s.artifact.collected && s.boots.owned && s.boots.active === 0 && s.boots.cooldown === 0,
      'Collecting the boots must leave them ready for a later key press');
    tick(s, { bootsPressed: true });
    assert(s.boots.active > 29.9 && s.boots.active <= 30, 'Manual activation must start a thirty-second timer');
    return { owned: s.boots.owned, activeSeconds: s.boots.active };
  });

  test('Jet boots give approximately three times the normal held jump height', () => {
    const arc = boosted => {
      const s = fixture(); s.boots.owned = boosted;
      if (boosted) tick(s, { bootsPressed: true });
      const floor = s.player.y; let highest = floor;
      for (let i = 0; i < 300; i++) {
        tick(s, { jumpPressed: i === 0, jumpHeld: true });
        highest = Math.min(highest, s.player.y);
      }
      assert(s.player.grounded && s.player.y === floor, 'Both arcs must return to the starting floor');
      return floor - highest;
    };
    const normal = arc(false), boosted = arc(true);
    assert(boosted > normal * 2.8 && boosted < normal * 3.2, 'Boots must multiply height, rather than only speed');
    return { normalHeight: normal, boostedHeight: boosted, ratio: boosted / normal };
  });

  test('Boot duration, reactivation lock, cooldown and pause follow simulation time', () => {
    const s = fixture(); s.boots.owned = true;
    tick(s, { bootsPressed: true }); tick(s, {}, 1200);
    const remaining = s.boots.active;
    tick(s, { bootsPressed: true });
    assert(s.boots.active < remaining && s.boots.active > remaining - .02, 'A second activation must not extend an active boost');
    s.mode = 'paused'; const frozen = JSON.stringify(s.boots), time = s.time;
    tick(s, { bootsPressed: true }, 5000);
    assert(JSON.stringify(s.boots) === frozen && s.time === time, 'Pause must freeze boost and cooldown clocks');
    s.mode = 'playing'; tick(s, {}, 2400);
    assert(s.boots.active === 0 && s.boots.cooldown > 14.9 && s.boots.cooldown <= 15, 'Boost expiration must start a fifteen-second cooldown');
    tick(s, { bootsPressed: true });
    assert(s.boots.active === 0, 'Cooldown must block immediate reuse');
    tick(s, {}, 1800); tick(s, { bootsPressed: true });
    assert(s.boots.active > 29.9 && s.boots.cooldown === 0, 'Boots must become usable after the cooldown');
    return { durationSeconds: s.boots.duration, cooldownSeconds: s.boots.cooldownDuration, afterReuse: s.boots.active };
  });

  test('The pre-boss lantern, respawn and chapter retry restore usable boots', () => {
    const s = fixture(3); s.boots.owned = true; s.boots.active = 4; s.boots.cooldown = 9; s.health = 1;
    const lantern = s.checkpoints.at(-1);
    s.player.x = lantern.x; tick(s);
    assert(s.checkpointIndex === s.checkpoints.length - 1 && s.health === 3 && s.boots.active > 3.9 && s.boots.cooldown === 0,
      'The last lantern must refill hearts, preserve an active boost and clear boot cooldown');
    s.boots.active = 7;
    Object.assign(s.player, { x: 2000, y: 740, vy: 400, grounded: false }); tick(s);
    assert(s.player.x === s.spawn.x && s.boots.owned && s.boots.active === 0 && s.boots.cooldown === 0,
      'Checkpoint respawn must not leave the player waiting through a boot cooldown');
    s.boss.health = 2; s.mode = 'lost'; s.health = 0; s.boots.cooldown = 15;
    MossEngine.retryLevel(s);
    assert(s.levelIndex === 3 && s.health === 3 && s.boss.health === 10 && s.boots.owned && s.boots.cooldown === 0,
      'Retrying the final chapter must reset the fight and retain the acquired artifact');
    return { level: s.levelIndex + 1, bossHealth: s.boss.health, bootsReady: s.boots.owned && s.boots.cooldown === 0 };
  });

  test('Spell cooldown limits held casting and repeated key presses', () => {
    const casts = ['castPressed', 'castHeld'].map(action => {
      const s = fixture(), times = [];
      for (let frame = 0; frame < 360; frame++) {
        const before = s.events.length;
        tick(s, { [action]: true });
        if (s.events.slice(before).includes('spell')) times.push(s.time);
        if (frame === 119) assert(times.length === 1, 'One second of continuous input must produce only one spell');
      }
      assert(times.length === 3 && s.player.castCooldown >= 0,
        'Three seconds of held or repeatedly pressed input must produce three spells');
      assert(times.slice(1).every((time, i) => Math.abs(time - times[i] - 1) < 1e-8),
        'Both input paths must enforce exactly one second between spells');
      return { action, count: times.length, times };
    });
    return { casts, cooldownSeconds: MossEngine.CAST_COOLDOWN };
  });

  test('A rocket jump past the cloud exit still starts the descent when landing', () => {
    const s = fixture(2); s.boots.owned = true;
    Object.assign(s.player, { x: s.worldWidth - s.player.w, y: 479, vy: 300, grounded: false });
    tick(s);
    assert(s.mode === 'transition' && s.transition.kind === 'fall' && s.transition.nextLevel === 3,
      'Landing beyond the exit after a boosted jump must never strand the wizard at the world edge');
    return { x: s.player.x, transition: s.transition.kind };
  });

  test('The raid boss survives nine real projectile hits and animates before victory on the tenth', () => {
    const s = fixture(3), boss = s.boss;
    s.enemies.forEach(enemy => { enemy.alive = false; });
    boss.active = true; boss.phase = 'recover'; boss.phaseTime = 100;
    Object.assign(s.player, { x: boss.x - 180, y: 480, facing: 1, invulnerable: 100 });
    let projectiles = 0;
    for (let hit = 1; hit <= 10; hit++) {
      tick(s, { castPressed: true }); projectiles++;
      for (let frame = 0; frame < 100 && boss.health > 10 - hit; frame++) tick(s);
      assert(boss.health === 10 - hit, `Projectile ${hit} must remove exactly one boss hit point`);
      assert(hit === 10 ? s.mode === 'bossDefeat' && boss.phase === 'kneel' : s.mode === 'playing',
        'The tenth accepted spell must start the kneeling animation before victory');
      if (hit < 10) tick(s, {}, 120);
    }
    assert(s.score === 0 && !s.completedLevels.includes(3) && !s.events.includes('win'),
      'The ending and reward must wait until the death animation finishes');
    tick(s, {}, 263);
    assert(s.mode === 'bossDefeat' && boss.phase === 'defeated', 'The fallen boss must remain visible before the ending');
    tick(s);
    assert(s.mode === 'won' && boss.defeatTime === MossEngine.BOSS_DEFEAT_DURATION && s.score === 500,
      'The animation must finish after 2.2 seconds and award the boss reward');
    assert(s.events.filter(event => event === 'win').length === 1, 'Boss defeat must trigger the ending once');
    return { projectiles, finalHealth: boss.health, mode: s.mode };
  });

  test('Boss charges have a warning and recovery, and boosted jumps clear its full body', () => {
    const s = fixture(3), boss = s.boss; s.boots.owned = true;
    s.enemies.forEach(enemy => { enemy.alive = false; });
    Object.assign(s.player, { x: 4255, y: 480, grounded: true });
    tick(s, { bootsPressed: true });
    assert(boss.active && boss.phase === 'telegraph', 'Entering the arena must first warn of a charge');
    const phaseStart = s.time, warningX = boss.x;
    while (boss.phase === 'telegraph' && s.time - phaseStart < 2) tick(s);
    const warningSeconds = s.time - phaseStart;
    assert(boss.phase === 'charge' && warningSeconds >= .6 && Math.abs(boss.x - warningX) < 10,
      'Warning must last long enough to react before the boss moves');
    Object.assign(s.player, { x: boss.x - 150, vx: 0, y: 480, vy: 0, grounded: true, coyote: .11 });
    let crossed = false, cleared = false;
    for (let i = 0; i < 210; i++) {
      tick(s, { right: true, jumpPressed: i === 0, jumpHeld: true });
      if (s.player.x + s.player.w > boss.x && s.player.x < boss.x + boss.w && s.player.y + s.player.h < boss.y) cleared = true;
      if (s.player.x > boss.x + boss.w) crossed = true;
    }
    assert(cleared && crossed && s.health === 3, 'The boosted jump must carry the wizard over the charging boss');
    assert(boss.phase === 'recover' || boss.phase === 'telegraph', 'The charge must enter a predictable pause before the next attack');
    return { warningSeconds, cleared, crossed, phase: boss.phase };
  });
  return results;
})()
