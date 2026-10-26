/* ==============================================
   AKSHAY T — PORTFOLIO
   Three.js Hero Scene
   Particle network with mouse parallax + scroll fade
   ============================================== */

'use strict';

(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ─────────────────────────────────────────────
     Renderer
  ───────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha:     true,   // transparent bg — lets neumorphic #e0e5ec show through
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);   // fully transparent clear

  /* ─────────────────────────────────────────────
     Scene & Camera
  ───────────────────────────────────────────── */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.z = 42;

  /* ─────────────────────────────────────────────
     Colour — pull from CSS custom property
  ───────────────────────────────────────────── */
  const accentHex = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#6c8ebf';

  /* ─────────────────────────────────────────────
     Particles
  ───────────────────────────────────────────── */
  const isMobile = window.innerWidth < 720;
  const COUNT    = isMobile ? 90 : 200;

  const positions  = new Float32Array(COUNT * 3);
  const randoms    = new Float32Array(COUNT);   // per-particle phase offset
  const origY      = new Float32Array(COUNT);   // for gentle sine float

  for (let i = 0; i < COUNT; i++) {
    const x = (Math.random() - 0.5) * 90;
    const y = (Math.random() - 0.5) * 55;
    const z = (Math.random() - 0.5) * 35;

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    origY[i]              = y;
    randoms[i]            = Math.random() * Math.PI * 2;  // random phase
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const pMat = new THREE.PointsMaterial({
    color:           accentHex,
    size:            0.38,
    sizeAttenuation: true,
    transparent:     true,
    opacity:         0.75,
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ─────────────────────────────────────────────
     Connecting edges (network graph)
     Draw a line between any two particles within
     threshold distance — classic neural net look
  ───────────────────────────────────────────── */
  const EDGE_DIST = 16;

  function buildEdges() {
    const verts = [];
    const p     = positions;   // live reference

    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = p[i*3]   - p[j*3];
        const dy = p[i*3+1] - p[j*3+1];
        const dz = p[i*3+2] - p[j*3+2];
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < EDGE_DIST) {
          verts.push(p[i*3], p[i*3+1], p[i*3+2]);
          verts.push(p[j*3], p[j*3+1], p[j*3+2]);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    return geo;
  }

  const edgeMat = new THREE.LineBasicMaterial({
    color:       accentHex,
    transparent: true,
    opacity:     0.1,
  });

  const edgeGeo  = buildEdges();
  const edges    = new THREE.LineSegments(edgeGeo, edgeMat);
  scene.add(edges);

  /* ─────────────────────────────────────────────
     Click ripple — burst of 12 particles at cursor
  ───────────────────────────────────────────── */
  const ripples = [];

  function spawnRipple(ndcX, ndcY) {
    // Un-project NDC → world at z = 0 plane
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const origin = camera.position.clone().addScaledVector(dir, dist);

    const BURST = 12;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(BURST * 3);
    const vel   = [];

    for (let i = 0; i < BURST; i++) {
      pos[i*3]     = origin.x;
      pos[i*3+1]   = origin.y;
      pos[i*3+2]   = origin.z;
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.1,
      ));
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat   = new THREE.PointsMaterial({
      color:       accentHex,
      size:        0.55,
      transparent: true,
      opacity:     0.9,
    });

    const mesh  = new THREE.Points(geo, mat);
    scene.add(mesh);
    ripples.push({ mesh, vel, life: 1.0 });
  }

  document.getElementById('home').addEventListener('click', e => {
    const hero = document.getElementById('home');
    const rect = hero.getBoundingClientRect();
    const ndcX =  ((e.clientX - rect.left)  / rect.width  ) * 2 - 1;
    const ndcY = -((e.clientY - rect.top)   / rect.height ) * 2 + 1;
    spawnRipple(ndcX, ndcY);
  });

  /* ─────────────────────────────────────────────
     Mouse parallax (smooth lerp)
  ───────────────────────────────────────────── */
  const mouse  = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ─────────────────────────────────────────────
     Scroll fade
  ───────────────────────────────────────────── */
  window.addEventListener('scroll', () => {
    const ratio   = Math.max(0, 1 - window.scrollY / window.innerHeight);
    canvas.style.opacity = ratio * 0.5;
  }, { passive: true });

  /* ─────────────────────────────────────────────
     Resize
  ───────────────────────────────────────────── */
  function resize() {
    const hero = document.getElementById('home');
    const w    = hero.clientWidth;
    const h    = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ─────────────────────────────────────────────
     Animation loop
  ───────────────────────────────────────────── */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const t   = clock.getElapsedTime();
    const pos = pGeo.attributes.position.array;

    /* Gentle per-particle y float */
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] = origY[i] + Math.sin(t * 0.35 + randoms[i]) * 1.4;
    }
    pGeo.attributes.position.needsUpdate = true;

    /* Smooth mouse lerp */
    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;

    /* Apply rotation to both particles and edges */
    particles.rotation.y = t * 0.035 + target.x * 0.10;
    particles.rotation.x =             target.y * 0.06;
    edges.rotation.y     = particles.rotation.y;
    edges.rotation.x     = particles.rotation.x;

    /* Ripple updates */
    for (let r = ripples.length - 1; r >= 0; r--) {
      const rpl = ripples[r];
      rpl.life -= 0.018;

      if (rpl.life <= 0) {
        scene.remove(rpl.mesh);
        rpl.mesh.geometry.dispose();
        rpl.mesh.material.dispose();
        ripples.splice(r, 1);
        continue;
      }

      const rPos = rpl.mesh.geometry.attributes.position.array;
      for (let i = 0; i < rpl.vel.length; i++) {
        rPos[i*3]     += rpl.vel[i].x;
        rPos[i*3+1]   += rpl.vel[i].y;
        rPos[i*3+2]   += rpl.vel[i].z;
        rpl.vel[i].multiplyScalar(0.97);   // drag
      }
      rpl.mesh.geometry.attributes.position.needsUpdate = true;
      rpl.mesh.material.opacity = rpl.life * 0.9;
    }

    renderer.render(scene, camera);
  }

  animate();

})();
