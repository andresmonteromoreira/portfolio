// Esquemas 2D animados del apartado de anticaídas. Dibujo técnico en SVG,
// sin CAD: líneas de 1,5 y 1 px, trazos de eje y oculto, sombreado a 45° y una
// sola tinta de acento. Son esquemas funcionales, no a escala.
import {LEVER, SLOT_A, SLOT_B, JAW1, JAW2, PAWL, PAWL_PIVOT, TIP, PIVOT, LOBE_STEP} from './v3-mordazas-datos.js';
import {TFM_TEXT, junta, contorno, malla, materiales, explorador, universidades, resultadosLocales} from './v3-tfm.js';
const NS = 'http://www.w3.org/2000/svg';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = x => { const y = clamp(x); return y * y * (3 - 2 * y); };
const rad = deg => deg * Math.PI / 180;
const polar = (r, deg, c = {x: 0, y: 0}) => ({x: c.x + r * Math.cos(rad(deg)), y: c.y + r * Math.sin(rad(deg))});
const f = n => Math.round(n * 100) / 100;

function S(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  parent?.append(node);
  return node;
}
const place = (node, x, y, deg = 0) => node.setAttribute('transform', 'translate(' + f(x) + ' ' + f(y) + ')' + (deg ? ' rotate(' + f(deg) + ')' : ''));
const label = (parent, x, y, text, cls = 'tag', anchor = 'start') => S('text', {x, y, class: cls, 'text-anchor': anchor}, parent, text);
const lead = (parent, ...p) => S('polyline', {points: p.join(' '), class: 'lead'}, parent);
const arrow = (parent, x1, y1, x2, y2, cls = 'ln2') => {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 6;
  const g = S('g', {}, parent);
  S('line', {x1, y1, x2, y2, class: cls}, g);
  S('path', {d: 'M' + x2 + ' ' + y2 + 'L' + f(x2 - s * Math.cos(a - .4)) + ' ' + f(y2 - s * Math.sin(a - .4)) + 'L' + f(x2 - s * Math.cos(a + .4)) + ' ' + f(y2 - s * Math.sin(a + .4)) + 'Z', class: 'dark'}, g);
  return g;
};
function zig(x1, y1, x2, y2, turns, amp) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const lead = Math.min(9, len * .12), body = len - 2 * lead;
  let d = 'M' + f(x1) + ' ' + f(y1) + 'L' + f(x1 + ux * lead) + ' ' + f(y1 + uy * lead);
  for (let i = 0; i < turns * 2; i++) {
    const t = (i + .5) / (turns * 2), s = (i % 2 ? -1 : 1) * amp;
    d += 'L' + f(x1 + ux * (lead + body * t) + nx * s) + ' ' + f(y1 + uy * (lead + body * t) + ny * s);
  }
  return d + 'L' + f(x2 - ux * lead) + ' ' + f(y2 - uy * lead) + 'L' + f(x2) + ' ' + f(y2);
}
function spiral(r0, r1, turns) {
  let d = '';
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = t * turns * 2 * Math.PI, r = lerp(r0, r1, t);
    d += (i ? 'L' : 'M') + f(r * Math.cos(a)) + ' ' + f(r * Math.sin(a));
  }
  return d;
}
function hatchRect(parent, x, y, w, h) {
  return S('rect', {x, y, width: w, height: h, class: 'hatch'}, parent);
}
function cableBody(parent, x, y1, y2, clip) {
  const g = S('g', {}, parent);
  S('rect', {x: x - 4, y: y1, width: 8, height: y2 - y1, class: 'solid'}, g);
  const ticks = S('g', {'clip-path': 'url(#' + clip + ')'}, g);
  return {g, ticks};
}
function defs(svg, id) {
  const d = S('defs', {}, svg);
  const p = S('pattern', {id: 'dg-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'}, d);
  S('rect', {width: 5, height: 5, fill: 'var(--bg)'}, p);
  S('line', {x1: 0, y1: 0, x2: 0, y2: 5, stroke: 'var(--ink)', 'stroke-width': .9}, p);
  return d;
}
function clip(d, id, x, y, w, h) {
  const c = S('clipPath', {id}, d);
  S('rect', {x, y, width: w, height: h}, c);
}
let uid = 0;

