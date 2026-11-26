import { lineChart, heatmap } from './graficos.js';

const MOSTRAR_CONFIDENCIAL = false;
const IDS = ['anticaidas', 'reductor', 'tfm'];
const SCENES = {
  plataforma: 'plataforma', evolucion: 'anticaidas', 'giro-dispositivo': 'anticaidas',
  principio: 'anticaidas', 'reductor-inferior': 'reductor', 'reductor-superior': 'reductor',
  'reductor-funcionamiento': 'reductor',
  'tfm-2d-3d': 'tfm', 'tfm-tensiones': 'tfm'
};
const params = new URLSearchParams(location.search);
const valid = v => ['es', 'en'].includes(v) ? v : null;
let saved;
try { saved = localStorage.getItem('portfolio.lang'); } catch {}
const lang = valid(params.get('lang')) || valid(saved) || (navigator.language.startsWith('es') ? 'es' : 'en');
document.documentElement.lang = lang;
try { localStorage.setItem('portfolio.lang', lang); } catch {}
const tema = document.documentElement.dataset.tema.toLowerCase();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const json = async (path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(path);
  return response.json();
};
const [ui, intro, ...projects] = await Promise.all(['ui', 'intro', ...IDS].map(name => json('content/' + name + '.' + lang + '.json')));
document.querySelector('meta[name=description]').content = ui.description;
const css = value => getComputedStyle(document.documentElement).getPropertyValue(value).trim();
const fmt = (value, digits = 2) => value.toLocaleString(lang, { maximumFractionDigits: digits });
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const para = text => text ? '<p>' + esc(text) + '</p>' : '';
const img = (src, alt, extra = '') => '<img loading="lazy" decoding="async" src="' + esc(src) + '" alt="' + esc(alt) + '" ' + extra + '>';
const getTFM = () => tfmData ??= json('data/tfm.json');
let tfmData;

// Vista actual: la portada o un solo proyecto, según el ancla (o la escena pedida con ?paso=).
function routeOf(hash, paso) {
  const key = hash.slice(1) || (paso || '').split(':')[0];
  const own = IDS.find(id => key === id || key.startsWith(id + '-'));
  if (own) return own;
  const scene = Object.keys(SCENES).find(id => key === id || key.startsWith(id + '-'));
  if (!scene) return null;
  return SCENES[scene] === 'plataforma' ? 'anticaidas' : SCENES[scene];
}
const route = routeOf(location.hash, params.get('paso'));

// Anticaídas y reductor giran y la unión del TFM se carga (herramientas/render_portadas.py). Sin movimiento si el sistema lo pide.
function cover(p) {
  const still = 'img/portadas/' + p.id + '.webp';
  if (reduced) return img(still, p.titulo);
  return img('img/portadas/' + p.id + (p.id === 'tfm' ? '-carga' : '-giro') + '.webp', p.titulo);
}

function projectCard(p) {
  return '<a class="pcard" href="#' + p.id + '"><div class="pcard-img">' + cover(p) +
    '</div><div class="pcard-body"><p class="pcard-meta mono"><span>' + p.numero + '</span><span>' + esc(p.lugar) + ' · ' + esc(p.fecha) + '</span></p><h3>' +
    esc(p.titulo) + '</h3>' + para(p.resumen) + '<ul class="chips">' + ui.tags[p.id].map(x => '<li>' + esc(x) + '</li>').join('') +
    '</ul><span class="pcard-go mono">' + esc(ui.see) + ' →</span></div></a>';
}

// CV vigentes: servidor_local.py los copia desde 1_MIS_DOCUMENTOS/CV_Aprobado cada vez que cambian.
function cvLinks() {
  return ['ES', 'EN'].map(code => '<a class="btn" href="cv/Andres_Montero_CV_' + code + '.pdf" download>' + esc(code === 'ES' ? ui.cvEs : ui.cvEn) + ' ↓</a>').join('');
}
const contactButton = () => '<button type="button" class="btn" data-contact aria-expanded="false">' + esc(ui.email) + '</button>';
function contactPanel() {
  const mail = esc(intro.contacto.correo);
  return '<div class="contact-panel" hidden><a class="contact-mail" href="mailto:' + mail + '">' + mail + '</a><button type="button" data-copy>' + esc(ui.copy) +
    '</button><a href="https://' + esc(intro.contacto.linkedin) + '">LinkedIn</a></div>';
}

