// Del 2D axisimétrico al 3D helicoidal: animación con la geometría de ANSYS y figura de secciones.
// Datos: data/tfm_modelo2d.json y data/tfm_modelo3d.bin (herramientas/exportar_tfm_modelos.py).

const COPY = {
  es: {
    phases: ['Sección 2D', 'Revolución', 'Modelo helicoidal', 'Rosca libre'],
    captions: [
      'El modelo 2D axisimétrico es la mitad de una sección meridiana de la unión.',
      'Al revolucionar la sección alrededor del eje se obtiene el sólido que representa el modelo: filetes anulares cerrados.',
      'A su lado, el modelo 3D con la rosca helicoidal real.',
      'En la rosca libre se aprecia la diferencia: anillos independientes frente a un filete que avanza a lo largo del eje.'],
    two: '2D axisimétrico', three: '3D helicoidal', play: 'Reproducir', pause: 'Pausa', replay: 'Repetir',
    load: 'Cargando geometría…', error: 'No se pudo cargar la geometría 3D.',
    crest: 'Corte por una cresta', root: 'Corte por una raíz', hel: 'Modelo helicoidal', axi: 'Modelo axisimétrico',
    half: 'Semisección', cross: 'Sección transversal', bolt: 'Perno', nut: 'Tuerca', constant: 'constante',
    note: 'Cresta y raíz referidas al perno. En la tuerca las fases son opuestas.', eq: 'Círculo equivalente al área helicoidal'
  },
  en: {
    phases: ['2D section', 'Revolution', 'Helical model', 'Unengaged thread'],
    captions: [
      'The 2D axisymmetric model uses half of a meridional section of the joint.',
      'Revolving the section about the axis gives the solid the model represents, with closed annular threads.',
      'Next to it, the 3D model with the real helical thread.',
      'The unengaged thread shows the difference: separate rings versus a single thread advancing along the axis.'],
    two: '2D axisymmetric', three: '3D helical', play: 'Play', pause: 'Pause', replay: 'Replay',
    load: 'Loading geometry…', error: 'The 3D geometry could not be loaded.',
    crest: 'Cut through a crest', root: 'Cut through a root', hel: 'Helical model', axi: 'Axisymmetric model',
    half: 'Half section', cross: 'Cross section', bolt: 'Bolt', nut: 'Nut', constant: 'constant',
    note: 'Crest and root refer to the bolt. The nut is in the opposite phase.', eq: 'Circle with the helical area'
  }
};

const el = (tag, cls, parent, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  parent?.append(n);
  return n;
};
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const y = clamp(x); return y * y * (3 - 2 * y); };
const mix = (a, b, t) => a + (b - a) * t;

// Normales suaves con aristas vivas. La malla exportada no orienta todas las caras igual, así que cada
// cara vecina se suma con el signo que coincide con la cara propia.
function smoothNormals(T, geometry) {
  const p = geometry.getAttribute('position').array, faces = p.length / 9;
  const normal = new Float32Array(faces * 3), shared = new Map();
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
  const key = i => p[i] + ',' + p[i + 1] + ',' + p[i + 2];
  for (let f = 0; f < faces; f++) {
    a.fromArray(p, f * 9); b.fromArray(p, f * 9 + 3); c.fromArray(p, f * 9 + 6);
    b.sub(a); c.sub(a); b.cross(c).normalize().toArray(normal, f * 3);
    for (let v = 0; v < 3; v++) {
      const k = key(f * 9 + v * 3);
      if (!shared.has(k)) shared.set(k, []);
      shared.get(k).push(f);
    }
  }
  const out = new Float32Array(p.length), limit = Math.cos(Math.PI / 5);
  for (let f = 0; f < faces; f++) for (let v = 0; v < 3; v++) {
    a.fromArray(normal, f * 3);
    c.set(0, 0, 0);
    for (const g of shared.get(key(f * 9 + v * 3))) {
      b.fromArray(normal, g * 3);
      const dot = a.dot(b);
      if (Math.abs(dot) > limit) c.addScaledVector(b, Math.sign(dot));
    }
    c.normalize().toArray(out, f * 9 + v * 3);
  }
  geometry.setAttribute('normal', new T.BufferAttribute(out, 3));
}

