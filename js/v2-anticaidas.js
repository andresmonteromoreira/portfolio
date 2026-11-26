import * as T from 'three';
import {optionalModel} from './v2-plataforma.js';
import {view, fit, ease, vec, message, named} from './v2-three.js';

const FILES = {v1:'evolucion_v1.glb', v5:'evolucion_v5.glb', v8:'evolucion_v8.glb', final:'dispositivo.glb'};
const HOUSING = /carcasa|housing|carter|enclosure|tapa lateral|side cover|pieza-00[1-5]|pieza-014|etiqueta/i;
// Nuts behind the base plate, left out of the turning display of the final device.
const LOOSE_NUTS = /DIN-985[_ ]M1[02](?!\d)/i;
const parts = {
  cable: /cable|rope/i, centrifugo: /contrapeso|governor|regulador|polea|pieza-10[234]/i,
  mordazas: /mordaza|jaw|pieza-11[234]/i, manual: /pulsador|trigger|GN.313|pieza-030/i,
  rearme: /rearme|reset|maneta|pieza-05[057]/i
};
const NS = 'http://www.w3.org/2000/svg';
function label(stage) {
  const overlay = document.createElement('div');
  overlay.className = 'annotations';
  overlay.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  const line = document.createElementNS(NS, 'line');
  const text = document.createElementNS(NS, 'text');
  svg.append(line, text);
  overlay.append(svg);
  stage.append(overlay);
  return {show(point, title, camera) {
    const w = stage.clientWidth, h = stage.clientHeight;
    const p = point.clone().project(camera);
    const x = Math.max(10, Math.min(w - 10, (p.x + 1) * w / 2));
    const y = Math.max(46, Math.min(h - 32, (1 - p.y) * h / 2));
    // One active annotation leaves the technical view clear. Choose the free
    // side of the canvas and connect the label with a straight leader.
    const left = x < w * .5;
    overlay.hidden = false;
    text.textContent = title;
    const textWidth = text.getComputedTextLength();
    const end = left ? Math.max(textWidth + 13, w * .23) : Math.min(w - textWidth - 13, w * .77);
    line.setAttribute('x1', x); line.setAttribute('y1', y);
    line.setAttribute('x2', end); line.setAttribute('y2', y);
    text.setAttribute('x', end + (left ? -6 : 6));
    text.setAttribute('y', Math.max(48, y + 4));
    text.setAttribute('text-anchor', left ? 'end' : 'start');
  }, clear() { overlay.hidden = true; }};
}

function normalized(root) {
  const item = new T.Group();
  item.add(root);
  const box = new T.Box3().setFromObject(item);
  const scale = 1 / Math.max(.001, box.getSize(new T.Vector3()).length());
  item.scale.setScalar(scale);
  // All evolution variants are expected to use the same CAD datum, even
  // when their external envelopes differ.
  item.position.copy(box.getCenter(new T.Vector3())).multiplyScalar(-scale);
  const meshes = [];
  root.traverse(node => {
    if (!node.isMesh) return;
    const ancestry = [];
    for (let p = node; p && p !== item; p = p.parent) ancestry.push(p.name);
    const path = ancestry.join('/');
    const materials = [].concat(node.material).map(m => m.clone());
    node.material = Array.isArray(node.material) ? materials : materials[0];
    meshes.push({node, path, materials, housing: named(path, HOUSING)});
  });
  return {item, root, meshes, scale, bounds: box};
}
function opacity(mesh, alpha) {
  mesh.node.visible = alpha > .018;
  for (const m of mesh.materials) {
    const original = m.userData.opacity ??= m.opacity;
    m.opacity = alpha * original;
    const translucent = m.opacity < .986;
    if (m.transparent !== translucent) { m.transparent = translucent; m.needsUpdate = true; }
    m.depthWrite = !translucent;
  }
}
function motions(model, metadata) {
  return Object.entries(metadata?.nodos || {}).flatMap(([name, info]) => {
    if (!Array.isArray(info.eje) || !Array.isArray(info.punto) ||
        ![...info.eje, ...info.punto, info.min, info.max].every(Number.isFinite) ||
        !['rot', 'tras'].includes(info.tipo)) return [];
    let target = model.root.getObjectByName(name);
    if (!target) model.root.traverse(node => {
      if (!target && (node.userData.stepName === name || (info.referencia && node.userData.stepName === info.referencia))) target = node;
    });
    const center = vec(info.punto);
    const axis = vec(info.eje);
    if (!target || axis.lengthSq() === 0) return [];
    axis.normalize();
    model.root.updateMatrixWorld(true);
    const rootQ = model.root.getWorldQuaternion(new T.Quaternion());
    const inv = target.parent.getWorldQuaternion(new T.Quaternion()).invert();
    const localAxis = axis.applyQuaternion(rootQ).applyQuaternion(inv);
    const pivot = target.parent.worldToLocal(model.root.localToWorld(center));
    return [{target, name, info, pivot, axis: localAxis, pos: target.position.clone(), rot: target.quaternion.clone()}];
  });
}

