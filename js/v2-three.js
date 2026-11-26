import * as T from 'three';

export const ease = x => { const y = T.MathUtils.clamp(x, 0, 1); return y * y * (3 - 2 * y); };

export function view(stage, draw, { shadows = false, orthographic = false, cad = false } = {}) {
  const renderer = new T.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cad ? 1.21 : 1.14;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.prepend(renderer.domElement);
  const scene = new T.Scene();
  if (cad) {
    // Same lighting as the CAD viewer of the reducer model (3 directional lights plus a hemisphere).
    scene.add(new T.HemisphereLight(0xf1f9ff, 0xa7a5a0, 2.08));
    for (const [x, y, z, k, color] of [[-470, -390, 900, 3.4, 0xfff1df], [490, 410, 680, 2.65, 0xe7f5ff], [-220, 670, 70, 1.4, 0xffffff]]) {
      const l = new T.DirectionalLight(color, k);
      l.position.set(x, y, z);
      scene.add(l);
    }
  } else {
    scene.add(new T.HemisphereLight('#f3f6ff', '#85807b', 2.6));
    const key = new T.DirectionalLight('#fff4df', 3.3);
    key.position.set(-4, 6, 8);
    if (shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, {left: -5, right: 5, top: 6, bottom: -5, near: .5, far: 24});
      key.shadow.normalBias = .012;
      key.shadow.bias = -.00035;
    }
    const rim = new T.DirectionalLight('#ddeaff', 1.3);
    rim.position.set(6, 3, -4);
    scene.add(key, rim);
  }
  const camera = orthographic ? new T.OrthographicCamera(-.6,.6,.6,-.6,.01,100) : new T.PerspectiveCamera(33, 1, .01, 10000);
  let visible = true, queued = 0, lastFrame = 0;
  const tick = now => {
    queued = 0;
    if (!visible) return;
    if (now - lastFrame >= 32) {
      lastFrame = now;
      render(now);
    }
    queued = requestAnimationFrame(tick);
  };
  function render(now = performance.now()) {
    draw({scene, camera, renderer, now});
    renderer.render(scene, camera);
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (orthographic) {
      const w = .53 * Math.max(1, camera.aspect), h = .53 * Math.max(1, 1 / camera.aspect);
      Object.assign(camera, {left: -w, right: w, top: h, bottom: -h});
    }
    camera.updateProjectionMatrix();
    if (visible) render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  return {scene, camera, renderer, resize, paint: render, visibility(next) {
    visible = next;
    if (next && !queued) queued = requestAnimationFrame(tick);
    if (!next && queued) { cancelAnimationFrame(queued); queued = 0; }
  }};
}

export function fit(camera, direction, center, span, margin = 1.18) {
  const a = Math.tan(T.MathUtils.degToRad(camera.fov * .5));
  const distance = span * margin / (2 * a * Math.min(1, camera.aspect));
  camera.position.copy(direction).normalize().multiplyScalar(distance).add(center);
  camera.lookAt(center);
}

export const vec = values => new T.Vector3(...values);
export const named = (name, regex) => regex.test(name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

export function message(stage, title, detail) {
  const el = document.createElement('div');
  el.className = 'media-placeholder';
  const strong = document.createElement('strong'), sub = document.createElement('span');
  strong.textContent = title;
  sub.textContent = detail;
  el.append(strong, sub);
  stage.append(el);
  return el;
}
