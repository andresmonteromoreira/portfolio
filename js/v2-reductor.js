import * as T from 'three';
import {view, ease, vec, named} from './v2-three.js';

// Part groups, matched on the (accent-stripped) CAD names.
const G = {
  worm: /MR-01-01/, brgIn: /7207/, radialIn: /6007-2Z/, nutIn: /KM7/, washerIn: /MB7/, circlip: /DIN 471/,
  capIn: /MR-01-07/, capInBolts: /tornillo de tapa ciega/i, shimIn: /MR-01-08/, orTensor: /torica del tensor/i,
  drain: /tapon magnetico/i, sight: /visor de nivel/i,
  flange: /MR-04-03/, flangeBolts: /fijacion interior/i, sealIn: /12360/, orCentr: /torica del centrador/i,
  lowerCase: /MR-04-02/, nutsM8: /ISO 4032/, thru: /perno pasante/i, gasket: /JC-001/,
  upperCase: /MR-04-01/, shaftOut: /MR-02-03/, key: /ISO 773/, wheel: /MR-02-05/, hub: /MR-02-06/, hubBolts: /cubo a corona/i,
  spacer: /MR-02-02/, brgOut: /7214/, nutOut: /KMK 14/, shimOut: /MR-02-08/, capA: /MR-02-04/, capB: /MR-02-07/,
  sealA: /26238.*salida -A|salida -A.*26238/i, sealB: /26238.*salida -B|salida -B.*26238/i,
  orA: /torica de tapas de salida -A/i, orB: /torica de tapas de salida -B/i,
  boltsA: /tapas de salida \[-/i, boltsB: /tapas de salida \[\+/i, fill: /tapon de llenado/i
};
const SHAFT_IN = ['worm', 'brgIn', 'radialIn', 'nutIn', 'washerIn', 'circlip'];
const CAP_IN = ['capIn', 'shimIn', 'orTensor', 'capInBolts'];
const LOWER = [...SHAFT_IN, ...CAP_IN, 'drain', 'sight', 'flange', 'flangeBolts', 'sealIn', 'orCentr', 'lowerCase'];
const OUT_SHAFT = ['shaftOut', 'key', 'wheel', 'hub', 'hubBolts', 'spacer', 'brgOut', 'nutOut'];
const CAPS = ['capA', 'capB', 'shimOut', 'sealA', 'sealB', 'orA', 'orB', 'boltsA', 'boltsB'];
const UPPER = [...OUT_SHAFT, ...CAPS, 'upperCase', 'fill'];
const X = n => [n, 0, 0], Y = n => [0, n, 0], Z = n => [0, 0, n];
const VERTICAL = vec(Z(1));
const DRIVE_INPUT = ['worm', 'nutIn', 'washerIn', 'circlip'];
const DRIVE_OUTPUT = ['shaftOut', 'key', 'wheel', 'hub', 'hubBolts', 'spacer', 'nutOut'];
const GEAR_RATIO = 35, INPUT_SPEED = 2 * Math.PI; // One input revolution per second for the animation.
const STEP_OPERATING = {
  loop: 1, dir: [-.82, -1.55, .72],
  rules: [
    {g: ['upperCase', 'lowerCase'], a: .15},
    {g: ['flange', 'capA', 'capB', 'capIn', 'gasket', 'thru', 'flangeBolts', 'capInBolts', 'boltsA', 'boltsB'], a: .24},
    {g: [...LOWER, ...UPPER, 'nutsM8'], a: 1}
  ]
};

// Each step: which groups are visible (a = opacity, off = held offset), a loop of
// timed movements (g groups, from offset, t window in seconds) and a camera.
const LOWER_STEPS = {
  carcasa: {loop: 6, rules: [{g: ['lowerCase'], a: 1}], dir: [-.98, -1.42, .84]},
  'eje-sinfin': {loop: 9, rules: [{g: ['worm'], a: 1}, {g: ['lowerCase'], a: .13, off: Z(-120)}],
    split: {g: 'worm', t: [1.6, 3.2, 5.2, 6.8]}, dir: [-.6, -1.5, .75]},
  rodamientos: {loop: 11, rules: [{g: SHAFT_IN, a: 1}, {g: ['lowerCase'], a: .13}],
    anim: [
      {g: ['brgIn'], from: X(-110), t: [.4, 1.3], only: 'B'}, {g: ['brgIn'], from: X(-70), t: [1.2, 2.1], only: 'A'},
      {g: ['washerIn'], from: X(-146), t: [2.1, 2.8]}, {g: ['nutIn'], from: X(-183), t: [2.8, 3.5]},
      {g: ['radialIn'], from: X(157), t: [3.5, 4.3]}, {g: ['circlip'], from: X(195), t: [4.3, 5]},
      {g: SHAFT_IN, from: Z(130), t: [6, 8]}],
    dir: [-.9, -1.45, .8]},
  'tapa-reglaje': {loop: 10.4, rules: [
    {g: ['capInBolts'], a: 1, appear: 5.3},
    {g: [...SHAFT_IN, ...CAP_IN], a: 1}, {g: ['lowerCase'], a: .3}
  ],
    anim: [{g: ['orTensor'], from: X(90), t: [.4, 1.5]}, {g: ['capIn', 'shimIn', 'orTensor'], from: X(-130), t: [2.2, 3.8]},
      {g: ['capInBolts'], from: X(-115), t: [5.3, 6.5]}],
    dir: [1.6, -.65, .5], turns: [{t: [3.8, 5.2], yaw: Math.PI}, {t: [8.9, 10.35], yaw: -Math.PI}],
    stillDir: [-1.6, .65, .5]},
  drenaje: {loop: 8, rules: [{g: [...SHAFT_IN, ...CAP_IN, 'drain', 'sight', 'lowerCase'], a: 1}],
    anim: [{g: ['drain'], from: Z(-110), t: [.5, 2]}, {g: ['sight'], from: Y(110), t: [2.2, 3.6], sign: true}],
    dir: [-1.25, -1.3, .2]},
  brida: {loop: 11, rules: [{g: LOWER, a: 1}],
    anim: [{g: ['flange', 'sealIn', 'orCentr'], from: X(150), t: [5.4, 7.2]}, {g: ['sealIn'], from: X(-110), t: [.6, 2.2]},
      {g: ['orCentr'], from: X(-100), t: [2.9, 4.4]}, {g: ['flangeBolts'], from: X(120), t: [7.6, 8.8]}],
    dir: [-1.27, 1.35, .62]}
};
const UPPER_STEPS = {
  carcasa: {loop: 6, rules: [{g: ['upperCase'], a: 1}, {g: LOWER, a: .1}], dir: [-.98, -1.42, .84]},
  eje: {loop: 7, rules: [{g: ['shaftOut'], a: 1}, {g: ['upperCase'], a: .1, off: Z(150)}, {g: LOWER, a: .08}], dir: [1.08, -1.43, .76]},
  cubo: {loop: 8, rules: [{g: ['wheel', 'hub', 'hubBolts'], a: 1}, {g: LOWER, a: .08}],
    anim: [{g: ['hub'], from: Y(-120), t: [.6, 2.2]}, {g: ['hubBolts'], from: Y(-130), t: [2.6, 4]}], dir: [1.08, -1.43, .76]},
  conjunto: {loop: 12, rules: [{g: OUT_SHAFT, a: 1}, {g: ['upperCase'], a: .12}, {g: LOWER, a: .08}],
    anim: [{g: ['key'], from: Z(60), t: [.3, 1]}, {g: ['wheel', 'hub', 'hubBolts'], from: Y(-120), t: [1, 2.3]},
      {g: ['spacer'], from: Y(-90), t: [2.4, 3.2]}, {g: ['brgOut'], from: Y(-130), t: [3.2, 4], only: 'A'},
      {g: ['brgOut'], from: Y(160), t: [3.8, 4.6], only: 'B'}, {g: ['nutOut'], from: Y(-130), t: [4.6, 5.4]},
      {g: ['upperCase'], from: Z(150), t: [6.4, 8.4]}], dir: [1.08, -1.43, .76]},
  tapas: {loop: 16.8, rules: [{g: ['upperCase'], a: .22}, {g: OUT_SHAFT, a: 1}, {g: LOWER, a: .08}, {g: CAPS, a: 1}],
    anim: [
      {g: ['sealA'], from: Y(110), t: [.3, 1.3]}, {g: ['orA'], from: Y(90), t: [1.5, 2.5]},
      {g: ['capA', 'sealA', 'orA', 'shimOut'], from: Y(-140), t: [3, 4.6]}, {g: ['boltsA'], from: Y(-120), t: [4.8, 5.8]},
      {g: ['sealB'], from: Y(-110), t: [7.6, 8.6]}, {g: ['orB'], from: Y(-90), t: [8.8, 9.8]},
      {g: ['capB', 'sealB', 'orB'], from: Y(140), t: [10.3, 11.9]}, {g: ['boltsB'], from: Y(120), t: [12.1, 13.1]}],
    dir: [.9, 1.5, .84], turns: [{t: [5.9, 7.45], yaw: Math.PI}, {t: [15.15, 16.75], yaw: -Math.PI}]},
  llenado: {loop: 7, rules: [{g: [...OUT_SHAFT, ...CAPS, 'upperCase', 'fill'], a: 1}, {g: LOWER, a: .1}],
    anim: [{g: ['fill'], from: Z(130), t: [.5, 2]}], dir: [-.7, -.82, 1.5]},
  ensamblado: {loop: 13, rules: [{g: [...UPPER, 'gasket', 'thru', 'nutsM8'], a: 1}, {g: LOWER, a: 1}],
    anim: [{g: ['gasket'], from: Z(-80), t: [.5, 1.9], rel: true}, {g: [...UPPER], from: Z(170), t: [2.5, 4.5]},
      {g: ['gasket'], from: Z(170), t: [2.5, 4.5]}, {g: ['thru'], from: Z(220), t: [5, 6.4]}, {g: ['nutsM8'], from: Z(-120), t: [6.2, 7.4]}],
    dir: [.7, 1.35, -.27], stillDir: [-.7, -1.35, .96],
    turns: [{t: [1.9, 3.6], yaw: Math.PI, tilt: 1.23}, {t: [11.4, 12.95], yaw: -Math.PI, tilt: -1.23}]}
};

const FASTENERS = ['capInBolts', 'hubBolts', 'boltsA', 'boltsB', 'flangeBolts', 'thru', 'nutsM8'];
const progress = (t, [start, end]) => ease((t - start) / (end - start));

function shot(step, t, reduced, direction) {
  direction.set(...(reduced && step?.stillDir || step?.dir || [-.98, -1.42, .84]));
  if (reduced || !step?.turns) return;
  for (const turn of step.turns) {
    const fraction = progress(t, turn.t);
    direction.applyAxisAngle(VERTICAL, turn.yaw * fraction);
    direction.z += (turn.tilt ?? 0) * fraction;
  }
}
function unpack(encoded, Type) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Type(bytes.buffer);
}

async function loadModel() {
  const response = await fetch(new URL('../data/reductor-v4.json.gz', import.meta.url));
  if (!response.ok) throw Error(`Reducer CAD: HTTP ${response.status}`);
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  const data = await new Response(stream).json();
  return {
    materials: data.materials,
    entries: data.entries.map(item => ({
      name: item.name,
      shapes: item.bodies.map(makeGeometry),
      halves: item.split?.map(makeGeometry)
    }))
  };
}

function frameCAD(camera, direction, center, span) {
  const halfHeight = span * .54 / Math.min(1, camera.aspect);
  const halfWidth = halfHeight * camera.aspect;
  Object.assign(camera, {left: -halfWidth, right: halfWidth, top: halfHeight, bottom: -halfHeight,
    near: 1, far: 4 * span});
  camera.updateProjectionMatrix();
  camera.position.copy(direction).normalize().multiplyScalar(2 * span).add(center);
  camera.lookAt(center);
}

let shared;
function makeGeometry(body) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(unpack(body.v, Float32Array), 3));
  g.setAttribute('normal', new T.BufferAttribute(unpack(body.n, Float32Array), 3));
  g.setIndex(new T.BufferAttribute(unpack(body.t, Uint32Array), 1));
  let start = 0;
  body.sections?.forEach(([, count], i) => { if (count) g.addGroup(start, count, i); start += count; });
  g.computeBoundingBox();
  return {g, material: body.sections ? body.sections.map(([name]) => name) : [body.m]};
}
const groupsOf = name => Object.keys(G).filter(k => named(name, G[k]));