// ---------------------------------------------------------------- Textos
const TEXT = {
  es: {
    cable: 'Cable de seguridad Ø 8,3', roller: 'Rodillo de nailon', spring: 'Muelle', presser: 'Presionador',
    pulley: 'Polea del centrífugo', weights: 'Contrapesos con muelle', lever: 'Palanca de disparo', speed: 'Velocidad de descenso',
    critical: 'crítica 0,5', toTrip: 'al mecanismo de disparo', force: 'Fuerza de presión', schematic: 'Esquema funcional · no a escala', schematicShort: 'Esquema funcional',
    c0: 'Descenso normal', c1: 'Sobrevelocidad', c2: 'Se abre y dispara',
    closed: 'Centrífugo cerrado', open: 'Centrífugo abierto',
    play: 'Pausa', resume: 'Reanudar',
    bushing: 'Entrada', counterweight: 'Contrapeso', button: 'Botón de emergencia', governor: 'Centrífugo',
    latch: 'Retén de las mordazas', handle: 'Maneta de rearme', tilt: 'Inclinación', limit: 'límite 14°', freeJaws: 'Libera las mordazas',
    d0: 'Armado', d1: 'Centrífugo', d2: 'Inclinación', d3: 'Botón', d4: 'Rearme',
    armed: 'Posición de trabajo', tripped: 'Disparado', rearm: 'Rearme',
    jaws: 'Mordaza', torsion: 'Muelle de torsión', hook: 'Retén', cam: 'Leva de rearme · 45°', teeth: 'Dientes',
    platform: 'Plataforma', work: 'Cable de trabajo', safety: 'Cable de seguridad', load: 'Carga',
    m0: 'Trabajo', m1: 'Disparo', m2: 'Bloqueada', m3: 'Carga al cable de trabajo', m4: 'Reapertura',
    blocked: 'Con carga no se reabren', free: 'Sin carga en el cable de seguridad', slack: 'flojo',
    open2: 'Abiertas', closed2: 'Cerradas',
    lap: 'Versión', of: 'de unas 9', final: 'Producto final',
    jawCam: 'Leva con muesca', notchNote: 'retenida por el retén', trip: 'disparo',
    jawCamX: 0, safetyShort: 'Seguridad', workShort: 'Trabajo', openLines: ['Mordazas', 'abiertas'], closedLines: ['Mordazas', 'cerradas'], blockedLines: ['Con carga no', 'se reabren'],
    steps: ['Diseño', 'Revisión con el director', 'Planos', 'Pedido de piezas', 'Comprobación de\npiezas recibidas', 'Montaje', 'Discusión con\noperarios del taller', 'Pruebas', 'Conclusiones'],
    loop: 'Ciclo de diseño', loopSub: 'repetido en unas nueve versiones', next: 'siguiente versión', versions: 'Versiones'
  },
  en: {
    cable: 'Safety rope Ø 8.3', roller: 'Nylon roller', spring: 'Spring', presser: 'Pressure arm',
    pulley: 'Governor pulley', weights: 'Spring-loaded flyweights', lever: 'Trip lever', speed: 'Descent speed',
    critical: 'critical 0.5', toTrip: 'to the trip mechanism', force: 'Pressing force', schematic: 'Functional diagram · not to scale', schematicShort: 'Functional diagram',
    c0: 'Normal descent', c1: 'Overspeed', c2: 'Opens and trips',
    closed: 'Governor closed', open: 'Governor open',
    play: 'Pause', resume: 'Resume',
    bushing: 'Inlet bushing', counterweight: 'Counterweight', button: 'Emergency button', governor: 'Governor',
    latch: 'Jaw catch', handle: 'Reset handle', tilt: 'Tilt', limit: 'limit 14°', freeJaws: 'Releases the jaws',
    d0: 'Armed', d1: 'Governor', d2: 'Tilt', d3: 'Button', d4: 'Reset',
    armed: 'Working position', tripped: 'Tripped', rearm: 'Reset',
    jaws: 'Jaw', torsion: 'Torsion spring', hook: 'Catch', cam: 'Reset cam · 45°', teeth: 'Teeth',
    platform: 'Platform', work: 'Working rope', safety: 'Safety rope', load: 'Load',
    m0: 'Working', m1: 'Trip', m2: 'Locked', m3: 'Load back on working rope', m4: 'Reopening',
    blocked: 'Under load they stay shut', free: 'No load on the safety rope', slack: 'slack',
    open2: 'Open', closed2: 'Closed',
    lap: 'Version', of: 'of about 9', final: 'Final product',
    jawCam: 'Notched cam', notchNote: 'held by the catch', trip: 'trip',
    jawCamX: 0, safetyShort: 'Safety', workShort: 'Working', openLines: ['Jaws', 'open'], closedLines: ['Jaws', 'closed'], blockedLines: ['Under load', 'they stay shut'],
    steps: ['Design', 'Review with project lead', 'Drawings', 'Parts order', 'Incoming parts\ninspection', 'Assembly', 'Feedback from\nworkshop staff', 'Testing', 'Conclusions'],
    loop: 'Design loop', loopSub: 'repeated over about nine versions', next: 'next version', versions: 'Versions'
  }
};

