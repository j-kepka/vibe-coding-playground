/* Original Wandmoss Journey chapter layouts, generated entirely in local code. */
(() => {
  'use strict';
  const WORLD_WIDTH = 5500;
  function originalForest() {
    const platforms = [
      { x: 0, y: 530, w: 1040, h: 118, kind: 'ground' },
      { x: 1180, y: 530, w: 1100, h: 118, kind: 'ground' },
      { x: 2430, y: 530, w: 890, h: 118, kind: 'ground' },
      { x: 3465, y: 530, w: 935, h: 118, kind: 'ground' },
      { x: 4550, y: 530, w: 950, h: 118, kind: 'ground' },
      { x: 560, y: 483, w: 126, h: 47, kind: 'log' },
      { x: 818, y: 427, w: 140, h: 23, kind: 'mushroom', oneWay: true },
      { x: 1070, y: 450, w: 82, h: 22, kind: 'stone', oneWay: true },
      { x: 1395, y: 433, w: 138, h: 23, kind: 'mushroom', oneWay: true },
      { x: 1595, y: 355, w: 150, h: 24, kind: 'log', oneWay: true },
      { x: 1810, y: 418, w: 130, h: 23, kind: 'mushroom', oneWay: true },
      { x: 2165, y: 447, w: 130, h: 23, kind: 'mushroom', oneWay: true },
      { x: 2340, y: 451, w: 65, h: 22, kind: 'stone', oneWay: true },
      { x: 2590, y: 482, w: 115, h: 48, kind: 'log' },
      { x: 2775, y: 410, w: 140, h: 23, kind: 'mushroom', oneWay: true },
      { x: 2985, y: 333, w: 130, h: 24, kind: 'log', oneWay: true },
      { x: 3180, y: 415, w: 140, h: 23, kind: 'mushroom', oneWay: true },
      { x: 3370, y: 453, w: 66, h: 22, kind: 'stone', oneWay: true },
      { x: 3830, y: 447, w: 135, h: 23, kind: 'mushroom', oneWay: true },
      { x: 4045, y: 367, w: 160, h: 24, kind: 'log', oneWay: true },
      { x: 4280, y: 441, w: 145, h: 23, kind: 'mushroom', oneWay: true },
      { x: 4450, y: 453, w: 68, h: 22, kind: 'stone', oneWay: true },
      { x: 4750, y: 465, w: 120, h: 23, kind: 'mushroom', oneWay: true }
    ];
    const fireflies = [];
    const row = (x, y, count, spacing = 58) => {
      for (let i = 0; i < count; i++) fireflies.push({ x: x + i * spacing, y, collected: false });
    };
    row(310, 467, 3); row(592, 430, 2); row(843, 381, 2);
    row(1078, 408, 1); row(1280, 470, 2); row(1426, 389, 2);
    row(1630, 310, 2); row(1845, 375, 2); row(2090, 472, 2);
    row(2368, 410, 1); row(2615, 436, 2); row(2810, 368, 2);
    row(3015, 291, 2); row(3210, 373, 2); row(3398, 412, 1);
    row(3580, 471, 2); row(3860, 401, 2); row(4080, 322, 2);
    row(4320, 395, 2); row(4477, 413, 1); row(4780, 421, 2);
    row(4990, 470, 3);
    const enemies = [
      [760, 715, 970], [1490, 1250, 1550], [2070, 1990, 2200],
      [2850, 2760, 3090], [3610, 3520, 3690], [4180, 3990, 4280], [4850, 4690, 5000]
    ].map(([x, xMin, xMax], i) => ({ x, y: 500, w: 38, h: 30, xMin, xMax, vx: i % 2 ? -54 : 54, alive: true }));
    return {
      mode: 'ready', time: 0, camera: 0, worldWidth: WORLD_WIDTH,
      player: { x: 110, y: 480, w: 30, h: 50, vx: 0, vy: 0, facing: 1, grounded: true, invulnerable: 0, anim: 0, coyote: .12, jumpBuffer: 0, castCooldown: 0 },
      platforms, fireflies, enemies, spells: [], particles: [], events: [],
      checkpoints: [{ x: 1948, y: 530, active: false }, { x: 3735, y: 530, active: false }],
      goal: { x: 5200, y: 395, w: 95, h: 135 },
      spawn: { x: 110, y: 480 }, health: 3, collected: 0, deaths: 0, smokeClock: 0, checkpointIndex: -1, maxX: 110
    };
  }


  const names = ['Las świetlików', 'Szlak zmierzchu', 'Ogrody obłoków', 'Serce doliny'];
  const ground = (x, w) => ({ x, y: 530, w, h: 118, kind: 'ground' });
  const platform = (x, y, w, kind = 'mushroom') => ({ x, y, w, h: kind === 'cloud' ? 28 : 23, kind, oneWay: true });
  const log = (x, y, w) => ({ x, y, w, h: 530 - y, kind: 'log' });
  const thorn = (x, lo, hi, speed = 68) => ({ x, y: 500, w: 38, h: 30, xMin: lo, xMax: hi, vx: speed, alive: true, kind: 'thorn' });

  function lights(rows) {
    const out = [];
    for (const [x, y, count, spacing = 55] of rows) {
      for (let i = 0; i < count; i++) out.push({ x: x + i * spacing, y, collected: false });
    }
    return out;
  }

  function create(index = 0) {
    let level;
    if (index === 0) {
      level = originalForest();
      level.enemies.forEach(enemy => enemy.kind = 'thorn');
      level.goal.kind = 'gate';
      level.theme = 'forest';
    } else if (index === 1) {
      level = {
        theme: 'dusk', worldWidth: 4850,
        platforms: [
          ground(0,720), ground(890,760), ground(1820,770), ground(2760,780), ground(3705,1145),
          log(435,474,110), log(1240,460,110), log(2095,458,120), log(3120,475,130), log(4180,459,110),
          platform(615,432,115), platform(1030,412,125), platform(1440,394,125),
          platform(1940,433,100), platform(2330,395,140), platform(2810,436,120),
          platform(3370,411,100), platform(3820,423,120), platform(4370,398,130)
        ],
        enemies: [thorn(590,570,675,76),thorn(1110,990,1205,-78),thorn(1470,1380,1555,83),
          thorn(2020,1840,2070,-72),thorn(2470,2290,2515,85),thorn(3000,2835,3080,78),
          thorn(3480,3325,3490,-82),thorn(4060,3880,4120,84),thorn(4530,4440,4610,-76)],
        fireflies: lights([[270,470,3],[470,420,2],[642,387,2],[1070,367,2],[1458,350,2],
          [1850,470,2],[2155,402,2],[2360,351,2],[2850,391,2],[3385,367,2],
          [3860,379,2],[4210,409,2],[4400,354,2],[4650,465,2]]),
        checkpoints:[{x:1560,y:530,active:false},{x:3450,y:530,active:false}],
        goal:{x:4650,y:408,w:95,h:122,kind:'launch'}, spawn:{x:110,y:480}
      };
    } else if (index === 2) {
      const platforms = [
        platform(0,530,500,'cloud'), platform(620,485,220,'cloud'),
        platform(955,425,210,'cloud'), platform(1265,470,270,'cloud'),
        platform(1650,402,190,'cloud'), platform(1930,452,240,'cloud'),
        platform(2300,390,225,'cloud'), platform(2650,450,230,'cloud'),
        platform(3030,485,200,'cloud'), platform(3350,530,720,'cloud'),
        platform(1450,342,130,'cloud'), platform(2110,315,110,'cloud'),
        platform(2790,320,110,'cloud'), platform(3590,398,130,'cloud')
      ];
      const phoenix = (x,y,lo,hi,speed) => ({x,y,w:34,h:28,xMin:lo,xMax:hi,vx:speed,alive:true,kind:'phoenix'});
      level = {
        theme:'sky',worldWidth:4070,platforms,
        enemies:[phoenix(730,457,650,790,65),phoenix(1025,397,980,1100,-68),
          phoenix(1740,374,1690,1790,62),phoenix(2040,424,1970,2100,-70),
          phoenix(2440,362,2330,2470,73),phoenix(2745,422,2680,2820,-66),
          phoenix(3130,457,3060,3170,60),phoenix(3720,502,3530,3820,-74)],
        fireflies:lights([[240,468,3],[665,440,3],[990,379,3],[1285,423,2],[1480,295,2],
          [1675,356,2],[1970,407,3],[2135,267,2],[2335,345,3],[2680,405,3],
          [2807,274,2],[3070,440,2],[3400,472,3],[3620,352,2],[3820,471,3]]),
        checkpoints:[{x:1320,y:470,active:false},{x:2680,y:450,active:false}],
        artifact:{x:1400,y:425,w:38,h:32,collected:false},
        goal:{x:3890,y:400,w:100,h:130,kind:'descent'},spawn:{x:110,y:480}
      };
    } else {
      level = {
        theme:'return',worldWidth:5500,
        platforms:[ground(0,910),ground(1060,1000),ground(2220,1100),ground(3470,2030),
          log(510,479,120),log(1630,458,120),log(2860,467,125),
          platform(805,433,125),platform(1265,420,130),platform(1870,410,150),
          platform(2500,427,130),platform(3190,421,135),platform(3630,428,135)],
        enemies:[thorn(750,685,825,72),thorn(1320,1110,1430,80),thorn(1900,1790,1950,-75),
          thorn(2530,2330,2640,83),thorn(3100,3000,3210,-80),thorn(3740,3570,3870,86)],
        fireflies:lights([[310,469,3],[540,428,2],[835,387,2],[1300,374,2],
          [1665,408,2],[1900,366,2],[2340,467,2],[2535,382,2],[2890,416,2],
          [3220,376,2],[3650,382,2],[3950,469,3]]),
        checkpoints:[{x:1930,y:530,active:false},{x:4050,y:530,active:false}],
        goal:{x:5130,y:395,w:95,h:135,kind:'boss'},spawn:{x:110,y:480},
        arena:{xMin:4100,xMax:5300,triggerX:4250},
        boss:{x:4780,y:385,w:108,h:145,health:10,maxHealth:10,hits:0,
          phase:'idle',phaseTime:0,dir:-1,vx:0,active:false,invulnerable:0}
      };
    }
    return {platforms:level.platforms,fireflies:level.fireflies,enemies:level.enemies,
      checkpoints:level.checkpoints,goal:level.goal,spawn:level.spawn,
      theme:level.theme,worldWidth:level.worldWidth,levelIndex:index,levelCount:4,levelName:names[index],
      artifact:level.artifact||null,boss:level.boss||null,arena:level.arena||null};
  }
  const totalFireflies = [0,1,2,3].reduce((sum,index)=>sum+create(index).fireflies.length,0);
  window.MossLevels = { create, names, totalFireflies };
})();

