import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {view, fit, ease, vec} from './v2-three.js';

const BASE = 'assets3d/anticaidas/';
export async function optionalModel(path) {
  const response = await fetch(BASE + path, {method: 'HEAD'});
  if (!response.ok) return null;
  const gltf = await new GLTFLoader().loadAsync(BASE + path);
  return gltf.scene;
}

function material(color, metalness = .25, roughness = .54) {
  return new T.MeshStandardMaterial({color, metalness, roughness});
}
function box(group, mat, size, xyz, shadow = true) {
  const node = new T.Mesh(new T.BoxGeometry(...size), mat);
  node.position.set(...xyz);
  node.castShadow = shadow;
  node.receiveShadow = true;
  group.add(node);
  return node;
}
function tube(group, mat, radius, start, end) {
  const a = vec(start), b = vec(end), d = b.clone().sub(a);
  const node = new T.Mesh(new T.CylinderGeometry(radius, radius, d.length(), 12), mat);
  node.position.copy(a).lerp(b, .5);
  node.quaternion.setFromUnitVectors(vec([0, 1, 0]), d.normalize());
  node.castShadow = node.receiveShadow = true;
  group.add(node);
  return node;
}

function catalogue(scene, width, depth, height, guard, diameter) {
  const gondola = new T.Group();
  const metal = material('#879399', .54, .42), dark = material('#343c43', .38), aluminum = material('#a0aaae', .53);
  const deck = material('#7b8284', .44), gunmetal = material('#242c31', .25), safety = material('#ae436c');
  const half = width * .5, side = depth * .5;
  box(gondola, deck, [width, .075, depth], [0, -.0375, 0]);
  for (const y of [-.09, .12]) for (const z of [-side, side]) {
    box(gondola, y < 0 ? dark : aluminum, [width, y < 0 ? .085 : .15, .028], [0, y, z]);
  }
  for (let i = 0; i < 20; i++) {
    box(gondola, metal, [.018, .004, depth - .08], [((i + .5) / 20 - .5) * (width - .05), .002, 0], false);
  }
  const ends = [-1, 1].map(s => {
    const x = s * (half - .03), h = height - .095;
    for (const z of [-side + .027, side - .027]) {
      tube(gondola, aluminum, .024, [x, 0, z], [x, h, z]);
      tube(gondola, aluminum, .022, [x, h, z], [x, h + .065, .12]);
      tube(gondola, metal, .016, [x, h * .65, z], [s * (half - .24), .075, z]);
    }
    const barTop = h + .065 + .0215, plateTop = barTop + .02;
    box(gondola, metal, [.05, .043, depth - .012], [x, h + .065, 0]);
    // Motor block and arrest device stand on the top bar of each end frame, side by side in depth,
    // with the device casing flush against the motor. The two devices face opposite ways
    // (handle to the wall at one end, to the outside at the other).
    const hz = s > 0 ? -1 : 1, mz = -hz * .145, px = s * (half - .2);
    box(gondola, dark, [.34, .02, .62], [px, barTop + .01, 0]);
    const motorParts = [
      box(gondola, dark, [.20, .34, .21], [px, plateTop + .17, mz]),
      box(gondola, metal, [.21, .035, .22], [px, plateTop + .3575, mz])
    ];
    const motor = new T.Mesh(new T.CylinderGeometry(.062, .062, .17, 24), gunmetal);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(px - s * .185, plateTop + .17, mz);
    motor.castShadow = true;
    gondola.add(motor);
    motorParts.push(motor);
    for (let i = 0; i < 5; i++) {
      const fin = new T.Mesh(new T.CylinderGeometry(.067, .067, .008, 24), dark);
      fin.rotation.z = Math.PI / 2;
      fin.position.set(px - s * (.12 + i * .021), plateTop + .17, mz);
      gondola.add(fin);
      motorParts.push(fin);
    }
    // Own materials so one motor block can fade without touching the other.
    for (const part of motorParts) part.material = part.material.clone();
    const device = box(gondola, safety, [.16, .35, .114], [px, plateTop + .175, 0]);
    const trigger = box(gondola, aluminum, [.03, .03, .03], [px, plateTop + .3, hz * .07]);
    return {xWork: px, zWork: mz, xSafety: px, hz, yBase: plateTop, yGuide: plateTop + .17, s, device, trigger, safety: device.material.clone(), motorParts};
  });
  for (const z of [-side + .02, side - .02]) {
    for (const y of [guard, guard * .55]) tube(gondola, aluminum, y === guard ? .024 : .017, [-half, y, z], [half, y, z]);
    for (const x of [-half + .5, 0, half - .5]) tube(gondola, aluminum, .018, [x, .08, z], [x, guard, z]);
  }
  for (const e of ends) {
    e.device.material = e.safety;
    e.ropes = [[e.xWork, e.zWork, gunmetal], [e.xSafety, 0, metal]].map(([x, z, mat]) => {
      const top = new T.Vector3(x, 2.6, z), bottom = new T.Vector3(x, -2.6, z);
      return {x, z, rope: tube(scene, mat, diameter * .5, bottom.toArray(), top.toArray())};
    });
  }
  return {gondola, ends};
}