// ---------------------------------------------------------------- Animación
const STARTS = [0, 3, 8.6, 12], END = 22;

export async function modelos(host, {lang, reduced}) {
  const copy = COPY[lang] || COPY.es;
  const root = el('div', 'tf-widget tf-3d', host);
  const stage = el('div', 'tf-3dstage', root);
  const status = el('span', 'tf-3dstatus mono muted', stage, copy.load);
  const labels = [el('span', 'tf-3dlabel mono', stage, copy.two), el('span', 'tf-3dlabel mono', stage, copy.three)];
  const caption = el('p', 'tf-3dcaption', root);
  const bar = el('div', 'tf-chips', root);

  let T, kit, models;
  try {
    const [three, helpers, two, bin] = await Promise.all([
      import('three'), import('./v2-three.js'),
      fetch('data/tfm_modelo2d.json').then(r => r.json()),
      fetch('data/tfm_modelo3d.bin').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })]);
    T = three;
    kit = helpers;
    models = {two, bin};
  } catch (error) {
    status.textContent = copy.error;
    console.error(error);
    return;
  }

  const themeC = document.documentElement.dataset.tema === 'C';
  const COLORS = themeC ? {PERNO: '#8a959c', TUERCA: '#cdae72'} : {PERNO: '#b4b7ba', TUERCA: '#e3a48c'};
  const INK = themeC ? '#1d2124' : '#141414';
  const material = (body, opacity = 1) => new T.MeshStandardMaterial({color: COLORS[body], roughness: .58, metalness: .12, side: T.DoubleSide, transparent: opacity < 1, opacity});

  // Sección meridiana: relleno y contorno, usada como tapa de la revolución.
  const section = () => {
    const group = new T.Group();
    for (const body of ['PERNO', 'TUERCA']) {
      const data = models.two[body];
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position', new T.Float32BufferAttribute(data.puntos.flatMap(([r, y]) => [r, y, 0]), 3));
      geometry.setIndex(data.triangulos);
      group.add(new T.Mesh(geometry, new T.MeshBasicMaterial({color: new T.Color(COLORS[body]).multiplyScalar(.92), side: T.DoubleSide})));
      const lines = new T.BufferGeometry();
      lines.setAttribute('position', geometry.getAttribute('position'));
      lines.setIndex(data.borde);
      group.add(new T.LineSegments(lines, new T.LineBasicMaterial({color: INK, transparent: true, opacity: .75})));
    }
    return group;
  };

  // Superficie de revolución: cada arista del contorno barre su propia banda (aristas vivas entre bandas).
  const STEPS = 120;
  const lathe = body => {
    const {puntos, borde} = models.two[body];
    const edges = [];
    for (let i = 0; i < borde.length; i += 2) {
      const a = puntos[borde[i]], b = puntos[borde[i + 1]];
      if (Math.max(a[0], b[0]) > 1e-6) edges.push([a, b]);
    }
    const position = [], index = [];
    // Los índices van ordenados por ángulo: drawRange recorta el barrido.
    for (let s = 0; s <= STEPS; s++) {
      const angle = -2 * Math.PI * s / STEPS, c = Math.cos(angle), n = Math.sin(angle);
      for (const edge of edges) for (const [r, y] of edge) position.push(r * c, y, r * n);
    }
    const row = edges.length * 2;
    for (let s = 0; s < STEPS; s++) for (let e = 0; e < edges.length; e++) {
      const a = s * row + e * 2, b = a + 1, c = a + row, d = b + row;
      index.push(a, b, d, a, d, c);
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(position, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material(body));
    mesh.userData.perStep = edges.length * 6;
    mesh.frustumCulled = false;
    return mesh;
  };

  const flat = new T.Group();
  const first = section(), moving = section();
  const surfaces = [lathe('PERNO'), lathe('TUERCA')];
  flat.add(first, moving, ...surfaces);

  const helix = new T.Group();
  const raw = new Int16Array(models.bin);
  const nutTriangles = 20698, boltTriangles = raw.length / 9 - nutTriangles;
  [['PERNO', 0, boltTriangles], ['TUERCA', boltTriangles, nutTriangles]].forEach(([body, start, count]) => {
    const position = Float32Array.from(raw.subarray(start * 9, (start + count) * 9), v => v / 900);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(position, 3));
    smoothNormals(T, geometry);
    helix.add(new T.Mesh(geometry, material(body)));
  });
  const fade = value => helix.traverse(o => {
    if (!o.material) return;
    const transparent = value < .999;
    if (o.material.transparent !== transparent) { o.material.transparent = transparent; o.material.needsUpdate = true; }
    o.material.opacity = value;
  });

  const axisGeometry = new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1.6, 0), new T.Vector3(0, 37.6, 0)]);
  const axis = new T.Line(axisGeometry, new T.LineDashedMaterial({color: INK, dashSize: 1.1, gapSize: .45, transparent: true}));
  axis.computeLineDistances();
  flat.add(axis);

  let time = 0, spin = 0, last = 0, playing = !reduced, phase = -1;
  const view = kit.view(stage, ({scene, camera, renderer, now}) => {
    if (!flat.parent) scene.add(flat, helix);
    const dt = last ? Math.min(.1, (now - last) / 1000) : 0;
    last = now;
    if (playing) {
      time += dt;
      if (time > END) { time = 0; spin = 0; }
    }
    const toIso = ease((time - STARTS[1]) / 1.4);                 // frontal -> isométrica
    const turn = ease((time - STARTS[1] - 1.1) / 3.6) * 270;      // revolución hasta 270°
    const arrive = ease((time - STARTS[2]) / 2);                  // entra el modelo helicoidal
    const close = ease((time - STARTS[3]) / 1.3);                 // se completa la revolución
    const zoom = ease((time - STARTS[3] - .9) / 2.2);             // zoom a la rosca libre
    const sweep = turn + 90 * close;
    if (playing && time > STARTS[3] + 2.4) spin += dt * .7;

    const step = Math.round(sweep / 360 * STEPS);
    for (const mesh of surfaces) { mesh.visible = step > 0; mesh.geometry.setDrawRange(0, step * mesh.userData.perStep); }
    first.visible = sweep < 359;
    moving.visible = sweep > 0 && sweep < 359;
    moving.rotation.y = step / STEPS * 2 * Math.PI;
    axis.visible = zoom < 1;
    axis.material.opacity = 1 - zoom;

    const azimuth = Math.PI / 4 * toIso;
    const elevation = mix(mix(0, .46, toIso), .12, zoom);
    const aspect = stage.clientWidth / stage.clientHeight || 1.6;
    const separation = mix(mix(0, 10.5, arrive), 7.4, zoom);
    const rightX = Math.cos(azimuth), rightZ = -Math.sin(azimuth);
    flat.position.set(-separation * rightX, 0, -separation * rightZ);
    const helixOffset = separation + (1 - arrive) * 14;
    helix.position.set(helixOffset * rightX, 0, helixOffset * rightZ);
    helix.visible = arrive > 0;
    fade(arrive);
    flat.rotation.y = spin;
    helix.rotation.y = spin;

    // Encuadre: media sección, sólido completo, los dos modelos y la rosca libre.
    const needWidth = mix(mix(mix(6, 10.5, toIso), 20, arrive), 14.4, zoom);
    const needHeight = mix(mix(20.5, 21.6, toIso), 5.6, zoom);
    const halfHeight = Math.max(needHeight, needWidth / aspect);
    const half = mix(mix(4, 0, toIso), 0, zoom);
    const target = new T.Vector3(half, mix(18, 16.4, zoom), 0);
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)).multiplyScalar(120).add(target);
    camera.lookAt(target);
    Object.assign(camera, {left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight, near: 1, far: 400});
    camera.updateProjectionMatrix();

    // Rótulos bajo cada modelo.
    labels.forEach((label, i) => {
      const side = (i ? 1 : -1) * separation;
      const x = 50 + 50 * side / (halfHeight * aspect);
      label.style.left = (arrive ? x : 50) + '%';
      label.style.opacity = i ? arrive : 1;
    });
    const current = STARTS.reduce((n, s, i) => time >= s ? i : n, 0);
    if (current !== phase) {
      phase = current;
      caption.textContent = copy.captions[current];
      chips.forEach((chip, i) => chip.setAttribute('aria-pressed', String(i === current)));
    }
  }, {orthographic: true});
  view.renderer.toneMapping = T.NoToneMapping;
  status.remove();

  // Momento representativo de cada fase, para saltar a ella.
  const REST = [STARTS[0] + .1, STARTS[2] - .1, STARTS[3] - .1, STARTS[3] + 4];
  const chips = copy.phases.map((name, i) => {
    const chip = el('button', 'tf-chip', bar, (i + 1) + ' · ' + name);
    chip.type = 'button';
    chip.onclick = () => {
      time = reduced ? REST[i] : STARTS[i];
      if (i < 3) spin = 0;
      phase = -1;
      view.paint();
    };
    return chip;
  });
  const play = el('button', 'tf-play mono', bar);
  play.type = 'button';
  const sync = () => { play.textContent = playing ? copy.pause : copy.play; };
  play.onclick = () => { playing = !playing; sync(); };
  sync();
  view.resize();
  new IntersectionObserver(([entry]) => { last = 0; view.visibility(entry.isIntersecting); }, {threshold: .15}).observe(stage);
  // Para las comprobaciones visuales: ir a un instante concreto.
  host.seek = value => { playing = false; sync(); time = value; spin = value > STARTS[3] + 2.4 ? (value - STARTS[3] - 2.4) * .7 : 0; phase = -1; view.paint(); };
}