// ---------------------------------------------------------------- 1 · Centrífugo y presionador
function centrifugo(svg, t) {
  const id = 'c' + (uid++);
  const d = defs(svg);
  clip(d, id + 'k', 236, 28, 28, 372);
  const C = {x: 322, y: 215}, R = 66, cableX = 250;
  S('rect', {x: 20, y: 14, width: 600, height: 392, class: 'frame'}, svg);
  label(svg, 30, 396, t.schematic, 'tag m');

  // cable con trenzado en movimiento
  const cable = cableBody(svg, cableX, 28, 400, id + 'k');
  const lay = S('g', {}, cable.ticks);
  for (let y = -30; y < 420; y += 14) S('line', {x1: 244, y1: y + 8, x2: 256, y2: y, class: 'thin'}, lay);
  arrow(svg, 276, 52, 276, 104, 'ln2');
  label(svg, 284, 82, 'v', 'tag a');
  lead(svg, 172, 58, 214, 58, 246, 58);
  label(svg, 30, 62, t.cable, 'tag');

  // presionador: tope fijo, vástago, muelle, soporte y rodillo
  hatchRect(svg, 96, 186, 30, 58);
  S('line', {x1: 126, y1: 215, x2: 200, y2: 215, class: 'ln2'}, svg);
  S('path', {d: zig(130, 215, 172, 215, 7, 11), class: 'ln'}, svg);
  S('rect', {x: 172, y: 203, width: 28, height: 24, class: 'solid'}, svg);
  S('line', {x1: 200, y1: 215, x2: 222, y2: 215, class: 'ln2'}, svg);
  const roller = S('g', {}, svg);
  place(roller, 222, 215);
  S('circle', {r: 24, class: 'solid'}, roller);
  S('circle', {r: 6, class: 'dark'}, roller);
  const rollMark = S('line', {x1: 0, y1: 0, x2: 0, y2: -16, class: 'ln2'}, roller);
  arrow(svg, 98, 262, 170, 262, 'ln2');
  label(svg, 98, 280, t.force, 'tag a');
  label(svg, 150, 184, t.spring, 'tag', 'middle');
  label(svg, 236, 326, t.roller, 'tag', 'end');
  lead(svg, 222, 242, 222, 312);

  // polea del centrífugo
  const pulley = S('g', {}, svg);
  place(pulley, C.x, C.y);
  const body = S('g', {}, pulley);
  S('circle', {r: R, class: 'solid'}, body);
  S('circle', {r: R - 6, class: 'thin'}, body);
  S('path', {d: 'M' + R + ' 0 l-9 -4 v8 z', class: 'dark'}, body);
  for (const a of [90, 270]) { const p = polar(26, a); S('circle', {cx: p.x, cy: p.y, r: 2.4, class: 'dot'}, body); }
  const sector = (a1, a2) => {
    const rO = 54, rI = 34, p1 = polar(rO, a1), p2 = polar(rO, a2), p3 = polar(rI, a2), p4 = polar(rI, a1);
    return 'M' + f(p1.x) + ' ' + f(p1.y) + 'A' + rO + ' ' + rO + ' 0 0 1 ' + f(p2.x) + ' ' + f(p2.y) + 'L' + f(p3.x) + ' ' + f(p3.y) + 'A' + rI + ' ' + rI + ' 0 0 0 ' + f(p4.x) + ' ' + f(p4.y) + 'Z';
  };
  const hinge = polar(44, 204), free0 = polar(44, 262), BETA = 32;
  const turned = s => { const a = rad(s * BETA), dx = free0.x - hinge.x, dy = free0.y - hinge.y;
    return Math.hypot(hinge.x + dx * Math.cos(a) - dy * Math.sin(a), hinge.y + dx * Math.sin(a) + dy * Math.cos(a)); };
  const sign = turned(1) > turned(-1) ? 1 : -1;
  const springPath = S('path', {class: 'ln2'}, body);
  const weights = [0, 180].map(rot => {
    const g = S('g', {transform: 'rotate(' + rot + ')'}, body);
    const w = S('path', {d: sector(198, 268), class: 'dark'}, g);
    S('circle', {cx: hinge.x, cy: hinge.y, r: 3.6, fill: 'var(--bg)', stroke: 'var(--ink)', 'stroke-width': 1}, g);
    return {g, w, rot};
  });
  S('circle', {r: 9, class: 'solid'}, pulley);
  S('circle', {r: 2.4, class: 'dot'}, pulley);
  label(svg, 322, 304, t.pulley, 'tag', 'middle');
  const wl = polar(60, -24, C);
  lead(svg, wl.x, wl.y, 420, 176, 430, 176);
  label(svg, 434, 180, t.weights, 'tag');

  // palanca de disparo
  const P = {x: 424, y: 322};
  const lev = S('g', {}, svg);
  place(lev, P.x, P.y);
  S('path', {d: 'M-8 6 L-36 -100 L-26 -102 L6 -6 Z', class: 'hot'}, lev);
  S('circle', {r: 8, class: 'solid'}, lev);
  S('circle', {r: 2.4, class: 'dot'}, lev);
  label(svg, P.x + 20, P.y + 22, t.lever, 'tag');
  arrow(svg, P.x + 16, P.y - 6, P.x + 70, P.y - 6, 'ln2');
  label(svg, P.x + 20, P.y - 14, t.toTrip, 'tag m');

  // velocímetro
  const gx = 452, gy = 40;
  label(svg, gx, gy, t.speed, 'tag m');
  const num = label(svg, gx, gy + 32, '', 'big');
  S('rect', {x: gx, y: gy + 46, width: 160, height: 8, class: 'ln2', fill: 'none'}, svg);
  const fill = S('rect', {x: gx, y: gy + 46, width: 0, height: 8, fill: 'var(--ink)'}, svg);
  S('line', {x1: gx + 80, y1: gy + 40, x2: gx + 80, y2: gy + 62, stroke: 'var(--accent)', 'stroke-width': 2}, svg);
  label(svg, gx + 80, gy + 76, t.critical + ' m/s', 'tag a', 'middle');
  const state = label(svg, gx, gy + 96, '', 'tag');

  let lay0 = 0, angle = 0, deflect = 0;
  const fmt = v => v.toFixed(2).replace('.', ',') + ' m/s';
  return {
    phases: [{label: t.c0, dur: 4.6}, {label: t.c1, dur: 3.4}, {label: t.c2, dur: 3}],
    draw(i, u, dt) {
      let v, open, d;
      if (i === 0) { v = .15 + .17 * ease(u) + .015 * Math.sin(u * 12); open = 0; d = 13 * (1 - ease(u / .12)); }
      else if (i === 1) { v = lerp(.32, .78, ease(u)); open = ease((v - .47) / .1); d = 13 * ease((open - .8) / .2); }
      else { v = u < .5 ? .78 : lerp(.78, 0, ease((u - .5) / .35)); open = ease((v - .47) / .1); d = 13; }
      lay0 = (lay0 + v * dt * 150) % 14;
      angle -= v * dt * 260;
      lay.setAttribute('transform', 'translate(0 ' + f(lay0) + ')');
      place(roller, 222, 215);
      rollMark.setAttribute('transform', 'rotate(' + f(-angle * R / 24 * .7) + ')');
      place(pulley, C.x, C.y, 0);
      body.setAttribute('transform', 'rotate(' + f(angle) + ')');
      const pts = weights.map(w => {
        const a = sign * BETA * open;
        w.w.setAttribute('transform', 'rotate(' + f(a) + ' ' + f(hinge.x) + ' ' + f(hinge.y) + ')');
        const dx = free0.x - hinge.x, dy = free0.y - hinge.y, r = rad(a);
        const p = {x: hinge.x + dx * Math.cos(r) - dy * Math.sin(r), y: hinge.y + dx * Math.sin(r) + dy * Math.cos(r)};
        return w.rot ? {x: -p.x, y: -p.y} : p;
      });
      springPath.setAttribute('d', zig(pts[0].x, pts[0].y, pts[1].x, pts[1].y, 9, 4.5));
      place(lev, P.x, P.y, d);
      num.textContent = fmt(v);
      fill.setAttribute('width', f(160 * clamp(v / 1)));
      fill.setAttribute('fill', v > .5 ? 'var(--accent)' : 'var(--ink)');
      state.textContent = open > .5 ? t.open : t.closed;
      state.setAttribute('class', open > .5 ? 'tag a' : 'tag');
    }
  };
}