function introSection() {
  const tools = intro.herramientas.map(item => '<dt>' + esc(item.grupo) + '</dt><dd>' + item.items.map(esc).join(' · ') + '</dd>').join('');
  const study = intro.estudios.items.map(item => '<li><h4>' + esc(item.titulo) + '</h4><span class="mono muted">' + esc(item.lugar) + '</span>' + para(item.texto) + '</li>').join('');
  const work = intro.experiencia.items.map(item => '<li><div class="job-head"><h4>' + esc(item.empresa) + '</h4><span class="mono muted">' + esc(item.fecha) + ' · ' + esc(item.lugar) +
    '</span></div>' + para(item.texto) + '</li>').join('');
  return '<header class="intro home" id="inicio"><div class="wrap grid"><p class="kicker mono">' + esc(ui.tag) + ' · ' + esc(intro.contacto.ciudad) +
    '</p><h1>' + esc(intro.nombre) + '</h1><p class="tit">' + esc(intro.titular) + '</p><div class="bio">' +
    intro.bio.map(para).join('') + '<p class="actions"><a class="btn btn-main" href="#proyectos">' + esc(ui.seeProjects) + ' ↓</a>' +
    cvLinks() + contactButton() + '</p>' + contactPanel() + '</div>' +
    '<div class="tools"><dl>' + tools + '</dl></div>' +
    '<div class="profile"><section class="p-study"><h2>' + esc(intro.estudios.titulo) + '</h2><ul class="p-list">' + study + '</ul></section>' +
    '<section class="p-work"><h2>' + esc(intro.experiencia.titulo) + '</h2>' + para(intro.experiencia.texto) + '<ul class="p-list">' + work + '</ul></section></div>' +
    '</div></header><section class="projects" id="proyectos"><div class="wrap"><h2>' + esc(ui.kicker) + '</h2><div class="pgrid">' +
    projects.map(projectCard).join('') + '</div></div></section>';
}

// Al final de cada proyecto: pasar a otro o volver a la portada.
function pager(current) {
  return '<nav class="pager" aria-label="' + esc(ui.nav) + '"><div class="wrap"><a class="btn" href="#proyectos">← ' + esc(ui.all) + '</a><div class="pager-others">' +
    projects.filter(p => p.id !== current.id).map(p => '<a href="#' + p.id + '">' + img('img/portadas/' + p.id + '.webp', '') +
      '<span><small class="mono muted">' + p.numero + '</small>' + esc(p.titulo) + '</span></a>').join('') + '</div></div></nav>';
}

function stageMarkup(b) {
  return '<div class="stage-col"><figure class="stage" aria-label="' + esc(ui.stage + ' · ' + b.titulo) +
    '"><div class="hud"><span class="stage-step"></span><span class="readout"></span></div><div class="loading">' + esc(ui.loading) +
    '</div><figcaption class="caption"><span class="cap-l"></span><span class="cap-r"></span></figcaption></figure></div>';
}
function sceneBlock(b) {
  return '<div class="scrolly" data-id="' + esc(b.escena) + '"><div class="steps">' + b.pasos.map((s, i) =>
    '<article class="step" id="' + b.escena + '-' + s.clave + '" data-key="' + s.clave + '"><div class="card">' +
      (b.pasos.length > 1 ? '<span class="mono">' + (i + 1) + '/' + b.pasos.length + '</span>' : '') +
      '<h4>' + esc(s.titulo) + '</h4>' + para(s.texto) +
    '</div></article>').join('') + '</div>' + stageMarkup(b) + '</div>';
}
function showcase(b) {
  return '<div class="scrolly vitrina" data-id="' + esc(b.escena) + '"><div class="steps" hidden><article class="step" data-key="ciclo"><div class="card"><h4>' +
    esc(b.titulo) + '</h4></div></article></div>' + stageMarkup(b) + '<table class="spec"><tbody>' +
    b.tabla.map(r => '<tr><th scope="row">' + esc(r.k) + '</th><td>' + esc(r.v) + '</td></tr>').join('') + '</tbody></table></div>';
}
const figure = name => '<figure class="diagram" data-figura="' + esc(name) + '"><div class="diagram-body"></div></figure>';

