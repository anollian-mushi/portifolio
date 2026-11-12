// Hero: a sphere of points that pulses like sound and follows the mouse.
// Three.js, loaded from a CDN through the import map in index.html.
import * as THREE from 'three';

const canvas = document.querySelector('.hero-canvas');
const hero = document.querySelector('.hero');

if (canvas && hero) {
  try { init(); } catch (err) { console.warn('3D hero disabled:', err); }
}

function init() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 700;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const group = new THREE.Group();
  scene.add(group);

  // ---- Sphere of points (Fibonacci distribution, evenly spaced) ----
  const COUNT = small ? 4200 : 9000;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * r;
    seeds[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uScroll: { value: 0 },
    uPixel: { value: renderer.getPixelRatio() },
    uRadius: { value: 1.75 },
    uCamZ: { value: 9 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uEnergy, uScroll, uPixel, uRadius, uCamZ;
      varying float vAlpha;

      void main() {
        vec3 p = position;

        // Layered waves across the surface
        float wave = sin(p.y * 7.0 + uTime * 1.4) * 0.5
                   + sin(p.x * 5.0 - uTime * 1.1) * 0.3
                   + sin(p.z * 9.0 + uTime * 0.7) * 0.2;

        // A band that sweeps up and down and "plays" like an equaliser
        float bandY = sin(uTime * 0.55) * 0.75;
        float band = smoothstep(0.32, 0.0, abs(p.y - bandY));
        float beat = 0.5 + 0.5 * sin(uTime * 7.0 + aSeed * 6.2831);

        float d = 1.0
          + wave * (0.035 + uEnergy * 0.07)
          + band * beat * (0.14 + uEnergy * 0.3);

        p *= uRadius * d * (1.0 + uScroll * 0.9);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        float depth = clamp((mv.z + uCamZ + uRadius) / (2.0 * uRadius), 0.0, 1.0);
        vAlpha = (0.12 + depth * 0.88) * (0.55 + band * 0.45) * (1.0 - uScroll * 0.85);
        gl_PointSize = (1.4 + aSeed * 1.6 + band * 1.6) * uPixel * (uCamZ / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vec3(0.95, 0.94, 0.91), a * vAlpha);
      }
    `,
  });

  const sphere = new THREE.Points(geometry, material);
  group.add(sphere);

  // ---- Thin orbit rings ----
  const ringMat = new THREE.LineBasicMaterial({ color: 0xf1eee8, transparent: true, opacity: 0.18 });
  const makeRing = (radius, tiltX, tiltZ) => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    ring.rotation.set(tiltX, 0, tiltZ);
    group.add(ring);
    return ring;
  };
  const ringA = makeRing(2.55, 1.35, 0.25);
  const ringB = makeRing(2.95, 1.2, -0.45);

  // ---- Layout ----
  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the sphere fully in frame on tall/narrow screens
    camera.position.z = camera.aspect < 1 ? 9 / Math.max(camera.aspect, 0.55) * 0.82 : 9;
    camera.updateProjectionMatrix();
    uniforms.uCamZ.value = camera.position.z;
    group.position.y = camera.aspect < 1 ? 0.55 : 0.35;
  }
  resize();
  addEventListener('resize', resize);

  // ---- Mouse ----
  const target = { x: 0, y: 0 };
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    target.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    uniforms.uEnergy.value = Math.min(1, uniforms.uEnergy.value + 0.05);
  });

  // ---- Scroll: the sphere expands and fades as you leave the hero ----
  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    window.gsap.to(uniforms.uScroll, {
      value: 1,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  // ---- Loop ----
  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uEnergy.value *= 0.965;

    group.rotation.y += ((target.x * 0.5 + t * 0.08) - group.rotation.y) * 0.04;
    group.rotation.x += ((target.y * 0.3) - group.rotation.x) * 0.04;
    ringA.rotation.y = t * 0.12;
    ringB.rotation.y = -t * 0.09;

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame();
    requestAnimationFrame(loop);
  }

  if (reduceMotion) {
    uniforms.uTime.value = 2.0;
    renderer.render(scene, camera);
  } else {
    new IntersectionObserver(([entry]) => {
      const wasRunning = running;
      running = entry.isIntersecting;
      if (running && !wasRunning) requestAnimationFrame(loop);
    }).observe(hero);
    requestAnimationFrame(loop);
  }

  canvas.classList.add('ready');
}