const HIGHLIGHT = '#ffae00';
function fade(meshes, alpha) {
  for (const {material: m} of meshes) {
    const translucent = alpha < .99;
    if (m.transparent !== translucent) { m.transparent = translucent; m.needsUpdate = true; }
    m.opacity = alpha;
    m.depthWrite = !translucent;
  }
}

// Scripted cycles for each trip mode. Each returns the platform state at time t
// (seconds into the loop): vertical position, tilt, speed and whether it is locked.
const TOP = .30;
const lerp = (a, b, k) => a + (b - a) * k;
const CYCLES = {
  sobrevelocidad: {length: 7.4, at(t) {
    // normal descent, then an acceleration that crosses 0.5 m/s, then the lock
    const tl = 2.7, v1 = .25, ramp = .3, accel = (.78 - v1) / (tl - 2.1);
    const y0 = TOP - v1 * ramp * .5;
    let y, v = 0, locked = false, phase = 'run';
    if (t < tl) {
      if (t < ramp) { y = TOP - v1 * ramp * .5 * (t / ramp) ** 2; v = v1 * t / ramp; }
      else if (t < 2.1) { y = y0 - v1 * (t - ramp); v = v1; }
      else { const q = t - 2.1; y = y0 - v1 * (2.1 - ramp) - v1 * q - .5 * accel * q * q; v = v1 + accel * q; }
    } else {
      const base = y0 - v1 * (2.1 - ramp) - v1 * (tl - 2.1) - .5 * accel * (tl - 2.1) ** 2;
      const q = t - tl, drop = .075, d = .22;
      const k = Math.min(1, q / d);
      y = base - drop * (1 - (1 - k) ** 2) + Math.sin(Math.max(0, q - d) * 22) * .008 * Math.exp(-Math.max(0, q - d) * 8);
      v = q < d ? .78 * (1 - k) : 0;
      locked = true;
      if (t > 6.2) { const r = ease((t - 6.2) / 1.1); y = lerp(base - drop, TOP, r); v = 0; locked = r < .08; phase = 'reset'; }
    }
    return {y, tilt: 0, v, locked, phase};
  }},
  manual: {length: 6.2, at(t) {
    const tl = 2.2, v1 = .25, ramp = .3;
    const run = u => TOP - v1 * ramp * .5 - v1 * Math.max(0, u - ramp);
    let y, v = 0, locked = false, phase = 'run';
    if (t < tl) { y = t < ramp ? TOP - v1 * ramp * .5 * (t / ramp) ** 2 : run(t); v = t < ramp ? v1 * t / ramp : v1; }
    else {
      const q = t - tl, base = run(tl), d = .09, k = Math.min(1, q / d);
      y = base - .028 * (1 - (1 - k) ** 2) + Math.sin(Math.max(0, q - d) * 26) * .005 * Math.exp(-Math.max(0, q - d) * 9);
      locked = true;
      if (t > 5.0) { const r = ease((t - 5.0) / 1.0); y = lerp(base - .028, TOP, r); locked = r < .08; phase = 'reset'; }
    }
    return {y, tilt: 0, v, locked, phase};
  }},
  inclinacion: {length: 7.6, at(width) { return t => {
    const final = T.MathUtils.degToRad(14.5), t0 = .5, t1 = 3.4;
    let k = ease((t - t0) / (t1 - t0)), locked = t >= t1, phase = 'run', v = 0;
    if (t < t1 && t > t0) v = .2 * Math.sin(Math.PI * (t - t0) / (t1 - t0));
    if (t > 6.4) { const r = ease((t - 6.4) / 1.1); k = 1 - r; locked = r < .08; phase = 'reset'; v = 0; }
    const tilt = final * k;
    return {y: TOP - width * .38 * Math.abs(Math.sin(tilt)), tilt, v, locked, phase};
  }; }}
};