export async function create(stage, {id, ui, reduced, json}) {
  const evolution = id === 'evolucion', schematic = id === 'principio';
  const placeholder = message(stage, ui.missing, ui.modelWait);
  const cap = stage.querySelector('.cap-l');
  const models = new Map(), pending = new Map();
  let panel, active = null, last = null, t0 = 0, key = null, visible = false, focus, motion = [];
  let commonScale, commonCenter;
  const metadata = schematic ? await json('assets3d/anticaidas/cinematica.json').catch(() => null) : null;
  const annotation = schematic ? label(stage) : null;
  const centered = new T.Vector3();
  const front = vec([0, -1, 0]), iso = vec([-.74, -1.3, .68]);

  function init() {
    if (panel) return;
    panel = view(stage, ({camera, now}) => {
      const phase = Math.max(0, (now - t0) / 1000);
      const f = reduced ? 1 : ease(phase / .55);
      if (last && last !== active) {
        for (const mesh of last.meshes) opacity(mesh, 1 - f);
        if (f >= 1) { last.item.visible = false; last = null; }
      }
      if (!active) { annotation?.clear(); return; }
      const turn = id === 'giro-dispositivo' && !reduced ? phase * .7 : 0;
      active.item.rotation.z = turn;
      // One revolution: covers opaque, then fade to transparent, hold, and fade back to opaque.
      const lap = (turn / (Math.PI * 2)) % 1;
      const clear = key !== 'ciclo' ? 0 : reduced ? .65 : ease((lap - .1) / .2) * (1 - ease((lap - .6) / .2));
      const currentPart = parts[key];
      for (const mesh of active.meshes) {
        if (id === 'giro-dispositivo' && LOOSE_NUTS.test(mesh.path)) { mesh.node.visible = false; continue; }
        const hidden = (schematic || key === 'mecanismo') && mesh.housing;
        const gain = hidden ? 0 : key === 'transparente' && mesh.housing ? .20 : key === 'ciclo' && mesh.housing ? 1 - .84 * clear : 1;
        opacity(mesh, gain * f);
        for (const m of mesh.materials) {
          if (!schematic || !m.emissive) continue;
          const selected = Boolean(schematic && currentPart && named(mesh.path, currentPart));
          m.emissive.set(selected ? '#e59e3e' : '#000000');
          m.emissiveIntensity = selected ? .30 : 0;
        }
      }
      for (const m of motion) {
        const on = currentPart && named(m.name, currentPart);
        const {target, info, axis, pivot, pos, rot} = m;
        target.position.copy(pos);
        target.quaternion.copy(rot);
        if (!on) continue;
        const blend = reduced ? 1 : info.periodico ? phase % 1 : ease(phase / .85);
        const value = T.MathUtils.lerp(info.min, info.max, blend);
        if (info.tipo === 'tras') target.position.addScaledVector(axis, value);
        else {
          const q = new T.Quaternion().setFromAxisAngle(axis, T.MathUtils.degToRad(value));
          target.position.sub(pivot).applyQuaternion(q).add(pivot);
          target.quaternion.premultiply(q);
        }
      }
      if (schematic) {
        camera.position.copy(front).multiplyScalar(3).add(centered);
        camera.lookAt(centered);
      } else {
        fit(camera, iso, centered, .96, 1.08);
      }
      if (annotation && focus?.node?.visible) {
        const center = new T.Box3().setFromObject(focus.node).getCenter(new T.Vector3());
        camera.updateMatrixWorld();
        annotation.show(center, ui.component[key], camera);
      } else annotation?.clear();
    }, {orthographic: schematic});
    panel.camera.up.set(0, 0, 1);
    panel.resize();
    panel.visibility(visible);
  }
  async function load(file) {
    if (!pending.has(file)) pending.set(file, optionalModel(file).then(root => {
      if (!root) return null;
      init();
      const model = normalized(root);
      if (schematic) for (const mesh of model.meshes) {
        for (const material of mesh.materials) material.color?.lerp(new T.Color('#89969e'), .32);
      }
      if (evolution) {
        commonScale ??= model.scale;
        commonCenter ??= model.bounds.getCenter(new T.Vector3());
        model.item.scale.setScalar(commonScale);
        model.item.position.copy(commonCenter).multiplyScalar(-commonScale);
      }
      model.item.visible = false;
      models.set(file, model);
      panel.scene.add(model.item);
      return model;
    }).catch(error => { console.warn(file, error); return null; }));
    return pending.get(file);
  }
  return {visibility(next) { visible = next; panel?.visibility(next); }, async update(next) {
    key = next;
    const file = evolution ? FILES[next] : FILES.final;
    if (evolution && file !== FILES.final && !commonScale) await load(FILES.final);
    const model = models.get(file) || await load(file);
    if (key !== next) return;
    placeholder.hidden = Boolean(model);
    if (active !== model) {
      if (last) last.item.visible = false;
      last = active;
      active = model;
      if (active) active.item.visible = true;
    }
    focus = schematic ? model?.meshes.find(mesh => !mesh.housing && named(mesh.path, parts[next])) : null;
    for (const old of motion) { old.target.position.copy(old.pos); old.target.quaternion.copy(old.rot); }
    motion = schematic && model ? motions(model, metadata) : [];
    cap.textContent = !schematic || !model || next === 'cable' ? '' :
      next === 'centrifugo' && motion.some(m => named(m.name, parts[next])) ? ui.governorMeasured : ui.motionWait;
    stage.dataset.asset = model ? 'ready' : 'missing';
    t0 = performance.now();
    panel?.paint();
  }};
}
