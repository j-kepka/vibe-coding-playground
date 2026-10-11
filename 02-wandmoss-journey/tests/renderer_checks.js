/* Browser pixel regressions for static scenery, parallax and boss defeat poses. */
(() => {
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const canvas = document.createElement('canvas');
  canvas.width = 1152;
  canvas.height = 648;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scene = MossEngine.createState(2);
  scene.platforms = [];
  scene.checkpoints = [];
  scene.fireflies = [];
  scene.enemies = [];
  scene.spells = [];
  scene.particles = [];
  scene.artifact = null;
  scene.goal.x = 1000000;
  scene.player.x = -1000000;
  const frame = (camera, time) => {
    scene.camera = camera;
    MossRenderer.render(ctx, scene, time);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  };
  const difference = (a, b) => {
    let changed = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) changed++;
    }
    return changed;
  };

  const fixed = frame(1700, 0);
  const later = frame(1700, 90);
  const stationaryChanges = difference(fixed, later);
  assert(stationaryChanges === 0, 'Cloud scenery must stay pixel-identical while time advances at a fixed camera');
  results.push({ name: 'Cloud scenery stays still while time advances', detail: { changedPixels: stationaryChanges } });

  const moved = frame(1800, 90);
  const parallaxChanges = difference(fixed, moved);
  assert(parallaxChanges > 10000, 'Moving the camera must scroll the sky scenery');
  const restored = frame(1700, 180);
  const returningChanges = difference(fixed, restored);
  assert(returningChanges === 0, 'Returning the camera must recover the same cloud shapes and positions');
  results.push({ name: 'Sky parallax follows the camera and returns to the same scenery', detail: { movedPixels: parallaxChanges, restoredChangedPixels: returningChanges } });

  const tiles = new Set();
  const originalDrawImage = ctx.drawImage;
  ctx.drawImage = function (source, ...args) {
    if (source instanceof HTMLCanvasElement) tiles.add(source);
    return originalDrawImage.call(this, source, ...args);
  };
  for (const camera of [0, 3000, 6400, 8999, 9001, 12857, 20001, 0]) frame(camera, 240);
  assert(tiles.size === 3, 'Camera movement must reuse three cloud layer canvases instead of generating new geometry');
  results.push({ name: 'Cloud parallax remains bounded and reuses scenery through tile wraps', detail: { layerCanvases: tiles.size } });

  const finale = MossEngine.createState(3);
  // A still background isolates the Guardian's articulated pose from scenery.
  finale.theme = 'sky';
  finale.camera = 0;
  finale.platforms = [];
  finale.checkpoints = [];
  finale.fireflies = [];
  finale.enemies = [];
  finale.spells = [];
  finale.particles = [];
  finale.arena = null;
  finale.goal.x = 1000000;
  finale.player.x = -1000000;
  finale.boss.x = 460;
  finale.boss.health = 0;
  finale.mode = 'bossDefeat';
  const defeatFrame = (progress, time = 0) => {
    finale.boss.defeatTime = progress;
    finale.boss.phase = progress < .75 ? 'kneel' : progress < 1.4 ? 'fall' : 'defeated';
    MossRenderer.render(ctx, finale, time);
    return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  };
  const standing = defeatFrame(0);
  const kneeling = defeatFrame(.65);
  const falling = defeatFrame(1.05);
  const faceDown = defeatFrame(1.95);
  const poseChanges = [difference(standing, kneeling), difference(kneeling, falling), difference(falling, faceDown)];
  assert(poseChanges.every(count => count > 1500), 'The Guardian must visibly kneel, fall forward and settle face-down in distinct poses');
  finale.boss.invulnerable = .22;
  const settledChanges = difference(faceDown, defeatFrame(1.95, 90));
  assert(settledChanges === 0, 'The defeated Guardian must stay still without attack cues or hit flashing');
  results.push({ name: 'Boss defeat visibly kneels, falls and settles without flicker', detail: { poseChangedPixels: poseChanges, settledChangedPixels: settledChanges } });
  return results;
})();