// ---------------------------------------------------------------- 2 · Mecanismo de disparo
function disparo(svg, t) {
  const id = 'd' + (uid++);
  const dfs = defs(svg);
  clip(dfs, id + 'k', 24, 16, 592, 408);
  S('rect', {x: 20, y: 12, width: 600, height: 416, class: 'frame'}, svg);
  label(svg, 30, 420, t.schematic, 'tag m');
  const Pv = {x: 300, y: 150};

  // cable inclinable alrededor de su entrada
  S('line', {x1: 110, y1: 22, x2: 110, y2: 360, class: 'ctr'}, svg);
  const cableClip = S('g', {'clip-path': 'url(#' + id + 'k)'}, svg);
  const cable = S('g', {}, cableClip);
  S('rect', {x: -4, y: 0, width: 8, height: 330, class: 'solid'}, cable);
  for (let y = 10; y < 322; y += 12) S('line', {x1: -4, y1: y + 6, x2: 4, y2: y, class: 'thin'}, cable);
  S('rect', {x: -10, y: 326, width: 20, height: 26, class: 'dark'}, cable);
  S('circle', {cx: 110, cy: 22, r: 11, class: 'hatch'}, svg);
  S('circle', {cx: 110, cy: 22, r: 4.5, fill: 'var(--bg)', stroke: 'var(--ink)', 'stroke-width': 1}, svg);
  label(svg, 330, 384, t.tilt, 'tag m');
  const tiltTag = label(svg, 330, 408, '', 'big a');
  tiltTag.setAttribute('style', 'font-size:20px');
  label(svg, 410, 408, t.limit, 'tag m');
  label(svg, 90, 372, t.counterweight, 'tag m', 'end');

  // centrífugo en miniatura sobre el saliente de la palanca
  const gc = {x: 244, y: 89};
  const gov = S('g', {}, svg);
  place(gov, gc.x, gc.y);
  S('circle', {r: 17, class: 'solid'}, gov);
  const arms = S('g', {}, gov);
  const govSpring = S('line', {class: 'thin'}, arms);
  const gl = [0, 1].map(() => ({line: S('line', {class: 'ln2'}, arms), mass: S('circle', {r: 7, class: 'dark'}, arms)}));
  S('circle', {r: 4, fill: 'var(--bg)', stroke: 'var(--ink)', 'stroke-width': 1}, gov);
  label(svg, gc.x, 56, t.governor, 'tag m', 'middle');

  // botón de emergencia
  hatchRect(svg, 160, 58, 28, 12);
  const button = S('g', {}, svg);
  S('rect', {x: 168, y: 36, width: 12, height: 106, class: 'solid'}, button);
  S('rect', {x: 158, y: 26, width: 32, height: 12, rx: 3, class: 'hot'}, button);
  label(svg, 198, 36, t.button, 'tag a');

  // palanca de disparo
  const lever = S('g', {}, svg);
  place(lever, Pv.x, Pv.y);
  S('path', {d: 'M-152 -8 L-70 -8 L-70 -17 L-42 -17 L-42 -8 L106 -8 L106 40 L92 40 L92 8 L-138 8 L-138 46 L-148 46 L-148 8 L-152 8 Z', class: 'solid'}, lever);
  S('circle', {r: 12, class: 'dark'}, lever);
  S('circle', {r: 4, fill: 'var(--bg)'}, lever);
  label(svg, 298, 110, t.lever, 'tag');

  // retén de las mordazas: carro con muelle
  S('line', {x1: 250, y1: 178, x2: 560, y2: 178, class: 'thin'}, svg);
  S('line', {x1: 250, y1: 210, x2: 560, y2: 210, class: 'thin'}, svg);
  hatchRect(svg, 560, 168, 28, 52);
  const car = S('g', {}, svg);
  S('path', {d: 'M330 182 H388 V190 H408 V182 H470 V206 H330 Z', class: 'solid'}, car);
  S('circle', {cx: 440, cy: 194, r: 3, class: 'dot'}, car);
  const carSpring = S('path', {class: 'ln'}, svg);
  label(svg, 416, 172, t.latch, 'tag');
  const freeTag = S('g', {}, svg);
  arrow(freeTag, 268, 194, 214, 194, 'hotln');
  label(freeTag, 214, 224, t.freeJaws, 'tag a');

  // maneta de rearme con biela
  const H = {x: 480, y: 260}, h = 40, A0 = 100;
  hatchRect(svg, 466, 236, 28, 10);
  const rod = S('line', {class: 'ln'}, svg);
  const handle = S('g', {}, svg);
  S('rect', {x: -8, y: -4, width: 108, height: 8, rx: 3, class: 'solid'}, handle);
  S('circle', {cx: 40, cy: 0, r: 4.5, class: 'dark'}, handle);
  S('circle', {cx: 100, cy: 0, r: 6, class: 'hot'}, handle);
  S('circle', {r: 7, class: 'dark'}, handle);
  const rodEnd = S('circle', {r: 4, class: 'dark'}, svg);
  label(svg, 508, 300, t.handle, 'tag');
  const turn = S('path', {d: 'M' + f(polar(70, 100, H).x) + ' ' + f(polar(70, 100, H).y) + 'A70 70 0 0 0 ' + f(polar(70, 145, H).x) + ' ' + f(polar(70, 145, H).y), class: 'hid'}, svg);
  const stateTag = label(svg, 612, 36, '', 'tag a', 'end');

  const solve = x => A0 + 45 * clamp(-x / 56);
  const TRAVEL = 56, PHI = 12;
  let spin = 0, from = {phi: 0, alpha: 0}, lastIndex = 0, shown = {phi: 0, alpha: 0};
  const SEQ = [
    () => ({phi: 0, alpha: 0, btn: 0, open: 0, rate: 40}),
    u => ({phi: PHI * ease((u - .3) / .25), alpha: 0, btn: 0, open: ease((u - .05) / .22) * (1 - ease((u - .72) / .1)), rate: lerp(40, 520, ease(u / .3)) * (1 - .9 * ease((u - .72) / .1))}),
    u => { const al = 16 * ease((u - .1) / .5); return {phi: PHI * ease((al - 14) / 2), alpha: al, btn: 0, open: 0, rate: 40}; },
    u => { const b = ease((u - .2) / .3); return {phi: PHI * b, alpha: 0, btn: b, open: 0, rate: 40}; },
    u => { const pull = ease(u / .5); return {phi: PHI * (1 - ease((u - .52) / .14)), alpha: 0, btn: 0, open: 0, rate: 40, dx: -TRAVEL * (1 - pull)}; }
  ];
  const names = [t.armed, t.tripped, t.tripped, t.tripped, t.rearm];
  return {
    phases: [{label: t.d0, dur: 2.6}, {label: t.d1, dur: 4.4}, {label: t.d2, dur: 4.4}, {label: t.d3, dur: 3.6}, {label: t.d4, dur: 4.2}],
    draw(i, u, dt) {
      if (i !== lastIndex) { from = {...shown}; lastIndex = i; }
      const target = SEQ[i](u);
      // Each trip starts from the armed position, so a mechanism left tripped resets first.
      const k = i === 4 ? 1 : ease(u / .15);
      const phi = i === 4 ? target.phi : lerp(from.phi, target.phi, i === 1 ? 1 : k);
      const alpha = i === 4 ? 0 : lerp(from.alpha, target.alpha, k);
      shown = {phi, alpha};
      const dx = target.dx ?? -TRAVEL * ease((98 * Math.sin(rad(phi)) - 9) / 12);
      spin += target.rate * dt;
      cable.setAttribute('transform', 'translate(110 22) rotate(' + f(-alpha) + ')');
      tiltTag.textContent = alpha.toFixed(1).replace('.', ',') + '°';
      place(lever, Pv.x, Pv.y, -phi);
      place(car, dx, 0);
      carSpring.setAttribute('d', zig(470 + dx, 194, 560, 194, 8, 9));
      freeTag.setAttribute('opacity', f(ease(-dx / 40)));
      const a = solve(dx), q = polar(h, a, H);
      place(handle, H.x, H.y, a);
      rod.setAttribute('x1', f(q.x)); rod.setAttribute('y1', f(q.y)); rod.setAttribute('x2', f(440 + dx)); rod.setAttribute('y2', 206);
      place(rodEnd, 440 + dx, 206);
      const reach = lerp(20, 36, target.open);
      const pts = [0, 1].map(n => polar(reach, spin + n * 180));
      gl.forEach((w, n) => {
        w.line.setAttribute('x2', f(pts[n].x)); w.line.setAttribute('y2', f(pts[n].y));
        w.mass.setAttribute('cx', f(pts[n].x)); w.mass.setAttribute('cy', f(pts[n].y));
      });
      govSpring.setAttribute('x1', f(pts[0].x)); govSpring.setAttribute('y1', f(pts[0].y)); govSpring.setAttribute('x2', f(pts[1].x)); govSpring.setAttribute('y2', f(pts[1].y));
      place(button, 0, target.btn > 0 ? 126 * Math.sin(rad(phi)) : 0);
      stateTag.textContent = names[i];
    }
  };
}

