import {lineChart} from './graficos.js';

function layers(host, reduced) {
  let current, request = 0;
  const cached = new Map();
  function fetchImage(path) {
    if (!cached.has(path)) {
      const load = fallback => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(path));
        image.src = path + (fallback ? '?retry=1' : '');
      });
      cached.set(path, load(false).catch(() => load(true)).catch(error => {
        cached.delete(path);
        throw error;
      }));
    }
    return cached.get(path);
  }
  return {
    async preload(paths) {
      for (let i = 0; i < paths.length; i += 3) {
        await Promise.allSettled(paths.slice(i, i + 3).map(fetchImage));
      }
    },
    async set(path, alt, fade = true) {
      const token = ++request;
      let source;
      try { source = await fetchImage(path); }
      catch (error) {
        if (token === request) {
          host.dataset.media = 'error';
          console.error(error.message);
        }
        return;
      }
      if (token !== request) return;
      host.dataset.media = 'ready';
      if (current?.getAttribute('src') === source.getAttribute('src')) {
        current.alt = alt;
        return;
      }
      const node = source.cloneNode();
      node.alt = alt;
      const old = current;
      current = node;
      for (const image of host.querySelectorAll('img')) if (image !== old) image.remove();
      host.append(node);
      if (!old) return;
      if (reduced || !fade) old.remove();
      else {
        node.animate([{opacity: 0}, {opacity: 1}], {duration: 230, easing: 'ease-out'});
        old.animate([{opacity: 1}, {opacity: 0}], {duration: 230, easing: 'ease-out'}).finished.then(() => old.remove());
      }
    }
  };
}