const list = (items, tag = 'ul') => '<' + tag + ' class="block-list">' + items.map(item =>
  '<li>' + (item.n ? '<span class="mono" value="' + item.n + '">' + item.n + '</span>' : '') +
  '<div><h4>' + esc(item.titulo) + '</h4>' + para(item.texto) + '</div></li>').join('') + '</' + tag + '>';

function contentBlock(b, project) {
  let body;
  switch (b.tipo) {
    case 'texto': body = b.parrafos.map(para).join(''); break;
    case 'lista': body = para(b.intro) + (b.layout ? '<div class="cards cards-' + esc(b.layout) + '">' + list(b.items, b.layout === 'conclusiones' ? 'ol' : 'ul') + '</div>' : list(b.items)) + (b.nota ? '<p class="cards-note">' + esc(b.nota) + '</p>' : ''); break;
    case 'cifras': body = para(b.texto) + '<dl class="figures">' + b.cifras.map(c =>
      '<div><dt>' + esc(c.etiqueta) + '</dt><dd>' + esc(c.valor) + '</dd></div>').join('') + '</dl>'; break;
    case 'escena': body = para(b.intro) + sceneBlock(b); break;
    case 'vitrina': body = para(b.texto) + showcase(b); break;
    case 'figura': body = '<div class="split' + (b.layout === 'full' ? ' split-full' : '') + '">' + '<div class="split-text">' + b.parrafos.map(para).join('') + (b.destacado ? '<aside class="goal"><span class="mono">' + esc(b.destacado.titulo) + '</span><ul>' + b.destacado.puntos.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul></aside>' : '') + '</div>' + figure(b.figura) + '</div>'; break;
    case 'subsistemas': body = para(b.intro) + b.items.map((item, n) => '<article class="subsystem"><div class="split-text"><span class="mono muted">' +
      (n + 1) + '/' + b.items.length + '</span><h4>' + esc(item.titulo) + '</h4>' + item.parrafos.map(para).join('') + '</div>' + figure(item.figura) + '</article>').join(''); break;
    case 'grafico': body = para(b.texto) + '<div class="chart-body" data-chart="' + esc(b.id) + '"></div>'; break;
    case 'galeria': body = '<div class="gallery">' + b.imagenes.map(im => '<figure>' + img(im.archivo, im.pie) + '<figcaption>' + esc(im.pie) + '</figcaption></figure>').join('') + '</div>'; break;
    case 'plano': body = para(b.texto) + '<div class="plan"><button type="button" class="plan-open" aria-label="' +
      esc((b.zoom || ui.zoom) + ' · ' + b.titulo) + '">' + img(b.archivo, b.titulo) + '<span>' + esc(b.zoom || ui.zoom) + '</span></button>' + list(b.anotaciones, 'ol') + '</div>'; break;
    default: throw new Error(project + ' / ' + b.tipo);
  }
  return '<section class="content-block block-' + b.tipo + '"><h3>' + esc(b.titulo) + '</h3>' + body + '</section>';
}

function project(p) {
  return '<section class="proj" id="' + p.id + '"><div class="wrap"><header class="project-header"><div class="project-kicker mono"><span>' +
    p.numero + '</span>' + esc(p.subtitulo) + '</div><div class="project-title"><h2>' + esc(p.titulo_completo || p.titulo) + '</h2><p class="project-meta mono"><span>' +
    esc(p.fecha) + '</span><span>' + esc(p.lugar) + '</span></p></div>' + para(p.resumen) + '</header>' +
    p.bloques.map(b => contentBlock(b, p.id)).join('') + '</div></section>';
}

const nav = document.querySelector('.nav');
nav.setAttribute('aria-label', ui.nav);
document.querySelector('#nav-list').innerHTML = projects.map(p => '<li><a href="#' + p.id + '">' + esc(ui.index[p.id]) + '</a></li>').join('');
const language = document.createElement('div');
language.className = 'language';
language.setAttribute('aria-label', ui.lang);
for (const code of ['es', 'en']) {
  const link = document.createElement('a');
  link.hreflang = code;
  link.lang = code;
  link.textContent = code.toUpperCase();
  if (code === lang) link.setAttribute('aria-current', 'true');
  const toLanguage = () => {
    const url = new URL(location.href);
    url.searchParams.set('lang', code);
    const active = [...document.querySelectorAll('.proj')].filter(el => el.getBoundingClientRect().top < innerHeight * .43).at(-1);
    if (!url.hash && active) url.hash = active.id;
    return url;
  };
  link.href = toLanguage();
  link.addEventListener('click', () => { link.href = toLanguage(); });
  language.append(link);
}
nav.querySelector('.wrap').append(language);

const active = projects.find(p => p.id === route);
document.body.dataset.view = active ? 'project' : 'home';
document.querySelector('#app').innerHTML = (active
    ? '<div class="backbar"><div class="wrap"><a href="#proyectos">← ' + esc(ui.all) + '</a></div></div>' + project(active) + pager(active)
    : introSection()) +
  '<footer class="contact" id="contacto"><div class="wrap"><h2>' + esc(ui.contact) + '</h2><p class="actions">' + contactButton() + cvLinks() + '</p>' + contactPanel() + '<div class="row"><span>' +
  esc(intro.contacto.ciudad) + '</span><a href="' + (active ? '#' + active.id : '#inicio') + '" data-top>' +
  esc(ui.top) + '</a></div></div></footer>';
for (const button of document.querySelectorAll('[data-contact]')) {
  button.onclick = () => {
    const panel = button.closest('.actions').nextElementSibling;
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
  };
}
for (const button of document.querySelectorAll('[data-copy]')) {
  button.onclick = async () => {
    try { await navigator.clipboard.writeText(intro.contacto.correo); }
    catch { getSelection().selectAllChildren(button.previousElementSibling); return; }
    button.textContent = ui.copied;
    setTimeout(() => { button.textContent = ui.copy; }, 1800);
  };
}
const modal = document.createElement('dialog');
modal.className = 'plan-modal';
modal.setAttribute('aria-label', ui.zoom);
modal.innerHTML = '<button type="button">' + esc(ui.close) + '</button><img alt="">';
modal.querySelector('button').onclick = () => modal.close();
modal.onclick = event => { if (event.target === modal) modal.close(); };
document.body.append(modal);
for (const button of document.querySelectorAll('.plan-open')) {
  button.onclick = () => {
    const source = button.querySelector('img');
    const target = modal.querySelector('img');
    target.src = source.src;
    target.alt = source.alt;
    modal.showModal();
  };
}

function buildChart(host, data) {
  const labels = {xLabel: ui.disp, yLabel: ui.force, xUnit: 'mm', yUnit: 'kN'};
  const colors = {0.45: css('--s2'), 0.7: css('--s3'), 1: css('--s1')};
  const dashes = {0.1: '', 0.15: '6 3', 0.2: '2 3'};
  if (host.dataset.chart === 'tfm_2d_3d') {
    lineChart(host, {...labels, series: [
      {name: ui.axis2d, color: css('--s1'), pts: data.c2d3d.map(([x, y]) => [x, y])},
      {name: ui.helix3d, color: css('--s2'), pts: data.c2d3d.map(([x, , z]) => [x, z]), dash: '5 3'}
    ]});
  } else if (host.dataset.chart === 'tfm_curvas_9') {
    lineChart(host, {...labels, series: data.curvas.map(c => ({
      name: 'R ' + fmt(c.R) + ' · μ ' + fmt(c.mu), color: colors[c.R], dash: dashes[c.mu], pts: c.pts
    }))});
  } else {
    const R = [0.45, 0.7, 1], M = [0.1, 0.15, 0.2];
    heatmap(host, {
      rows: R.map(v => 'R = ' + fmt(v)), cols: M.map(v => 'μ = ' + fmt(v)),
      values: R.map(r => M.map(m => data.resumen.find(x => x.R === r && x.mu === m).Fmax_kN)),
      rowLabel: ui.relative, colLabel: ui.friction, unit: 'kN'
    });
  }
}
for (const host of document.querySelectorAll('[data-chart]')) {
  getTFM().then(data => buildChart(host, data)).catch(() => { host.textContent = ui.error; });
}
const figureObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    figureObserver.unobserve(entry.target);
    import('./v3-figuras.js').then(m => m.mount(entry.target.querySelector('.diagram-body'), entry.target.dataset.figura, {lang, reduced}))
      .catch(error => { console.error(error); entry.target.textContent = ui.error; });
  }
}, {rootMargin: '30% 0px'});
for (const el of document.querySelectorAll('[data-figura]')) figureObserver.observe(el);
const sceneNodes = [...document.querySelectorAll('.scrolly')].map(el => ({
  id: el.dataset.id, el, stage: el.querySelector('.stage'),
  steps: [...el.querySelectorAll('.step')], key: null
}));
async function loadScene(scene) {
  if (scene.task) return scene.task;
  scene.task = (async () => {
    const {id, stage} = scene;
    try {
      const module = await import('./v2-' + SCENES[id] + '.js');
      scene.engine = await module.create(stage, {id, ui, lang, tema, reduced, json, css, fmt});
      stage.querySelector('.loading').remove();
      stage.dataset.ready = 'true';
      if (scene.step) scene.engine.update(scene.step.dataset.key, scene.step.querySelector('h4').textContent);
      schedule();
    } catch (error) {
      console.error(id, error);
      const status = stage.querySelector('.loading') || stage.appendChild(document.createElement('div'));
      status.className = 'loading';
      status.textContent = ui.error;
      stage.dataset.ready = 'error';
    }
  })();
  return scene.task;
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      loadScene(sceneNodes.find(scene => scene.el === entry.target));
    }
  }
}, {rootMargin: '35% 0px'});
for (const scene of sceneNodes) observer.observe(scene.el);
const links = [...document.querySelectorAll('#nav-list a')];
const sections = [...document.querySelectorAll('.proj')];
function visibleProject() {
  return sections.filter(el => el.getBoundingClientRect().top < innerHeight * .43).at(-1);
}
function activate(scene, step) {
  if (step === scene.step) return;
  scene.step?.classList.remove('on');
  scene.step = step;
  step.classList.add('on');
  const title = step.querySelector('h4').textContent;
  scene.stage.querySelector('.stage-step').textContent = title;
  scene.stage.dataset.key = step.dataset.key;
  scene.engine?.update(step.dataset.key, title);
}
function paintScroll() {
  const height = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('#nav-bar').style.width = (height ? 100 * scrollY / height : 0) + '%';
  const current = visibleProject();
  links.forEach(link => link.classList.toggle('on', link.hash === '#' + current?.id));
  for (const scene of sceneNodes) {
    const rect = scene.el.getBoundingClientRect();
    const visible = rect.bottom > 55 && rect.top < innerHeight;
    scene.engine?.visibility?.(visible);
    if (!visible && scene.step) continue;
    const anchor = innerWidth <= 760 ? .76 : .55;
    const step = scene.steps.filter(el => el.getBoundingClientRect().top < innerHeight * anchor).at(-1) || scene.steps[0];
    activate(scene, step);
  }
}
let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; paintScroll(); });
}
addEventListener('scroll', schedule, {passive: true});
addEventListener('resize', schedule);
paintScroll();

