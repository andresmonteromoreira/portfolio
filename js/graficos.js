// Gráficos SVG propios, sin librerías: líneas, mapa de calor, puntos y pasos.
const NS = 'http://www.w3.org/2000/svg';
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().replace(/"/g, "'");
const nice = (lo, hi, n = 5) => {
  const span = hi - lo || 1, step0 = span / n, mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, t = [];
  for (let v = a; v <= b + step / 2; v += step) t.push(+v.toFixed(10));
  return t;
};
const fmt = (v, d = 1) => v.toLocaleString(document.documentElement.lang, { maximumFractionDigits: d, minimumFractionDigits: 0 });
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

function frame(host, W, H, m) {
  host.innerHTML = '';
  const plot = document.createElement('div'); plot.className = 'plot'; host.appendChild(plot);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' }, plot);
  const tip = document.createElement('div'); tip.className = 'tip'; plot.appendChild(tip);
  return { svg, tip, plot, iw: W - m.l - m.r, ih: H - m.t - m.b, g: el('g', { transform: `translate(${m.l},${m.t})` }, svg) };
}

function axes(g, iw, ih, xs, ys, X, Y, xl, yl, xf = v => fmt(v), yf = v => fmt(v)) {
  const grid = el('g', { class: 'grid-l' }, g), ax = el('g', { class: 'ax' }, g);
  ys.forEach(v => { el('line', { x1: 0, x2: iw, y1: Y(v), y2: Y(v) }, grid); const t = el('text', { x: -8, y: Y(v) + 3, 'text-anchor': 'end' }, ax); t.textContent = yf(v); });
  xs.forEach(v => { const t = el('text', { x: X(v), y: ih + 16, 'text-anchor': 'middle' }, ax); t.textContent = xf(v); });
  el('line', { x1: 0, x2: iw, y1: ih, y2: ih }, ax);
  const a = el('text', { x: iw, y: ih + 32, 'text-anchor': 'end' }, ax); a.textContent = xl;
  const b = el('text', { x: 0, y: -10, 'text-anchor': 'start' }, ax); b.textContent = yl;
}

/** Varias series x-y. Devuelve setCursor(x) para sincronizar con el scroll. */
export function lineChart(host, { series, xLabel, yLabel, xUnit = '', yUnit = '', legend = true, height = 340, xmax, ymin = 0 }) {
  const W = 640, H = height, m = { t: 26, r: 16, b: 40, l: 44 };
  if (legend && series.length > 1) {
    const lg = document.createElement('div'); lg.className = 'legend';
    series.forEach((s, i) => { const b = document.createElement('button'); b.setAttribute('aria-pressed', 'true'); b.style.color = s.color; b.innerHTML = `<i></i><span style="color:var(--ink)">${s.name}</span>`; b.onclick = () => { s.hidden = !s.hidden; b.setAttribute('aria-pressed', String(!s.hidden)); draw(); }; lg.appendChild(b); });
    host.appendChild(lg);
  }
  const holder = document.createElement('div'); host.appendChild(holder);
  const all = series.flatMap(s => s.pts);
  const x1 = xmax ?? Math.max(...all.map(p => p[0])), y1 = Math.max(...all.map(p => p[1]));
  const xs = nice(0, x1), ys = nice(ymin, y1);
  let cursorX = null, F;
  function draw() {
    F = frame(holder, W, H, m);
    const X = v => (v - xs[0]) / (xs.at(-1) - xs[0]) * F.iw, Y = v => F.ih - (v - ys[0]) / (ys.at(-1) - ys[0]) * F.ih;
    F.X = X; F.Y = Y;
    axes(F.g, F.iw, F.ih, xs, ys, X, Y, xLabel, yLabel);
    series.forEach(s => {
      if (s.hidden) return;
      el('path', { d: 'M' + s.pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('L'), fill: 'none', stroke: s.color, 'stroke-width': s.width || 1.6, 'stroke-dasharray': s.dash || '', opacity: s.opacity ?? 1 }, F.g);
    });
    F.cur = el('g', { opacity: 0 }, F.g);
    el('line', { y1: 0, y2: F.ih, stroke: css('--accent'), 'stroke-width': 1 }, F.cur);
    F.dots = series.map(s => el('circle', { r: 3.5, fill: s.color, stroke: css('--bg'), 'stroke-width': 1.5 }, F.cur));
    const hit = el('rect', { width: F.iw, height: F.ih, fill: 'transparent' }, F.g);
    hit.addEventListener('pointermove', e => { const r = F.svg.getBoundingClientRect(); const px = (e.clientX - r.left) * (W / r.width) - m.l; show(xs[0] + px / F.iw * (xs.at(-1) - xs[0]), true); });
    hit.addEventListener('pointerleave', () => { F.tip.style.opacity = 0; show(cursorX, false); });
    show(cursorX, false);
  }
  const at = (pts, x) => { let i = pts.findIndex(p => p[0] >= x); if (i <= 0) return i === 0 ? pts[0][1] : null; const [a, b] = [pts[i - 1], pts[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); };
  function show(x, withTip) {
    if (x == null) { F.cur.setAttribute('opacity', 0); return; }
    F.cur.setAttribute('opacity', 1); F.cur.querySelector('line').setAttribute('x1', F.X(x)); F.cur.querySelector('line').setAttribute('x2', F.X(x));
    const lines = [];
    series.forEach((s, i) => { const y = s.hidden ? null : at(s.pts, x); const d = F.dots[i]; if (y == null) { d.setAttribute('opacity', 0); return; } d.setAttribute('opacity', 1); d.setAttribute('cx', F.X(x)); d.setAttribute('cy', F.Y(y)); lines.push(`${s.name}: ${fmt(y, 1)} ${yUnit}`); });
    if (withTip) { const r = F.svg.getBoundingClientRect(), k = r.width / W; F.tip.style.left = (m.l + F.X(x)) * k + 'px'; F.tip.style.top = (m.t + 10) * k + 'px'; F.tip.innerHTML = `${xLabel.split(' (')[0]} ${fmt(x, 2)} ${xUnit}<br>` + lines.slice(0, 9).join('<br>'); F.tip.style.opacity = 1; }
  }
  draw();
  return { setCursor(x) { cursorX = x; show(x, false); } };
}

/** Matriz filas × columnas con valores (p. ej. Fmax por R y μ). */
export function heatmap(host, { rows, cols, values, rowLabel, colLabel, unit = '', digits = 1, onHover }) {
  const W = 640, H = 300, m = { t: 30, r: 16, b: 34, l: 90 };
  const F = frame(host, W, H, m), cw = F.iw / cols.length, ch = F.ih / rows.length;
  const flat = values.flat(), lo = Math.min(...flat), hi = Math.max(...flat);
  const mix = t => { const a = css('--heat-lo'), b = css('--heat-hi'); const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const [x, y] = [p(a), p(b)]; return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
  const ax = el('g', { class: 'ax' }, F.g);
  rows.forEach((r, i) => cols.forEach((c, j) => {
    const v = values[i][j], t = (v - lo) / (hi - lo || 1);
    const g = el('g', {}, F.g);
    el('rect', { x: j * cw + 1, y: i * ch + 1, width: cw - 2, height: ch - 2, fill: mix(t) }, g);
    const tx = el('text', { x: j * cw + cw / 2, y: i * ch + ch / 2 + 6, 'text-anchor': 'middle', 'font-family': css('--f-head'), 'font-size': 20, fill: t > .6 ? '#fff' : css('--ink') }, g);
    tx.textContent = fmt(v, digits);
    g.addEventListener('pointerenter', () => onHover && onHover(i, j));
  }));
  rows.forEach((r, i) => { const t = el('text', { x: -10, y: i * ch + ch / 2 + 4, 'text-anchor': 'end' }, ax); t.textContent = r; });
  cols.forEach((c, j) => { const t = el('text', { x: j * cw + cw / 2, y: F.ih + 18, 'text-anchor': 'middle' }, ax); t.textContent = c; });
  const a = el('text', { x: -10, y: -12, 'text-anchor': 'end' }, ax); a.textContent = rowLabel;
  const b = el('text', { x: F.iw, y: -12, 'text-anchor': 'end' }, ax); b.textContent = colLabel + (unit ? ` · valores en ${unit}` : '');
}

/** Puntos por grupo con una línea de límite (ensayos de caída). */
export function dotPlot(host, { groups, limit, limitLabel, yLabel, unit = '' }) {
  const W = 640, H = 300, m = { t: 26, r: 16, b: 40, l: 44 };
  const F = frame(host, W, H, m), all = groups.flatMap(g => g.values).concat(limit ?? []);
  const ys = nice(0, Math.max(...all)), gw = F.iw / groups.length;
  const Y = v => F.ih - v / ys.at(-1) * F.ih;
  axes(F.g, F.iw, F.ih, [], ys, () => 0, Y, '', yLabel);
  if (limit != null) { el('line', { x1: 0, x2: F.iw, y1: Y(limit), y2: Y(limit), stroke: css('--accent'), 'stroke-dasharray': '5 4' }, F.g); const t = el('text', { x: F.iw, y: Y(limit) - 6, 'text-anchor': 'end', class: 'ax', fill: css('--accent-text'), 'font-family': css('--f-mono'), 'font-size': 10 }, F.g); t.textContent = limitLabel; }
  const ax = el('g', { class: 'ax' }, F.g);
  groups.forEach((g, i) => {
    const cx = i * gw + gw / 2; const t = el('text', { x: cx, y: F.ih + 18, 'text-anchor': 'middle' }, ax); t.textContent = g.name;
    g.values.forEach((v, k) => { const c = el('circle', { cx: cx + (k - (g.values.length - 1) / 2) * 12, cy: Y(v), r: 5, fill: css('--ink') }, F.g); c.addEventListener('pointerenter', () => { const r = F.svg.getBoundingClientRect(), s = r.width / W; F.tip.style.left = (m.l + +c.getAttribute('cx')) * s + 'px'; F.tip.style.top = (m.t + +c.getAttribute('cy')) * s + 'px'; F.tip.textContent = `${g.name} · caída ${k + 1}: ${fmt(v, 1)} ${unit}`; F.tip.style.opacity = 1; }); c.addEventListener('pointerleave', () => F.tip.style.opacity = 0); });
  });
}

/** Banda de rango cuando solo se conoce un intervalo (sin inventar puntos). */
export function rangeBand(host, { lo, hi, limit, unit, label, limitLabel }) {
  const W = 640, H = 120, m = { t: 30, r: 16, b: 30, l: 16 };
  const F = frame(host, W, H, m), mx = Math.max(hi, limit) * 1.2, X = v => v / mx * F.iw;
  const ax = el('g', { class: 'ax' }, F.g); el('line', { x1: 0, x2: F.iw, y1: 40, y2: 40 }, ax);
  nice(0, mx).filter(v => v <= mx).forEach(v => { el('line', { x1: X(v), x2: X(v), y1: 36, y2: 44 }, ax); const t = el('text', { x: X(v), y: 60, 'text-anchor': 'middle' }, ax); t.textContent = fmt(v) + ' ' + unit; });
  el('rect', { x: X(lo), y: 26, width: X(hi) - X(lo), height: 28, fill: css('--ink') }, F.g);
  const t = el('text', { x: (X(lo) + X(hi)) / 2, y: 18, 'text-anchor': 'middle', 'font-family': css('--f-mono'), 'font-size': 11, fill: css('--ink') }, F.g); t.textContent = label;
  el('line', { x1: X(limit), x2: X(limit), y1: 14, y2: 66, stroke: css('--accent'), 'stroke-width': 2, 'stroke-dasharray': '4 3' }, F.g);
  const u = el('text', { x: X(limit) + 6, y: 18, 'font-family': css('--f-mono'), 'font-size': 11, fill: css('--accent-text') }, F.g); u.textContent = limitLabel;
}