// ---------------------------------------------------------------- Secciones (figura de la memoria)
// Mismo perfil analítico y mismas áreas que 20261022_c11_secciones_vector.py y c11-secciones.csv.
const P = 1.5, RR = 5.08, RC = 5.95, RF = .2165, NC = 5.188, NR = 6, RO = 8;
const R2 = RR - RF + P / 4 * Math.sqrt(3);
const AREAS = {boltCrest: 111.22, boltRoot: 81.07, boltHelix: 95.943, nutCrest: 116.5, nutRoot: 87.96, nutHelix: 104.23};
const radii = z => {
  const q = Math.abs((((z + P / 2) % P) + P) % P - P / 2);
  const flank = R2 + (q - P / 4) * Math.sqrt(3);
  const arc = RR + RF - Math.sqrt(Math.max(0, RF * RF - q * q));
  return [q <= RF * Math.sqrt(3) / 2 ? arc : Math.min(flank, RC), Math.max(NC, Math.min(NR, flank))];
};
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
};
const path = points => 'M' + points.map(([x, y]) => x.toFixed(3) + ' ' + y.toFixed(3)).join('L') + 'Z';

function halfSection(parent, cut, helical) {
  const svg = sv('svg', {viewBox: '-1 -1 11 17', class: 'tf-sec-half', 'aria-hidden': 'true'}, parent);
  const Y = z => 15 - z;
  const zs = Array.from({length: 601}, (_, i) => i / 40);
  sv('path', {class: 'nut', d: path([...zs.filter(z => z >= 1.5 && z <= 13.5).map(z => [radii(z)[1], Y(z)]), [RO, Y(13.5)], [RO, Y(1.5)]])}, svg);
  sv('path', {class: 'bolt', d: path([[0, Y(0)], ...zs.map(z => [radii(z)[0], Y(z)]), [0, Y(15)]])}, svg);
  // Trazas de la superficie en el tramo libre: inclinadas solo en la hélice.
  for (const k of [0, 13.5]) for (let z = k; z <= k + 1.5; z += P) {
    const pts = Array.from({length: 25}, (_, i) => { const x = RC * i / 24; return [x, Y(z + (helical ? P / (2 * Math.PI) * Math.asin(x / RC) : 0))]; });
    sv('path', {class: 'trace', d: 'M' + pts.map(p => p.join(' ')).join('L')}, svg);
  }
  sv('line', {class: 'axisline', x1: 0, y1: -.8, x2: 0, y2: 15.8}, svg);
  sv('line', {class: 'cutline', x1: -.8, y1: Y(cut), x2: 9.6, y2: Y(cut)}, svg);
}