function revolution(stage, {ui, tema, reduced}) {
  const visual = document.createElement('div');
  visual.className = 'v2-frames';
  visual.innerHTML = '<div class="frame-layer"></div><div class="frame-legend"><span></span><span></span></div>';
  const labels = [...visual.querySelectorAll('.frame-legend span')];
  stage.prepend(visual);
  const display = layers(visual.firstElementChild, reduced);
  const path = n => 'img/tfm/rev/' + tema + '/r' + String(n).padStart(2, '0') + '.webp';
  let run = 0, current = 0, phase;
  const caption = stage.querySelector('.cap-l');
  function frame(n) {
    current = n;
    display.set(path(n), labels.map(x => x.textContent).filter(Boolean).join(' · ') || ui.axis2d, false);
  }
  return {update(key) {
    const token = ++run;
    const old = phase;
    phase = key;
    visual.classList.toggle('geometry-contrast', key === 'geometria');
    labels[0].textContent = key === 'geometria' ? ui.rings : '';
    labels[1].textContent = key === 'geometria' ? ui.helix : '';
    caption.textContent = key === 'malla' ? ui.mesh : '';
    if (key === 'malla') { display.set('img/tfm/malla3d.webp', ui.mesh); return; }
    const target = key === 'geometria' ? 35 : 26;
    const start = key === 'geometria' ? 27 : old === 'geometria' ? 20 : 0;
    const files = Array.from({length: target - start + 1}, (_, i) => path(start + i));
    display.preload(files);
    if (reduced) { frame(target); return; }
    frame(start);
    const at = performance.now(), duration = key === 'geometria' ? 850 : 2200;
    function tick(now) {
      if (token !== run) return;
      const k = Math.min(1, (now - at) / duration);
      const n = Math.round(start + (target - start) * k);
      if (n !== current) frame(n);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }};
}

async function stress(stage, {ui, tema, reduced, json, fmt}) {
  const meta = await json('data/tfm_tens.json');
  const by = ['2d', '3d'].map(k => meta.estados.filter(x => x.modelo === k));
  const labels = [ui.axis2d, ui.helix3d];
  const element = document.createElement('div');
  element.className = 'tf-fields';
  element.innerHTML = '<div class="field-labels"><span></span><span></span></div><div class="field-images"><div class="field-pane"></div><div class="field-pane"></div></div><div class="field-scale"><i></i><div></div><span></span></div><div class="curve-key"><span></span><span></span></div><div class="curve"></div>';
  stage.prepend(element);
  [...element.querySelectorAll('.field-labels span')].forEach((el, i) => { el.textContent = labels[i]; });
  [...element.querySelectorAll('.curve-key span')].forEach((el, i) => { el.textContent = labels[i]; });
  const fields = [...element.querySelectorAll('.field-pane')].map(p => layers(p, reduced));
  const scale = element.querySelector('.field-scale');
  const showScale = key => {
    const s = meta.escalas[key];
    scale.querySelector('div').innerHTML = [0, 1, 2, 3, 4].map(i => '<b>' + fmt(s.max * i / 4, key === 'VM' ? 0 : 3).replace(/([.,]\d*?)0+$/, '$1').replace(/[.,]$/, '') + '</b>').join('');
    scale.querySelector('span').textContent = (key === 'VM' ? ui.vm : key) + ' · ' + s.unidad;
  };
  showScale('EPPL_EQV');
  const select = document.createElement('button');
  select.className = 'scene-button';
  select.textContent = ui.vm;
  select.setAttribute('aria-pressed', 'false');
  stage.append(select);
  const data = await json('data/tfm.json');
  const graph = lineChart(element.querySelector('.curve'), {
    legend: false, height: 230, yLabel: ui.force, xLabel: ui.disp, xUnit: 'mm', yUnit: 'kN',
    series: [
      {name: labels[0], color: 'var(--s1)', pts: data.c2d3d.map(([x, y]) => [x, y])},
      {name: labels[1], color: 'var(--s2)', dash: '5 3', pts: data.c2d3d.map(([x, , z]) => [x, z])}
    ]
  });
  const cap = stage.querySelector('.cap-l'), hud = stage.querySelector('.readout');
  let vm = false, state = 'elastico', current = 0, request = 0, keys = '';
  const targets = {elastico: .062, plastificacion: .23, maximo: .705, final: 1.16};
  const nearest = (rows, u) => rows.reduce((a, b) => Math.abs(a.u_mm - u) <= Math.abs(b.u_mm - u) ? a : b);
  function show(u) {
    const rows = by.map(series => nearest(series, u));
    const paths = rows.map((r, i) => r[(vm ? 'vm_' : '') + 'archivo' + r.modelo].replace('{tema}', tema));
    graph.setCursor(u);
    cap.textContent = ui.method;
    const key = paths.join('/');
    if (key === keys) return;
    keys = key;
    rows.forEach((r, i) => fields[i].set(paths[i], labels[i] + ' · ' + fmt(r.u_mm, 3) + ' mm · ' + fmt(r.F_kN) + ' kN'));
    hud.textContent = rows.map((r, i) => r.modelo.toUpperCase() + ' · ' + fmt(r.u_mm, 3) + ' mm · ' + fmt(r.F_kN) + ' kN').join('\n');
  }
  function update(key) {
    state = key;
    const token = ++request;
    const end = targets[key], start = current, t = performance.now();
    const complete = () => { current = end; show(end); };
    if (reduced || Math.abs(start - end) < .001) { complete(); return; }
    const move = now => {
      if (token !== request) return;
      const q = Math.min(1, (now - t) / 980);
      if (q === 1) { complete(); return; }
      current = start + (end - start) * q * q * (3 - 2 * q);
      show(current);
      requestAnimationFrame(move);
    };
    requestAnimationFrame(move);
  }
  select.onclick = () => {
    vm = !vm;
    select.setAttribute('aria-pressed', String(vm));
    select.textContent = vm ? ui.strain : ui.vm;
    showScale(vm ? 'VM' : 'EPPL_EQV');
    show(current);
  };
  return {update};
}
export function create(stage, options) {
  return options.id === 'tfm-2d-3d' ? revolution(stage, options) : stress(stage, options);
}