async function goToStep(id, key) {
  const scene = sceneNodes.find(item => item.id === id);
  const step = scene?.steps.find(item => item.dataset.key === key);
  if (!step) return false;
  const anchor = innerWidth <= 760 ? .76 : .55;
  const offset = innerHeight * anchor - Math.min(innerHeight * .27, step.offsetHeight * .54);
  window.scrollTo({top: window.scrollY + step.getBoundingClientRect().top - offset, behavior: 'instant'});
  await loadScene(scene);
  paintScroll();
  return scene.stage.dataset.key === key;
}
window.__portfolio = {scenes: sceneNodes, goToStep};

// Cambiar de vista recarga la página: cada proyecto arranca limpio sus escenas 3D.
history.scrollRestoration = 'manual';
const HOME_Y = 'portfolio.homeY';
const jump = top => scrollTo({top, behavior: 'instant'});
document.querySelector('[data-top]').addEventListener('click', event => { event.preventDefault(); scrollTo({top: 0, behavior: 'smooth'}); });
addEventListener('hashchange', () => {
  if (routeOf(location.hash) === route) return;
  if (!route) try { sessionStorage.setItem(HOME_Y, scrollY); } catch {}
  location.reload();
});
if (!route) {
  const target = location.hash.length > 1 && document.querySelector('#' + CSS.escape(location.hash.slice(1)));
  let saved = 0;
  try { saved = Number(sessionStorage.getItem(HOME_Y)) || 0; sessionStorage.removeItem(HOME_Y); } catch {}
  document.fonts.ready.then(() => {
    if (target) target.scrollIntoView({behavior: 'instant'});
    else jump(saved);
  });
} else if (location.hash === '#' + route) jump(0);
const requested = params.get('paso');
if (requested) goToStep(...requested.split(':'));