// ---------------------------------------------------------------- 3 · Mordazas
// Sección de un conjunto de mordazas paralelas a ambos lados del cable. Capas de abajo a arriba:
// levas con pivote y muelle de torsión, cable, mordazas y retén. Cada mordaza lleva un perno que
// desliza por una ranura de la leva. El retén se aloja en una muesca de la leva y la mantiene
// en la posición de trabajo. Perfiles genéricos (js/v3-mordazas-datos.js), no los del dispositivo.
function mordazas(svg, t) {
  const dfs = defs(svg);
  S('rect', {x: 20, y: 12, width: 600, height: 416, class: 'frame'}, svg);
  label(svg, 470, 32, t.schematicShort, 'tag m');
  const NSE = {'vector-effect': 'non-scaling-stroke'};
  const OX = 176, MM = 2.7, TY = 24 - 20 * MM;
  const px = x => OX + MM * x, py = z => TY - MM * z;
  const mm = (parent) => S('g', {transform: 'matrix(' + MM + ' 0 0 ' + (-MM) + ' ' + OX + ' ' + f(TY) + ')'}, parent);
  const path = (parent, d, cls, extra = {}) => S('path', {d, class: cls, ...NSE, ...extra}, parent);
  const rotPt = (p, phi) => {
    const r = rad(phi), dx = p[0] - PIVOT.x, dz = p[1] - PIVOT.y;
    return [PIVOT.x + dx * Math.cos(r) - dz * Math.sin(r), PIVOT.y + dx * Math.sin(r) + dz * Math.cos(r)];
  };
  // posición del perno de cada mordaza: corte de su ranura (girada con la leva) con la cota del perno
  const slotX = (q0, gamma, phi) => { const q = rotPt(q0, phi); return q[0] + (-62 - q[1]) / Math.tan(rad(gamma + phi)); };
  const OPEN_PHI = 14;

  // 1 · levas (capa inferior)
  const levers = [0, LOBE_STEP].map(dz => {
    const g = S('g', {transform: 'matrix(' + MM + ' 0 0 ' + (-MM) + ' ' + OX + ' ' + f(TY) + ')'}, svg);
    const shift = S('g', {transform: 'translate(0 ' + dz + ')'}, g);
    const rot = S('g', {}, shift);
    path(rot, LEVER + SLOT_A + SLOT_B, 'solid', {'fill-rule': 'evenodd'});
    S('circle', {cx: PIVOT.x, cy: PIVOT.y, r: PIVOT.r, class: 'dark', ...NSE}, shift);
    S('circle', {cx: PIVOT.x, cy: PIVOT.y, r: 2, fill: 'var(--bg)'}, shift);
    const coil = S('path', {class: 'ln2', ...NSE}, svg);
    return {rot, coil, cx: px(PIVOT.x), cy: py(PIVOT.y + dz)};
  });

  // 2 · cable de seguridad (siempre visible, sobre las levas)
  S('line', {x1: px(0), y1: 14, x2: px(0), y2: 426, class: 'ctr'}, svg);
  const cableClip = S('clipPath', {id: 'mzc'}, svg);
  S('rect', {x: px(-4.15), y: 24, width: MM * 8.3, height: 390}, cableClip);
  S('rect', {x: px(-4.15), y: 24, width: MM * 8.3, height: 390, fill: 'var(--bg)', stroke: 'var(--ink)', 'stroke-width': 1.6}, svg);
  const tickLines = S('g', {'clip-path': 'url(#mzc)'}, svg);
  const strands = S('g', {}, tickLines);
  for (let y = 6; y < 430; y += 9) S('line', {x1: px(-4.15), y1: y + 5, x2: px(4.15), y2: y, stroke: 'var(--ink)', 'stroke-width': .9, opacity: .75}, strands);

  // 3 · mordazas (sobre el cable y las levas) con sus pernos
  const jaw1 = mm(svg), jaw2 = mm(svg);
  path(jaw1, JAW1, 'solid'); path(jaw2, JAW2, 'solid');
  for (const [j, sign] of [[jaw1, 1], [jaw2, -1]]) {
    for (let z = -46; z > -134; z -= 5) S('line', {x1: sign * 4.15, y1: z, x2: sign * 6.8, y2: z - 2.5, class: 'ln2', ...NSE}, j);
    for (const zp of [-62, -62 + LOBE_STEP]) {
      S('circle', {cx: sign * 12, cy: zp, r: 2.6, class: 'dark', ...NSE}, j);
    }
  }

  // 4 · retén: dos garras unidas por una bieleta, que entran en la muesca de cada leva
  const pawls = [0, LOBE_STEP].map(dz => {
    const g = S('g', {transform: 'matrix(' + MM + ' 0 0 ' + (-MM) + ' ' + OX + ' ' + f(TY) + ')'}, svg);
    const shift = S('g', {transform: 'translate(0 ' + dz + ')'}, g);
    const rot = S('g', {}, shift);
    path(rot, PAWL, 'hot');
    S('circle', {cx: PAWL_PIVOT.x, cy: PAWL_PIVOT.y, r: 5, class: 'dark', ...NSE}, shift);
    S('circle', {cx: PAWL_PIVOT.x, cy: PAWL_PIVOT.y, r: 1.6, fill: 'var(--bg)'}, shift);
    return {rot, dz};
  });
  const tie = S('line', {class: 'ln', stroke: 'var(--ink)'}, svg);
  const tieDots = [S('circle', {r: 3, class: 'dark'}, svg), S('circle', {r: 3, class: 'dark'}, svg)];
  const trig = S('g', {}, svg);
  arrow(trig, px(PAWL_PIVOT.x) + 2, 52, px(PAWL_PIVOT.x) + 2, 84, 'ln2');
  label(trig, px(PAWL_PIVOT.x) + 10, 66, t.trip, 'tag m');

  // etiquetas con directrices
  label(svg, 56, 88, t.hook, 'tag a');
  lead(svg, 58, 92, px(PAWL_PIVOT.x) + 4, py(PAWL_PIVOT.y) - 6);
  const gap = py(-95);
  lead(svg, px(20) + 4, gap, 352, gap);
  label(svg, 358, gap + 4, t.jaws, 'tag');
  lead(svg, px(55), py(-64), 352, py(-64));
  label(svg, 358, py(-64) + 4, t.jawCam, 'tag');
  label(svg, 358, py(-64) + 18, t.notchNote, 'tag m');
  lead(svg, levers[0].cx + 33, levers[0].cy + 12, 352, levers[0].cy + 34);
  label(svg, 358, levers[0].cy + 38, t.torsion, 'tag m');
  label(svg, px(0) + 52, 421, t.safety, 'tag m');
  const loadArrow = S('g', {}, svg);
  arrow(loadArrow, px(0), 372, px(0), 414, 'hotln');
  label(loadArrow, px(0) + 12, 400, t.load, 'tag a');
  const stateA = label(svg, 358, 372, '', 'tag a'), stateB = label(svg, 358, 388, '', 'tag a');

  // inset de la plataforma
  const bx = 470;
  S('rect', {x: bx, y: 44, width: 142, height: 358, class: 'frame'}, svg);
  label(svg, bx + 10, 62, t.platform, 'tag m');
  const safe = S('path', {}, svg), work = S('path', {}, svg);
  const rs = bx + 36, rw = bx + 108;
  S('rect', {x: rs - 12, y: 86, width: 24, height: 38, class: 'solid'}, svg);
  S('rect', {x: rw - 12, y: 86, width: 24, height: 38, class: 'solid'}, svg);
  S('line', {x1: rs, y1: 70, x2: rs, y2: 86, class: 'ln'}, svg);
  S('line', {x1: rw, y1: 70, x2: rw, y2: 86, class: 'ln'}, svg);
  const deck = S('g', {}, svg);
  S('rect', {x: bx + 14, y: 0, width: 114, height: 18, class: 'solid'}, deck);
  S('rect', {x: bx + 22, y: -14, width: 98, height: 14, class: 'thin'}, deck);
  S('rect', {x: rs - 6, y: 15, width: 10, height: 6, class: 'dark'}, deck);
  arrow(deck, bx + 71, 24, bx + 71, 56, 'ln2');
  label(deck, bx + 71, 70, t.load, 'tag', 'middle');
  const swS = S('line', {x1: bx + 10, y1: 354, x2: bx + 26, y2: 354}, svg), swW = S('line', {x1: bx + 10, y1: 378, x2: bx + 26, y2: 378}, svg);
  const safeTag = label(svg, bx + 32, 358, '', 'tag'), workTag = label(svg, bx + 32, 382, '', 'tag');
  const ropePath = (x, top, bottom, slack) => {
    if (slack < .02) return 'M' + x + ' ' + top + 'V' + bottom;
    const len = bottom - top, b = 20 * slack;
    return 'M' + x + ' ' + top + 'C' + f(x + b) + ' ' + f(top + len * .3) + ' ' + f(x - b) + ' ' + f(top + len * .7) + ' ' + x + ' ' + bottom;
  };

  const st = {close: 0, hook: 0, load: 0, deck: 0, safeLoad: 0, workLoad: 1, flow: 1};
  let flowOffset = 0;
  const midOf = (dz, rho) => {
    // punto medio de la garra tras girar rho grados alrededor de su pivote (para la bieleta)
    const tipRel = [TIP.x - PAWL_PIVOT.x, TIP.y - PAWL_PIVOT.y], r = rad(rho);
    const x = PAWL_PIVOT.x + .62 * (tipRel[0] * Math.cos(r) - tipRel[1] * Math.sin(r));
    const z = PAWL_PIVOT.y + .62 * (tipRel[0] * Math.sin(r) + tipRel[1] * Math.cos(r));
    return [px(x), py(z + dz)];
  };
  const paint = () => {
    const phi = OPEN_PHI * (1 - st.close);
    const d1 = slotX([12, -62], 28.5, phi) - 12, d2 = slotX([-12, -62], 102, phi) + 12;
    jaw1.setAttribute('transform', 'matrix(' + MM + ' 0 0 ' + (-MM) + ' ' + f(OX + MM * d1) + ' ' + f(TY) + ')');
    jaw2.setAttribute('transform', 'matrix(' + MM + ' 0 0 ' + (-MM) + ' ' + f(OX + MM * d2) + ' ' + f(TY) + ')');
    levers.forEach(l => {
      l.rot.setAttribute('transform', 'rotate(' + f(phi) + ' ' + PIVOT.x + ' ' + PIVOT.y + ')');
      l.coil.setAttribute('d', spiral(21, 30 + 3 * (1 - st.close), 2.6 + .6 * (1 - st.close)));
      l.coil.setAttribute('transform', 'translate(' + f(l.cx) + ' ' + f(l.cy) + ')');
    });
    const rho = -30 * st.hook;
    pawls.forEach(p => p.rot.setAttribute('transform', 'rotate(' + f(rho) + ' ' + PAWL_PIVOT.x + ' ' + PAWL_PIVOT.y + ')'));
    const m1 = midOf(0, rho), m2 = midOf(LOBE_STEP, rho);
    tie.setAttribute('x1', f(m1[0])); tie.setAttribute('y1', f(m1[1])); tie.setAttribute('x2', f(m2[0])); tie.setAttribute('y2', f(m2[1]));
    tieDots[0].setAttribute('cx', f(m1[0])); tieDots[0].setAttribute('cy', f(m1[1]));
    tieDots[1].setAttribute('cx', f(m2[0])); tieDots[1].setAttribute('cy', f(m2[1]));
    trig.setAttribute('opacity', f(ease((st.hook - .02) / .3) * (1 - ease((st.hook - .9) / .1))));
    loadArrow.setAttribute('opacity', f(st.load));
    strands.setAttribute('transform', 'translate(0 ' + f(flowOffset) + ')');
    const deckY = 262 + st.deck;
    deck.setAttribute('transform', 'translate(0 ' + f(deckY) + ')');
    safe.setAttribute('d', ropePath(rs, 124, deckY, 1 - st.safeLoad));
    work.setAttribute('d', ropePath(rw, 124, deckY, 1 - st.workLoad));
    const sl = st.safeLoad > .5, wl = st.workLoad > .5;
    safe.setAttribute('class', sl ? 'hotln' : 'ln2'); work.setAttribute('class', wl ? 'hotln' : 'ln2');
    swS.setAttribute('class', sl ? 'hotln' : 'ln2'); swW.setAttribute('class', wl ? 'hotln' : 'ln2');
    safeTag.textContent = t.safetyShort + ': ' + (sl ? t.load.toLowerCase() : t.slack);
    workTag.textContent = t.workShort + ': ' + (wl ? t.load.toLowerCase() : t.slack);
    safeTag.setAttribute('class', sl ? 'tag a' : 'tag m'); workTag.setAttribute('class', wl ? 'tag a' : 'tag m');
  };
  const SEQ = [
    () => ({close: 0, hook: 0, load: 0, deck: 0, safeLoad: 0, workLoad: 1, flow: 1}),
    u => ({close: ease((u - .3) / .2), hook: ease((u - .15) / .2), load: 0, deck: 10 * ease((u - .3) / .4), safeLoad: ease((u - .5) / .3), workLoad: 1 - ease((u - .5) / .3), flow: 1 - ease((u - .3) / .2)}),
    u => ({close: 1, hook: 1, load: 1, deck: 10, safeLoad: 1, workLoad: 0, flow: 0, blocked: true}),
    u => ({close: 1, hook: 1, load: 1 - ease((u - .4) / .3), deck: 10 - 10 * ease((u - .1) / .5), safeLoad: 1 - ease((u - .35) / .3), workLoad: ease((u - .2) / .3), flow: 0}),
    u => ({close: 1 - ease((u - .1) / .4), hook: 1 - ease((u - .6) / .2), load: 0, deck: 0, safeLoad: 0, workLoad: 1, flow: ease((u - .7) / .3)})
  ];
  return {
    phases: [{label: t.m0, dur: 3}, {label: t.m1, dur: 3}, {label: t.m2, dur: 4}, {label: t.m3, dur: 3.4}, {label: t.m4, dur: 4.2}],
    draw(i, u, dt) {
      const s = SEQ[i](u);
      Object.assign(st, s);
      flowOffset = (flowOffset + (s.flow || 0) * dt * 36) % 9;
      paint();
      const lines = s.blocked ? t.blockedLines : st.close > .5 ? t.closedLines : t.openLines;
      stateA.textContent = lines[0]; stateB.textContent = lines[1];
    }
  };
}

