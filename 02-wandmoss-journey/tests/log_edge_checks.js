/* Focused collision fixtures, evaluated by log_edge_check.py in the browser.
 * Real chapter layouts are retained for edge walks; enemies and rewards are
 * removed so damage, checkpoints and transitions cannot hide a collision snap.
 */
(() => {
  'use strict';
  const results = [], dt = 1 / 120, epsilon = 1e-7;
  let scenarios = 0;
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const test = (name, run) => {
    const before = scenarios, detail = run();
    results.push({ name, detail: { scenarios: scenarios - before, ...detail } });
  };
  const fixture = level => {
    const s = MossEngine.createState(level);
    s.mode = 'playing';
    s.enemies = []; s.checkpoints = []; s.fireflies = []; s.boss = null;
    return s;
  };
  const logs = [0, 1, 3].flatMap(level => MossLevels.create(level).platforms
    .filter(p => p.kind === 'log' && !p.oneWay).map(log => ({ level, log })));
  assert(logs.length > 0 && [0, 1, 3].every(level => logs.some(item => item.level === level)),
    'The edge fixtures must include solid logs in forest, dusk and the finale');
  const directions = [-1, 1];
  const inputFor = direction => direction > 0 ? { right: true } : { left: true };
  const edgeX = (log, player, direction, overlap) => direction > 0 ?
    log.x + log.w - overlap : log.x - player.w + overlap;
  const onSpan = (p, q) => p.x + p.w > q.x && p.x < q.x + q.w;
  const place = (s, q, direction, overlap, extra = {}) => Object.assign(s.player, {
    x: edgeX(q, s.player, direction, overlap), y: q.y - s.player.h,
    vx: 0, vy: 0, grounded: true, coyote: .11, ...extra
  });
  const label = (item, direction) => `chapter ${item.level + 1} log ${item.log.x}, ${direction > 0 ? 'right' : 'left'}`;
  const step = (s, input = {}, interval = dt) => MossEngine.step(s, interval, input);
  const safeMove = (s, input, direction, context, interval = dt) => {
    const before = s.player.x;
    step(s, input, interval);
    const traveled = (s.player.x - before) * direction;
    assert(traveled >= -epsilon && traveled <= 310 * interval + epsilon,
      `${context}: discontinuous horizontal movement ${before} -> ${s.player.x}`);
    assert(s.health === 3 && s.deaths === 0 && s.mode === 'playing' &&
      !s.events.some(event => ['hurt', 'respawn', 'lost'].includes(event)),
    `${context}: walking off a log must not lose a heart or respawn`);
  };
  const walkToFloor = (s, item, direction, interval = dt) => {
    const { log } = item, context = label(item, direction);
    let leftLog = false, fell = false;
    for (let frame = 0; frame < Math.ceil(2 / interval); frame++) {
      safeMove(s, inputFor(direction), direction, context, interval);
      const p = s.player;
      if (onSpan(p, log)) {
        assert(p.grounded && p.y === log.y - p.h,
          `${context}: any remaining overlap must support the wizard on the top`);
      } else {
        leftLog = true;
        if (!p.grounded && p.vy > 0) fell = true;
      }
      if (leftLog && p.grounded) {
        assert(fell && p.y === 480 && p.y + p.h === log.y + log.h,
          `${context}: the edge must drop normally onto the chapter floor`);
        return;
      }
    }
    assert(false, `${context}: did not reach the floor after leaving the log`);
  };

  test('The reported final-chapter slow edge walk does not jump back across the log', () => {
    const item = logs.find(item => item.level === 3), s = fixture(item.level);
    place(s, item.log, 1, 1.5, { vx: 50 });
    // Before the fix, these exact two steps moved x=628.5 to 629.0972,
    // then to 480 at the opposite face of the 510..630 final-chapter log.
    for (let frame = 0; frame < 2; frame++) safeMove(s, { right: true }, 1, label(item, 1));
    assert(s.player.grounded && s.player.y + s.player.h === item.log.y,
      'The reported slow edge walk must retain the remaining top support');
    scenarios++;
    return { chapter: 4, log: { x: item.log.x, right: item.log.x + item.log.w }, x: s.player.x };
  });

  test('Every solid log supports fractional overlap at both ends', () => {
    for (const item of logs) for (const direction of directions) for (const overlap of [.125, .9, 1.1]) {
      const s = fixture(item.level), context = `${label(item, direction)}, overlap ${overlap}`;
      place(s, item.log, direction, overlap);
      for (let frame = 0; frame < 20; frame++) {
        safeMove(s, {}, direction, context);
        assert(s.player.grounded && s.player.y + s.player.h === item.log.y,
          `${context}: a stationary foot must not fall through the last pixel of support`);
      }
      scenarios++;
    }
    return { logs: logs.length, chapters: [1, 2, 4], overlaps: [.125, .9, 1.1] };
  });

  test('Slow walks leave every solid log continuously and reach the floor with three hearts', () => {
    for (const item of logs) for (const direction of directions) for (const interval of [dt, 1 / 60]) {
      const s = fixture(item.level);
      place(s, item.log, direction, 1.5, { vx: direction * 50 });
      walkToFloor(s, item, direction, interval);
      scenarios++;
    }
    return { intervals: [dt, 1 / 60], initialSpeed: 50 };
  });

  test('Braking inside the last pixel retains support and can resume walking off', () => {
    for (const item of logs) for (const direction of directions) {
      const s = fixture(item.level), context = label(item, direction);
      place(s, item.log, direction, .9, { vx: direction * 50 });
      for (let frame = 0; frame < 20; frame++) {
        safeMove(s, {}, direction, context);
        assert(s.player.grounded && s.player.y + s.player.h === item.log.y,
          `${context}: releasing movement must not drop or snap the wizard through the log`);
      }
      assert(s.player.vx === 0, `${context}: braking must stop horizontal motion`);
      walkToFloor(s, item, direction);
      scenarios++;
    }
    return { initialOverlap: .9, initialSpeed: 50 };
  });

  test('Airborne feet just below a log top settle without being pushed to the opposite side', () => {
    for (const item of logs) for (const direction of directions) for (const penetration of [.00001, .125]) {
      const s = fixture(item.level), context = `${label(item, direction)}, feet +${penetration}`;
      place(s, item.log, direction, .9, {
        y: item.log.y - s.player.h + penetration, vx: direction * 5,
        grounded: false, coyote: 0
      });
      safeMove(s, inputFor(direction), direction, context);
      assert(s.player.grounded && s.player.y + s.player.h === item.log.y,
        `${context}: a shallow landing must settle on top while overlap remains`);
      walkToFloor(s, item, direction);
      scenarios++;
    }
    return { initialOverlap: .9, initialSpeed: 5, feetBelowTop: [.00001, .125] };
  });

  test('Exact separation at either log end falls instead of acquiring false support', () => {
    for (const item of logs) for (const direction of directions) {
      const s = fixture(item.level), context = label(item, direction);
      place(s, item.log, direction, 0);
      const x = s.player.x;
      step(s);
      assert(!s.player.grounded && s.player.vy > 0 && s.player.y + s.player.h > item.log.y &&
        s.player.x === x && s.health === 3 && s.deaths === 0,
      `${context}: zero overlap must leave support and begin a normal fall`);
      scenarios++;
    }
    return { overlap: 0 };
  });

  test('Solid logs still block entry through both sides and stop upward ceiling bumps', () => {
    for (const item of logs) for (const direction of directions) for (const airborne of [false, true]) {
      const s = fixture(item.level), { log } = item, p = s.player, context = label(item, direction);
      Object.assign(p, {
        x: direction > 0 ? log.x - p.w - .25 : log.x + log.w + .25,
        y: airborne ? log.y - p.h + 5 : 480, vx: direction * 200,
        vy: airborne ? -100 : 0, grounded: !airborne, coyote: 0
      });
      step(s, { ...inputFor(direction), jumpHeld: true });
      assert(p.x === (direction > 0 ? log.x - p.w : log.x + log.w) && p.vx === 0,
        `${context}: entering a solid side must still clamp against that face`);
      assert(s.health === 3 && s.deaths === 0, `${context}: side contact must be harmless`);
      scenarios++;
    }
    for (const item of logs) {
      const s = fixture(item.level), { log } = item, p = s.player;
      // The real logs meet the floor; isolate their geometry to test the solid
      // underside contract without placing the wizard inside that floor.
      s.platforms = [{ ...log }];
      Object.assign(p, { x: log.x + log.w / 2 - p.w / 2, y: log.y + log.h + .25,
        vx: 0, vy: -300, grounded: false, coyote: 0 });
      step(s, { jumpHeld: true });
      assert(p.y === log.y + log.h && p.vy === 0 && !p.grounded,
        `chapter ${item.level + 1} log ${log.x}: the solid underside must stop an upward head bump`);
      scenarios++;
    }
    return { sides: ['left', 'right'], sideStates: ['grounded', 'ascending'], underside: 'isolated solid log geometry' };
  });

  const oneWays = ['mushroom', 'stone', 'log', 'cloud'].map(kind => {
    for (const level of [0, 2]) {
      const layout = MossLevels.create(level);
      const platform = layout.platforms.find(q => q.kind === kind && q.oneWay &&
        q.x > 30 && q.x + q.w < layout.worldWidth - 30);
      if (platform) return { level, platform };
    }
    throw new Error(`Missing one-way ${kind} fixture`);
  });
  test('One-way mushroom, stone, log and cloud retain their edges and allow ascent through the underside', () => {
    for (const { level, platform } of oneWays) {
      for (const direction of directions) {
        const s = fixture(level);
        place(s, platform, direction, .125);
        for (let frame = 0; frame < 20; frame++) step(s);
        assert(s.player.grounded && s.player.y + s.player.h === platform.y,
          `one-way ${platform.kind}: fractional support must remain at both ends`);
        place(s, platform, direction, 0);
        step(s);
        assert(!s.player.grounded && s.player.vy > 0,
          `one-way ${platform.kind}: zero overlap must leave the edge`);
        scenarios++;
      }
      const s = fixture(level), p = s.player;
      s.platforms = [{ ...platform }];
      Object.assign(p, { x: platform.x + platform.w / 2 - p.w / 2,
        y: platform.y + platform.h + .25, vx: 0, vy: -680, grounded: false, coyote: 0 });
      let passedAbove = false;
      for (let frame = 0; frame < 180; frame++) {
        step(s, { jumpHeld: true });
        if (p.y + p.h < platform.y) passedAbove = true;
      }
      assert(passedAbove && p.grounded && p.y + p.h === platform.y && s.health === 3,
        `one-way ${platform.kind}: upward passage and the subsequent top landing must work`);
      scenarios++;
    }
    return { kinds: oneWays.map(item => item.platform.kind) };
  });

  test('Normal and rocket jumps work on the last fraction of support and during coyote time', () => {
    const supports = [...logs.map(({ level, log }) => ({ level, platform: log })), ...oneWays];
    for (const { level, platform } of supports) for (const direction of directions)
      for (const boosted of [false, true]) for (const coyote of [false, true]) {
        const s = fixture(level), p = s.player;
        place(s, platform, direction, .125, { vx: direction * (coyote ? 310 : 0) });
        if (boosted) { s.boots.owned = true; s.boots.active = 30; }
        if (coyote) {
          step(s, inputFor(direction));
          assert(!p.grounded && p.coyote > 0,
            `${platform.kind} ${platform.x}: setup must leave the edge within coyote time`);
        }
        const previousY = p.y;
        step(s, { ...inputFor(direction), jumpPressed: true, jumpHeld: true });
        const event = boosted ? 'rocketJump' : 'jump';
        assert(p.vy < (boosted ? -1100 : -600) && p.y < previousY && !p.grounded &&
          s.events.filter(value => value === event).length === 1 &&
          !s.events.includes(boosted ? 'jump' : 'rocketJump') && s.health === 3 && s.deaths === 0,
        `${platform.kind} ${platform.x}: ${boosted ? 'rocket' : 'normal'} ${coyote ? 'coyote' : 'edge'} jump must remain usable`);
        scenarios++;
      }
    return { supports: supports.length, jumpKinds: ['normal', 'rocket'], timing: ['supported edge', 'coyote'] };
  });
  return results;
})()
