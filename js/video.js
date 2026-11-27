// Las escenas se sirven como vídeo grabado (herramientas/grabar_videos.py): la web no lleva ningún modelo.
const BASE = 'video/';
let index;
const escenas = () => index ??= fetch(BASE + 'escenas.json').then(r => {
  if (!r.ok) throw new Error('escenas.json');
  return r.json();
});

function player(label) {
  const video = document.createElement('video');
  video.muted = video.loop = video.playsInline = true;
  video.preload = 'auto';
  video.disableRemotePlayback = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('disablepictureinpicture', '');
  video.setAttribute('controlslist', 'nodownload');
  if (label) video.setAttribute('aria-label', label);
  video.addEventListener('contextmenu', event => event.preventDefault());
  return video;
}
const play = video => video.play().catch(() => {});

export async function create(stage, {id, ui, lang, reduced}) {
  const meta = await escenas();
  const fill = text => text.replace(/\{(\w+)\}/g, (_, key) => ui[key] ?? '');
  const number = text => lang === 'es' ? text.replace(/(\d)\.(\d)/g, '$1,$2') : text;
  const readout = stage.querySelector('.readout'), left = stage.querySelector('.cap-l'), right = stage.querySelector('.cap-r');
  const video = player(stage.getAttribute('aria-label'));
  video.className = 'scene-video';
  stage.prepend(video);
  let current = null, visible = false, paused = reduced, queued = 0, shown = null;

  function paint() {
    if (!current?.readout) return;
    let text = '';
    for (const [at, value] of current.readout) {
      if (at > video.currentTime + .02) break;
      text = value;
    }
    if (text !== shown && readout) { shown = text; readout.textContent = number(fill(text)); }
  }
  function tick() {
    queued = 0;
    paint();
    if (visible && !video.paused) queued = requestAnimationFrame(tick);
  }
  video.addEventListener('playing', () => { if (!queued) queued = requestAnimationFrame(tick); });
  video.addEventListener('seeked', paint);
  // Con «reducir movimiento» se enseña un fotograma quieto de cada paso.
  video.addEventListener('loadedmetadata', () => { if (reduced) video.currentTime = video.duration * .9; });

  let button;
  if (id === 'reductor-funcionamiento') {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-button scene-playback';
    const words = lang === 'en' ? ['Play', 'Pause'] : ['Reproducir', 'Pausar'];
    const sync = () => { button.textContent = words[paused ? 0 : 1]; };
    button.onclick = () => { paused = !paused; sync(); if (paused) video.pause(); else play(video); };
    sync();
    stage.append(button);
  }

  return {
    visibility(next) {
      if (next === visible) return;
      visible = next;
      if (next && !paused) play(video);
      if (!next) video.pause();
    },
    update(key) {
      const name = id + '-' + key;
      current = meta[name];
      if (!current) return;
      shown = null;
      video.classList.toggle('blend', current.blend);
      video.src = BASE + name + '.mp4';
      if (left) left.textContent = fill(current.left);
      if (right) right.textContent = fill(current.right);
      if (readout) readout.textContent = '';
      if (visible && !paused) play(video);
    }
  };
}

const COPY = {
  es: {
    phases: ['Sección 2D', 'Revolución', 'Modelo helicoidal', 'Rosca libre'],
    captions: [
      'El modelo 2D axisimétrico es la mitad de una sección meridiana de la unión.',
      'Al revolucionar la sección alrededor del eje se obtiene el sólido que representa el modelo: filetes anulares cerrados.',
      'A su lado, el modelo 3D con la rosca helicoidal real.',
      'En la rosca libre se aprecia la diferencia: anillos independientes frente a un filete que avanza a lo largo del eje.'],
    two: '2D axisimétrico', three: '3D helicoidal', play: 'Reproducir', pause: 'Pausa'
  },
  en: {
    phases: ['2D section', 'Revolution', 'Helical model', 'Unengaged thread'],
    captions: [
      'The 2D axisymmetric model uses half of a meridional section of the joint.',
      'Revolving the section about the axis gives the solid the model represents, with closed annular threads.',
      'Next to it, the 3D model with the real helical thread.',
      'The unengaged thread shows the difference: separate rings versus a single thread advancing along the axis.'],
    two: '2D axisymmetric', three: '3D helical', play: 'Play', pause: 'Pause'
  }
};
// Comienzo de cada fase y momento representativo (para «reducir movimiento»).
const STARTS = [0, 3, 8.6, 12], REST = [.1, 8.5, 11.9, 16];

// Figura «Del 2D axisimétrico al 3D helicoidal»: mismo montaje que la animación original, con vídeo.
export async function modelos(host, {lang, reduced}) {
  const copy = COPY[lang] || COPY.es;
  const el = (tag, cls, parent, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  };
  const meta = (await escenas())['tfm-modelos'];
  const root = el('div', 'tf-widget tf-3d', host);
  const stage = el('div', 'tf-3dstage', root);
  const video = player();
  video.className = 'tf-3dvideo';
  stage.append(video);
  const labels = [el('span', 'tf-3dlabel mono', stage, copy.two), el('span', 'tf-3dlabel mono', stage, copy.three)];
  const caption = el('p', 'tf-3dcaption', root);
  const bar = el('div', 'tf-chips', root);
  let paused = reduced, visible = false, queued = 0, phase = -1;
  function paint() {
    const row = meta.track[Math.min(meta.track.length - 1, Math.round(video.currentTime * meta.rate))];
    const [a, b, alpha, current] = row;
    labels[0].style.left = a + '%';
    labels[1].style.left = b + '%';
    labels[1].style.opacity = alpha;
    if (current !== phase) {
      phase = current;
      caption.textContent = copy.captions[current];
      chips.forEach((chip, i) => chip.setAttribute('aria-pressed', String(i === current)));
    }
  }
  function tick() {
    queued = 0;
    paint();
    if (!video.paused) queued = requestAnimationFrame(tick);
  }
  const chips = copy.phases.map((name, i) => {
    const chip = el('button', 'tf-chip', bar, (i + 1) + ' · ' + name);
    chip.type = 'button';
    chip.onclick = () => { video.currentTime = reduced ? REST[i] : STARTS[i] + .05; };
    return chip;
  });
  const button = el('button', 'tf-play mono', bar);
  button.type = 'button';
  const sync = () => { button.textContent = paused ? copy.play : copy.pause; };
  button.onclick = () => { paused = !paused; sync(); if (paused) video.pause(); else play(video); };
  sync();
  video.addEventListener('playing', () => { if (!queued) queued = requestAnimationFrame(tick); });
  video.addEventListener('seeked', paint);
  video.addEventListener('loadeddata', paint);
  video.src = BASE + 'tfm-modelos.mp4';
  stage.style.background = meta.background;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !paused) play(video);
    else video.pause();
  }, {threshold: .15}).observe(stage);
}