// ---------------------------------------------------------------- 4 · Ciclo de prototipado
function ciclo(svg, t) {
  const dfs = defs(svg);
  const C = {x: 320, y: 214}, R = 150;
  S('rect', {x: 20, y: 12, width: 600, height: 416, class: 'frame'}, svg);
  // anillo base, arco de avance y marcas
  S('circle', {cx: C.x, cy: C.y, r: R, fill: 'none', stroke: 'var(--rule-strong)', 'stroke-width': 1, opacity: .5}, svg);
  S('circle', {cx: C.x, cy: C.y, r: R + 12, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1}, svg);
  S('circle', {cx: C.x, cy: C.y, r: R - 12, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1}, svg);
  for (let a = 0; a < 360; a += 5) {
    const p1 = polar(R + 12, a, C), p2 = polar(R + (a % 45 ? 16 : 20), a, C);
    S('line', {x1: f(p1.x), y1: f(p1.y), x2: f(p2.x), y2: f(p2.y), stroke: 'var(--muted)', 'stroke-width': a % 45 ? .5 : .9, opacity: a % 45 ? .5 : 1}, svg);
  }
  const arcLen = 2 * Math.PI * R;
  const arc = S('circle', {cx: C.x, cy: C.y, r: R, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 3, 'stroke-linecap': 'round',
    'stroke-dasharray': '0 ' + f(arcLen), transform: 'rotate(-90 ' + C.x + ' ' + C.y + ')'}, svg);
  // centro
  const spinner = S('circle', {cx: C.x, cy: C.y, r: 62, fill: 'none', stroke: 'var(--muted)', 'stroke-width': .9, 'stroke-dasharray': '3 7'}, svg);
  label(svg, C.x, C.y - 8, t.loop, 'big', 'middle').setAttribute('style', 'font-size:17px');
  label(svg, C.x, C.y + 14, t.loopSub, 'tag m', 'middle');
  const head = S('circle', {r: 6, class: 'hot'}, svg);
  const STEP = 360 / t.steps.length;
  const nodes = t.steps.map((name, k) => {
    const a = -90 + k * STEP, p = polar(R, a, C), c = Math.cos(rad(a));
    const g = S('g', {}, svg);
    place(g, p.x, p.y);
    const halo = S('circle', {r: 22, fill: 'var(--accent)', opacity: 0}, g);
    const disc = S('circle', {r: 15, class: 'solid'}, g);
    const num = label(g, 0, 4, String(k + 1), 'tag', 'middle');
    const anchor = c > .3 ? 'start' : c < -.3 ? 'end' : 'middle';
    const tx = c > .3 ? 28 : c < -.3 ? -28 : 0, ty = Math.abs(c) > .3 ? 4 : (k === 0 ? -28 : 36);
    const lines = name.split('\n');
    const text = label(g, tx, ty, lines.length > 1 ? '' : name, 'tag', anchor);
    if (lines.length > 1) lines.forEach((line, i) => S('tspan', {x: tx, dy: i ? 14 : -4}, text, line));
    return {a, disc, num, halo, text, p};
  });
  const LAP = 9, HOLD = 1.6, FADE = .9, TOTAL = LAP + HOLD + FADE;
  return {
    phases: null,
    tick(time) {
      const s = time % TOTAL;
      const run = clamp(s / LAP);
      const sweep = ease(run) * .12 + run * .88;          // avance continuo con arranque y frenada suaves
      const ang = sweep * 360;
      const fade = s > LAP + HOLD ? 1 - ease((s - LAP - HOLD) / FADE) : 1;
      arc.setAttribute('stroke-dasharray', f(arcLen * sweep) + ' ' + f(arcLen));
      arc.setAttribute('opacity', f(fade));
      const hp = polar(R, ang - 90, C);
      place(head, hp.x, hp.y);
      head.setAttribute('opacity', f(s <= LAP ? 1 : fade * .0));
      spinner.setAttribute('transform', 'rotate(' + f(time * 8) + ' ' + C.x + ' ' + C.y + ')');
      nodes.forEach((n, k) => {
        const reach = ang - k * STEP;                          // grados que el arco ha pasado del nodo
        const on = clamp(reach / 14) * fade;
        const near = Math.exp(-Math.pow(reach / 18, 2)) * (s <= LAP ? 1 : 0);
        n.disc.setAttribute('style', 'fill:' + (on > .5 ? 'var(--ink)' : 'var(--panel)'));
        n.disc.setAttribute('r', f(15 + 2.5 * near));
        n.num.setAttribute('style', 'fill:' + (on > .5 ? 'var(--bg)' : 'var(--ink)'));
        n.halo.setAttribute('opacity', f(.22 * near));
        n.text.setAttribute('opacity', f(.55 + .45 * Math.max(on, near)));
      });
    }
  };
}