function crossSection(parent, cut, helical, lang) {
  const svg = sv('svg', {viewBox: '-8.4 -8.4 16.8 16.8', class: 'tf-sec-cross', 'aria-hidden': 'true'}, parent);
  const ring = index => Array.from({length: 360}, (_, i) => {
    const t = i * Math.PI / 180, r = radii(helical ? cut - P * t / (2 * Math.PI) : cut)[index];
    return [r * Math.cos(t), -r * Math.sin(t)];
  });
  sv('circle', {class: 'nut', r: RO}, svg);
  sv('path', {class: 'hole', d: path(ring(1))}, svg);
  sv('path', {class: 'bolt', d: path(ring(0))}, svg);
  if (!helical) sv('circle', {class: 'equivalent', r: Math.sqrt(AREAS.boltHelix / Math.PI)}, svg);
  sv('path', {class: 'trace', d: 'M-.5 0H.5M0 -.5V.5'}, svg);
  if (!helical) return;
  // Radios del corte helicoidal en los dos sentidos, como en la figura de la memoria.
  const [left, right] = cut === 6.75 ? [RR, RC] : [RC, RR];
  sv('line', {class: 'radius', x1: -left, y1: 0, x2: right, y2: 0}, svg);
  for (const [x, y, text] of [[-2.6, -.7, left], [2.8, -.7, right], [0, 1.8, 'r [mm]']])
    sv('text', {x, y, 'text-anchor': 'middle'}, svg).textContent = typeof text === 'number' ? text.toLocaleString(lang, {minimumFractionDigits: 2}) : text;
}