export async function create(stage, {id, ui, lang, reduced, css}) {
  shared ??= loadModel().catch(error => {
    shared = undefined;
    throw error;
  });
  const data = await shared;
  const cover = id === 'cover', upperScene = id === 'reductor-superior';
  const operating = id === 'reductor-funcionamiento';
  const STEPS = operating ? {funcionamiento: STEP_OPERATING} : upperScene ? UPPER_STEPS : LOWER_STEPS;
  const globalBox = new T.Box3(), model = new T.Group();
  const parts = data.entries.map(item => {
    const group = new T.Group(), materials = [], bounds = new T.Box3();
    const groups = groupsOf(item.name);
    const solidFlange = !operating && groups.includes('flange');
    const drive = groups.some(key => DRIVE_INPUT.includes(key)) ? 'input' :
      groups.some(key => DRIVE_OUTPUT.includes(key)) ? 'output' : null;
    group.matrixAutoUpdate = false;
    const build = ({g, material}) => {
      const mats = material.map(key => {
        const [color, metal, rough] = data.materials[key];
        const m = new T.MeshStandardMaterial({color, metalness: .64 * metal, roughness: rough,
          transparent: key === 'glass', opacity: key === 'glass' ? .47 : 1, depthWrite: key !== 'glass'});
        return m;
      });
      const mesh = new T.Mesh(g, mats.length === 1 ? mats[0] : mats);
      materials.push(...mats);
      return mesh;
    };
    const plainMeshes = item.shapes.map(build);
    group.add(...plainMeshes);
    const halves = item.halves?.map(build) || [];
    for (const mesh of halves) {
      mesh.visible = false;
      group.add(mesh);
    }
    for (const {g} of item.shapes) bounds.union(g.boundingBox);
    globalBox.union(bounds);
    model.add(group);
    // Bearing bodies in the CAD export are ordered outer race, inner race, then the remaining bodies.
    const bearing = groups.includes('brgOut') ? 'output' : groups.some(key => ['brgIn', 'radialIn'].includes(key)) ? 'input' : null;
    return {group, halves, materials, bounds, name: item.name, groups, drive, bearing, solidFlange, fade: 0,
      off: new T.Vector3(), plain: plainMeshes};
  });
  const center = globalBox.getCenter(new T.Vector3()), full = globalBox.getSize(new T.Vector3()).length();
  const wormPart = parts.find(p => p.groups.includes('worm'));
  const wormCenter = wormPart.bounds.getCenter(new T.Vector3());
  const initial = vec([-.88, -1.42, .83]);
  const nextDirection = initial.clone(), direction = initial.clone(), nextCenter = center.clone(), target = center.clone();
  // STEP V4 datums: the worm spins on X at Z = 0 and the output spins on Y at Z = 127 mm.
  const inputRotation = new T.Matrix4(), outputRotation = new T.Matrix4(), wheelPivot = new T.Matrix4().makeTranslation(0, 0, 127);
  const inverseWheelPivot = wheelPivot.clone().invert(), wheelRotation = new T.Matrix4();
  if (operating) for (const p of parts) if (p.bearing) p.plain[1].matrixAutoUpdate = false;
  const readout = stage.querySelector('.readout');
  let step = null, started = performance.now(), previous = 0, span = full * .94, nextSpan = span;
  let manual = false, drag = null, yaw = 0, pitch = 0, spin = 0;
  let playing = !reduced;
  const tmp = new T.Vector3();
  const side = name => /-A\b|\[-/.test(name) ? 'A' : /-B\b|\[\+/.test(name) ? 'B' : '';

  const panel = view(stage, ({camera, now}) => {
    const dt = Math.min(.1, Math.max(0, (now - previous) / 1000));
    previous = now;
    const t = reduced || cover || !step ? (step?.loop ?? 0) * .97 : Math.max(0, (now - started) / 1000) % step.loop;
    if (operating && step) {
      if (playing) spin += dt * INPUT_SPEED;
      inputRotation.makeRotationX(spin);
      wheelRotation.makeRotationY(spin / GEAR_RATIO);
      outputRotation.copy(wheelPivot).multiply(wheelRotation).multiply(inverseWheelPivot);
    }
    const edge = reduced || cover || !step ? 1 : Math.min(1, t / .5) * Math.min(1, (step.loop - t) / .6);
    let count = 0;
    const split = step?.split ? ease((t - step.split.t[0]) / (step.split.t[1] - step.split.t[0])) - ease((t - step.split.t[2]) / (step.split.t[3] - step.split.t[2])) : 0;
    for (const p of parts) {
      let alpha = cover ? 1 : 0, hold = null, available = true;
      if (!cover && step) {
        const rule = step.rules.find(rule => rule.g.some(k => p.groups.includes(k)));
        alpha = rule?.a ?? 0;
        hold = rule?.off ?? null;
        available = t >= (rule?.appear ?? 0);
      }
      if (!available) {
        p.fade = 0;
        p.group.visible = false;
        continue;
      }
      // timed movements add up; moving parts fade out and in around the loop restart
      let moving = false, extra = tmp.set(0, 0, 0);
      if (!cover && step?.anim) {
        for (const m of step.anim) {
          if (!m.g.some(k => p.groups.includes(k))) continue;
          if (m.only === 'A' && side(p.name) !== 'A' && !/A$|entrada A/.test(p.name)) continue;
          if (m.only === 'B' && side(p.name) !== 'B' && !/B$|entrada B/.test(p.name)) continue;
          const e = progress(t, m.t);
          const sign = m.sign && /-B\b/.test(p.name) ? -1 : 1;
          extra.x += m.from[0] * sign * (1 - e); extra.y += m.from[1] * sign * (1 - e); extra.z += m.from[2] * (1 - e);
          if (t > m.t[0] && t < m.t[1]) moving = true;
        }
      }
      const animated = extra.lengthSq() > 0 || (step?.anim || []).some(m => m.g.some(k => p.groups.includes(k)));
      let late = 1;
      if (!cover && step?.anim && p.groups.some(k => FASTENERS.includes(k))) {
        const first = Math.min(...step.anim.filter(m => m.g.some(k => p.groups.includes(k))).map(m => m.t[0]), 99);
        late = first < 99 ? ease((t - first + .1) / .25) : 1;
      }
      const wanted = alpha * (animated && !cover ? edge : 1) * late;
      if (p.solidFlange) {
        p.fade = Number(wanted > .02);
      } else {
        p.fade = reduced || cover ? wanted : T.MathUtils.lerp(p.fade, wanted, Math.min(1, dt * 7));
      }
      p.group.visible = p.fade > .02;
      if (!p.group.visible) continue;
      count++;
      const base = hold ? vec(hold) : tmp.clone().set(0, 0, 0);
      p.off.lerp(base, reduced ? 1 : Math.min(1, dt * 5));
      const off = p.off.clone().add(extra);
      p.group.matrix.makeTranslation(off.x, off.y, off.z);
      if (operating) {
        if (p.drive) p.group.matrix.multiply(p.drive === 'input' ? inputRotation : outputRotation);
        if (p.bearing) {
          p.plain[1].matrix.copy(p.bearing === 'input' ? inputRotation : outputRotation);
          p.plain[1].matrixWorldNeedsUpdate = true;
        }
      }
      p.group.matrixWorldNeedsUpdate = true;
      // the worm shaft opens along its axis plane so the hollow end and keyway show
      if (p.halves.length) {
        const open = split > .004;
        p.plain.forEach(m => { m.visible = !open; });
        p.halves.forEach(m => { m.visible = open; });
        p.halves[1].position.y = -110 * split;
      }
      for (const m of p.materials) {
        const baseOpacity = m.userData.base ??= m.opacity;
        m.opacity = baseOpacity * p.fade;
        const translucent = m.opacity < .985;
        if (m.transparent !== translucent) { m.transparent = translucent; m.needsUpdate = true; }
        m.depthWrite = !translucent;
        m.emissive.set(moving ? css('--accent') : '#000000');
        m.emissiveIntensity = moving ? .12 : 0;
      }
    }
    const speed = reduced || cover ? 1 : .075;
    shot(step, t, reduced, nextDirection);
    direction.lerp(nextDirection, speed);
    if (step === UPPER_STEPS.ensamblado) {
      const lifted = 1 - progress(t, [2.5, 4.5]);
      nextCenter.z = center.z + 85 * lifted;
      nextSpan = full * .95 + 105 * lifted;
    }
    target.lerp(nextCenter, speed);
    span = T.MathUtils.lerp(span, nextSpan, speed);
    const position = direction.clone();
    if (manual) {
      position.applyAxisAngle(VERTICAL, yaw);
      position.z = T.MathUtils.clamp(position.z + pitch, -.8, 1.8);
    }
    frameCAD(camera, position, target, span);
    if (readout) readout.textContent = operating ? '35:1' : ui.parts + ' · ' + count + ' / ' + parts.length;
  }, {cad: true, orthographic: true});
  panel.scene.add(model);
  panel.camera.up.set(0, 0, 1);
  panel.resize();
  if (operating) {
    const playback = document.createElement('button');
    playback.type = 'button';
    playback.className = 'scene-button scene-playback';
    const play = lang === 'en' ? 'Play' : 'Reproducir', pause = lang === 'en' ? 'Pause' : 'Pausar';
    playback.textContent = playing ? pause : play;
    playback.onclick = () => {
      playing = !playing;
      previous = performance.now();
      playback.textContent = playing ? pause : play;
      panel.paint();
    };
    stage.append(playback);
  }
  if (!cover) {
    const button = document.createElement('button');
    button.className = 'scene-button';
    button.textContent = ui.turn;
    button.setAttribute('aria-pressed', 'false');
    stage.append(button);
    const surface = panel.renderer.domElement;
    button.onclick = () => {
      manual = !manual;
      button.setAttribute('aria-pressed', String(manual));
      surface.style.touchAction = manual ? 'none' : '';
    };
    surface.onpointerdown = e => { if (!manual) return; drag = [e.clientX, e.clientY]; surface.setPointerCapture(e.pointerId); };
    surface.onpointermove = e => {
      if (!drag) return;
      yaw += (e.clientX - drag[0]) * .012;
      pitch += (e.clientY - drag[1]) * .008;
      drag = [e.clientX, e.clientY];
    };
    surface.onpointerup = surface.onpointercancel = () => { drag = null; };
  }
  return {visibility: panel.visibility, canvas: panel.renderer.domElement, update(next) {
    step = STEPS[next] || null;
    started = performance.now();
    yaw = pitch = spin = 0;
    if (step?.turns || next === 'brida') {
      shot(step, 0, reduced, nextDirection);
      direction.copy(nextDirection);
    }
    nextCenter.copy(center);
    nextSpan = full * .95;
    if (!upperScene && next === 'carcasa') {
      const housing = parts.find(p => p.groups.includes('lowerCase')).bounds;
      housing.getCenter(nextCenter);
      nextSpan = housing.getSize(new T.Vector3()).length() * .97;
    } else if (next === 'eje-sinfin') {
      nextCenter.copy(wormCenter);
    } else if (next === 'tapa-reglaje') {
      nextCenter.set(-42, 0, 12);
      nextSpan = full * .79;
    }
    panel.paint();
  }};
}