Object.assign(TEXT.es, TFM_TEXT.es); Object.assign(TEXT.en, TFM_TEXT.en);
const FIGURES = {centrifugo, disparo, mordazas, ciclo};
import {secciones} from './v4-tfm3d.js';
import {modelos} from './video.js';
const CUSTOM = {'tfm-modelos': modelos, 'tfm-secciones': secciones, 'tfm-universidades': universidades, 'tfm-resultados-locales': resultadosLocales, 'tfm-junta': junta, 'tfm-contorno': contorno, 'tfm-malla': malla, 'tfm-materiales': materiales, 'tfm-explorador': explorador};

// ---------------------------------------------------------------- Ejecución
export function mount(host, name, {lang, reduced}) {
  const t = TEXT[lang] || TEXT.es;
  if (CUSTOM[name]) return CUSTOM[name](host, {lang, reduced, t});
  const build = FIGURES[name];
  if (!build) throw new Error(name);
  const svg = S('svg', {viewBox: '0 0 640 440', class: 'dg', role: 'img', 'aria-label': (t.steps && name === 'ciclo' ? t.steps.join(', ').replace(/\n/g, ' ') : t.schematic)}, host);
  const model = build(svg, t);
  const bar = document.createElement('div');
  bar.className = 'dg-bar';
  host.append(bar);
  const phases = document.createElement('ul');
  phases.className = 'dg-phases';
  bar.append(phases);
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'dg-play';
  bar.append(play);
  let index = 0, clock = 0, playing = !reduced, visible = true, last = 0, queued = 0, total = 0;
  const buttons = (model.phases || []).map((p, k) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.label;
    b.addEventListener('click', () => { index = k; clock = 0; if (reduced) clock = p.dur; draw(0); });
    li.append(b);
    phases.append(li);
    return b;
  });
  const syncPlay = () => { play.textContent = playing ? t.play : t.resume; play.setAttribute('aria-pressed', String(!playing)); };
  play.addEventListener('click', () => { playing = !playing; syncPlay(); if (playing) kick(); });
  syncPlay();
  function draw(dt) {
    if (model.phases) {
      const p = model.phases[index];
      model.draw(index, clamp(clock / p.dur, 0, 1), dt);
      buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === index)));
    } else model.tick(total, dt);
  }
  function frame(now) {
    queued = 0;
    if (!visible || !playing) return;
    const dt = Math.min(.25, last ? (now - last) / 1000 : 0);
    last = now;
    total += dt;
    if (model.phases) {
      clock += dt;
      while (clock >= model.phases[index].dur) { clock -= model.phases[index].dur; index = (index + 1) % model.phases.length; }
    }
    draw(dt);
    queued = requestAnimationFrame(frame);
  }
  function kick() { last = 0; if (!queued && visible && playing) queued = requestAnimationFrame(frame); }
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) kick(); }, {rootMargin: '10% 0px'}).observe(host);
  // Hook used by the visual checks: jump to a phase and a point inside it.
  host.seek = (k, u) => { playing = false; syncPlay(); index = k; clock = u * (model.phases ? model.phases[k].dur : 1); total = u; draw(0); };
  if (reduced) { clock = model.phases ? model.phases[0].dur : 0; total = model.phases ? 0 : 4; }
  draw(0);
  kick();
}