export function secciones(host, {lang}) {
  const copy = COPY[lang] || COPY.es;
  const num = v => v.toLocaleString(lang, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' mm²';
  const root = el('div', 'tf-widget tf-sec', host);
  const grid = el('div', 'tf-secgrid', root);
  el('span', 'tf-seccorner', grid);
  el('h4', '', grid, copy.crest);
  el('h4', '', grid, copy.root);
  for (const helical of [true, false]) {
    el('h4', 'tf-secrow', grid, helical ? copy.hel : copy.axi);
    for (const crest of [true, false]) {
      const cell = el('div', 'tf-seccell', grid);
      el('span', 'tf-secmobile mono muted', cell, crest ? copy.crest : copy.root);
      const views = el('div', 'tf-secviews', cell);
      const cut = crest ? 6.75 : 6;
      for (const [draw, name] of [[halfSection, copy.half], [crossSection, copy.cross]]) {
        const figure = el('figure', '', views);
        draw(figure, cut, helical, lang);
        el('figcaption', 'mono muted', figure, name);
      }
      const bolt = helical ? AREAS.boltHelix : crest ? AREAS.boltCrest : AREAS.boltRoot;
      const nut = helical ? AREAS.nutHelix : crest ? AREAS.nutRoot : AREAS.nutCrest;
      const data = el('dl', 'tf-secareas', cell);
      for (const [kind, name, value] of [['bolt', copy.bolt, bolt], ['nut', copy.nut, nut]]) {
        el('dt', kind, data, name);
        el('dd', 'mono', data, 'A = ' + num(value) + (helical ? ' · ' + copy.constant : ''));
      }
    }
  }
  const foot = el('div', 'tf-secfoot', root);
  el('span', 'tf-seceq', foot, copy.eq + ': A = ' + num(AREAS.boltHelix) + ' · Ø ' + (2 * Math.sqrt(AREAS.boltHelix / Math.PI)).toLocaleString(lang, {maximumFractionDigits: 3}) + ' mm');
  el('span', 'tf-note', foot, copy.note);
}
