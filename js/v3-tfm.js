// Figuras del apartado del TFM. Todo lo que representa geometría, malla o campos sale de los
// archivos de ANSYS (imágenes renderizadas por Codex desde los resultados y tablas MISO de la campaña);
// aquí solo se añaden anotaciones, controles y gráficos de datos.
export const TFM_TEXT = {
  es: {
    fr0: 'R = 0,45 · tuerca débil', fr1: 'R = 1,00 · tuerca resistente',
    mech0: 'Colapso de los filetes de la tuerca', mech1: 'Estricción de la rosca libre del perno',
    legend: 'Deformación plástica equivalente (EPPL_EQV)', u: 'u', F: 'F', tplay: 'Reproducir', tpause: 'Pausa',
    roles: {PRIMERO: 'primer estado', S50: '50 % de la fuerza máxima', S90: '90 % de la fuerza máxima', MAX: 'fuerza máxima', FINAL: 'estado final', D95: 'tras el máximo (95 %)', D90: 'tras el máximo (90 %)'},
    frSource: 'Campos de ANSYS, deformada a escala real',
    bcTitle: 'Condiciones de contorno',
    ml: ['Campaña', 'Intermedia', 'Fina'], elements: 'elementos', nodes: 'nodos',
    meshTitle: 'Sensibilidad de la fuerza a la malla', meshCase1: 'R = 1,00', meshCase2: 'R = 0,45',
    meshDiff1: 'Fuerza máxima ≈ 0,01 % entre mallas', meshDiff2: 'campaña +3,3 % sobre la fina (u = 0,675 mm)',
    meshNote2: 'Las mallas finas terminan por distorsión y no verifican la rama descendente completa.',
    stressAxis: 'Tensión verdadera (MPa)', strainAxis: 'Deformación plástica εp', bolt: 'Perno y tuerca · R = 1,00', rLabel: 'Tuerca R',
    extended: 'Prolongación numérica', epsF: 'εp = 0,765', matNote: 'El marcador indica la media plástica al final de los ensayos. El sombreado empieza en εp = 0,939, el máximo de la nube depurada.',
    matParams: ['E = 210 GPa', 'ν = 0,3', 'σy perno = 900 MPa', 'σy tuercas = 900 · 630 · 405 MPa'],
    expX: 'Desplazamiento (mm)', expY: 'Fuerza (kN)', expMax: 'Fuerza máxima', expAt: 'a',
    expCollapse: 'Colapso de los filetes de la tuerca', expNeck: 'Estricción de la rosca libre del perno',
    expMu: 'Efecto de μ', expMu1: 'μ 0,20 → 0,10 baja Fmáx un 2,6 %', expMu2: 'μ cambia Fmáx como mucho un 0,3 %',
    expMatrix: 'R × μ', auto: 'Recorrer', rowR: 'R', colMu: 'μ'
  },
  en: {
    fr0: 'R = 0.45 · weak nut', fr1: 'R = 1.00 · strong nut',
    mech0: 'Collapse of the nut threads', mech1: 'Bolt necking in the unengaged threads',
    legend: 'Equivalent plastic strain (EPPL_EQV)', u: 'u', F: 'F', tplay: 'Play', tpause: 'Pause',
    roles: {PRIMERO: 'first state', S50: '50 % of peak force', S90: '90 % of peak force', MAX: 'peak force', FINAL: 'final state', D95: 'after the peak (95 %)', D90: 'after the peak (90 %)'},
    frSource: 'ANSYS fields, deformed shape at true scale',
    bcTitle: 'Boundary conditions',
    ml: ['Study mesh', 'Intermediate', 'Fine'], elements: 'elements', nodes: 'nodes',
    meshTitle: 'Force sensitivity to mesh density', meshCase1: 'R = 1.00', meshCase2: 'R = 0.45',
    meshDiff1: 'Peak force varies by ≈ 0.01 %', meshDiff2: 'study mesh 3.3 % above the fine mesh (u = 0.675 mm)',
    meshNote2: 'The finer meshes stop due to element distortion, so the whole post-peak branch is not verified.',
    stressAxis: 'True stress (MPa)', strainAxis: 'Plastic strain εp', bolt: 'Bolt and nut · R = 1.00', rLabel: 'Nut R',
    extended: 'Numerical extension', epsF: 'εp = 0.765', matNote: 'The marker indicates the mean plastic strain at the end of the tests. Shading starts at εp = 0.939, the upper limit of the corrected data.',
    matParams: ['E = 210 GPa', 'ν = 0.3', 'bolt σy = 900 MPa', 'nut σy = 900 · 630 · 405 MPa'],
    expX: 'Displacement (mm)', expY: 'Force (kN)', expMax: 'Peak force', expAt: 'at',
    expCollapse: 'Collapse of the nut threads', expNeck: 'Bolt necking in the unengaged threads',
    expMu: 'Effect of μ', expMu1: 'μ 0.20 → 0.10 lowers Fmax by 2.6 %', expMu2: 'μ changes Fmax by 0.3 % at most',
    expMatrix: 'R × μ', auto: 'Cycle', rowR: 'R', colMu: 'μ'
  }
};
const tema = () => (document.documentElement.dataset.tema || 'A').toLowerCase();
const base = () => 'img/tfm/ansys/' + tema() + '/';
const STOPS = () => tema() === 'a' ? '#c9ccce,#e9b49f,#d2411b,#7a1a08,#2a0702' : '#7d8a92,#e7d2a6,#c39445,#7a5418,#2b1c06';