export async function create(stage, {ui, reduced, json, css, fmt}) {
  const dimensions = await json(BASE + 'plataforma_medidas.json');
  const [width, depth, height, guard, diameter] = [dimensions.largo, dimensions.ancho, dimensions.altura,
    dimensions.altura_barandilla_sobre_piso, dimensions.posicion_cable.diametro_seguridad].map(x => x / 1000);
  const supplied = await optionalModel('plataforma.glb').catch(() => null);
  const device = supplied ? null : await optionalModel('dispositivo.glb').catch(() => null);
  const facade = material('#aeada8', .04, .8), rail = material('#9da0a0', .22), grout = material('#8f9495', .04);
  const inclination = CYCLES.inclinacion.at(width);
  let key = 'normal', at = performance.now(), position = TOP, tilt = 0, previous = {y: TOP, tilt: 0};
  const zoom = {x: 0, y: .48, span: 3.7, az: .95, follow: 0}, zoomTarget = {...zoom};
  let platform;
  const hud = stage.querySelector('.readout');
  const caption = stage.querySelector('.cap-l'), right = stage.querySelector('.cap-r');
  caption.textContent = ui.illustration;
  right.textContent = supplied ? '' : ui.previewNote;
  const state = t => {
    if (key === 'normal') {
      const wave = reduced ? 0 : Math.sin(t * .88) * .30;
      return {y: wave, tilt: 0, v: reduced ? 0 : .264 * Math.cos(t * .88), locked: false};
    }
    if (reduced) return key === 'inclinacion' ? inclination(4) : CYCLES[key].at(key === 'manual' ? 3.2 : 3.6);
    const cycle = CYCLES[key];
    const local = t % cycle.length;
    return key === 'inclinacion' ? inclination(local) : cycle.at(local);
  };
  const panel = view(stage, ({camera, now}) => {
    if (!platform) return;
    const t = Math.max(0, (now - at) / 1000);
    const target = state(t);
    // Blend from wherever the previous step left the platform into the new cycle.
    const mix = reduced ? 1 : ease(t / .6);
    position = lerp(previous.y, target.y, mix);
    tilt = lerp(previous.tilt, target.tilt, mix);
    const speed = target.v, locked = target.locked;
    platform.gondola.position.y = position;
    platform.gondola.rotation.z = tilt;
    platform.gondola.updateMatrixWorld(true);
    const pulse = reduced ? 1 : .5 - .5 * Math.cos(t * Math.PI * 2 * 1.3);
    // Normal operation: every few seconds the right-hand motor turns see-through
    // and both arrest devices flash, so the one hidden behind it stands out.
    const lap = t % 8;
    const spot = key !== 'normal' ? 0 : reduced ? 1 : ease((lap - .8) / .5) * (1 - ease((lap - 4.8) / .5));
    for (const e of platform.ends) {
      if (e.s > 0) fade(e.motorParts, 1 - .84 * spot);
      e.safety.emissive.set(locked ? css('--accent') : '#000');
      e.safety.emissiveIntensity = locked ? .24 : 0;
      e.trigger.position.z = e.hz * (.07 - (key === 'manual' && locked ? .012 : 0));
      for (const cover of e.covers || []) {
        cover.emissive.set(locked ? css('--accent') : '#000');
        cover.emissiveIntensity = locked ? .28 : 0;
      }
      for (const skin of e.skins || [e.safety]) {
        if (spot > 0) {
          skin.emissive.set(HIGHLIGHT);
          skin.emissiveIntensity = spot * (.08 + .75 * pulse);
        } else if (skin !== e.safety && !(e.covers || []).includes(skin)) skin.emissiveIntensity = 0;
      }
      if (key === 'manual') for (const skin of e.buttons || []) {
        skin.emissive.set(HIGHLIGHT);
        skin.emissiveIntensity = .2 + 1.1 * pulse;
      }
      for (const item of e.ropes) {
        // The upper ends stay fixed at the suspension points. Each rope passes
        // through the appropriate winch or arrest head as the deck tilts.
        const anchor = vec([item.x, 2.6, item.z]);
        const guide = platform.gondola.localToWorld(vec([item.x, e.yGuide, item.z]));
        const topDirection = anchor.clone().sub(guide).normalize();
        const bottom = guide.clone().addScaledVector(topDirection, -2.55);
        const axis = anchor.clone().sub(bottom);
        item.rope.position.copy(anchor).lerp(bottom, .5);
        item.rope.scale.y = axis.length() / 5.2;
        item.rope.quaternion.setFromUnitVectors(vec([0, 1, 0]), axis.normalize());
      }
    }
    // Close on the left-hand motor and arrest device only for the manual stop;
    // the other cases keep the whole deck in frame.
    for (const k of ['x', 'y', 'span', 'az', 'follow']) zoom[k] += (zoomTarget[k] - zoom[k]) * (reduced ? 1 : .07);
    const drift = reduced ? 0 : .05 * Math.sin(t * .53);
    fit(camera, vec([zoom.az + drift, .36, 2.15]), vec([zoom.x, zoom.y + zoom.follow * position, 0]), zoom.span, 1);
    const resetting = target.phase === 'reset';
    hud.textContent = ui.speed + ' ' + fmt(Math.abs(speed), 2) + ' m/s\n' + ui.angle + ' ' + fmt(Math.abs(T.MathUtils.radToDeg(tilt)), 1) + '°' +
      (locked ? '\n' + ui.stop : resetting ? '\n' + ui.reset : '');
  }, {shadows: true});
  box(panel.scene, facade, [14, 13, .16], [0, .5, -.83], false);
  for (const y of [-2.8, -1.3, .22, 1.73, 3.23, 4.73]) box(panel.scene, grout, [14, .014, .012], [0, y, -.741], false);
  for (const x of [-4.4, -2.3, -.18, 1.96, 4.1]) box(panel.scene, rail, [.017, 13, .026], [x, .5, -.738], false);
  if (supplied) {
    const gondola = new T.Group();
    const orient = new T.Group();
    orient.rotation.x = -Math.PI / 2;
    orient.scale.setScalar(.001);
    orient.add(supplied);
    gondola.add(orient);
    platform = {gondola, ends: []};
  } else {
    platform = catalogue(panel.scene, width, depth, height, guard, diameter);
    if (device) {
      for (const end of platform.ends) {
        const sample = device.clone(true);
        end.covers = [];
        end.skins = [];
        end.buttons = [];
        sample.traverse(node => {
          if (!node.isMesh) return;
          if (/cable|etiqueta/i.test(node.name + ' ' + (node.userData.stepName || ''))) node.visible = false;
          node.receiveShadow = true;
          // Own copy of the materials so each highlight stays per device and per part.
          node.material = node.material.clone();
          if (!node.material.emissive) return;
          end.skins.push(node.material);
          const plain = node.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (/carter|tapa_lateral/i.test(plain)) end.covers.push(node.material);
          if (/pulsador[_ ]manual|GN.?313/i.test(plain + ' ' + (node.userData.stepName || ''))) {
            end.buttons.push(node.material);
          }
        });
        // The CAD has Z up along the rope and the handle and label on -Y.
        const upright = new T.Group();
        upright.rotation.x = -Math.PI / 2;
        upright.scale.setScalar(.001);
        upright.add(sample);
        const turned = new T.Group();
        // One device faces the wall and the other the outside, so each detects tilt to one side.
        turned.rotation.y = end.hz > 0 ? 0 : Math.PI;
        turned.position.set(end.xSafety, end.yBase + .30, 0);
        turned.add(upright);
        end.device.visible = end.trigger.visible = false;
        platform.gondola.add(turned);
      }
    }
  }
  panel.scene.add(platform.gondola);
  panel.resize();
  return {visibility: panel.visibility, update(next) {
    previous = {y: position, tilt};
    at = performance.now();
    key = next;
    const wide = key !== 'manual';
    Object.assign(zoomTarget, wide ? {x: 0, y: .48, span: 3.7, az: .95, follow: 0} : {x: -1.2, y: 1.22, span: 1.12, az: .8, follow: .85});
    caption.textContent = key === 'sobrevelocidad' ? ui.test : key === 'inclinacion' ? ui.limit : ui.illustration;
    panel.paint();
  }};
}
