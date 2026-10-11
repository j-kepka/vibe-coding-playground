/* Deterministic input-only campaign route; uses real maps, enemies and cooldowns.
   Unlike isolated rule fixtures, this run never teleports or changes game objects. */
(() => {
  const s = MossEngine.createState(); s.mode = 'playing';
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const stages = new Set([0]), transitions = [], lanterns = {};
  let jumps = 0, acquiredWithoutActivation = false, priorMode = s.mode;
  for (let frame = 0; frame < 24000 && s.mode !== 'won' && s.mode !== 'lost'; frame++) {
    const p = s.player;
    const support = s.platforms.find(q => p.x + p.w > q.x + 1 && p.x < q.x + q.w - 1 && Math.abs(p.y + p.h - q.y) < 3);
    const edge = support && p.x > support.x + support.w - (s.theme === 'sky' ? 70 : 72);
    const log = s.platforms.some(q => !q.oneWay && q.kind === 'log' && q.x - p.x > 0 && q.x - p.x < 75);
    let jump = p.grounded && (edge || log), right = true, left = false;
    if (s.boss && s.boss.active) {
      const aim = Math.sign(s.boss.x + s.boss.w / 2 - p.x - p.w / 2);
      right = aim > 0 && p.facing !== aim;
      left = aim < 0 && p.facing !== aim;
      jump = p.grounded && s.boss.phase === 'telegraph' && s.boss.phaseTime < .65;
    }
    const beforeOwned = s.boots.owned;
    const bootsPressed = s.levelIndex === 3 && p.x > 4100 && s.boots.owned && s.boots.active === 0 && s.boots.cooldown === 0;
    // With a one-second cooldown, aim at a reachable creature before casting
    // instead of spending the next shot at the top of a platform jump.
    const castHeld = (s.boss && s.boss.active) || s.enemies.some(enemy => enemy.alive &&
      enemy.x > p.x && enemy.x - p.x < 450 && Math.abs(enemy.y + enemy.h / 2 - p.y - 24) < 24);
    MossEngine.step(s, 1 / 120, { right, left, jumpPressed: jump, jumpHeld: true, castHeld, bootsPressed });
    if (jump && s.mode === 'playing') jumps++;
    if (!beforeOwned && s.boots.owned) acquiredWithoutActivation = s.boots.active === 0;
    if (s.mode === 'transition' && priorMode !== 'transition') transitions.push(s.transition.kind);
    priorMode = s.mode;
    stages.add(s.levelIndex);
    lanterns[s.levelIndex] = Math.max(lanterns[s.levelIndex] || 0, s.checkpoints.filter(q => q.active).length);
  }
  assert(s.mode === 'won' && s.health > 0 && s.deaths === 0,
    'The full campaign must be finishable with movement, jumping, held spells and manual boots, without teleporting or falling');
  assert(stages.size === 4 && transitions.join(',') === 'walk,launch,fall' && s.completedLevels.length === 4,
    'The complete route must traverse all four chapters and story transitions in order');
  assert(acquiredWithoutActivation && s.boots.owned && s.boss.health === 0 && s.boss.hits === 10,
    'The route must find the artifact, manually activate it and defeat the boss with ten accepted shots');
  assert(s.collected > 0 && s.score >= 500 && jumps > 10,
    'The complete route must earn points and solve the actual platform layout');
  // The browser harness can display this actual completed run in its ending screenshot.
  window.__wandmossRouteResult = s;
  return [{ name: 'Complete uninterrupted four-stage campaign using only gameplay input', detail: {
    mode: s.mode, seconds: s.time, health: s.health, falls: s.deaths, collected: s.collected,
    total: s.totalFireflies, score: s.score, jumps, bossHits: s.boss.hits, lanterns, transitions,
    acquiredWithoutActivation
  } }];
})()