// ---------------------------------------------------------------- Contexto: campos reales de ANSYS
export async function junta(host, {lang, reduced, t}) {
  const [meta, tfm] = await Promise.all([fetch('data/tfm_frames.json').then(r => r.json()), fetch('data/tfm.json').then(r => r.json())]);
  const root = el('div', 'tf-widget tf-frames', host);
  const row = el('div', 'tf-frow', root);
  const anim = el('div', 'tf-fanim', row);
  const cases = [{dp: 'DP00', curve: 'c0', title: t.fr0, mech: t.mech0, color: 'var(--accent)'}, {dp: 'DP05', curve: 'c5', title: t.fr1, mech: t.mech1, color: 'var(--ink)'}];
  for (const c of cases) {
    const frames = meta.casos[c.dp].frames;
    c.frames = frames;
    c.panel = el('div', 'tf-fpanel', anim);
    el('div', 'tf-ftitle', c.panel, c.title).style.setProperty('--c', c.color);
    const box = el('div', 'tf-fimg', c.panel);
    c.imgs = frames.map(f => { const i = el('img', '', box); i.src = base() + c.dp + '/f' + String(f.i).padStart(2, '0') + '.webp'; i.alt = c.dp + ' · u = ' + f.u_mm + ' mm'; i.decoding = 'async'; return i; });
    c.read = el('div', 'tf-fread mono', c.panel);
    el('div', 'tf-fmech', c.panel, c.mech).style.setProperty('--c', c.color);
  }
  // curva fuerza-desplazamiento real de los mismos casos, con el punto del estado mostrado
  const chart = el('div', 'tf-fchart', row);
  const W = 340, H = 300, m = {l: 44, r: 12, t: 14, b: 38};
  const svg = sv('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'dg tf-svg'}, chart);
  const X = u => m.l + (W - m.l - m.r) * u / 3, Y = F => m.t + (H - m.t - m.b) * (1 - F / 100);
  for (let F = 0; F <= 100; F += 25) { sv('line', {x1: m.l, y1: Y(F), x2: W - m.r, y2: Y(F), stroke: 'var(--rule)'}, svg); sv('text', {x: m.l - 6, y: Y(F) + 4, class: 'tag m', 'text-anchor': 'end'}, svg, String(F)); }
  for (let u = 0; u <= 3; u++) sv('text', {x: X(u), y: H - m.b + 15, class: 'tag m', 'text-anchor': 'middle'}, svg, String(u));
  sv('line', {x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
  sv('line', {x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
  sv('text', {x: m.l + (W - m.l - m.r) / 2, y: H - 6, class: 'tag m', 'text-anchor': 'middle'}, svg, t.expX);
  sv('text', {x: 12, y: m.t + (H - m.t - m.b) / 2, class: 'tag m', 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (m.t + (H - m.t - m.b) / 2) + ')'}, svg, t.expY);
  for (const c of cases) {
    const cv = tfm.curvas.find(x => x.case === c.curve);
    sv('path', {d: 'M' + cv.pts.map(p => X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('L'), fill: 'none', stroke: c.color, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}, svg);
    c.dot = sv('circle', {r: 6, fill: 'var(--bg)', stroke: c.color, 'stroke-width': 3}, svg);
  }
  const key = el('div', 'tf-key', chart);
  for (const c of cases) el('span', '', key, c.title).style.setProperty('--c', c.color);
  const legend = el('div', 'tf-legend', anim);
  legend.innerHTML = '<i style="background:linear-gradient(90deg,' + STOPS() + ')"></i><span>0</span><span>' + t.legend + '</span><span>≥ ' + String(meta.vmax).replace('.', lang === 'en' ? '.' : ',') + '</span>';
  const ctrl = el('div', 'tf-ctrl', root);
  const play = el('button', 'tf-play mono', ctrl); play.type = 'button';
  const slider = el('input', 'tf-slider', ctrl); slider.type = 'range'; slider.min = 0; slider.max = 6; slider.value = 0; slider.step = 1; slider.setAttribute('aria-label', t.expX);
  el('span', 'tf-src mono muted', ctrl, t.frSource);
  let playing = !reduced, visible = false, step = 0, timer = 0;
  const fmtN = (v, d) => v.toLocaleString(lang, {maximumFractionDigits: d, minimumFractionDigits: d});
  const show = s => {
    step = s; slider.value = s;
    for (const c of cases) {
      const idx = Math.min(s, c.frames.length - 1), f = c.frames[idx];
      c.imgs.forEach((im, k) => im.classList.toggle('on', k === idx));
      c.read.textContent = 'u = ' + fmtN(f.u_mm, 2) + ' mm · F = ' + fmtN(f.F_kN, 1) + ' kN · ' + (t.roles[f.rol] || f.rol);
      c.dot.setAttribute('cx', X(f.u_mm)); c.dot.setAttribute('cy', Y(f.F_kN));
    }
  };
  const sync = () => { play.textContent = playing ? t.tpause : t.tplay; };
  play.onclick = () => { playing = !playing; sync(); };
  slider.oninput = () => { playing = false; sync(); show(Number(slider.value)); };
  sync(); show(0);
  clearInterval(timer);
  timer = setInterval(() => { if (playing && visible) show((step + 1) % 7); }, 2200);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {threshold: .2}).observe(root);
}

const studio = 'img/tfm/estudio/';
const resultTypes = ['deformada', 'plasticidad', 'triaxialidad', 'tension', 'cortante', 'carga', 'axial', 'radial', 'contacto'];

const STUDY = {
  es: {
    institutions: ['ETSEIB · Universitat Politècnica de Catalunya', 'Facultad de Ingeniería · Universidad de Santiago de Chile'],
    mesh: [
      ['Malla completa', 'Malla axisimétrica de la unión, con elementos cuadráticos PLANE183. Compartida por los nueve casos de la campaña.'],
      ['Zona roscada', 'El cambio de tamaño conecta el núcleo y el cuerpo de la tuerca con las bandas de malla más fina en la rosca.'],
      ['Raíces y flancos', 'Los cuadriláteros mapeados siguen los arcos de raíz y los flancos de los primeros filetes engranados.']
    ],
    bc: [
      ['Desplazamiento impuesto', 'Recorrido axial de 1,2 mm para R = 0,45 y de 3 mm para R = 0,70 y 1,00.'],
      ['Apoyo de la tuerca', 'La cara de apoyo de la tuerca queda empotrada, con desplazamientos axial y radial nulos.'],
      ['Contacto friccional', 'Ocho pares de flancos portantes y ocho opuestos. Se aplica rozamiento de Coulomb con μ = 0,10, 0,15 o 0,20.']
    ],
    flanks: ['Flancos portantes', 'Flancos opuestos'],
    fitted: 'Ver los puntos depurados y las leyes ajustadas',
    fullSize: 'Abrir a tamaño completo',
    portfolioSource: 'Figuras del TFM generadas a partir de resultados de ANSYS',
    results: [
      ['Geometría deformada', 'Ver dónde se concentra el movimiento y cómo cambia la forma de la rosca a medida que avanza la carga.'],
      ['Plasticidad equivalente', 'Localizar dónde empieza la plastificación y cómo se extiende por el engrane y el perno.'],
      ['Triaxialidad', 'Distinguir el estado de tensiones de cada zona crítica: tracción, cortante o compresión.'],
      ['Tensión equivalente', 'Identificar las zonas más solicitadas y la concentración de tensiones en las raíces.'],
      ['Cortante normalizado', 'Ver lo cerca que está cada filete de su límite a cizalladura.'],
      ['Fuerza por hilo', 'Seguir cómo se reparte la carga entre los hilos y cómo se redistribuye al plastificar.'],
      ['Desplazamiento axial', 'Determinar qué zona de la unión absorbe el alargamiento y, con ello, dónde se localiza el fallo.'],
      ['Reducción de sección', 'Detectar la formación de un cuello en la rosca libre del perno y situarlo.'],
      ['Estado de contacto', 'Ver qué flancos se abren, deslizan o quedan adheridos a medida que avanza la carga.']
    ]
  },
  en: {
    institutions: ['ETSEIB · Universitat Politècnica de Catalunya', 'Faculty of Engineering · Universidad de Santiago de Chile'],
    mesh: [
      ['Full mesh', 'Axisymmetric mesh of the joint with quadratic PLANE183 elements, used for all nine cases.'],
      ['Threaded zone', 'Element size transitions from the bolt core and nut body into the finer threaded bands.'],
      ['Roots and flanks', 'Mapped quadrilaterals follow the root arcs and flanks of the first engaged threads.']
    ],
    bc: [
      ['Imposed displacement', 'Axial travel of 1.2 mm for R = 0.45 and 3 mm for R = 0.70 and 1.00.'],
      ['Nut support', 'The nut bearing face is fixed, with zero axial and radial displacement.'],
      ['Frictional contact', 'Eight loaded flank pairs and eight unloaded pairs. Coulomb friction uses μ = 0.10, 0.15 or 0.20.']
    ],
    flanks: ['Loaded flanks', 'Unloaded flanks'],
    fitted: 'View the corrected data and fitted laws',
    fullSize: 'Open full-size figure',
    portfolioSource: 'Thesis figures generated from ANSYS results · original labels in Spanish',
    results: [
      ['Deformed shape', 'See where motion concentrates and how the thread shape changes as the load advances.'],
      ['Equivalent plastic strain', 'Locate where yielding starts and how it spreads through the engagement and the bolt.'],
      ['Triaxiality', 'Tell apart the stress state of each critical zone: tension, shear or compression.'],
      ['Equivalent stress', 'Identify the most heavily loaded zones and the stress concentration at the roots.'],
      ['Normalised thread shear', 'See how close each thread is to its shear limit.'],
      ['Force by thread', 'Follow how the load is shared between threads and how it redistributes with yielding.'],
      ['Axial displacement', 'Determine which part of the joint takes up the elongation and therefore where failure localises.'],
      ['Cross-section reduction', 'Detect necking in the bolt’s unengaged threads and locate it.'],
      ['Contact state', 'See which flanks open, slide or stick as the load advances.']
    ]
  }
};

export function universidades(host, {lang}) {
  const root = el('div', 'tf-widget tf-institutions', host);
  for (const [i, name] of ['etseib-upc', 'usach-fing'].entries()) {
    const img = el('img', '', root);
    img.src = studio + name + '.webp';
    img.alt = STUDY[lang].institutions[i];
  }
}

export function resultadosLocales(host, {lang, reduced, t}) {
  const copy = STUDY[lang], root = el('div', 'tf-widget tf-local-results', host);
  const filters = el('div', 'tf-chips', root);
  const caption = el('div', 'tf-results-caption', root);
  const title = el('h4', '', caption);
  const reading = el('p', '', caption);
  const figure = el('figure', 'tf-result-figure', root);
  const picture = el('img', '', figure);
  picture.decoding = 'async';
  const foot = el('div', 'tf-results-foot', root);
  el('span', 'tf-note', foot, copy.portfolioSource);
  const link = el('a', '', foot, copy.fullSize);
  link.target = '_blank'; link.rel = 'noopener';
  const buttons = copy.results.map(([label], n) => {
    const button = el('button', 'tf-chip', filters, label);
    button.type = 'button';
    button.onclick = () => { playback.pause(); show(n); };
    return button;
  });
  // Recorre las láminas solo mientras el bloque está en pantalla; elegir una detiene el recorrido.
  let current = 0;
  const playback = playbackControl(root, filters, reduced, t, 5000, () => show((current + 1) % buttons.length));
  resultTypes.forEach(name => { new Image().src = studio + name + '.webp'; });
  function show(index) {
    current = index;
    const [label, description] = copy.results[index];
    const src = studio + resultTypes[index] + '.webp';
    title.textContent = label;
    reading.textContent = description;
    picture.alt = label;
    picture.src = src;
    link.href = src;
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(index === n)));
  }
  show(0);
}

// SVG camera coordinates use the same mm-to-pixel map as render_tfm_ansys.py.
function camera(svg, initial, reduced) {
  let view = initial;
  let frame;
  return function move(target) {
    cancelAnimationFrame(frame);
    const start = view, since = performance.now();
    const draw = now => {
      const t = reduced ? 1 : Math.min(1, (now - since) / 850);
      const easing = 1 - (1 - t) ** 3;
      view = start.map((v, i) => v + (target[i] - v) * easing);
      svg.setAttribute('viewBox', view.join(' '));
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    draw(since);
  };
}

export async function contorno(host, {lang, reduced, t}) {
  const copy = STUDY[lang];
  const root = el('div', 'tf-widget tf-bc', host);
  const stage = el('div', 'tf-bcstage', root);
  const full = [-100, -180, 1100, 2130], detail = [520, 1225, 390, 740];
  const svg = sv('svg', {viewBox: full.join(' '), class: 'tf-svg tf-bcsvg', role: 'img', 'aria-label': t.bcTitle}, stage);
  const move = camera(svg, full, reduced);
  sv('image', {href: base() + 'm_geometria.webp', width: 900, height: 1936}, svg);
  const groups = copy.bc.map(() => sv('g', {class: 'tf-g'}, svg));
  const A = 'var(--accent)';
  for (const x of [240, 450, 660]) {
    sv('line', {x1: x, y1: 5, x2: x, y2: -111, stroke: A, 'stroke-width': 14}, groups[0]);
    sv('path', {d: 'M' + (x - 29) + ' -101L' + x + ' -151L' + (x + 29) + ' -101Z', fill: A}, groups[0]);
  }
  for (const [x0, x1] of [[30, 150], [750, 870]]) {
    sv('line', {x1: x0, y1: 1282, x2: x1, y2: 1282, stroke: A, 'stroke-width': 12}, groups[1]);
    for (let x = x0; x <= x1 - 10; x += 24) sv('line', {x1: x, y1: 1280, x2: x - 18, y2: 1245, stroke: A, 'stroke-width': 8}, groups[1]);
  }
  const data = await fetch(studio + 'flancos.json').then(response => response.json());
  Object.entries(data).forEach(([type, paths]) => {
    for (const path of paths) {
      sv('polyline', {points: path, class: 'tf-flank ' + type, 'vector-effect': 'non-scaling-stroke'}, groups[2]);
    }
  });
  const side = el('div', 'tf-bcside', root);
  const list = el('div', 'tf-bclist', side);
  const items = copy.bc.map(([title, text], n) => {
    const button = el('button', 'tf-bcitem', list);
    button.type = 'button';
    const label = el('span', 'tf-bctext', button);
    el('b', '', label, title); el('small', '', label, text);
    button.onclick = () => { playback.pause(); show(n); };
    return button;
  });
  const legend = el('div', 'tf-flanks-legend', side);
  copy.flanks.forEach((label, n) => el('span', n ? 'opuesto' : 'portante', legend, label));
  const controls = el('div', 'tf-chips', side);
  const playback = playbackControl(root, controls, reduced, t, 4700, () => show((current + 1) % items.length));
  let current = -1;
  function show(n) {
    if ((current === 2) !== (n === 2)) move(n === 2 ? detail : full);
    current = n;
    items.forEach((b, k) => b.setAttribute('aria-pressed', String(k === n)));
    groups.forEach((g, k) => g.classList.toggle('on', k === n));
    legend.hidden = n !== 2;
  }
  show(0);
}

function playbackControl(root, controls, reduced, t, interval, advance) {
  let playing = !reduced, timer;
  const button = el('button', 'tf-play mono', controls);
  button.type = 'button';
  const sync = () => { button.textContent = playing ? t.tpause : t.tplay; };
  button.onclick = () => { playing = !playing; sync(); };
  sync();
  new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(() => { if (playing) advance(); }, interval);
  }, {threshold: .2}).observe(root);
  return {pause() { playing = false; sync(); }};
}


// Zonas de mallado: caras del CAD 2D (memoria, apartado 7.1.4), sin dibujar la malla.
const ZONES = {
  es: {title: 'Zonas de mallado', full: 'Sección completa', detail: 'Hilos 1 y 2', parts: ['Perno', 'Tuerca'], names: {liso: 'Vástago liso', rampa: 'Rampa', nucleo_libre: 'Núcleo de rosca libre', exterior_libre: 'Exterior de rosca libre', nucleo_engrane: 'Núcleo del engrane', transicion_perno: 'Transición del perno', banda_perno: 'Banda del perno', cizalla_perno: 'Banda de cizalla del perno', banda_tuerca: 'Banda de la tuerca', transicion_tuerca: 'Transición de la tuerca', exterior_tuerca: 'Exterior de la tuerca', cizalla_tuerca: 'Banda de cizalla de la tuerca'}, note: 'Las bandas de cizalla son zonas de medida de resultados, superpuestas a las particiones.'},
  en: {title: 'Meshing zones', full: 'Full section', detail: 'Threads 1 and 2', parts: ['Bolt', 'Nut'], names: {liso: 'Plain shank', rampa: 'Run-out ramp', nucleo_libre: 'Unengaged thread core', exterior_libre: 'Unengaged thread outer band', nucleo_engrane: 'Engagement core', transicion_perno: 'Bolt transition', banda_perno: 'Bolt profile band', cizalla_perno: 'Bolt shear band', banda_tuerca: 'Nut profile band', transicion_tuerca: 'Nut transition', exterior_tuerca: 'Nut body', cizalla_tuerca: 'Nut shear band'}, note: 'Shear bands are result evaluation zones, laid over the partitions.'}
};

async function zonas(root, lang) {
  const copy = ZONES[lang], box = el('div', 'tf-zones', root);
  el('div', 'tf-bartitle mono muted', box, copy.title);
  const figs = el('div', 'tf-zfigs', box);
  const faces = await fetch('data/tfm_zonas.json').then(r => r.json());
  const draw = (cls, view, label) => {
    const fig = el('figure', cls, figs);
    const svg = sv('svg', {viewBox: view, role: 'img', 'aria-label': copy.title + ' · ' + label}, fig);
    const paint = (zone, points, parent) => sv('polygon', {points, class: 'tf-zone z-' + zone, 'data-zone': zone, 'vector-effect': 'non-scaling-stroke'}, parent);
    const contact = zone => zone === 'banda_perno' || zone === 'banda_tuerca';
    for (const [zone, points] of faces) if (!contact(zone)) paint(zone, points, svg);
    for (const [body, r0, r1] of [['perno', 5.088, 5.288], ['tuerca', 5.85, 6.05]]) {
      const id = 'tf-cizalla-' + cls + '-' + body;
      sv('rect', {x: r0, y: 24, width: r1 - r0, height: 12}, sv('clipPath', {id}, svg));
      const band = sv('g', {'clip-path': 'url(#' + id + ')'}, svg);
      for (const [zone, points] of faces) if (zone.endsWith('tuerca') === (body === 'tuerca')) paint('cizalla_' + body, points, band);
    }
    for (const [zone, points] of faces) if (contact(zone)) paint(zone, points, svg);
    el('figcaption', 'mono muted', fig, label);
    return svg;
  };
  const full = draw('tf-zfull', '-0.1 -0.1 8.2 36.2', copy.full);
  sv('rect', {x: 4.25, y: 23.95, width: 2.6, height: 3.05, class: 'tf-zframe', 'vector-effect': 'non-scaling-stroke'}, full);
  draw('tf-zdetail', '4.25 23.95 2.6 3.05', copy.detail);
  const legend = el('div', 'tf-zlegend', box);
  const keys = Object.keys(copy.names);
  const light = zone => box.querySelectorAll('.tf-zone').forEach(p => p.classList.toggle('dim', Boolean(zone) && p.dataset.zone !== zone));
  [keys.slice(0, 8), keys.slice(8)].forEach((group, n) => {
    const col = el('div', '', legend);
    el('b', '', col, copy.parts[n]);
    for (const key of group) {
      const item = el('button', 'tf-zkey', col);
      item.type = 'button';
      el('i', 'z-' + key, item); el('span', '', item, copy.names[key]);
      item.onpointerenter = item.onfocus = () => light(key);
      item.onpointerleave = item.onblur = () => light(null);
    }
  });
  el('p', 'tf-note', legend, copy.note);
}

export function malla(host, {lang, reduced, t}) {
  const copy = STUDY[lang];
  const root = el('div', 'tf-widget tf-mesh', host);
  zonas(root, lang);
  const left = el('div', 'tf-meshview', root);
  const stage = el('div', 'tf-meshstage', left);
  const views = [[-686, -18, 2272, 1972], [-127, 760, 1154, 995], [495, 1186, 525, 456]];
  const svg = sv('svg', {viewBox: views[0].join(' '), class: 'tf-meshdrawing', role: 'img', 'aria-label': copy.mesh[0][0]}, stage);
  sv('image', {href: base() + 'm_malla.webp', width: 900, height: 1936}, svg);
  const move = camera(svg, views[0], reduced);
  const chips = el('div', 'tf-chips', left);
  const buttons = copy.mesh.map(([label], index) => {
    const button = el('button', 'tf-chip', chips, label);
    button.type = 'button';
    button.onclick = () => { playback.pause(); show(index); };
    return button;
  });
  const playback = playbackControl(root, chips, reduced, t, 4800, () => show((current + 1) % views.length));
  const desc = el('p', 'tf-note', left);
  const right = el('div', 'tf-meshdata', root);
  const table = el('div', 'tf-levels', right);
  const levels = [[10810, 33452], [20017, 61401], [35453, 107901]];
  levels.forEach(([e, n], k) => {
    const r = el('div', 'tf-level', table);
    el('b', '', r, t.ml[k]);
    el('span', '', r, e.toLocaleString(lang) + ' ' + t.elements + ' · ' + n.toLocaleString(lang) + ' ' + t.nodes);
    const bar = el('i', '', r); bar.style.setProperty('--w', (e / 35453 * 100).toFixed(1) + '%');
    if (k === 0) r.classList.add('on');
  });
  el('div', 'tf-bartitle mono muted', right, t.meshTitle);
  for (const [name, text] of [[t.meshCase1, t.meshDiff1], [t.meshCase2, t.meshDiff2]]) {
    const r = el('div', 'tf-diff', right);
    el('b', '', r, name);
    el('span', '', r, text);
  }
  el('p', 'tf-note', right, t.meshNote2);
  let current = 0;
  function show(index) {
    current = index;
    move(views[index]);
    svg.setAttribute('aria-label', copy.mesh[index][0]);
    desc.textContent = copy.mesh[index][1];
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(index === n)));
  }
  show(0);
}


