/* Original, dependency-free Canvas artwork for Wandmoss Journey. */
(() => {
  'use strict';

  const W = 1152;
  const H = 648;
  const TAU = Math.PI * 2;
  const tileWidth = 1800;
  const backgrounds = {};

  function noise(n) {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return v - Math.floor(v);
  }

  function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
    ctx.fill();
  }

  function glow(ctx, x, y, radius, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function rounded(ctx, x, y, w, h, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  function fern(ctx, x, y, scale, color, lean = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * lean, scale);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -24, 4, -43);
    ctx.stroke();
    for (let j = 0; j < 6; j++) {
      const yLeaf = -8 - j * 5;
      const length = 14 - j * 1.8;
      ctx.beginPath();
      ctx.moveTo(4, yLeaf);
      ctx.quadraticCurveTo(-length, yLeaf - 7, -length + 3, yLeaf - 10);
      ctx.quadraticCurveTo(2, yLeaf - 5, 4, yLeaf);
      ctx.moveTo(5, yLeaf - 2);
      ctx.quadraticCurveTo(length + 8, yLeaf - 12, length + 5, yLeaf - 15);
      ctx.quadraticCurveTo(6, yLeaf - 7, 5, yLeaf - 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function tree(ctx, x, bottom, height, width, color, detail, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - width, bottom);
    ctx.bezierCurveTo(x - width * 0.25, bottom - height * 0.16,
      x - width * 0.47, bottom - height * 0.57, x - width * 0.2, bottom - height);
    ctx.lineTo(x + width * 0.4, bottom - height);
    ctx.bezierCurveTo(x + width * 0.12, bottom - height * 0.54,
      x + width * 0.52, bottom - height * 0.1, x + width * 1.3, bottom);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let j = 0; j < 4; j++) {
      const side = j % 2 ? 1 : -1;
      const by = bottom - height * (0.54 + j * 0.09);
      const bx = x + side * (50 + noise(seed + j) * 115);
      ctx.lineWidth = width * (0.26 - j * 0.036);
      ctx.beginPath();
      ctx.moveTo(x, by + 12);
      ctx.quadraticCurveTo(bx - side * 28, by - 10, bx, by - 60);
      ctx.stroke();
      ellipse(ctx, bx, by - 56, 70 + noise(seed + j + 8) * 50, 36, color, side * 0.15);
    }
    if (detail) {
      ctx.strokeStyle = 'rgba(93,146,130,.12)';
      ctx.lineWidth = 2;
      for (let j = 0; j < 5; j++) {
        const xx = x - width * 0.34 + j * width * 0.15;
        ctx.beginPath();
        ctx.moveTo(xx, bottom - 10);
        ctx.bezierCurveTo(xx - 10, bottom - height * .26, xx + 8, bottom - height * .6, xx, bottom - height * .84);
        ctx.stroke();
      }
      for (let j = 0; j < 14; j++) {
        const yy = bottom - noise(seed + 30 + j) * height * .72;
        ellipse(ctx, x + (noise(seed + j + 50) - .5) * width * .6, yy, 6, 3, 'rgba(70,112,92,.28)', -.25);
      }
    }
  }

  function makeBackgrounds(theme = 'forest') {
    const layers = [];
    for (let layer = 0; layer < 3; layer++) {
      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const color = (theme === 'dusk' ? ['#4d4558', '#373347', '#27293c']
        : theme === 'return' ? ['#285354', '#1d4040', '#123132']
          : ['#245054', '#173c42', '#102e34'])[layer];
      const step = [102, 215, 375][layer];
      for (let x = -170; x < tileWidth + 180; x += step) {
        const seed = x + 900 + layer * 717;
        const height = [350, 460, 580][layer] + noise(seed) * 120;
        const bottom = [485, 527, 564][layer];
        tree(ctx, x + noise(seed + 1) * 55, bottom, height,
          [13, 25, 40][layer] + noise(seed + 2) * 17, color, layer === 2, seed);
      }
      for (let j = 0; j < 24; j++) {
        const x = j * 79 + noise(j + layer * 28) * 40;
        const y = layer === 2 ? 40 : 132;
        ellipse(ctx, x, y + noise(j + layer * 17) * 75, 95, 50,
          ['rgba(44,83,77,.28)', 'rgba(27,64,59,.48)', 'rgba(16,46,48,.68)'][layer]);
      }
      if (layer === 2) {
        for (let j = 0; j < 80; j++) {
          const x = noise(j + 170) * tileWidth;
          const y = 75 + noise(j + 350) * 285;
          ellipse(ctx, x, y, 3.5 + noise(j) * 4, 1.8, 'rgba(104,153,108,.17)', -.5);
        }
        for (let j = 0; j < 18; j++) fern(ctx, j * 107, 542, 1 + noise(j) * .5, '#183e38', j % 2 ? 1 : -1);
      }
      layers.push(canvas);
    }
    return layers;
  }

  function background(ctx, camera, time, theme = 'forest') {
    if (theme === 'sky') { skyBackground(ctx, camera); return; }
    if (!backgrounds[theme]) backgrounds[theme] = makeBackgrounds(theme);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    const palette = theme === 'dusk' ? ['#25243e', '#6c4d68', '#b17875', '#392f41']
      : theme === 'return' ? ['#182d3d', '#385969', '#587972', '#1c3433']
        : ['#142d3c', '#345b62', '#47716a', '#172f32'];
    sky.addColorStop(0, palette[0]);
    sky.addColorStop(.38, palette[1]);
    sky.addColorStop(.72, palette[2]);
    sky.addColorStop(1, palette[3]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const moonX = 820 - camera * .025;
    if (theme === 'dusk') {
      glow(ctx, moonX, 350, 170, 'rgba(255,194,135,.2)');
      ellipse(ctx, moonX, 350, 42, 42, '#edbe98');
      glow(ctx, 175 - camera * .015, 95, 52, 'rgba(240,218,211,.08)');
      ellipse(ctx, 175 - camera * .015, 95, 19, 19, '#cfbfcb');
      ellipse(ctx, 181 - camera * .015, 89, 17, 18, '#2a2942');
    } else {
      glow(ctx, moonX, 259, 135, 'rgba(221,231,188,.16)');
      ellipse(ctx, moonX, 259, 38, 38, '#b5ccb9');
      ellipse(ctx, moonX + 11, 250, 32, 34, '#385960');
    }
    for (let j = 0; j < 32; j++) {
      const x = (noise(j + 230) * (W + 200) - camera * .04 + W * 10) % (W + 200);
      const y = 35 + noise(j + 31) * 258;
      ellipse(ctx, x, y, 1.1, 1.1, 'rgba(222,232,203,.34)');
    }
    for (let layer = 0; layer < 3; layer++) {
      const offset = ((camera * [.16, .3, .48][layer]) % tileWidth + tileWidth) % tileWidth;
      ctx.drawImage(backgrounds[theme][layer], -offset, 0);
      if (offset > tileWidth - W) ctx.drawImage(backgrounds[theme][layer], tileWidth - offset, 0);
      if (layer < 2) {
        const fog = ctx.createLinearGradient(0, 300, 0, 550);
        fog.addColorStop(0, 'rgba(99,149,135,0)');
        fog.addColorStop(.75, theme === 'dusk' ? (layer ? 'rgba(174,125,144,.13)' : 'rgba(224,162,161,.17)')
          : layer ? 'rgba(91,136,120,.17)' : 'rgba(113,166,145,.24)');
        fog.addColorStop(1, 'rgba(89,131,116,0)');
        ctx.fillStyle = fog;
        ctx.fillRect(0, 300, W, 250);
      }
    }
    // Long diagonal shafts give the forest depth without covering the path.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(167,202,153,.025)';
    for (let j = 0; j < 5; j++) {
      const x = 155 + j * 260 - camera * .08 % 260;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 38, 0);
      ctx.lineTo(x - 140, 510); ctx.lineTo(x - 260, 510); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // The glimmers are scenery; collectible fireflies are much larger and golden.
    for (let j = 0; j < 22; j++) {
      const x = (noise(j + 803) * (W + 100) - camera * .6 + (W + 100) * 30) % (W + 100);
      const y = 185 + noise(j + 901) * 280 + Math.sin(time * .45 + j) * 10;
      const pulse = .26 + (Math.sin(time * .9 + j * 2.3) + 1) * .18;
      ellipse(ctx, x, y, 1.4, 1.4, `rgba(194,224,164,${pulse})`);
    }
  }

  function skyCloud(ctx, x, y, width, depth, alpha = 1, seed = 0, distant = false) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const shade = ctx.createLinearGradient(0, y - depth, 0, y + depth);
    const colors = distant ? ['#d4e6ee', '#c4dce8', '#a9c5da'] : ['#fffef6', '#f6fafc', '#dce8f3'];
    shade.addColorStop(0, colors[0]); shade.addColorStop(.55, colors[1]); shade.addColorStop(1, colors[2]);
    ellipse(ctx, x, y + depth * .35, width * .5, depth * .6, shade);
    for (let j = 0; j < 5; j++) {
      const px = x + width * (j / 5 - .4);
      ellipse(ctx, px, y - Math.sin(j * .9) * depth * .3, width * (.16 + noise(j + seed) * .05), depth * (.65 + noise(j + seed + 6) * .25), shade);
    }
    ctx.restore();
  }

  function makeSkyBackgrounds() {
    // Distant scenery stays cloud-only; translucent island bases read as shadows.
    const layers = [];
    for (let layer = 0; layer < 3; layer++) {
      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const count = [6, 5, 4][layer];
      const spacing = tileWidth / count;
      for (let j = 0; j < count; j++) {
        // Each shape is fixed in its layer, including copies across the tile seam.
        const seed = 901 + layer * 157 + j * 37;
        const x = (j + .5) * spacing;
        const y = [100, 255, 420][layer] + noise(seed + 13) * [145, 80, 110][layer];
        const width = [200, 240, 300][layer] + noise(seed + 53) * 125;
        for (const shift of [-tileWidth, 0, tileWidth]) {
          skyCloud(ctx, x + shift, y, width, [24, 34, 48][layer], [.54, .42, .46][layer], seed, true);
        }
      }
      layers.push(canvas);
    }
    return layers;
  }

  function skyBackground(ctx, camera) {
    if (!backgrounds.sky) backgrounds.sky = makeSkyBackgrounds();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#79b7d9'); sky.addColorStop(.42, '#b5ddea');
    sky.addColorStop(.76, '#ecedf2'); sky.addColorStop(1, '#e5d2e6');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const sunX = 868 - camera * .025;
    glow(ctx, sunX, 107, 190, 'rgba(255,248,207,.55)');
    ellipse(ctx, sunX, 107, 44, 44, '#fff7d0');
    ctx.save(); ctx.translate(sunX, 107);
    ctx.fillStyle = 'rgba(255,250,220,.14)';
    for (let j = 0; j < 12; j++) {
      const angle = j * TAU / 12;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle - .035) * 58, Math.sin(angle - .035) * 58);
      ctx.lineTo(Math.cos(angle - .065) * 190, Math.sin(angle - .065) * 190);
      ctx.lineTo(Math.cos(angle + .065) * 190, Math.sin(angle + .065) * 190);
      ctx.lineTo(Math.cos(angle + .035) * 58, Math.sin(angle + .035) * 58); ctx.fill();
    }
    ctx.restore();
    // Cloud geometry stays still; only the camera moves the cached parallax layers.
    for (let layer = 0; layer < 3; layer++) {
      const offset = ((camera * [.09, .14, .2][layer]) % tileWidth + tileWidth) % tileWidth;
      ctx.drawImage(backgrounds.sky[layer], -offset, 0);
      if (offset > tileWidth - W) ctx.drawImage(backgrounds.sky[layer], tileWidth - offset, 0);
    }
    const mist = ctx.createLinearGradient(0, 460, 0, H);
    mist.addColorStop(0, 'rgba(255,247,245,0)'); mist.addColorStop(1, 'rgba(255,248,248,.62)');
    ctx.fillStyle = mist; ctx.fillRect(0, 460, W, H - 460);
  }

  function mushroom(ctx, x, y, w, h, seed, decorative = false) {
    const stemWidth = Math.max(10, w * .19);
    const center = x + w * .5;
    const stemHeight = Math.max(h, decorative ? w * .8 : 54);
    const stem = ctx.createLinearGradient(center - stemWidth, 0, center + stemWidth, 0);
    stem.addColorStop(0, '#697063'); stem.addColorStop(.47, '#c2b68b'); stem.addColorStop(1, '#64756a');
    ctx.fillStyle = stem;
    ctx.beginPath();
    ctx.moveTo(center - stemWidth * .5, y + 11);
    ctx.quadraticCurveTo(center + stemWidth * .18, y + stemHeight * .65, center - stemWidth, y + stemHeight);
    ctx.lineTo(center + stemWidth, y + stemHeight);
    ctx.quadraticCurveTo(center + stemWidth * .45, y + stemHeight * .6, center + stemWidth * .5, y + 11);
    ctx.fill();
    ctx.strokeStyle = 'rgba(223,203,161,.26)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(center + 1, y + 19); ctx.quadraticCurveTo(center - 2, y + 35, center + 2, y + stemHeight - 3); ctx.stroke();
    glow(ctx, center, y + 5, w * .75, 'rgba(218,190,119,.09)');
    const cap = ctx.createLinearGradient(0, y - 3, 0, y + 28);
    cap.addColorStop(0, decorative ? '#96719b' : '#a78dba');
    cap.addColorStop(.35, decorative ? '#705b83' : '#87729f');
    cap.addColorStop(1, '#443f65');
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 16);
    ctx.bezierCurveTo(x + w * .04, y - 4, x + w * .3, y - 5, center, y);
    ctx.bezierCurveTo(x + w * .79, y - 7, x + w * .99, y + 5, x + w + 3, y + 16);
    ctx.bezierCurveTo(x + w * .72, y + 25, x + w * .28, y + 25, x - 3, y + 16);
    ctx.fill();
    ctx.strokeStyle = '#d5c19a'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.quadraticCurveTo(center, y + 29, x + w, y + 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(231,212,170,.28)'; ctx.lineWidth = 1;
    for (let j = 0; j < 9; j++) {
      const px = x + w * (.09 + j * .102);
      ctx.beginPath(); ctx.moveTo(px, y + 17); ctx.lineTo(center + (px - center) * .7, y + 24); ctx.stroke();
    }
    for (let j = 0; j < 6; j++) {
      ellipse(ctx, x + w * (.13 + noise(seed + j) * .74), y + 6 + noise(seed + j + 9) * 8,
        2.5 + noise(seed + j + 20) * 3, 1.5, '#d6c6bd', -.1);
    }
  }

  function grass(ctx, x, y, seed) {
    ctx.strokeStyle = ['#7c9a57', '#536f43', '#a0a96b'][Math.floor(noise(seed) * 3)];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      const px = x + j * 3;
      ctx.moveTo(px, y + 2);
      ctx.quadraticCurveTo(px + (j - 1.5) * 3, y - 4, px + (j - 1.5) * 5, y - 6 - noise(seed + j) * 8);
    }
    ctx.stroke();
  }

  function ground(ctx, p, camera) {
    const start = Math.max(p.x, Math.floor((camera - 30) / 20) * 20);
    const end = Math.min(p.x + p.w, camera + W + 30);
    const soil = ctx.createLinearGradient(0, p.y, 0, H + 50);
    soil.addColorStop(0, '#384938'); soil.addColorStop(.14, '#303d31'); soil.addColorStop(.5, '#23302b'); soil.addColorStop(1, '#182526');
    ctx.fillStyle = soil; ctx.fillRect(p.x, p.y, p.w, Math.max(p.h, H - p.y));
    ctx.fillStyle = '#586d3d'; ctx.fillRect(p.x, p.y, p.w, 9);
    ctx.fillStyle = '#a1ae6d'; ctx.fillRect(p.x, p.y, p.w, 2);
    for (let x = start; x < end; x += 20) {
      const seed = x * .17;
      ellipse(ctx, x + 8, p.y + 5, 13, 6 + noise(seed) * 5, '#647745');
      ellipse(ctx, x + 10, p.y + 3, 9, 3, '#829354');
      if (noise(seed + 2) > .28) grass(ctx, x + 2, p.y, seed);
      ellipse(ctx, x + 12, p.y + 23 + noise(seed + 3) * 60, 2.6, 1.8, 'rgba(149,134,99,.16)', -.2);
      if (noise(seed + 4) > .74) {
        ctx.strokeStyle = '#536047'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, p.y + 10); ctx.bezierCurveTo(x + 9, p.y + 27, x - 16, p.y + 31, x - 4, p.y + 56); ctx.stroke();
      }
      if (noise(seed + 7) > .92) fern(ctx, x + 8, p.y + 1, .55 + noise(seed + 8) * .24, '#658051', x % 40 ? -1 : 1);
      if (noise(seed + 9) > .956 && x > p.x + 20 && x < p.x + p.w - 30) {
        const mw = 14 + noise(seed + 10) * 10;
        mushroom(ctx, x, p.y - mw * .9, mw, mw * .9, seed, true);
      }
    }
    // Exposed edges make the gaps legible at a glance.
    ctx.fillStyle = '#4f5d3e';
    ctx.fillRect(p.x, p.y + 8, 5, 26);
    ctx.fillRect(p.x + p.w - 5, p.y + 8, 5, 26);
  }

  function cloudPlatform(ctx, p) {
    const shade = ctx.createLinearGradient(0, p.y, 0, p.y + 46);
    shade.addColorStop(0, '#fffdf0'); shade.addColorStop(.26, '#f8fcff');
    shade.addColorStop(.62, '#bdd4ea'); shade.addColorStop(1, '#6c8fbe');
    const count = Math.max(3, Math.ceil(p.w / 38));
    const lobes = [];
    for (let j = 0; j < count; j++) {
      const step = (p.w - 26) / (count - 1);
      const radius = Math.min(28, step * .75 + 9);
      lobes.push({ x: p.x + 13 + j * step, y: p.y + 14 + noise(p.x + j) * 6,
        rx: radius, ry: 14 + noise(p.x + j + 42) * 9 });
    }
    // Paint a thin outer silhouette beneath the opaque body, without drawing
    // overlapping internal outlines. Distant clouds have no such edge.
    for (const margin of [1.5, 0]) {
      const color = margin ? '#6b88b1' : shade;
      rounded(ctx, p.x - margin, p.y + 6 - margin, p.w + margin * 2, 26 + margin * 2, 13 + margin, color);
      for (const lobe of lobes) ellipse(ctx, lobe.x, lobe.y, lobe.rx + margin, lobe.ry + margin, color);
    }
    // A warm, outlined level ridge marks the physical landing height.
    ctx.strokeStyle = '#6682a8'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x + 8, p.y + 1); ctx.lineTo(p.x + p.w - 8, p.y + 1); ctx.stroke();
    ctx.strokeStyle = '#fff3bf'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(83,116,165,.48)'; ctx.lineWidth = 1.3;
    for (let j = 0; j < count - 1; j++) {
      const x = p.x + 26 + j * (p.w - 40) / Math.max(1, count - 2);
      ctx.beginPath(); ctx.moveTo(x, p.y + 22); ctx.quadraticCurveTo(x + 11, p.y + 28, x + 18, p.y + 20); ctx.stroke();
    }
    for (let j = 0; j < Math.floor(p.w / 65); j++) {
      const x = p.x + 34 + j * 65;
      ellipse(ctx, x, p.y + 10, 10, 1.4, 'rgba(255,255,255,.5)', -.1);
    }
  }

  function platform(ctx, p, camera) {
    if (p.kind === 'cloud') {
      cloudPlatform(ctx, p);
    } else if (p.kind === 'mushroom') {
      mushroom(ctx, p.x, p.y, p.w, Math.max(p.h, 530 - p.y), p.x * .3);
    } else if (p.kind === 'stone') {
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      g.addColorStop(0, '#697b70'); g.addColorStop(1, '#344c48');
      rounded(ctx, p.x, p.y, p.w, p.h, 8, g);
      ctx.strokeStyle = '#253f3d'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x + p.w * .31, p.y + 6); ctx.lineTo(p.x + p.w * .35, p.y + p.h * .4); ctx.lineTo(p.x + p.w * .26, p.y + p.h * .63); ctx.stroke();
      ctx.fillStyle = '#86916a'; ctx.fillRect(p.x + 6, p.y, p.w - 12, 3);
      for (let x = p.x + 6; x < p.x + p.w - 6; x += 15) ellipse(ctx, x, p.y + 3, 9, 3, '#708551');
      fern(ctx, p.x + p.w - 15, p.y, .44, '#708c59', -1);
    } else if (p.kind === 'log') {
      rounded(ctx, p.x, p.y, p.w, p.h, 11, '#534b38');
      ctx.strokeStyle = '#837254'; ctx.lineWidth = 2;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath(); ctx.moveTo(p.x + 14, p.y + 8 + j * 7); ctx.bezierCurveTo(p.x + p.w * .4, p.y + 3 + j * 7, p.x + p.w * .6, p.y + 13 + j * 7, p.x + p.w - 10, p.y + 6 + j * 7); ctx.stroke();
      }
      ellipse(ctx, p.x + p.w - 8, p.y + p.h * .5, 7, p.h * .43, '#968665');
      ellipse(ctx, p.x + p.w - 8, p.y + p.h * .5, 3.5, p.h * .28, '#675940');
      ctx.fillStyle = '#819358'; ctx.fillRect(p.x + 6, p.y, p.w - 12, 3);
      for (let x = p.x + 16; x < p.x + p.w - 10; x += 28) grass(ctx, x, p.y, x);
    } else ground(ctx, p, camera);
  }

  function firefly(ctx, f, time) {
    const y = f.y + Math.sin(time * 2.4 + f.x * .05) * 4;
    glow(ctx, f.x, y, 27, 'rgba(255,201,91,.23)');
    const wings = .9 + Math.sin(time * 19 + f.x) * .35;
    ellipse(ctx, f.x - 4, y - 2, 4 * wings, 2.5, 'rgba(237,246,208,.69)', -.5);
    ellipse(ctx, f.x + 4, y - 2, 4 * wings, 2.5, 'rgba(237,246,208,.69)', .5);
    ellipse(ctx, f.x, y + 1, 3.4, 4.4, '#ffd771');
    ellipse(ctx, f.x, y - 2, 2, 2, '#fff1bc');
  }

  function enemy(ctx, e, time) {
    if (e.kind === 'phoenix') { phoenix(ctx, e, time); return; }
    const bob = Math.sin(time * 8 + e.x) * 1.5;
    ctx.save(); ctx.translate(e.x + e.w * .5, e.y + e.h + bob);
    ellipse(ctx, 0, 1, 18, 4, 'rgba(6,23,22,.27)');
    for (const side of [-1, 1]) {
      const step = Math.sin(time * 9 + side * 1.8) * 3;
      rounded(ctx, side * 10 - 4 + step, -5, 9, 5, 3, '#2b3834');
    }
    ctx.fillStyle = '#4c5941';
    for (let j = 0; j < 9; j++) {
      const angle = Math.PI + j * Math.PI / 8;
      const x = Math.cos(angle) * 16;
      const y = -11 + Math.sin(angle) * 13;
      ctx.beginPath(); ctx.moveTo(x - 4, y + 3); ctx.lineTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 9); ctx.lineTo(x + 4, y + 3); ctx.fill();
    }
    const body = ctx.createRadialGradient(-5, -20, 0, 0, -13, 22);
    body.addColorStop(0, '#839165'); body.addColorStop(.55, '#62704e'); body.addColorStop(1, '#35473b');
    ellipse(ctx, 0, -13, 18, 14, body);
    ctx.strokeStyle = 'rgba(34,58,38,.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-12, -18); ctx.quadraticCurveTo(-5, -10, -12, -5); ctx.moveTo(10, -24); ctx.quadraticCurveTo(4, -17, 12, -10); ctx.stroke();
    ellipse(ctx, -5, -14, 3.5, 4, '#f4d59a'); ellipse(ctx, 6, -14, 3.5, 4, '#f4d59a');
    ellipse(ctx, -4 + Math.sign(e.vx), -14, 1.6, 2.3, '#2a3430'); ellipse(ctx, 7 + Math.sign(e.vx), -14, 1.6, 2.3, '#2a3430');
    ctx.strokeStyle = '#35473b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-9, -20); ctx.lineTo(-1, -18); ctx.moveTo(3, -18); ctx.lineTo(11, -20); ctx.stroke();
    ellipse(ctx, 0, -6, 2, 1.2, '#293a31');
    ctx.restore();
  }

  function phoenix(ctx, e, time) {
    ctx.save(); ctx.translate(e.x + e.w * .5, e.y + e.h * .5); ctx.scale(Math.sign(e.vx) || 1, 1);
    const flap = Math.sin(time * 13 + e.x * .01);
    glow(ctx, 0, 3, 35, 'rgba(255,176,81,.15)');
    // Three curled flame feathers form a tiny phoenix's tail.
    for (let j = 0; j < 3; j++) {
      const tailY = 1 + j * 4;
      ctx.fillStyle = ['#dc7550', '#f0a259', '#ffe39a'][j];
      ctx.beginPath(); ctx.moveTo(-6, tailY); ctx.quadraticCurveTo(-23, tailY + 12, -29 - j * 2, tailY - 6 + flap * 2);
      ctx.quadraticCurveTo(-15, tailY + 5, -7, tailY - 4); ctx.fill();
    }
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 5, -1); ctx.rotate(side * (.5 + flap * .38));
      const wing = ctx.createLinearGradient(0, 0, side * 23, -17);
      wing.addColorStop(0, '#d97769'); wing.addColorStop(.65, '#eeac73'); wing.addColorStop(1, '#fff1b6');
      ctx.fillStyle = wing;
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(side * 16, -2, side * 22, -22);
      ctx.quadraticCurveTo(side * 7, -15, side * 9, -4); ctx.quadraticCurveTo(side * 10, 3, 0, 5); ctx.fill();
      ctx.strokeStyle = '#fff0b1'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(side * 5, 0); ctx.quadraticCurveTo(side * 13, -7, side * 19, -17); ctx.stroke();
      ctx.restore();
    }
    const body = ctx.createRadialGradient(4, -6, 1, 0, 1, 16);
    body.addColorStop(0, '#fff0b0'); body.addColorStop(.6, '#eaaa77'); body.addColorStop(1, '#c96665');
    ellipse(ctx, 0, 2, 12, 13, body, -.3);
    ellipse(ctx, 8, -7, 8, 9, '#f6c38a');
    ctx.fillStyle = '#f08f64'; ctx.beginPath(); ctx.moveTo(4, -13); ctx.quadraticCurveTo(4, -24, 11, -24);
    ctx.quadraticCurveTo(7, -19, 12, -14); ctx.fill();
    ctx.fillStyle = '#fff0b1'; ctx.beginPath(); ctx.moveTo(13, -6); ctx.lineTo(22, -4); ctx.lineTo(13, -1); ctx.fill();
    ellipse(ctx, 10, -8, 2.2, 3, '#42334b'); ellipse(ctx, 10.7, -9, .7, 1, '#fff4d8');
    ellipse(ctx, 7, -2, 2.7, 1.5, 'rgba(202,111,118,.45)');
    ctx.restore();
  }

  function checkpoint(ctx, c, time, theme = 'forest') {
    const y = c.y;
    ctx.strokeStyle = '#8f7952'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c.x, y); ctx.lineTo(c.x, y - 82); ctx.quadraticCurveTo(c.x + 1, y - 95, c.x + 24, y - 90); ctx.stroke();
    ctx.strokeStyle = '#d6bd7e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.x + 22, y - 88); ctx.lineTo(c.x + 22, y - 75); ctx.stroke();
    glow(ctx, c.x + 22, y - 57, c.active ? 61 : 37, c.active ? 'rgba(255,205,103,.24)' : 'rgba(199,211,159,.1)');
    rounded(ctx, c.x + 11, y - 73, 22, 30, 4, '#493e36');
    const light = c.active ? '#ffe4a1' : '#a7be96';
    rounded(ctx, c.x + 15, y - 69, 14, 22, 2, light);
    ctx.fillStyle = '#77634b'; ctx.beginPath(); ctx.moveTo(c.x + 8, y - 74); ctx.lineTo(c.x + 22, y - 81); ctx.lineTo(c.x + 36, y - 74); ctx.fill();
    ctx.strokeStyle = '#6f5b41'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.x + 22, y - 69); ctx.lineTo(c.x + 22, y - 47); ctx.moveTo(c.x + 14, y - 57); ctx.lineTo(c.x + 30, y - 57); ctx.stroke();
    if (c.active) ellipse(ctx, c.x + 22, y - 58 + Math.sin(time * 4), 2, 4, '#fff5d0');
    if (theme === 'sky') {
      for (const side of [-1, 1]) ellipse(ctx, c.x + side * 8, y - 5, 9, 3, '#ead6a6', side * .3);
    } else fern(ctx, c.x - 10, y, .65, '#698350', -1);
  }

  function goal(ctx, g, time) {
    if (g.kind === 'launch') { launchFlower(ctx, g, time); return; }
    if (g.kind === 'descent') { descentGate(ctx, g, time); return; }
    if (g.kind === 'boss') return;
    const cx = g.x + g.w * .5;
    const bottom = g.y + g.h;
    glow(ctx, cx, g.y + g.h * .48, 125, 'rgba(137,207,182,.14)');
    const portal = ctx.createRadialGradient(cx, g.y + 72, 6, cx, g.y + 72, 80);
    portal.addColorStop(0, 'rgba(184,221,197,.24)'); portal.addColorStop(.7, 'rgba(79,142,143,.12)'); portal.addColorStop(1, 'rgba(51,107,112,0)');
    ctx.fillStyle = portal; ctx.beginPath(); ctx.ellipse(cx, g.y + 82, g.w * .44, 58, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#607970'; ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(g.x, bottom); ctx.lineTo(g.x, g.y + 54);
    ctx.bezierCurveTo(g.x, g.y - 13, g.x + g.w, g.y - 13, g.x + g.w, g.y + 54); ctx.lineTo(g.x + g.w, bottom); ctx.stroke();
    ctx.strokeStyle = '#9ca588'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g.x + 5, bottom - 6); ctx.lineTo(g.x + 5, g.y + 54);
    ctx.bezierCurveTo(g.x + 5, g.y + 2, g.x + g.w - 5, g.y + 2, g.x + g.w - 5, g.y + 54); ctx.lineTo(g.x + g.w - 5, bottom - 6); ctx.stroke();
    for (const side of [g.x, g.x + g.w]) {
      for (let j = 0; j < 3; j++) {
        const yy = g.y + 58 + j * 23;
        ctx.strokeStyle = '#405f58'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(side - 8, yy); ctx.lineTo(side + 8, yy - 2); ctx.stroke();
      }
      fern(ctx, side, bottom, .82, '#668659', side === g.x ? 1 : -1);
      for (let j = 0; j < 5; j++) ellipse(ctx, side + Math.sin(j * 2) * 9, bottom - j * 17, 6, 3, '#71895d', -.4);
    }
    ellipse(ctx, cx, g.y + 11, 18, 18, '#354e4c');
    ellipse(ctx, cx, g.y + 10, 11, 11, '#dfd39b'); ellipse(ctx, cx + 5, g.y + 6, 9, 10, '#354e4c');
    for (let j = 0; j < 10; j++) {
      const a = time * .23 + j * TAU / 10;
      const px = cx + Math.cos(a) * (g.w * .35);
      const py = g.y + 77 + Math.sin(a) * 43;
      ellipse(ctx, px, py, 1.8, 1.8, 'rgba(220,237,193,.7)');
    }
    rounded(ctx, g.x - 15, bottom - 6, g.w + 30, 9, 4, '#7c8865');
  }

  function launchFlower(ctx, g, time) {
    const cx = g.x + g.w * .5;
    const bottom = g.y + g.h;
    const flowerY = bottom - 61;
    glow(ctx, cx, flowerY, 115, 'rgba(255,213,152,.18)');
    ctx.strokeStyle = '#7f9361'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, bottom); ctx.quadraticCurveTo(cx - 15, bottom - 27, cx, flowerY + 17); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#79966d'; ctx.beginPath(); ctx.moveTo(cx, bottom - 8);
      ctx.quadraticCurveTo(cx + side * 48, bottom - 43, cx + side * 44, bottom - 17);
      ctx.quadraticCurveTo(cx + side * 27, bottom + 4, cx, bottom - 8); ctx.fill();
    }
    for (let j = 0; j < 7; j++) {
      const angle = -Math.PI + j * Math.PI / 6;
      const x = cx + Math.cos(angle) * 39;
      const y = flowerY + Math.sin(angle) * 14;
      const petal = ctx.createLinearGradient(0, y - 47, 0, y + 21);
      petal.addColorStop(0, '#e8c6cb'); petal.addColorStop(.5, '#ad8eb9'); petal.addColorStop(1, '#735d99');
      ellipse(ctx, x, y - 12, 15, 36, petal, Math.cos(angle) * .9);
      ctx.strokeStyle = 'rgba(255,224,181,.65)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x + Math.cos(angle) * 13, y - 29); ctx.stroke();
    }
    ellipse(ctx, cx, flowerY + 4, 35, 13, '#d6bb88');
    ellipse(ctx, cx, flowerY, 29, 9, '#ffdda0');
    glow(ctx, cx, flowerY, 53, 'rgba(255,237,174,.38)');
    for (let j = 0; j < 10; j++) {
      const rise = (time * 55 + j * 24) % 230;
      const x = cx + Math.sin(rise * .04 + j * .6) * (19 + rise * .1);
      const y = flowerY - rise;
      ellipse(ctx, x, y, 2.3, 4, `rgba(255,233,184,${.65 * (1 - rise / 230)})`, .2);
    }
    rounded(ctx, g.x - 20, bottom - 3, g.w + 40, 7, 4, '#87956b');
  }

  function descentGate(ctx, g, time) {
    const cx = g.x + g.w * .5;
    const bottom = g.y + g.h;
    glow(ctx, cx, g.y + g.h * .5, 102, 'rgba(255,234,174,.28)');
    ctx.strokeStyle = '#d0c4e4'; ctx.lineWidth = 15; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(g.x, bottom - 7); ctx.lineTo(g.x, g.y + 48);
    ctx.bezierCurveTo(g.x, g.y - 7, g.x + g.w, g.y - 7, g.x + g.w, g.y + 48);
    ctx.lineTo(g.x + g.w, bottom - 7); ctx.stroke();
    ctx.strokeStyle = '#fff3cb'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(g.x + 3, bottom - 9); ctx.lineTo(g.x + 3, g.y + 48);
    ctx.bezierCurveTo(g.x + 3, g.y + 3, g.x + g.w - 3, g.y + 3, g.x + g.w - 3, g.y + 48);
    ctx.lineTo(g.x + g.w - 3, bottom - 9); ctx.stroke();
    skyCloud(ctx, cx, bottom - 3, g.w + 58, 19);
    for (let j = 0; j < 3; j++) {
      const y = g.y + 39 + j * 22 + Math.sin(time * 2) * 3;
      ctx.strokeStyle = `rgba(176,132,186,${.35 + j * .12})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx - 9, y); ctx.lineTo(cx, y + 7); ctx.lineTo(cx + 9, y); ctx.stroke();
    }
    for (let j = 0; j < 6; j++) {
      const fall = (time * 27 + j * 20) % 115;
      ellipse(ctx, cx + Math.sin(j * 3 + time) * 22, bottom + fall, 1.8, 3.5,
        `rgba(206,156,200,${.35 * (1 - fall / 115)})`);
    }
    ellipse(ctx, cx, g.y + 8, 13, 13, '#b3a0ca');
    ellipse(ctx, cx, g.y + 8, 8, 8, '#ffedba');
  }

  function rocketBoot(ctx, x, y, w, h, active, time, flying = false) {
    if (active) {
      const flameHeight = (flying ? 25 : 13) + Math.sin(time * 25 + x) * 3;
      glow(ctx, x + w * .4, y + h + 4, 21, 'rgba(131,238,235,.23)');
      ctx.fillStyle = 'rgba(80,213,231,.73)';
      ctx.beginPath(); ctx.moveTo(x + 2, y + h - 1); ctx.lineTo(x + w * .65, y + h - 1);
      ctx.quadraticCurveTo(x + w * .65, y + h + flameHeight * .4, x + w * .35, y + h + flameHeight);
      ctx.quadraticCurveTo(x + 1, y + h + flameHeight * .4, x + 2, y + h - 1); ctx.fill();
      ctx.fillStyle = '#effde4'; ctx.beginPath(); ctx.moveTo(x + 3, y + h);
      ctx.lineTo(x + w * .57, y + h); ctx.lineTo(x + w * .36, y + h + flameHeight * .64); ctx.fill();
    }
    rounded(ctx, x + 1, y, w * .66, h, 2, '#ac8b5a');
    rounded(ctx, x, y + h * .42, w, h * .6, 3, '#c7a56b');
    rounded(ctx, x + 1, y + h - 1, w * .69, 3, 1, '#547573');
    ctx.fillStyle = '#f3d498'; ctx.fillRect(x + 1, y + 1, w * .64, 2);
    ellipse(ctx, x + w * .37, y + h * .44, Math.max(1.8, w * .15), Math.max(1.6, h * .2), '#b1ece0');
    ellipse(ctx, x + w * .4, y + h * .4, Math.max(1, w * .07), Math.max(.8, h * .1), '#f4fff0');
  }

  function bootShrine(ctx, artifact, time) {
    const cx = artifact.x + artifact.w * .5;
    const base = artifact.y + artifact.h + 9;
    const bob = Math.sin(time * 2.5) * 3;
    glow(ctx, cx, artifact.y + 8, 79, artifact.collected ? 'rgba(191,217,218,.07)' : 'rgba(250,223,162,.27)');
    const stone = ctx.createLinearGradient(0, base, 0, base + 21);
    stone.addColorStop(0, '#ece4ce'); stone.addColorStop(1, '#a9acc8');
    rounded(ctx, cx - 30, base, 60, 14, 6, stone);
    rounded(ctx, cx - 23, base - 5, 46, 7, 3, '#f9edd2');
    ctx.strokeStyle = '#c3ac87'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 10, base + 6); ctx.lineTo(cx, base + 11); ctx.lineTo(cx + 10, base + 6); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#cab9c8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + side * 27, base); ctx.quadraticCurveTo(cx + side * 47, base - 29, cx + side * 27, base - 64); ctx.stroke();
      for (let j = 0; j < 3; j++) ellipse(ctx, cx + side * (34 + j * 2), base - 17 - j * 12, 8, 3, '#f7e8c9', side * -.8);
    }
    if (artifact.collected) {
      ellipse(ctx, cx, base - 23, 3, 3, '#d7e9da'); return;
    }
    ctx.save(); ctx.translate(cx, artifact.y + 7 + bob);
    ctx.strokeStyle = 'rgba(255,244,196,.72)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 8, 26, 29, .15, 0, TAU); ctx.stroke();
    rocketBoot(ctx, -16, -6, 15, 24, false, time);
    rocketBoot(ctx, 3, -9, 15, 24, false, time);
    ctx.restore();
    for (let j = 0; j < 5; j++) {
      const angle = time * .7 + j * TAU / 5;
      ellipse(ctx, cx + Math.cos(angle) * 31, artifact.y + 15 + Math.sin(angle) * 29, 1.6, 2.4, '#fff3c4');
    }
  }

  function player(ctx, p, time, boots) {
    if (p.invulnerable > 0 && Math.floor(time * 13) % 2) ctx.globalAlpha = .52;
    ctx.save(); ctx.translate(p.x + p.w * .5, p.y); ctx.scale(p.facing || 1, 1);
    const moving = p.grounded && Math.abs(p.vx) > 10;
    const walk = moving ? Math.sin(time * 15) : 0;
    const bob = moving ? Math.abs(walk) * 1.2 : Math.sin(time * 2) * .3;
    if (p.grounded) ellipse(ctx, 0, p.h + 1, 19, 4, 'rgba(6,20,25,.28)');
    ctx.translate(0, -bob);
    // Cape, boots and robe are deliberately chunky at the actual play scale.
    ctx.fillStyle = '#413750'; ctx.beginPath(); ctx.moveTo(-10, 24); ctx.quadraticCurveTo(-23, 32, -19, 45); ctx.quadraticCurveTo(-10, 48, -1, 40); ctx.fill();
    if (boots && boots.owned) {
      rocketBoot(ctx, -12 + walk * 3, 42, 13, 9, boots.active > 0, time, !p.grounded);
      rocketBoot(ctx, 2 - walk * 3, 42, 15, 9, boots.active > 0, time + .1, !p.grounded);
    } else {
      rounded(ctx, -12 + walk * 3, 43, 13, 8, 3, '#2d3334');
      rounded(ctx, 2 - walk * 3, 43, 15, 8, 3, '#373c3b');
    }
    const robe = ctx.createLinearGradient(-12, 0, 13, 0);
    robe.addColorStop(0, '#544774'); robe.addColorStop(.6, '#8972a5'); robe.addColorStop(1, '#65567f');
    ctx.fillStyle = robe; ctx.beginPath(); ctx.moveTo(-9, 24); ctx.quadraticCurveTo(-14, 30, -14, 43); ctx.quadraticCurveTo(1, 48, 15, 43); ctx.quadraticCurveTo(15, 31, 8, 24); ctx.fill();
    ctx.strokeStyle = '#baa779'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, 34); ctx.quadraticCurveTo(0, 37, 12, 34); ctx.stroke();
    rounded(ctx, 1, 34, 4, 4, 1, '#dfc990');
    // The warm face and oversized nose stay readable against the cool forest.
    ellipse(ctx, 0, 19, 10, 12, '#eac6a0');
    ellipse(ctx, -9, 19, 3, 4, '#d4a780');
    ellipse(ctx, 6, 18, 1.6, 2, '#2c3232');
    ellipse(ctx, 9, 22, 5, 4, '#f1caa2');
    ellipse(ctx, 2, 23, 3.5, 2.2, 'rgba(208,126,112,.4)');
    ctx.fillStyle = '#e5e3d5'; ctx.beginPath(); ctx.moveTo(-10, 22); ctx.quadraticCurveTo(-11, 34, -1, 42); ctx.quadraticCurveTo(9, 38, 11, 26); ctx.quadraticCurveTo(5, 30, 2, 27); ctx.quadraticCurveTo(-4, 28, -10, 22); ctx.fill();
    ctx.strokeStyle = '#fff0d5'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-6, 29); ctx.quadraticCurveTo(-5, 35, -1, 38); ctx.moveTo(1, 30); ctx.lineTo(2, 36); ctx.stroke();
    // A bent tip and gold star distinguish the dwarf's floppy wizard hat.
    const hat = ctx.createLinearGradient(-10, -14, 12, 12);
    hat.addColorStop(0, '#9a7ab4'); hat.addColorStop(.65, '#6d538e'); hat.addColorStop(1, '#51456e');
    ctx.fillStyle = hat; ctx.beginPath(); ctx.moveTo(-13, 11); ctx.quadraticCurveTo(-6, -5, -8, -15); ctx.quadraticCurveTo(-3, -26, 10, -21); ctx.quadraticCurveTo(18, -18, 16, -12); ctx.quadraticCurveTo(8, -17, 6, -8); ctx.lineTo(13, 11); ctx.fill();
    ellipse(ctx, 0, 10, 18, 4.5, '#735b90', -.07);
    ctx.strokeStyle = '#c9ad77'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 5); ctx.quadraticCurveTo(1, 7, 11, 5); ctx.stroke();
    ctx.fillStyle = '#e7d59a'; ctx.beginPath(); ctx.moveTo(1, -5); ctx.lineTo(3, -1); ctx.lineTo(7, 0); ctx.lineTo(3, 2); ctx.lineTo(2, 6); ctx.lineTo(0, 2); ctx.lineTo(-4, 1); ctx.lineTo(0, -1); ctx.fill();
    // Sleeve and hand hold a crooked wooden wand with a constantly smoking tip.
    ctx.strokeStyle = '#79608e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(10, 29); ctx.lineTo(20, 32); ctx.stroke();
    ellipse(ctx, 20, 31, 3.3, 3.6, '#e8bc95');
    ctx.strokeStyle = '#bda27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 34); ctx.lineTo(29, 19); ctx.lineTo(31, 18); ctx.stroke();
    glow(ctx, 31, 17, 14, 'rgba(236,208,150,.19)'); ellipse(ctx, 31, 17, 2, 2, '#f0dbad');
    for (let j = 0; j < 4; j++) {
      const drift = (time * 11 + j * 8) % 34;
      const px = 31 + Math.sin(drift * .12 + j) * drift * .12;
      ellipse(ctx, px, 13 - drift, 2 + drift * .09, 2.5 + drift * .09, `rgba(210,213,211,${.27 * (1 - drift / 34)})`);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function guardianTorso(ctx, lean, warning, dying = false, arms = true) {
    const bark = ctx.createLinearGradient(-42, 0, 44, 0);
    bark.addColorStop(0, '#4b5141'); bark.addColorStop(.48, '#7e7852'); bark.addColorStop(1, '#454e3e');
    ctx.fillStyle = bark; ctx.beginPath(); ctx.moveTo(-31 + lean, 52);
    ctx.bezierCurveTo(-53 + lean, 65, -47 + lean, 96, -33, 115);
    ctx.quadraticCurveTo(0, 128, 33, 115); ctx.bezierCurveTo(47 + lean, 96, 52 + lean, 65, 29 + lean, 52);
    ctx.quadraticCurveTo(0 + lean, 38, -31 + lean, 52); ctx.fill();
    if (arms) {
      for (const side of [-1, 1]) {
        ctx.strokeStyle = side < 0 ? '#4d5942' : '#67694b'; ctx.lineWidth = 20; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(side * 36 + lean, 68); ctx.quadraticCurveTo(side * 55 + lean, 84, side * 48 + lean, 112); ctx.stroke();
        ellipse(ctx, side * 46 + lean, 110, 13, 17, '#68724e', side * .15);
        ctx.strokeStyle = '#9c9562'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(side * 47 + lean, 95); ctx.lineTo(side * 50 + lean, 115); ctx.stroke();
        ellipse(ctx, side * 35 + lean, 58, 23, 13, '#71815a', side * -.2);
        fern(ctx, side * 37 + lean, 63, .45, '#9bac65', side);
      }
    }
    ctx.strokeStyle = '#b09c65'; ctx.lineWidth = 2;
    for (let j = 0; j < 5; j++) {
      const x = -24 + j * 12;
      ctx.beginPath(); ctx.moveTo(x + lean, 57); ctx.quadraticCurveTo(x - 7 + lean, 78, x, 113); ctx.stroke();
    }
    const heartY = 87;
    glow(ctx, lean, heartY, warning ? 44 : 27, dying ? 'rgba(156,162,98,.05)' : warning ? 'rgba(255,160,95,.45)' : 'rgba(220,218,139,.15)');
    ellipse(ctx, lean, heartY, 16, 19, '#454e3c');
    ellipse(ctx, lean, heartY, 9, 12, dying ? '#8a9165' : warning ? '#ffd192' : '#d2d78e');
    ctx.strokeStyle = dying ? '#a8a878' : warning ? '#fff0b6' : '#eff0b2'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(lean, heartY - 8); ctx.lineTo(lean + 5, heartY); ctx.lineTo(lean, heartY + 8);
    ctx.lineTo(lean - 5, heartY); ctx.closePath(); ctx.stroke();
  }

  function guardianHead(ctx, lean, warning, dying = false) {
    // Antlers stay above the brow, with warm leaves that echo the dwarf's wand.
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#95885e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(side * 19 + lean, 37); ctx.quadraticCurveTo(side * 30 + lean, 19, side * 38 + lean, 4);
      ctx.moveTo(side * 30 + lean, 21); ctx.lineTo(side * 46 + lean, 15);
      ctx.moveTo(side * 34 + lean, 13); ctx.lineTo(side * 28 + lean, 2); ctx.stroke();
      ellipse(ctx, side * 43 + lean, 11, 8, 3, '#bea771', side * -.7);
      ellipse(ctx, side * 28 + lean, 1, 6, 3, '#a5ad65', side * -.8);
    }
    const head = ctx.createRadialGradient(-5 + lean, 38, 2, lean, 44, 39);
    head.addColorStop(0, '#929066'); head.addColorStop(1, '#525e43');
    ellipse(ctx, lean, 43, 33, 29, head);
    ellipse(ctx, lean + 3, 60, 24, 13, '#7c7953');
    ctx.fillStyle = '#98905c'; ctx.beginPath(); ctx.moveTo(-19 + lean, 61); ctx.quadraticCurveTo(-12 + lean, 90, -7 + lean, 72);
    ctx.lineTo(3 + lean, 86); ctx.lineTo(12 + lean, 70); ctx.quadraticCurveTo(19 + lean, 83, 22 + lean, 60); ctx.fill();
    if (dying) {
      ctx.strokeStyle = '#354b3c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const x of [-13, 14]) {
        ctx.beginPath(); ctx.moveTo(x - 4 + lean, 43);
        ctx.quadraticCurveTo(x + lean, 46, x + 4 + lean, 43); ctx.stroke();
      }
    } else {
      for (const x of [-13, 14]) {
        ellipse(ctx, x + lean, 42, 7, 6, '#354b3c');
        ellipse(ctx, x + lean + 2, 43, 3.7, 4, warning ? '#ffcc89' : '#e8dc91');
        ellipse(ctx, x + lean + 3, 42, 1.2, 1.5, '#fff4bc');
      }
    }
    ctx.strokeStyle = '#485b41'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-22 + lean, 34); ctx.lineTo(-7 + lean, 38);
    ctx.moveTo(7 + lean, 38); ctx.lineTo(23 + lean, 33); ctx.stroke();
    ellipse(ctx, lean + 2, 54, 7, 5, '#535b3d');
    ctx.strokeStyle = '#474e36'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-13 + lean, 65); ctx.quadraticCurveTo(2 + lean, 68, 17 + lean, 64); ctx.stroke();
    for (let j = 0; j < 6; j++) ellipse(ctx, -22 + j * 8 + lean, 20 + Math.sin(j) * 4, 8, 4, '#82925d', j * .4);
  }

  function bossDefeat(ctx, b) {
    const kneelDuration = MossEngine.BOSS_KNEEL_DURATION || .75;
    const fallDuration = MossEngine.BOSS_FALL_DURATION || .65;
    const elapsed = Math.max(0, b.defeatTime || 0);
    const smooth = value => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p); };
    const kneel = smooth(elapsed / (kneelDuration * .62));
    const fall = smooth((elapsed - kneelDuration) / fallDuration);
    const mix = (from, to, amount) => from + (to - from) * amount;
    const angle = mix(kneel * .14, Math.PI * .48, fall);
    const hipX = -12 * fall;
    const hipY = mix(-35 + 19 * kneel, -48, fall);
    const project = (x, y) => ({ x: hipX + x * Math.cos(angle) - y * Math.sin(angle), y: hipY + x * Math.sin(angle) + y * Math.cos(angle) });
    ctx.save(); ctx.translate(b.x + b.w * .5, b.y + b.h); ctx.scale(b.dir || 1, 1);
    ellipse(ctx, 24 * fall, 1, 64 + 56 * fall, 8, 'rgba(8,24,23,.3)');
    // Root thighs fold onto grounded knees; the feet trail behind the falling body.
    for (const side of [-1, 1]) {
      const hip = project(side * 20, -9);
      const kneeX = mix(mix(side * 35, side * 26 + 11, kneel), side * 19, fall);
      const kneeY = mix(-17, -5, kneel);
      const footX = mix(side * 35, kneeX - 31 - fall * 11, kneel);
      ctx.strokeStyle = side < 0 ? '#4d5942' : '#62694a'; ctx.lineWidth = 23; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.quadraticCurveTo(hip.x - 12, kneeY - 15, kneeX, kneeY); ctx.stroke();
      ctx.strokeStyle = '#525e43'; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(kneeX, kneeY); ctx.quadraticCurveTo(kneeX - 16, -8, footX, -7); ctx.stroke();
      ellipse(ctx, kneeX, -6, 14, 8, '#737751');
      rounded(ctx, footX - 15, -13 + kneel * 3, 34, 13 - kneel * 3, 5, '#686b47');
      ctx.strokeStyle = '#b8a16a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(footX - 5, -7); ctx.lineTo(footX - 8, -2);
      ctx.moveTo(kneeX + 2, -11); ctx.lineTo(kneeX - 2, -4); ctx.stroke();
    }
    // Rotate the torso around the hips, then articulate the arms separately so
    // the Guardian braces on the turf before his head comes down.
    ctx.save(); ctx.beginPath(); ctx.rect(-180, -220, 420, 220); ctx.clip();
    ctx.translate(hipX, hipY); ctx.rotate(angle); ctx.translate(0, -110);
    guardianTorso(ctx, 0, false, true, false); ctx.restore();
    for (const side of [-1, 1]) {
      const shoulder = project(side * 36, -42);
      const oldHand = project(side * 46, 0);
      const reach = smooth(fall * 1.7);
      const handX = mix(oldHand.x, 75 + side * 10, reach);
      const handY = mix(oldHand.y, -7, reach);
      ctx.strokeStyle = side < 0 ? '#4d5942' : '#67694b'; ctx.lineWidth = 19; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y);
      ctx.quadraticCurveTo(mix(shoulder.x + side * 14, handX - 21, reach), mix(shoulder.y + 22, -27, reach), handX, handY); ctx.stroke();
      ellipse(ctx, handX, handY, 14, mix(17, 7, reach), '#68724e', mix(side * .15, 0, reach));
      ellipse(ctx, shoulder.x, shoulder.y, 21, 13, '#71815a', angle + side * -.2);
      fern(ctx, shoulder.x, shoulder.y + 3, .4, '#9bac65', side);
    }
    const neck = project(0, -67);
    const headX = mix(neck.x, 112, fall);
    const headY = mix(neck.y, -21, fall);
    ctx.save(); ctx.translate(headX, headY); ctx.rotate(angle); ctx.scale(mix(1, .62, fall), 1); ctx.translate(0, -43);
    guardianHead(ctx, 0, false, true); ctx.restore();
    // A brief impact puff is driven by cinematic progress, never wall-clock time.
    const impact = elapsed - kneelDuration - fallDuration;
    if (impact >= 0 && impact < .4) {
      const progress = impact / .4;
      for (let j = 0; j < 8; j++) {
        const outward = j % 2 ? 1 : -1;
        const x = 110 + outward * (15 + progress * (26 + j * 4));
        const y = -3 - Math.sin(progress * Math.PI) * (8 + j * 2);
        ellipse(ctx, x, y, 3 + progress * 6, 2 + progress * 3, `rgba(201,190,148,${(1 - progress) * .28})`);
      }
    }
    ctx.restore();
  }

  function boss(ctx, b, time, arena) {
    const cx = b.x + b.w * .5;
    const bottom = b.y + b.h;
    const warning = b.phase === 'telegraph';
    const charging = b.phase === 'charge';
    const defeated = b.phase === 'kneel' || b.phase === 'fall' || b.phase === 'defeated' || b.health <= 0;
    if (defeated) { bossDefeat(ctx, b); return; }
    if (warning) {
      const pulse = .3 + (Math.sin(time * 13) + 1) * .18;
      glow(ctx, cx, bottom - 78, 110, `rgba(255,171,105,${pulse * .28})`);
      const reach = b.dir > 0 ? (arena ? arena.xMax : cx + 400) : (arena ? arena.xMin : cx - 400);
      ctx.strokeStyle = `rgba(255,199,115,${pulse})`; ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(cx + b.dir * 66, bottom - 17);
      ctx.lineTo(reach, bottom - 17); ctx.stroke(); ctx.setLineDash([]);
      for (let j = 0; j < 4; j++) {
        const x = cx + b.dir * (88 + j * 60);
        if ((b.dir > 0 && x > reach) || (b.dir < 0 && x < reach)) continue;
        ctx.beginPath(); ctx.moveTo(x - b.dir * 7, bottom - 35); ctx.lineTo(x, bottom - 28);
        ctx.lineTo(x - b.dir * 7, bottom - 21); ctx.stroke();
      }
    }
    ctx.save(); ctx.translate(cx, b.y); ctx.scale(b.dir || 1, 1);
    ellipse(ctx, 0, b.h + 1, 64, 8, 'rgba(8,24,23,.3)');
    if (charging) {
      for (let j = 0; j < 7; j++) {
        const distance = (time * 180 + j * 17) % 100;
        ellipse(ctx, -38 - distance, b.h - 5 - Math.sin(j) * 7, 6 + distance * .08, 4 + distance * .035,
          `rgba(194,179,135,${.27 * (1 - distance / 100)})`);
      }
    }
    const walk = charging ? Math.sin(time * 16) * 7 : Math.sin(time * 1.7) * 1.5;
    const lean = charging ? 8 : 0;
    // Heavy roots, gnarled shoulders and branch antlers make an original forest guardian.
    for (const side of [-1, 1]) {
      const step = side * walk;
      ctx.fillStyle = '#525e43'; ctx.beginPath(); ctx.moveTo(side * 22 - 12, 101);
      ctx.quadraticCurveTo(side * 35 - 12 + step, 127, side * 43 - 15 + step, 141);
      ctx.lineTo(side * 43 + 10 + step, 141); ctx.quadraticCurveTo(side * 36 + 12 + step, 121, side * 22 + 12, 101); ctx.fill();
      rounded(ctx, side * 29 - 16 + step, 132, 36, 13, 5, '#686b47');
      ctx.strokeStyle = '#b8a16a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(side * 30 - 7 + step, 137); ctx.lineTo(side * 30 - 11 + step, 143);
      ctx.moveTo(side * 30 + 3 + step, 136); ctx.lineTo(side * 30 + 3 + step, 143); ctx.stroke();
    }
    guardianTorso(ctx, lean, warning);
    guardianHead(ctx, lean, warning);
    if (b.invulnerable > 0) {
      ctx.globalCompositeOperation = 'screen';
      glow(ctx, lean, 79, 72, 'rgba(255,233,176,.48)');
    }
    ctx.restore();
  }

  function spell(ctx, s, time) {
    glow(ctx, s.x, s.y, 28, 'rgba(229,203,125,.26)');
    const direction = Math.sign(s.vx) || 1;
    ctx.strokeStyle = 'rgba(219,195,157,.35)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - direction * 19, s.y + Math.sin(time * 15) * 2); ctx.stroke();
    ellipse(ctx, s.x, s.y, 6, 4, '#eec982'); ellipse(ctx, s.x + direction * 1, s.y - 1, 3, 2.5, '#fff2c2');
  }

  function particles(ctx, list) {
    for (const p of list) {
      const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));
      ctx.globalAlpha = alpha;
      if (p.type === 'spark') {
        ctx.fillStyle = p.color || '#f5d48c';
        ctx.beginPath(); ctx.moveTo(p.x, p.y - p.size * 2); ctx.lineTo(p.x + p.size * .6, p.y);
        ctx.lineTo(p.x, p.y + p.size * 2); ctx.lineTo(p.x - p.size * .6, p.y); ctx.fill();
      } else ellipse(ctx, p.x, p.y, p.size, p.size * .8, p.color || '#cdd4c7');
    }
    ctx.globalAlpha = 1;
  }

  function arenaScenery(ctx, arena, b, time) {
    const bottom = b ? b.y + b.h : 530;
    for (const x of [arena.xMin, arena.xMax]) {
      glow(ctx, x, bottom - 40, 46, b && b.active && b.health > 0 ? 'rgba(233,195,126,.11)' : 'rgba(182,216,176,.08)');
      const stone = ctx.createLinearGradient(x - 10, 0, x + 10, 0);
      stone.addColorStop(0, '#455850'); stone.addColorStop(.5, '#7b8470'); stone.addColorStop(1, '#4b6156');
      rounded(ctx, x - 11, bottom - 76, 22, 78, 8, stone);
      ellipse(ctx, x, bottom - 65, 12, 5, '#7a8a68');
      ctx.strokeStyle = b && b.active && b.health > 0 ? '#e6c78c' : '#a9c09b'; ctx.lineWidth = 1.5;
      const y = bottom - 43;
      ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 11);
      ctx.lineTo(x - 5, y); ctx.closePath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
      fern(ctx, x - 8, bottom, .57, '#7d925a', x === arena.xMin ? -1 : 1);
      if (b && b.active && b.health > 0) {
        ctx.strokeStyle = `rgba(223,206,139,${.11 + Math.sin(time * 2) * .025})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, bottom - 79); ctx.quadraticCurveTo(x + Math.sin(time * 2) * 5, bottom - 150, x, bottom - 230); ctx.stroke();
      }
    }
  }

  function foreground(ctx, camera, theme = 'forest') {
    // A few low silhouettes frame the artwork without masking jumps or hazards.
    if (theme !== 'sky') {
      for (let j = 0; j < 9; j++) {
        const x = j * 225 - ((camera * .85) % 225);
        fern(ctx, x, H + 13, 1.45 + noise(j + 4) * .35, theme === 'dusk' ? '#232539' : '#102b29', j % 2 ? 1 : -1);
      }
    }
    const vignette = ctx.createRadialGradient(W * .5, H * .43, 160, W * .5, H * .45, W * .65);
    vignette.addColorStop(0, 'rgba(7,17,27,0)');
    vignette.addColorStop(1, theme === 'sky' ? 'rgba(103,130,174,.1)' : theme === 'dusk' ? 'rgba(23,17,39,.36)' : 'rgba(7,17,27,.29)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  }

  function transitionClouds(ctx, transition, time) {
    if (!transition || transition.kind === 'walk') return;
    const progress = Math.max(0, Math.min(1, transition.time / transition.duration));
    const opacity = Math.max(0, Math.min(1, (progress - .25) / .6));
    if (opacity <= 0) return;
    ctx.save(); ctx.globalAlpha = opacity * .75;
    for (let j = 0; j < 4; j++) {
      const y = H + 90 - progress * H * 1.45 + j * 105;
      skyCloud(ctx, W * .3 - Math.sin(time + j) * 50, y, W * .9, 100, 1, j * 17);
      skyCloud(ctx, W * .85 + Math.sin(time + j) * 35, y + 26, W * .75, 100, 1, j * 17 + 101);
    }
    ctx.restore();
  }

  function render(ctx, state, time) {
    const camera = state.camera || 0;
    const t = Number.isFinite(time) ? time : state.time || 0;
    const theme = state.theme || 'forest';
    ctx.save();
    background(ctx, camera, t, theme);
    ctx.save(); ctx.translate(-camera, 0);
    if (state.arena) arenaScenery(ctx, state.arena, state.boss, t);
    for (const p of state.platforms) {
      if (p.x + p.w < camera - 80 || p.x > camera + W + 80) continue;
      platform(ctx, p, camera);
    }
    for (const c of state.checkpoints) if (c.x > camera - 90 && c.x < camera + W + 90) checkpoint(ctx, c, t, theme);
    if (state.goal.x > camera - 180 && state.goal.x < camera + W + 180) goal(ctx, state.goal, t);
    if (state.artifact && state.artifact.x > camera - 100 && state.artifact.x < camera + W + 100) bootShrine(ctx, state.artifact, t);
    for (const f of state.fireflies) if (!f.collected && f.x > camera - 35 && f.x < camera + W + 35) firefly(ctx, f, t);
    for (const e of state.enemies) if (e.alive && e.x + e.w > camera - 30 && e.x < camera + W + 30) enemy(ctx, e, t);
    if (state.boss && state.boss.x + state.boss.w > camera - 150 && state.boss.x < camera + W + 150) boss(ctx, state.boss, t, state.arena);
    for (const s of state.spells) spell(ctx, s, t);
    player(ctx, state.player, t, state.boots);
    particles(ctx, state.particles);
    ctx.restore();
    foreground(ctx, camera, theme);
    transitionClouds(ctx, state.transition, t);
    ctx.restore();
  }

  window.MossRenderer = { render };
})();
