/* Wandmoss Journey's fixed-step game rules. No DOM, network or asset dependencies. */
(() => {
  'use strict';
  const WIDTH = 1152;
  const HEIGHT = 648;
  const WORLD_WIDTH = 5500;
  const SPEED = 310;
  const GRAVITY = 1800;
  const JUMP = 680;
  const CAST_COOLDOWN = 1;
  const FOOTSTEP_DISTANCE = 70;
  const BOSS_KNEEL_DURATION = .75;
  const BOSS_FALL_DURATION = .65;
  const BOSS_DEFEAT_DURATION = 2.2;
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function freshPlayer(spawn) {
    return {x:spawn.x,y:spawn.y,w:30,h:50,vx:0,vy:0,facing:1,grounded:true,
      invulnerable:0,anim:0,coyote:.12,jumpBuffer:0,castCooldown:0,footstepDistance:0};
  }
  function loadLevel(s, index) {
    const level = MossLevels.create(index);
    Object.assign(s, level);
    s.player = freshPlayer(level.spawn);
    s.spawn = {...level.spawn};
    s.mode = 'playing'; s.transition = null; s.camera = 0;
    s.spells = []; s.particles = []; s.smokeClock = 0;
    s.health = 3; s.checkpointIndex = -1; s.stageCollected = 0; s.maxX = level.spawn.x;
    s.boots.active = 0; s.boots.cooldown = 0;
    if (s.boss) s.boss.defeatTime = 0;
    if (s.artifact && s.boots.owned) s.artifact.collected = true;
    s.stageStart = {collected:s.collected,score:s.score};
    return s;
  }
  function createState(levelIndex = 0) {
    const s = {time:0,collected:0,score:0,deaths:0,events:[],completedLevels:[],
      totalFireflies:MossLevels.totalFireflies,
      boots:{owned:levelIndex>2,active:0,cooldown:0,duration:30,cooldownDuration:15}};
    loadLevel(s, levelIndex);
    s.mode = 'ready';
    return s;
  }
  function retryLevel(s) {
    s.collected = s.stageStart.collected; s.score = s.stageStart.score;
    s.events.length = 0;
    loadLevel(s, s.levelIndex);
    s.events.push('retry');
    return s;
  }
  function resetBoss(s) {
    if (!s.boss) return;
    Object.assign(s.boss, {x:4780,health:10,hits:0,phase:'idle',phaseTime:0,
      active:false,vx:0,invulnerable:0,dir:-1,defeatTime:0});
  }
  function retryBoss(s) {
    const index = s.checkpoints.length - 1;
    if (s.levelIndex !== 3 || !s.boss || (s.checkpointIndex < index && !s.boss.active)) return s;
    const checkpoint = s.checkpoints[index];
    if (s.completedLevels.includes(3)) s.score = Math.max(0, s.score - 500);
    s.completedLevels = s.completedLevels.filter(level => level !== 3);
    s.spawn = { x: checkpoint.x + 25, y: checkpoint.y - 50 };
    s.player = freshPlayer(s.spawn);
    s.mode = 'playing'; s.transition = null; s.health = 3;
    checkpoint.active = true; s.checkpointIndex = index;
    s.boots.owned = true; s.boots.active = 0; s.boots.cooldown = 0;
    s.spells.length = 0; s.particles.length = 0; s.smokeClock = 0;
    s.camera = clamp(s.player.x - WIDTH * .32, 0, s.worldWidth - WIDTH);
    resetBoss(s);
    s.events.length = 0; s.events.push('bossRetry');
    return s;
  }
  function beginTransition(s, kind) {
    if (!s.completedLevels.includes(s.levelIndex)) s.completedLevels.push(s.levelIndex);
    s.mode = 'transition';
    s.transition = {kind,time:0,duration:kind==='walk'?1.35:2.3,nextLevel:s.levelIndex+1};
    s.spells.length = 0;
    s.player.vx = 0; s.player.vy = kind==='launch'?-770:0; s.player.footstepDistance = 0;
    s.events.push(kind==='launch'?'launch':kind==='fall'?'descent':'chapter');
  }
  function stepTransition(s, dt) {
    s.time += dt;
    const t = s.transition;
    t.time += dt;
    if (t.kind === 'launch') {
      s.player.y -= 410 * dt;
      burst(s,s.player.x+15,s.player.y+50,'#f7dfa1',1,'spark');
    } else if (t.kind === 'fall') {
      s.player.y += 280 * dt;
    } else s.player.x += 55 * dt;
    if (t.time >= t.duration) {
      loadLevel(s,t.nextLevel);
      s.events.push('level');
    }
  }
  function stepBoots(s, dt, input) {
    const b = s.boots;
    if (b.active > 0) {
      b.active = Math.max(0,b.active-dt);
      if (b.active === 0) {b.cooldown=b.cooldownDuration;s.events.push('bootsExpired');}
    } else if (b.cooldown > 0) {
      b.cooldown = Math.max(0,b.cooldown-dt);
      if (b.cooldown === 0) s.events.push('bootsReady');
    }
    if (input.bootsPressed && b.owned && b.active===0 && b.cooldown===0) {
      b.active=b.duration;
      burst(s,s.player.x+15,s.player.y+45,'#f7d79c',16);
      s.events.push('boots');
    }
  }
  function stepBoss(s, dt) {
    const b=s.boss, p=s.player;
    if (!b || b.health<=0) return;
    b.invulnerable=Math.max(0,b.invulnerable-dt);
    if (!b.active && p.x>=s.arena.triggerX) {
      b.active=true;b.phase='telegraph';b.phaseTime=1.15;
      b.dir=p.x+p.w/2<b.x+b.w/2?-1:1;s.events.push('bossWake');
    }
    if (!b.active) return;
    p.x=clamp(p.x,s.arena.xMin,s.arena.xMax-p.w);
    b.phaseTime-=dt;
    if (b.phaseTime<=0) {
      if (b.phase==='telegraph') {
        b.phase='charge';b.phaseTime=1.15;b.vx=b.dir*430;s.events.push('bossCharge');
      }
      else if (b.phase==='charge') {b.phase='recover';b.phaseTime=1.5;b.vx=0;}
      else {b.phase='telegraph';b.phaseTime=1.15;b.dir=p.x+p.w/2<b.x+b.w/2?-1:1;}
    }
    if (b.phase==='charge') {
      b.x+=b.vx*dt;
      const clamped=clamp(b.x,s.arena.xMin,s.arena.xMax-b.w);
      if (b.x!==clamped) {b.x=clamped;b.phase='recover';b.phaseTime=1.5;b.vx=0;}
    }
    if (overlap(p,b)) hurt(s,false,b.x+b.w/2,'bossContact');
  }
  function burst(s, x, y, color, count = 12, type = 'spark') {
    for (let i = 0; i < count; i++) {
      const angle = i * 2.39996 + s.time;
      const speed = 35 + (i % 5) * 23;
      const life = .4 + (i % 4) * .13;
      s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 45, size: 2 + i % 3, color, life, maxLife: life, type });
    }
  }

  function stepParticles(s, dt) {
    for (const particle of s.particles) {
      particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt;
      if (particle.type !== 'smoke') particle.vy += 105 * dt;
      else particle.size += 5 * dt;
    }
    s.particles = s.particles.filter(particle => particle.life > 0).slice(-220);
  }

  function beginBossDefeat(s) {
    const b = s.boss;
    b.phase = 'kneel'; b.defeatTime = 0; b.vx = 0;
    s.mode = 'bossDefeat'; s.player.vx = 0; s.player.jumpBuffer = 0; s.player.footstepDistance = 0;
    s.spells.length = 0;
    s.events.push('bossDefeat');
    burst(s, b.x + b.w / 2, b.y + 60, '#ffe4a8', 28);
  }

  function stepBossDefeat(s, dt) {
    const b = s.boss, p = s.player;
    s.time += dt;
    b.defeatTime = Math.min(BOSS_DEFEAT_DURATION, b.defeatTime + dt);
    b.phase = b.defeatTime < BOSS_KNEEL_DURATION ? 'kneel' :
      b.defeatTime < BOSS_KNEEL_DURATION + BOSS_FALL_DURATION ? 'fall' : 'defeated';
    // The fight is over: the wizard can settle onto the arena floor safely
    // while the boss animation finishes, without input or contact damage.
    p.vx = 0;
    if (!p.grounded) {
      const oldY = p.y;
      p.vy = Math.min(950, Math.max(0, p.vy) + GRAVITY * dt);
      p.y += p.vy * dt;
      for (const platform of s.platforms) {
        if (p.x + p.w <= platform.x + 1 || p.x >= platform.x + platform.w - 1) continue;
        if (oldY + p.h <= platform.y + 2 && p.y + p.h >= platform.y) {
          p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
        }
      }
    }
    const center = (p.x + p.w / 2 + b.x + b.w / 2) / 2;
    const targetCamera = clamp(center - WIDTH / 2, 0, s.worldWidth - WIDTH);
    s.camera += (targetCamera - s.camera) * (1 - Math.exp(-7 * dt));
    stepParticles(s, dt);
    if (b.defeatTime + 1e-9 >= BOSS_DEFEAT_DURATION) {
      b.defeatTime = BOSS_DEFEAT_DURATION;
      s.mode = 'won';
      if (!s.completedLevels.includes(3)) { s.score += 500; s.completedLevels.push(3); }
      s.events.push('win');
      burst(s, b.x + b.w / 2, b.y + 95, '#ffe4a8', 36);
    }
  }

  function respawn(s) {
    const p = s.player;
    Object.assign(p, { x: s.spawn.x, y: s.spawn.y, vx: 0, vy: 0, invulnerable: 1.8, grounded: true, coyote: .12, jumpBuffer: 0, footstepDistance: 0 });
    s.spells.length = 0;
    s.camera = clamp(p.x - WIDTH * .32, 0, s.worldWidth - WIDTH);
    s.boots.active=0; s.boots.cooldown=0; resetBoss(s);
    s.events.push('respawn');
  }

  function hurt(s, falling, sourceX = s.player.x, contactEvent = null) {
    if (s.player.invulnerable > 0 && !falling) return;
    s.health--;
    s.events.push('hurt');
    if (contactEvent) s.events.push(contactEvent);
    s.player.footstepDistance = 0;
    burst(s, s.player.x + 15, s.player.y + 25, '#e6a7a1', 15);
    if (s.health <= 0) { s.mode = 'lost'; s.events.push('lost'); return; }
    if (falling) { s.deaths++; respawn(s); }
    else {
      s.player.invulnerable = 1.5;
      s.player.vy = -340;
      s.player.vx = s.player.x < sourceX ? -260 : 260;
      s.player.grounded = false;
    }
  }

  function step(s, dt, input = {}) {
    if (dt <= 0 || !['playing','transition','bossDefeat'].includes(s.mode)) return;
    dt = Math.min(dt, 1 / 30);
    if (s.mode==='transition') {stepTransition(s,dt);return;}
    if (s.mode==='bossDefeat') {stepBossDefeat(s,dt);return;}
    stepBoots(s,dt,input);
    s.time += dt;
    const p = s.player;
    const oldX = p.x, wasGrounded = p.grounded, deathsBefore = s.deaths;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.castCooldown = Math.max(0, p.castCooldown - dt);
    p.jumpBuffer = input.jumpPressed ? .13 : Math.max(0, p.jumpBuffer - dt);
    p.coyote = p.grounded ? .11 : Math.max(0, p.coyote - dt);
    const direction = Number(!!input.right) - Number(!!input.left);
    const target = direction * SPEED;
    const acceleration = p.grounded ? 2600 : 1800;
    p.vx += clamp(target - p.vx, -acceleration * dt, acceleration * dt);
    if (direction) p.facing = direction;

    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -(s.boots.active>0?1160:JUMP); p.grounded = false; p.coyote = 0; p.jumpBuffer = 0;
      burst(s, p.x + 15, p.y + 50, '#b4ce9c', 6, 'dust');
      s.events.push(s.boots.active>0?'rocketJump':'jump');
    }
    if (!input.jumpHeld && p.vy < -(s.boots.active>0?460:260)) p.vy = -(s.boots.active>0?460:260);
    if ((input.castPressed || input.castHeld) && p.castCooldown <= 1e-9) {
      const x = p.x + p.w / 2 + p.facing * 31;
      const y = p.y + 24;
      s.spells.push({ x, y, vx: p.facing * 640, life: .8 });
      burst(s, x, y, '#dbb6ff', 7);
      p.castCooldown = CAST_COOLDOWN;
      s.events.push('spell');
    }

    const oldY = p.y;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 0, s.worldWidth - p.w);
    for (const ground of s.platforms) {
      if (ground.oneWay || !overlap(p, ground)) continue;
      // Resolve only the vertical face crossed by this move. Feet settling on
      // an already overlapping platform are handled by the landing pass below.
      if (p.vx > 0 && oldX + p.w <= ground.x) {
        p.x = ground.x - p.w; p.vx = 0;
      } else if (p.vx < 0 && oldX >= ground.x + ground.w) {
        p.x = ground.x + ground.w; p.vx = 0;
      }
    }
    p.vy = Math.min(950, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    if (p.y<42) {p.y=42;p.vy=0;}
    p.grounded = false;
    for (const platform of s.platforms) {
      const within = p.x + p.w > platform.x && p.x < platform.x + platform.w;
      if (!within) continue;
      if (p.vy >= 0 && oldY + p.h <= platform.y + 2 && p.y + p.h >= platform.y) {
        p.y = platform.y - p.h; p.vy = 0; p.grounded = true;
      } else if (!platform.oneWay && p.vy < 0 && oldY >= platform.y + platform.h && p.y <= platform.y + platform.h) {
        p.y = platform.y + platform.h; p.vy = 0;
      }
    }
    p.anim += Math.abs(p.vx) * dt / 24;
    if (p.y > HEIGHT + 80) { hurt(s, true); if (s.mode === 'lost') return; }

    for (const enemy of s.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.xMin) { enemy.x = enemy.xMin; enemy.vx = Math.abs(enemy.vx); }
      if (enemy.x > enemy.xMax) { enemy.x = enemy.xMax; enemy.vx = -Math.abs(enemy.vx); }
      if (overlap(p, enemy)) {
        if (p.vy > 90 && oldY + p.h <= enemy.y + 12) {
          enemy.alive = false; p.vy = -430; p.grounded = false;
          burst(s, enemy.x + 19, enemy.y + 15, '#bfc79c', 18);
          s.score+=25;s.events.push('enemy');
        } else {
          hurt(s, false, enemy.x, 'enemyContact');
          if (s.mode === 'lost') return;
        }
      }
    }
    stepBoss(s,dt);
    if(s.mode==='lost')return;
    for (const spell of s.spells) {
      spell.x += spell.vx * dt; spell.life -= dt;
      const box = { x: spell.x - 10, y: spell.y - 9, w: 20, h: 18 };
      for (const enemy of s.enemies) {
        if (!enemy.alive || !overlap(box, enemy)) continue;
        enemy.alive = false; spell.life = 0;
        burst(s, enemy.x + 19, enemy.y + 15, '#d8b8f3', 18);
        s.score+=25;s.events.push('enemy'); break;
      }
      const boss=s.boss;
      // The timer is a visual hit flash, not damage immunity: every distinct
      // projectile that connects counts, even when the charge closes the gap.
      if (spell.life>0 && boss && boss.active && boss.health>0 && overlap(box,boss)) {
        boss.health--;boss.hits++;boss.invulnerable=.22;spell.life=0;
        burst(s,spell.x,spell.y,'#f7dfa1',12);s.events.push('bossHit');
        if (boss.health===0) {
          beginBossDefeat(s);
          return;
        }
      }
      // Spells travel through the decorative one-way platforms but stop at solid wood/terrain.
      if (s.platforms.some(platform => !platform.oneWay && overlap(box, platform))) spell.life = 0;
    }
    s.spells = s.spells.filter(spell => spell.life > 0);

    for (const firefly of s.fireflies) {
      if (firefly.collected) continue;
      if (firefly.x > p.x - 10 && firefly.x < p.x + p.w + 10 && firefly.y > p.y - 10 && firefly.y < p.y + p.h + 10) {
        firefly.collected = true; s.collected++;s.stageCollected++;s.score+=10;
        burst(s, firefly.x, firefly.y, '#f6d992', 9);
        s.events.push('collect');
      }
    }
    if(s.artifact && !s.artifact.collected && overlap(p,s.artifact)) {
      s.artifact.collected=true;s.boots.owned=true;s.boots.active=0;s.boots.cooldown=0;
      burst(s,s.artifact.x+19,s.artifact.y+16,'#ffe5a0',24);s.events.push('artifact');
    }
    for (let i = 0; i < s.checkpoints.length; i++) {
      const checkpoint = s.checkpoints[i];
      if (!checkpoint.active && Math.abs(p.x - checkpoint.x) < 65 && Math.abs(p.y + p.h - checkpoint.y) < 140) {
        checkpoint.active = true;
        if (i > s.checkpointIndex) {
          s.checkpointIndex = i;
          s.spawn = { x: checkpoint.x + 25, y: checkpoint.y - p.h };
        }
        // Lanterns restore hearts and the manually activated artifact.
        s.health = 3;s.boots.cooldown=0;
        // A player may leap past the sky artifact; the final lantern supplies
        // the boots before the fight so its high-jump strategy remains usable.
        if (s.levelIndex === 3 && i === s.checkpoints.length - 1 && !s.boots.owned) {
          s.boots.owned = true; s.events.push('artifact');
        }
        burst(s, checkpoint.x, checkpoint.y - 70, '#f6d992', 22);
        s.events.push('checkpoint');
      }
    }
    if (s.mode==='playing' && s.levelIndex<3 && p.x+p.w>s.goal.x+25 &&
        p.y+p.h>s.goal.y+50) {
      beginTransition(s,s.levelIndex===0?'walk':s.levelIndex===1?'launch':'fall');
    }
    // Count ground actually covered, including collision clamps, rather than
    // input or intended velocity. Landing, respawning and positional corrections
    // start a fresh stride; footsteps never accompany transitions or damage.
    const traveled = Math.abs(p.x - oldX);
    if (s.mode==='playing' && wasGrounded && p.grounded && s.deaths===deathsBefore &&
        traveled > 1e-6 && traveled <= SPEED * dt + 1e-6) {
      p.footstepDistance += traveled;
      if (p.footstepDistance >= FOOTSTEP_DISTANCE) {
        p.footstepDistance %= FOOTSTEP_DISTANCE;
        s.events.push('step');
      }
    } else p.footstepDistance = 0;
    s.maxX = Math.max(s.maxX, p.x);
    const targetCamera = clamp(p.x - WIDTH * .32, 0, s.worldWidth - WIDTH);
    s.camera += (targetCamera - s.camera) * (1 - Math.exp(-7 * dt));

    s.smokeClock -= dt;
    if (s.smokeClock <= 0) {
      s.smokeClock += .065;
      const life = .65;
      s.particles.push({ x: p.x + 15 + p.facing * 31, y: p.y + 19, vx: Math.sin(s.time * 4) * 9 - p.facing * 9, vy: -29, size: 3.5, color: '#d3b9dd', life, maxLife: life, type: 'smoke' });
    }
    stepParticles(s, dt);
  }
  window.MossEngine = { createState, step, loadLevel, retryLevel, retryBoss, WIDTH, HEIGHT, WORLD_WIDTH,
    CAST_COOLDOWN, BOSS_KNEEL_DURATION, BOSS_FALL_DURATION, BOSS_DEFEAT_DURATION };
})();