// ---------------------------------------------------------------- Materiales: tablas MISO reales de ANSYS
export async function materiales(host, {lang, reduced, t}) {
  const data = await fetch('data/tfm_materiales.json').then(r => r.json());
  // Plastic strain references in the thesis (c06_umbrales.tex).
  const experimentalMax = .9390, experimentalMean = .7649;
  const W = 640, H = 400, m = {l: 62, r: 20, t: 22, b: 46};
  const pw = W - m.l - m.r, ph = H - m.t - m.b, XM = 2.1, YM = 1500;
  const X = e => m.l + pw * e / XM, Y = s => m.t + ph * (1 - s / YM);
  const root = el('div', 'tf-widget', host);
  const chips = el('div', 'tf-chips', root);
  const svg = sv('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'dg tf-svg', role: 'img', 'aria-label': t.stressAxis}, root);
  const info = el('div', 'tf-params', root);
  for (const p of t.matParams) el('span', 'tf-param', info, p);
  el('p', 'tf-note', root, t.matNote);
  const fit = el('details', 'tf-fit', root);
  el('summary', '', fit, STUDY[lang].fitted);
  const plot = el('img', '', fit);
  plot.src = studio + 'datos.webp';
  plot.alt = STUDY[lang].fitted;
  plot.loading = 'lazy';

  // región de prolongación numérica y umbral de fallo
  sv('rect', {x: X(experimentalMax), y: m.t, width: X(XM) - X(experimentalMax), height: ph, fill: 'var(--muted)', opacity: .09}, svg);
  sv('text', {x: X(XM) - 8, y: H - m.b - 8, class: 'tag m', 'text-anchor': 'end'}, svg, t.extended);
  for (let s = 0; s <= YM; s += 250) {
    sv('line', {x1: m.l, y1: Y(s), x2: W - m.r, y2: Y(s), stroke: 'var(--rule)'}, svg);
    sv('text', {x: m.l - 8, y: Y(s) + 4, class: 'tag m', 'text-anchor': 'end'}, svg, String(s));
  }
  for (let e = 0; e <= XM + .001; e += .3) {
    sv('line', {x1: X(e), y1: m.t, x2: X(e), y2: H - m.b, stroke: 'var(--rule)'}, svg);
    sv('text', {x: X(e), y: H - m.b + 16, class: 'tag m', 'text-anchor': 'middle'}, svg, e.toLocaleString(lang, {minimumFractionDigits: 1, maximumFractionDigits: 1}));
  }
  sv('line', {x1: X(experimentalMean), y1: m.t, x2: X(experimentalMean), y2: H - m.b, stroke: 'var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4'}, svg);
  sv('text', {x: X(experimentalMean) - 6, y: H - m.b - 8, class: 'tag a', 'text-anchor': 'end'}, svg, t.epsF);
  sv('line', {x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
  sv('line', {x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
  sv('text', {x: m.l + pw / 2, y: H - 8, class: 'tag m', 'text-anchor': 'middle'}, svg, t.strainAxis);
  sv('text', {x: 14, y: m.t + ph / 2, class: 'tag m', 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (m.t + ph / 2) + ')'}, svg, t.stressAxis);
  const Rs = ['1', '0.7', '0.45'], COL = {'1': 'var(--ink)', '0.7': 'var(--s3)', '0.45': 'var(--accent)'};
  const state = {'1': true, '0.7': true, '0.45': true}, curves = {};
  const interp = (pts, e) => { for (let i = 1; i < pts.length; i++) if (e <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (e - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]); return pts.at(-1)[1]; };
  for (const R of Rs) {
    const pts = data.curvas[R], g = sv('g', {}, svg);
    const p = sv('path', {d: 'M' + pts.map(q => X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1)).join('L'), fill: 'none', stroke: COL[R], 'stroke-width': R === '1' ? 3 : 2.4, 'stroke-linejoin': 'round', 'stroke-dasharray': R === '1' ? '' : R === '0.7' ? '9 5' : '3 5'}, g);
    for (const q of pts) sv('circle', {cx: X(q[0]), cy: Y(q[1]), r: 2.6, fill: COL[R]}, g);
    sv('text', {x: X(1.05), y: Y(interp(pts, 1.6)) - 10, class: 'tag', style: 'fill:' + COL[R]}, g, R === '1' ? t.bolt : t.rLabel + ' = ' + Number(R).toLocaleString(lang, {minimumFractionDigits: 2}));
    curves[R] = {g, p};
    const b = el('button', 'tf-chip', chips, R === '1' ? t.bolt : t.rLabel + ' = ' + Number(R).toLocaleString(lang, {minimumFractionDigits: 2}));
    b.type = 'button'; b.setAttribute('aria-pressed', 'true'); b.style.setProperty('--c', COL[R]);
    b.onclick = () => { state[R] = !state[R]; b.setAttribute('aria-pressed', String(state[R])); g.style.opacity = state[R] ? 1 : .08; };
  }
  const cross = sv('g', {opacity: 0}, svg);
  const vline = sv('line', {y1: m.t, y2: H - m.b, stroke: 'var(--muted)', 'stroke-dasharray': '3 3'}, cross);
  const dots = {}; for (const R of Rs) dots[R] = sv('circle', {r: 5, fill: 'var(--bg)', stroke: COL[R], 'stroke-width': 2.4}, cross);
  const rbg = sv('rect', {x: W - m.r - 200, y: m.t + 24, width: 200, height: 74, fill: 'var(--bg)', stroke: 'var(--rule-strong)', 'stroke-width': .8, opacity: 0}, svg);
  const rt = [0, 1, 2, 3].map(i => sv('text', {x: W - m.r - 190, y: m.t + 42 + i * 15, class: 'tag'}, svg, ''));
  svg.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W;
    const e = Math.max(0, Math.min(XM, ((x - m.l) / pw) * XM));
    cross.setAttribute('opacity', 1); rbg.setAttribute('opacity', 1);
    vline.setAttribute('x1', X(e)); vline.setAttribute('x2', X(e));
    rt[0].textContent = 'εp = ' + e.toLocaleString(lang, {maximumFractionDigits: 2, minimumFractionDigits: 2}); rt[0].setAttribute('class', 'tag m');
    Rs.forEach((R, i) => {
      const s = interp(data.curvas[R], e);
      dots[R].setAttribute('cx', X(e)); dots[R].setAttribute('cy', Y(s)); dots[R].style.display = state[R] ? '' : 'none';
      rt[i + 1].textContent = (R === '1' ? t.bolt.split(' ·')[0] : t.rLabel + ' ' + Number(R).toLocaleString(lang, {minimumFractionDigits: 2})) + '  ' + Math.round(s) + ' MPa';
      rt[i + 1].style.fill = COL[R];
    });
  });
  svg.addEventListener('pointerleave', () => { cross.setAttribute('opacity', 0); rbg.setAttribute('opacity', 0); rt.forEach(x => { x.textContent = ''; }); });
}

const NS = 'http://www.w3.org/2000/svg';
const f = v => Math.round(v * 100) / 100;
const sv = (tag, attrs = {}, parent, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  parent?.append(n);
  return n;
};
const el = (tag, cls, parent, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  parent?.append(n);
  return n;
};
const fx = (v, d = 1, lang = 'es') => v.toLocaleString(lang, {maximumFractionDigits: d, minimumFractionDigits: d});
const COLORS = {1: 'var(--ink)', .7: 'var(--s3)', .45: 'var(--accent)'};

// Explorador de los nueve casos: matriz R × μ, curva fuerza-desplazamiento y lectura de resultados.
export function explorador(host, {lang, reduced, t}) {
  const root = el('div', 'tf-widget tf-explorer', host);
  const stage = el('div', 'tf-chartcol', root);
  const side = el('div', 'tf-side', root);
  const W = 600, H = 400, m = {l: 58, r: 24, t: 20, b: 46};
  const svg = sv('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'dg tf-svg', role: 'img', 'aria-label': t.expY}, stage);
  const Rs = [.45, .7, 1], Mus = [.1, .15, .2];
  let sel = {R: 1, mu: .15}, playing = !reduced, timer = 0, visible = false, data = null;
  const matrix = el('div', 'tf-matrix', side);
  el('div', 'tf-matrix-title mono muted', matrix, t.expMatrix);
  const grid = el('div', 'tf-grid', matrix);
  el('span', 'tf-corner', grid, t.rowR + ' \\ ' + t.colMu);
  for (const mu of Mus) el('span', 'tf-colhead mono', grid, fx(mu, 2, lang));
  const cells = {};
  for (const R of Rs) {
    el('span', 'tf-rowhead mono', grid, fx(R, 2, lang));
    for (const mu of Mus) {
      const b = el('button', 'tf-cell r' + Math.round(R * 100) + ' mu' + Math.round(mu * 100), grid);
      b.type = 'button';
      b.onclick = () => { playing = false; syncPlay(); select(R, mu); };
      cells[R + '|' + mu] = b;
    }
  }
  const read = el('div', 'tf-read', side);
  const big = el('div', 'tf-big', read);
  const bigSub = el('div', 'tf-bigsub mono muted', read);
  const meter = el('div', 'tf-meter', read), meterFill = el('i', '', meter);
  const mech = el('div', 'tf-mech', read);
  const mu = el('div', 'tf-mu muted', read);
  const play = el('button', 'tf-play mono', side);
  play.type = 'button';
  const syncPlay = () => { play.textContent = playing ? t.tpause : t.auto; play.setAttribute('aria-pressed', String(!playing)); };
  play.onclick = () => { playing = !playing; syncPlay(); };
  syncPlay();
  const W0 = m.l, PW = W - m.l - m.r, PH = H - m.t - m.b;
  const draw = () => {
    if (!data) return;
    const umax = 3.0, fmax = 100;
    const X = u => W0 + PW * u / umax, Y = F => m.t + PH * (1 - F / fmax);
    svg.replaceChildren();
    for (let F = 0; F <= fmax; F += 20) {
      sv('line', {x1: m.l, y1: Y(F), x2: W - m.r, y2: Y(F), stroke: 'var(--rule)', 'stroke-width': 1}, svg);
      sv('text', {x: m.l - 8, y: Y(F) + 4, class: 'tag m', 'text-anchor': 'end'}, svg, String(F));
    }
    for (let u = 0; u <= umax + .001; u += .5) {
      sv('line', {x1: X(u), y1: m.t, x2: X(u), y2: H - m.b, stroke: 'var(--rule)', 'stroke-width': 1}, svg);
      sv('text', {x: X(u), y: H - m.b + 16, class: 'tag m', 'text-anchor': 'middle'}, svg, fx(u, 1, lang));
    }
    sv('line', {x1: m.l, y1: H - m.b, x2: W - m.r, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
    sv('line', {x1: m.l, y1: m.t, x2: m.l, y2: H - m.b, stroke: 'var(--ink)', 'stroke-width': 1.4}, svg);
    sv('text', {x: m.l + PW / 2, y: H - 8, class: 'tag m', 'text-anchor': 'middle'}, svg, t.expX);
    sv('text', {x: 14, y: m.t + PH / 2, class: 'tag m', 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (m.t + PH / 2) + ')'}, svg, t.expY);
    const path = c => 'M' + c.pts.map(p => f1(X(p[0])) + ' ' + f1(Y(p[1]))).join('L');
    // las demás curvas, atenuadas, y la elegida encima
    const chosen = data.curvas.find(c => c.R === sel.R && c.mu === sel.mu);
    for (const c of data.curvas) {
      if (c === chosen) continue;
      sv('path', {d: path(c), fill: 'none', stroke: c.R === sel.R ? 'var(--muted)' : 'var(--rule-strong)', 'stroke-width': c.R === sel.R ? 1.6 : 1.1, opacity: c.R === sel.R ? .75 : .35, 'stroke-linejoin': 'round'}, svg);
    }
    const sum = data.resumen.find(s => s.R === sel.R && s.mu === sel.mu);
    const col = 'var(--r' + Math.round(sel.R * 100) + ')';
    root.style.setProperty('--rc', col);
    const area = sv('path', {d: path(chosen) + 'L' + f1(X(chosen.pts.at(-1)[0])) + ' ' + f1(Y(0)) + 'L' + f1(X(chosen.pts[0][0])) + ' ' + f1(Y(0)) + 'Z', fill: col, opacity: .1}, svg);
    const line = sv('path', {d: path(chosen), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, svg);
    const px = X(sum.u_peak_mm), py = Y(sum.Fmax_kN);
    sv('line', {x1: px, y1: py, x2: px, y2: H - m.b, stroke: col, 'stroke-width': 1, 'stroke-dasharray': '3 3'}, svg);
    sv('line', {x1: m.l, y1: py, x2: px, y2: py, stroke: col, 'stroke-width': 1, 'stroke-dasharray': '3 3'}, svg);
    const dot = sv('circle', {cx: px, cy: py, r: 6, fill: 'var(--bg)', stroke: col, 'stroke-width': 3}, svg);
    sv('text', {x: px + 12, y: py - 10, class: 'tag', style: 'fill:' + col}, svg, fx(sum.Fmax_kN, 1, lang) + ' kN');
    if (!reduced) {
      const len = line.getTotalLength();
      line.animate([{strokeDasharray: len + ' ' + len, strokeDashoffset: len}, {strokeDasharray: len + ' ' + len, strokeDashoffset: 0}], {duration: 700, easing: 'ease-out'});
      dot.animate([{opacity: 0, transform: 'scale(.3)', transformOrigin: px + 'px ' + py + 'px'}, {opacity: 1, transform: 'scale(1)', transformOrigin: px + 'px ' + py + 'px'}], {duration: 500, delay: 550, easing: 'ease-out', fill: 'backwards'});
    }
    // lectura
    big.textContent = fx(sum.Fmax_kN, 1, lang) + ' kN';
    bigSub.textContent = t.expMax + ' · ' + t.expAt + ' u = ' + fx(sum.u_peak_mm, 2, lang) + ' mm';
    meterFill.style.width = (100 * sum.Fmax_kN / 95) + '%';
    mech.textContent = (sel.R < .5 ? t.expCollapse : t.expNeck);
    mech.dataset.kind = sel.R < .5 ? 'collapse' : 'neck';
    mu.textContent = t.expMu + ': ' + (sel.R < .5 ? t.expMu1 : t.expMu2);
    for (const key in cells) {
      const [R, muV] = key.split('|').map(Number);
      const s = data.resumen.find(r => r.R === R && r.mu === muV);
      const c = cells[key];
      c.textContent = fx(s.Fmax_kN, 1, lang);
      c.setAttribute('aria-pressed', String(R === sel.R && muV === sel.mu));
    }
  };
  const f1 = v => Math.round(v * 10) / 10;
  function select(R, muV) { sel = {R, mu: muV}; draw(); }
  const order = [[1, .15], [.7, .1], [.45, .15], [.45, .2], [1, .1], [.7, .2], [.45, .1], [1, .2], [.7, .15]];
  let step = 0;
  const loop = () => {
    clearInterval(timer);
    timer = setInterval(() => {
      if (!playing || !visible) return;
      step = (step + 1) % order.length;
      select(...order[step]);
    }, 2600);
  };
  fetch('data/tfm.json').then(r => r.json()).then(d => { data = d; draw(); loop(); });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {threshold: .25}).observe(root);
}
