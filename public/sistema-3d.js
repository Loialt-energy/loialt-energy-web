// Render 3D del SISTEMA DE ENERGÍA que vive en la burbuja de #servicio.
//
// ORIGEN: portado de `imagenes-bess/fuente/sistema-energia-3d-original.html`,
// que el usuario generó aparte. Es una escena PROCEDURAL (se construye con
// primitivas, no carga ningún modelo), así que no hay asset que descargar.
//
// QUÉ SE CAMBIÓ AL PORTARLO
// -------------------------
// 1. Three.js: el original carga r128 como script GLOBAL desde cdnjs; el
//    proyecto usa three@0.160.0 como MÓDULO desde esm.sh. Se unificó al del
//    proyecto para no cargar dos copias de la librería (~600 KB de más).
//    Eso obligó a dos arreglos, porque r152 eliminó ambas APIs:
//      renderer.outputEncoding = sRGBEncoding  ->  outputColorSpace = SRGBColorSpace
//      texture.encoding        = sRGBEncoding  ->  texture.colorSpace = SRGBColorSpace
// 2. Controles propios (arrastrar/rueda/doble clic) APAGADOS salvo
//    `interactivo:true`. El manejador de `wheel` llama preventDefault() y se
//    tragaría el gesto del pager, y `touch-action:none` bloquearía el scroll
//    en móvil. Aquí el giro lo manda el cambio de fase.
// 3. Nuevo `girar(deltaRad, durSeg)`: gira el grupo `world` de forma
//    ACUMULATIVA (parte del ángulo actual, no de uno fijo por fase), con
//    easeInOutCubic. Es lo que pidió el usuario: el giro no se ancla a la
//    fase, solo avanza un tercio de vuelta cada vez.
//
// Verificado que la composición se lee a 0°, 120° y 240°: es una escena sobre
// un plano, no una lámina isométrica plana, así que funciona desde cualquier
// lado.
//
// USO:  initSistema3D(contenedor, { background:null, showGround:false })
//       -> { world, girar, dispose, ... }

import * as THREE from 'https://esm.sh/three@0.160.0';

/* =====================================================================
   energy-system-3d.js
   Render 3D isométrico (Three.js r128) del diagrama de sistema de energía:
   solar + red eléctrica + gabinete de control + cargas industriales +
   nube/monitoreo + racks de servidores + contenedor BESS + módulo y celdas.

   Uso (ver index.html):
     1. Cargar Three.js r128 (UMD): https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
     2. Cargar este archivo.
     3. EnergySystem3D.mount(document.getElementById('app'));

   API:
     EnergySystem3D.mount(container, options?) -> { scene, camera, renderer, resetView, setAutoRotate, dispose }
     options: { autoRotate: bool, background: hex | 'checker' | null, showGround: bool }
   ===================================================================== */


  // ---------- paleta ----------
  const C = {
    orange: 0xe8873a, blue: 0x4a7fb5, cloud: 0xbfdbfe, screen: 0x93c5fd,
    white: 0xf3f4f6, light: 0xe5e7eb, gray: 0xd1d5db, mid: 0x9ca3af, dark: 0x374151,
    rack: 0x1f2937, rackSlot: 0x4b5563, navy: 0x1e3a8a, panel: 0x1e3a5f, panelCell: 0x2c5282,
    floor: 0xe8dcc4, steel: 0x94a3b8, red: 0xdc2626,
    // Colores de MARCA. Van aparte de `navy` (que es azul-800 y lo usa el módulo
    // de batería): estos son los oficiales de Loialt y los lleva SOLO el
    // contenedor BESS, que es el producto. El resto de la escena es apoyo y se
    // queda en la paleta neutra a propósito.
    marcaVerde: 0x78b85b, marcaVerdeHondo: 0x5a9a42, marcaNavy: 0x021838,
    // Blanco PROPIO del forro del contenedor, más limpio que `white` (0xf3f4f6).
    // Va aparte a propósito: `white` lo comparten el gabinete convertidor y los
    // gabinetes de dentro del contenedor, así que aclarar el token subiría todo
    // por igual y no se ganaría contraste. Separándolo, el producto sube y el
    // apoyo se queda donde estaba — que es justo lo que lo hace resaltar.
    bessBlanco: 0xffffff,
    // Los LED de los racks eran 0x22c55e, un verde ajeno. Se unifican al de marca.
    led: 0x78b85b,
    // Gris de los racks EXTERIORES. Antes usaban `rack` (0x1f2937), el valor más
    // oscuro de todo el render: en una escena clara el máximo contraste manda la
    // mirada, y la mandaba al apoyo en vez de al producto. Los racks de DENTRO
    // del contenedor siguen con `rack` — ahí el negro sí conviene.
    rackExt: 0x475569,
  };

  // ---------- tamaño del contenedor BESS ----------
  // ÚNICO número a tocar para dimensionar la batería de Loialt. Su posición en el
  // mundo se DERIVA de aquí (ver el armado de `world`), así que cambiarlo no
  // desalinea las flechas que llegan a su costado.
  //   1.00 = como venía: 3×3×7. Quedaba MÁS BAJO que los racks (4.2) y que el
  //          gabinete (4.6), así que no se leía como el protagonista.
  //   1.25 = 3.75×3.75×8.75. Actual. Salto de producto real (20 ft → 40 ft), no
  //          una deformación; con los racks bajados a 3.5 ya es el más alto de
  //          la zona derecha sin inflar nada.
  //   1.35 = siguiente escalón si aún no gana. Sigue entrando en cuadro.
  const BESS_ESCALA = 1.25;

  // ---------- helpers ----------
  const Y = new THREE.Vector3(0, 1, 0);
  const mat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0.05 }, extra || {}));
  const lineMat = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacity == null ? 0.35 : opacity });

  function edges(mesh, color, opacity) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), lineMat(color == null ? 0x1f2937 : color, opacity));
    mesh.add(e);
    return mesh;
  }
  function box(w, h, d, color, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts.mat));
    m.castShadow = opts.shadow !== false; m.receiveShadow = true;
    if (opts.edges !== false) edges(m, opts.edgeColor, opts.edgeOpacity);
    return m;
  }
  function cyl(rt, rb, h, color, seg, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat(color, opts.mat));
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // cilindro entre dos puntos (para celosías y cables)
  function strut(a, b, r, material) {
    const d = new THREE.Vector3().subVectors(b, a);
    const L = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 6), material);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(Y, d.normalize());
    m.castShadow = true;
    return m;
  }
  function place(obj, x, y, z, ry) { obj.position.set(x, y, z); if (ry) obj.rotation.y = ry; return obj; }

  // ---------- flechas (energía = naranja, datos = azul) ----------
  function arrow(pts, color, opts) {
    opts = opts || {};
    const r = opts.r || 0.09, y = opts.y == null ? 1.25 : opts.y;
    const coneL = r * 6, coneR = r * 2.6;
    const m = mat(color, { roughness: 0.55, emissive: color, emissiveIntensity: 0.15 });
    const g = new THREE.Group(); g.userData.pulse = m;
    const v = pts.map(p => new THREE.Vector3(p[0], p.length > 2 ? p[2] : y, p[1]));
    for (let i = 0; i < v.length - 1; i++) {
      let a = v[i].clone(), b = v[i + 1].clone();
      const dir = new THREE.Vector3().subVectors(b, a).normalize();
      if (i === v.length - 2) b.sub(dir.clone().multiplyScalar(coneL));         // deja lugar a la punta
      if (i === 0 && opts.double) a.add(dir.clone().multiplyScalar(coneL));
      const seg = strut(a, b, r, m); g.add(seg);
      if (i > 0) { const j = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), m); j.position.copy(v[i]); g.add(j); }
    }
    const head = (tip, dir) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneL, 16), m);
      c.position.copy(tip).sub(dir.clone().multiplyScalar(coneL / 2));
      c.quaternion.setFromUnitVectors(Y, dir); c.castShadow = true; g.add(c);
    };
    head(v[v.length - 1], new THREE.Vector3().subVectors(v[v.length - 1], v[v.length - 2]).normalize());
    if (opts.double) head(v[0], new THREE.Vector3().subVectors(v[0], v[1]).normalize());
    return g;
  }

  function dashed(a, b, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: color || 0x6b7280, dashSize: 0.25, gapSize: 0.15 }));
    l.computeLineDistances();
    return l;
  }

  // ---------- componentes ----------
  function solarPanel() {
    const g = new THREE.Group();
    const tilt = -0.42;
    const frame = box(2.2, 0.08, 1.5, C.panel, { edgeColor: 0x0f172a });
    frame.rotation.x = tilt; frame.position.y = 0.75; g.add(frame);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const cell = box(0.66, 0.02, 0.68, C.panelCell, { edges: true, edgeColor: 0x93c5fd, edgeOpacity: 0.6, shadow: false });
      cell.position.set(-0.72 + i * 0.72, 0.05, -0.36 + j * 0.72);
      frame.add(cell);
    }
    // patas: cada una termina justo bajo el marco inclinado (no lo atraviesan)
    const underside = z => 0.75 + z * Math.sin(-tilt) - 0.05;
    [[-0.8, 0.55], [0.8, 0.55], [-0.8, -0.55], [0.8, -0.55]].forEach(([x, z]) => {
      const h = underside(z); const leg = cyl(0.05, 0.05, h, C.mid, 8); leg.position.set(x, h / 2, z); g.add(leg);
    });
    return g;
  }
  function solarArray() {
    const g = new THREE.Group();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const p = solarPanel(); p.position.set(c * 2.6, 0, r * 2.0); g.add(p);
    }
    return g;
  }

  function tower(h) {
    h = h || 6.5;
    const g = new THREE.Group(), m = mat(C.steel, { metalness: 0.35, roughness: 0.5 });
    const b = 0.9, t = 0.28, r = 0.035;
    const corner = (sx, sz, y) => { const w = b + (t - b) * (y / h); return new THREE.Vector3(sx * w, y, sz * w); };
    const S = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    S.forEach(([sx, sz]) => g.add(strut(corner(sx, sz, 0), corner(sx, sz, h), r * 1.3, m)));
    const levels = [0.8, 2.0, 3.3, 4.6, 5.8, h];
    levels.forEach((y, li) => {
      for (let i = 0; i < 4; i++) {
        const [sx, sz] = S[i], [sx2, sz2] = S[(i + 1) % 4];
        g.add(strut(corner(sx, sz, y), corner(sx2, sz2, y), r, m));
        if (li > 0) g.add(strut(corner(sx, sz, levels[li - 1]), corner(sx2, sz2, y), r * 0.8, m));
      }
    });
    // brazos con aisladores
    [h - 1.0, h - 2.3].forEach((y, i) => {
      const len = 3.4 - i * 0.4;
      const arm = box(len, 0.1, 0.1, C.steel, { edges: false, mat: { metalness: 0.35 } }); arm.position.y = y; g.add(arm);
      [-1, 1].forEach(s => { const ins = cyl(0.06, 0.06, 0.45, C.dark, 8); ins.position.set(s * (len / 2 - 0.15), y - 0.3, 0); g.add(ins); });
    });
    const tip = cyl(0.02, 0.02, 0.6, C.steel, 6); tip.position.y = h + 0.3; g.add(tip);
    return g;
  }
  function wires(posA, posB, h) {
    const g = new THREE.Group(), m = lineMat(0x475569, 0.8);
    const dir = new THREE.Vector3().subVectors(posB, posA).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const extA = posA.clone().sub(dir.clone().multiplyScalar(4.5)), extB = posB.clone().add(dir.clone().multiplyScalar(4.5));
    [[h - 1.0, 1.55], [h - 2.3, 1.35]].forEach(([y, off]) => [-1, 1].forEach(s => {
      const pts = [extA, posA, posB, extB].map(p => p.clone().add(perp.clone().multiplyScalar(s * off)).setY(y - 0.5));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= 0.45;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), m));
      }
    }));
    return g;
  }

  function acUnit() {
    const g = new THREE.Group();
    g.add(place(box(0.55, 0.28, 0.55, C.light), 0, 0.14, 0));
    const fan = cyl(0.2, 0.2, 0.05, C.mid, 20); fan.position.y = 0.3; g.add(fan);
    const hub = cyl(0.05, 0.05, 0.08, C.dark, 8); hub.position.y = 0.33; g.add(hub);
    return g;
  }
  function factory() {
    const g = new THREE.Group();
    // nave grande con chimeneas
    const main = box(2.4, 2.3, 2.0, C.gray); main.position.set(0, 1.15, 0); g.add(main);
    g.add(place(box(2.5, 0.12, 2.1, C.mid), 0, 2.35, 0));
    [[-0.7, -0.5], [0, -0.5], [0.7, -0.5]].forEach(([x, z]) => { const ch = cyl(0.14, 0.14, 1.0, C.light, 12); ch.position.set(x, 2.9, z); g.add(ch); });
    g.add(place(box(0.7, 0.5, 0.7, C.light), 0.6, 2.65, 0.5));
    // escalera / caseta
    g.add(place(box(0.5, 1.2, 0.9, C.light), -1.45, 0.6, 0.4));
    // naves bajas con climatización
    const low = (x, z) => {
      const b = box(2.6, 1.2, 2.2, C.gray); b.position.set(x, 0.6, z); g.add(b);
      g.add(place(box(2.7, 0.1, 2.3, C.mid), x, 1.25, z));
      g.add(place(acUnit(), x - 0.6, 1.3, z - 0.4)); g.add(place(acUnit(), x + 0.5, 1.3, z + 0.4));
      // ventanas
      for (let i = -1; i <= 1; i++) g.add(place(box(0.35, 0.35, 0.04, C.screen, { edges: false, shadow: false }), x + i * 0.7, 0.65, z + 1.12));
    };
    low(-2.4, 2.4); low(0.6, 3.3);
    return g;
  }

  function cabinet() {
    const g = new THREE.Group();
    g.add(place(box(3.8, 0.35, 2.6, C.mid), 0, 0.175, 0));
    const body = box(3.2, 4.6, 2.0, C.white); body.position.y = 0.35 + 2.3; g.add(body);
    g.add(place(box(3.3, 0.15, 2.1, C.light), 0, 5.02, 0));
    // puertas (cara +z) y detalles
    g.add(place(box(0.03, 4.2, 0.03, C.dark, { edges: false, shadow: false }), 0, 2.65, 1.01));
    [-0.15, 0.15].forEach(x => g.add(place(box(0.06, 0.35, 0.05, C.dark, { edges: false, shadow: false }), x, 2.6, 1.03)));
    [1.6, 3.9].forEach(y => [-0.8, 0.8].forEach(x => {
      for (let i = 0; i < 5; i++) g.add(place(box(0.7, 0.05, 0.03, C.mid, { edges: false, shadow: false }), x, y + i * 0.12, 1.02));
    }));
    // rejillas cara +x
    [1.3, 3.7].forEach(y => { for (let i = 0; i < 5; i++) g.add(place(box(0.03, 0.05, 1.2, C.mid, { edges: false, shadow: false }), 1.62, y + i * 0.12, 0)); });
    return g;
  }

  function cloud() {
    const g = new THREE.Group(), m = mat(C.cloud, { roughness: 0.95 });
    [[0, 0, 0, 1.15], [-1.2, -0.25, 0.1, 0.8], [1.2, -0.2, 0.05, 0.85], [0.5, 0.65, -0.1, 0.8], [-0.4, 0.6, 0.1, 0.7]].forEach(([x, y, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), m); s.position.set(x, y, z); s.castShadow = true; g.add(s);
    });
    return g;
  }
  function laptop() {
    const g = new THREE.Group();
    g.add(place(box(1.7, 0.08, 1.15, C.light), 0, 0.04, 0));
    g.add(place(box(1.3, 0.02, 0.6, C.mid, { edges: false, shadow: false }), 0, 0.09, 0.05));
    const scr = box(1.7, 1.05, 0.06, C.dark); scr.position.set(0, 0.5, -0.6); scr.rotation.x = -0.35;
    scr.add(place(box(1.5, 0.88, 0.02, C.screen, { edges: false, shadow: false, mat: { emissive: C.screen, emissiveIntensity: 0.3 } }), 0, 0, 0.035));
    g.add(scr);
    return g;
  }
  function monitor() {
    const g = new THREE.Group();
    const scr = box(1.7, 1.2, 0.1, C.dark); scr.position.y = 1.1;
    scr.add(place(box(1.55, 1.05, 0.02, C.screen, { edges: false, shadow: false, mat: { emissive: C.screen, emissiveIntensity: 0.3 } }), 0, 0, 0.06));
    g.add(scr);
    const st = cyl(0.08, 0.08, 0.5, C.mid, 10); st.position.y = 0.3; g.add(st);
    g.add(place(cyl(0.45, 0.5, 0.06, C.mid, 20), 0, 0.03, 0));
    return g;
  }
  function antenna() {
    const g = new THREE.Group();
    const t = tower(3.2); t.scale.set(0.35, 0.55, 0.35); g.add(t);
    const m = new THREE.MeshBasicMaterial({ color: C.blue });
    [0.45, 0.8, 1.15].forEach(r => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 24, Math.PI * 0.5), m);
      ring.position.set(0.1, 2.0, 0.1); ring.rotation.set(0, -Math.PI / 4, Math.PI * 0.25); g.add(ring);
    });
    return g;
  }

  function serverRack() {
    const g = new THREE.Group();
    // ALTO 3.5, antes 4.2. Un rack de servidores no puede ser más alto que un
    // contenedor marítimo: esa era la incoherencia de fondo de la escena, y la
    // razón por la que "agrandar la batería" a secas se sentía exagerado — se
    // compensaba con tamaño un problema que también era de los vecinos.
    const body = box(1.35, 3.5, 1.35, C.rackExt, { edgeColor: 0x334155, edgeOpacity: 0.5 }); body.position.y = 1.75; g.add(body);
    for (let i = 0; i < 9; i++) {
      const y = 0.45 + i * 0.34;   // paso reducido con el alto, para que quepan los 9
      g.add(place(box(1.1, 0.3, 0.05, C.rackSlot, { edges: false, shadow: false }), 0, y, 0.69));
      g.add(place(box(0.05, 0.05, 0.02, C.led, { edges: false, shadow: false, mat: { emissive: C.led, emissiveIntensity: 0.8 } }), 0.42, y + 0.08, 0.72));
      g.add(place(box(0.5, 0.05, 0.02, C.mid, { edges: false, shadow: false }), -0.2, y - 0.03, 0.72));
    }
    return g;
  }


  // ---------- isotipo de Loialt ----------
  // Son DOS trazos superpuestos: el NAVY arriba-izquierda y el verde
  // abajo-derecha. En la marca la pieza superior es hueso, pero aquí va sobre
  // un contenedor blanco: en hueso desaparecía. Es la variante azul del logo. Se pintan con Path2D sobre un canvas y se usan como textura
  // en vez de extruirlos: así no hace falta cargar SVGLoader solo para esto.
  const RAYO = [
    { fill: '#021838', d: 'M535.07,560.62l-45.47,51.82c-4.37,4.98-8.83,9.01-16.2,9l-168.02-.18c-11.23-.01-20.83-8.08-25.06-16.58-5.23-10.51-4.24-23,3.44-31.92l66.28-77.1,74.83-86.1,114.61-132.71,49.72-57.34c4.85-5.59,13.21-6.31,19.49-3.72s10.71,8.76,10.71,16.5l-.04,90.18c0,10.1-2.16,19.7-6.55,28.5l-7.86,15.77-99.1,148.01-21.48,31.85c-.85,1.26-.44,3.31.17,4.38.54.96,1.82,1.76,3.55,1.76h44.63c2-.01,3.45,1.48,3.9,2.67.72,1.9.03,3.42-1.53,5.21Z' },
    { fill: '#78b85b', d: 'M471.54,805.23l6.57-66.86c1.36-13.83,6.41-27.24,14.59-38.67l114.51-160.08c1.77-2.47-1.68-5.12-3.77-5.12h-50.03c-1.58,0-2.91-1.12-3.45-1.91-.68-1-1.19-3.53-.03-4.84l56.2-63.57c3.2-3.62,9.29-4.83,14.12-4.83l152.29.21c17.74.02,30.62,16.06,30.39,32.84-.15,10.55-4.67,18.42-11.27,25.97l-35.83,40.94-86.17,98.95-174.67,200.79c-4.45,5.12-9.1,8.17-16.02,5.81-5.63-1.93-8.71-7.5-8.55-14.05l1.11-45.56Z' }
  ];
  const RAYO_BBOX = { x: 275, y: 213, w: 528, h: 654 };   // caja real dentro del viewBox 1080

  function texturaRayo(px = 1024) {
    const esc = px / RAYO_BBOX.h;
    const cv = document.createElement('canvas');
    cv.width = Math.round(RAYO_BBOX.w * esc); cv.height = px;
    const g = cv.getContext('2d');
    g.setTransform(esc, 0, 0, esc, -RAYO_BBOX.x * esc, -RAYO_BBOX.y * esc);
    RAYO.forEach(p => { g.fillStyle = p.fill; g.fill(new Path2D(p.d)); });
    const t = new THREE.CanvasTexture(cv);
    t.anisotropy = 8;
    // three 0.160 usa colorSpace; las versiones viejas, encoding
    if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function placaRayo(alto) {
    const w = alto * (RAYO_BBOX.w / RAYO_BBOX.h);
    const m = new THREE.MeshBasicMaterial({ map: texturaRayo(), transparent: true, depthWrite: false });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, alto), m);
    p.renderOrder = 2;
    return p;
  }

  function container() {
    // Contenedor con corte: eje largo en Z (7), ancho X (3), alto Y (3). Puertas en +z.
    const g = new THREE.Group();
    const L = 7, W = 3, H = 3, t = 0.08;
    // El forro lleva un `emissive` bajo además del blanco puro. Solo subir el
    // color de 0xf3f4f6 a 0xffffff da un 5%, que apenas se nota; lo que apagaba
    // al contenedor eran sus caras EN SOMBRA, y el emisivo las levanta sin
    // quemar las que ya reciben luz. Es el knob que lo hace leer blanco de
    // verdad contra el gris del gabinete.
    // Calibrado midiendo la cara iluminada (percentil 90): sin emisivo 183 ·
    // 0x2b2b2b 187 · 0x454545 193 · 0x5f5f5f 202. El gabinete se queda en 166,
    // así que 0x454545 abre la separación del 7% al 16% sin aplanar el sombreado
    // (0x5f5f5f ya empieza a comerse el relieve).
    const wall = (w, h, d, x, y, z) => g.add(place(box(w, h, d, C.bessBlanco,
      { edgeColor: 0x475569, edgeOpacity: 0.5, mat: { emissive: 0x454545 } }), x, y, z));
    // ZÓCALO NAVY (antes blanco, con `wall`). Da peso abajo y asienta la pieza
    // contra el suelo beige; es lo que hace que se lea apoyada y no flotando.
    // VA SALIENTE 0.06 (W+0.12, L+0.12), NO a ras. Cuando medía exactamente W×L
    // sus caras quedaban COPLANARES con las de las paredes, y como la pared es
    // blanca y el zócalo navy, esa coincidencia se veía como un parpadeo en las
    // orillas al girar (pelea de profundidad). Con el mismo blanco no se notaba;
    // el color la destapó. Saliente además es lo correcto: un contenedor real
    // apoya sobre un bastidor más ancho que el forro.
    g.add(place(box(W + 0.12, 0.25, L + 0.12, C.marcaNavy, { edgeColor: 0x475569, edgeOpacity: 0.5 }), 0, 0.125, 0));
    g.add(place(box(W - 0.2, 0.02, L - 0.2, C.floor, { edges: false, shadow: false }), 0, 0.26, 0)); // piso interior beige
    wall(t, H, L, -W / 2 + t / 2, H / 2, 0);                        // pared larga trasera (-x)
    wall(W, H, t, 0, H / 2, -L / 2 + t / 2);                        // extremo -z
    wall(W, H, t, 0, H / 2, L / 2 - t / 2);                         // extremo +z (puertas)
    wall(t, H, 2.2, W / 2 - t / 2, H / 2, L / 2 - 1.1);             // pared frontal, sólo tramo junto a puertas
    wall(W, t, 2.2, 0, H - t / 2, L / 2 - 1.1);                     // techo sobre ese tramo
    wall(0.7, t, L - 2.2, -W / 2 + 0.35, H - t / 2, -1.1);          // franja de techo junto a pared trasera
    // corrugado exterior
    for (let i = 0; i < 10; i++) g.add(place(box(0.08, H - 0.4, 0.03, C.gray, { edges: false, shadow: false }), -W / 2 + 0.25 + i * 0.28, H / 2, L / 2 + 0.03));
    for (let i = 0; i < 7; i++) g.add(place(box(0.03, H - 0.4, 0.08, C.gray, { edges: false, shadow: false }), W / 2 + 0.03, H / 2, L / 2 - 0.2 - i * 0.28));
    // barras de cierre de puertas
    [-1.1, -0.4, 0.4, 1.1].forEach(x => { const bar = cyl(0.035, 0.035, H - 0.5, C.marcaVerdeHondo, 8); bar.position.set(x, H / 2, L / 2 + 0.08); g.add(bar); });
    // postes de esquina
    // Postes SALIENTES 0.02 por el mismo motivo que el zócalo: centrados en
    // W/2-0.07 su cara exterior caía justo sobre la de la pared, y en navy esa
    // coplanaridad parpadeaba al girar. Ahora sobresalen y leen como cantoneras.
    [[-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(([sx, sz]) => g.add(place(box(0.14, H, 0.14, C.marcaNavy, { edges: false }), sx * (W / 2 - 0.05), H / 2, sz * (L / 2 - 0.05))));
    // FRANJA VERDE en el TESTERO DE LAS PUERTAS (+z), no en los costados largos.
    // Se intentó primero a lo largo del alero de los dos muros y quedó mal por
    // dos razones que solo se ven renderizando: (1) este contenedor va CORTADO
    // para enseñar los racks, así que la franja del muro trasero se veía desde
    // DENTRO y leía como una viga verde cruzando el hueco, no como pintura;
    // (2) del lado +x el corrugado la troceaba en un punteado sucio.
    // El testero es plano, entero y se ve en las tres vistas del giro.
    // Va CENTRADA en z = L/2+0.075 con 0.03 de fondo → ocupa 0.06 a 0.09.
    // El corrugado termina en L/2+0.045, así que quedan 0.015 de separación
    // limpia. El primer intento la puso en 0.04–0.06 y SE SOLAPABA con el
    // corrugado: otra pelea de profundidad, que es parte de lo que parpadeaba.
    // Las barras de cierre (cilindros, 0.045 a 0.115) la cruzan por delante:
    // se intersecan de verdad, no comparten plano, así que eso sí es estable.
    g.add(place(box(W - 0.3, 0.3, 0.03, C.marcaVerde, { edges: false, shadow: false }),
      0, H * 0.62, L / 2 + 0.075));
    // interior: 2 gabinetes blancos + 5 racks oscuros contra la pared trasera
    const zs = [0.6, -0.2];
    zs.forEach(z => { const c = box(0.75, 2.2, 0.75, C.white, { edgeColor: 0x475569, edgeOpacity: 0.5 }); c.position.set(-W / 2 + 0.55, 1.35, z); g.add(c);
      g.add(place(box(0.03, 1.7, 0.03, C.dark, { edges: false, shadow: false }), -W / 2 + 0.93, 1.35, z)); });
    for (let i = 0; i < 5; i++) {
      const r = box(0.7, 2.2, 0.55, C.rack, { edgeColor: 0x000000, edgeOpacity: 0.5 }); r.position.set(-W / 2 + 0.55, 1.35, -1.0 - i * 0.6); g.add(r);
      for (let k = 0; k < 6; k++) g.add(place(box(0.03, 0.18, 0.4, C.rackSlot, { edges: false, shadow: false }), -W / 2 + 0.92, 0.5 + k * 0.32, -1.0 - i * 0.6));
    }
    // ISOTIPO en LOS DOS costados largos, como en un contenedor real: la cámara
    // solo ve uno según la vista, así el logo está siempre presente.
    //  · -X es el muro entero (7 de largo).
    //  · +X solo existe junto a las puertas (z de 1.3 a 3.5): el resto lo abre
    //    el corte que enseña los racks, por eso ahí va centrado en ese tramo.
    // Separación de 6 cm y no 2: las láminas del corrugado sobresalen 3 cm, y a
    // menos distancia la placa queda DETRÁS de ellas y el isotipo se lee rayado.
    // rayoA vive en el muro trasero (-x), que es el ÚNICO sitio desde donde se
    // ve en la vista 3 (en las vistas 1 y 2 ese muro da la espalda a la cámara:
    // 0 px medidos).
    // VA EN EL EXTREMO +z DEL MURO, no en el -z. En la vista 3 el gabinete
    // convertidor se planta DELANTE del extremo -z y le muerde la punta a la
    // placa: medido como % del área sin obstáculos, z=-1.0 daba 90% y z=-2.0
    // solo 67%, y un logo cortado por otro objeto lee como error. En el extremo
    // opuesto el muro está despejado y la placa se ve entera (~99%), así que
    // tampoco hace falta subirla para esquivar nada: vuelve a y=1.6, centrada a
    // lo alto del muro (que mide 3).
    // CENTRADO Y TAMAÑO, calculados (no a ojo): se midió el centroide de la
    // parte VISIBLE del muro en la vista 3 y se despejó qué (z,y) cae ahí. Con
    // cámara ortográfica el mapa (z,y)→pantalla es AFÍN, así que tres muestras
    // lo determinan; barrer posiciones a fuerza bruta era inviable en GL por
    // software. Sale z=0.45, y el centro vertical queda en ~1.55.
    // ALTO 2.45 (antes 1.9, ×1.29): es el mayor que cabe sin pisar el zócalo
    // (que acaba en y=0.25) ni asomar por el techo (y=3) — ocupa 0.33 a 2.78.
    // Medido al 100% visible: en este tramo del muro no lo tapa nada.
    // La x sale a -0.08 y no -0.06 porque la cara del zócalo saliente está
    // justo en -0.06: a ras volverían a ser coplanares y parpadearían.
    const rayoA = placaRayo(2.45);
    rayoA.rotation.y = -Math.PI / 2;
    rayoA.position.set(-W / 2 - 0.08, 1.55, 0.45);
    g.add(rayoA);

    const rayoB = placaRayo(1.9);
    rayoB.rotation.y = Math.PI / 2;
    rayoB.position.set(W / 2 + 0.06, 1.6, L / 2 - 1.1);
    g.add(rayoB);

    // Se escala el GRUPO entero, no L/W/H: así el corrugado, los postes, la
    // franja verde y las dos placas del isotipo crecen en proporción sin tener
    // que reajustar ni una constante interna.
    g.scale.setScalar(BESS_ESCALA);
    return g;
  }

  function batteryModule() {
    const g = new THREE.Group();
    const b = box(2.4, 1.3, 1.5, C.navy, { edgeColor: 0x93c5fd, edgeOpacity: 0.5 }); b.position.y = 0.65; g.add(b);
    g.add(place(box(1.4, 0.02, 0.6, C.light, { edges: false, shadow: false }), 0.1, 1.31, 0.2));
    g.add(place(cyl(0.1, 0.1, 0.18, C.red, 12), -0.85, 1.39, -0.4));
    g.add(place(cyl(0.1, 0.1, 0.18, C.rack, 12), 0.85, 1.39, -0.4));
    return g;
  }
  function cells() {
    const g = new THREE.Group();
    [[0, 0], [0.85, 0.1], [0.15, 0.85], [1.0, 0.95]].forEach(([x, z], i) => {
      const body = cyl(0.38, 0.38, 1.5, C.light, 28); body.position.set(x, 0.75, z); edges(body, 0x475569, 0.2); g.add(body);
      g.add(place(cyl(0.39, 0.39, 0.14, C.dark, 28), x, 0.07, z));
      g.add(place(cyl(0.3, 0.3, 0.06, C.mid, 28), x, 1.53, z));
      g.add(place(cyl(0.12, 0.12, 0.08, C.mid, 16), x, 1.6, z));
      g.add(place(box(0.5, 0.9, 0.02, C.navy, { edges: false, shadow: false }), x, 0.8, z + 0.38));
    });
    return g;
  }

  // ---------- escena ----------
  function mount(el, options) {
    options = Object.assign({ autoRotate: false, background: 'checker', showGround: true }, options || {});
    el = el || document.body;
    const W = () => el.clientWidth || window.innerWidth, H = () => el.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W(), H());
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;   // r152+: outputEncoding se eliminó
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    if (options.background === 'checker' && options.showGround) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = '#e4e6ea'; ctx.fillRect(0, 0, 32, 32); ctx.fillRect(32, 32, 32, 32);
      const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(30, 30); tex.colorSpace = THREE.SRGBColorSpace;   // r152+: texture.encoding se eliminó
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
      scene.background = new THREE.Color(0xf2f3f5);
    } else if (typeof options.background === 'number') {
      scene.background = new THREE.Color(options.background);
      if (options.showGround) { const gr = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: 0.18 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr); }
    }

    // luces
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd6e0, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85); sun.position.set(-12, 24, 16);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 80 }); sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(14, 10, -10); scene.add(fill);

    // ----- objetos (mapa: +x = abajo-derecha en pantalla, -z = arriba-derecha) -----
    const world = new THREE.Group(); scene.add(world);
    world.add(place(solarArray(), -13.5, 0, -3.5));
    const tA = new THREE.Vector3(-3.4, 0, 6.2), tB = new THREE.Vector3(-6.6, 0, 3.4);
    world.add(place(tower(), tA.x, 0, tA.z, Math.atan2(tB.x - tA.x, tB.z - tA.z)));
    world.add(place(tower(), tB.x, 0, tB.z, Math.atan2(tB.x - tA.x, tB.z - tA.z)));
    world.add(wires(tA, tB, 6.5));
    world.add(place(factory(), 1.5, 0, 9.0));
    world.add(place(cabinet(), -1.6, 0, 1.8));
    world.add(place(cloud(), -5.2, 3.4, -6.4));
    world.add(place(laptop(), -4.6, 0, -4.6, 0.15));
    world.add(place(monitor(), -2.9, 0, -5.6));
    world.add(place(antenna(), -6.4, 0, -8.2));
    [-1.2, 0.6, 2.4].forEach((x, i) => world.add(place(serverRack(), x, 0, -9.6 - i * 0.2)));
    // POSICIÓN DERIVADA DE LA ESCALA, no fija. Las dos flechas dobles
    // «gabinete ↔ contenedor BESS» terminan en x = 3.0, y la cara -X del
    // contenedor está en `x - (3 * BESS_ESCALA) / 2`. Anclando el crecimiento a
    // esa cara (3.1), la punta de flecha cae en el mismo sitio para CUALQUIER
    // escala: el contenedor crece hacia afuera, nunca hacia el gabinete.
    world.add(place(container(), 3.1 + 1.5 * BESS_ESCALA, 0, -0.4));
    world.add(place(batteryModule(), 7.4, 0, -6.4));
    world.add(place(cells(), 9.6, 0, 1.2));

    // líneas de despiece (rack -> módulo -> celdas)
    const dl = new THREE.Group();
    dl.add(dashed(new THREE.Vector3(2.4, 0.05, -9.0), new THREE.Vector3(6.2, 1.3, -7.15)));
    dl.add(dashed(new THREE.Vector3(3.1, 0.05, -10.0), new THREE.Vector3(8.6, 1.3, -7.15)));
    dl.add(dashed(new THREE.Vector3(6.6, 0.05, -5.7), new THREE.Vector3(9.4, 1.55, 0.9)));
    dl.add(dashed(new THREE.Vector3(8.6, 0.05, -5.7), new THREE.Vector3(10.7, 1.55, 1.9)));
    world.add(dl);

    // ----- flechas -----
    const arrows = new THREE.Group(); world.add(arrows);
    const O = C.orange, B = C.blue;
    // energía
    arrows.add(arrow([[-8.6, -2.8], [-4.4, -2.8], [-4.4, 1.0], [-3.3, 1.0]], O));                // solar -> gabinete
    arrows.add(arrow([[-6.3, 1.4], [-3.3, 1.4]], O, { double: true }));                          // red <-> gabinete
    arrows.add(arrow([[-6.3, 2.2], [-3.3, 2.2]], O, { double: true }));
    arrows.add(arrow([[-2.3, 2.9], [-2.3, 6.6]], O));                                            // gabinete -> planta
    arrows.add(arrow([[0.1, 1.2], [1.4, 1.2], [1.4, 7.4], [-0.1, 7.4]], O));                     // gabinete -> planta (2)
    arrows.add(arrow([[0.1, 2.0], [3.0, 2.0]], O, { double: true }));                            // gabinete <-> contenedor BESS
    arrows.add(arrow([[0.1, 2.7], [3.0, 2.7]], O, { double: true }));
    // datos
    arrows.add(arrow([[-2.4, -3.6], [-2.4, 0.7]], B, { y: 3.6 }));                               // nube -> gabinete
    arrows.add(arrow([[-1.2, 0.7], [-1.2, -3.6]], B, { y: 3.6 }));                               // gabinete -> nube
    arrows.add(arrow([[0.8, -4.2], [0.8, 0.3], [0.1, 0.3]], B, { y: 3.6 }));                     // nube -> gabinete (lateral)
    arrows.add(arrow([[-2.2, -7.6], [-2.2, -8.8]], B, { y: 2.2, double: true }));               // nube <-> racks
    arrows.add(arrow([[-1.0, -7.6], [-1.0, -8.8]], B, { y: 2.2, double: true }));

    // ----- cámara isométrica (ortográfica) -----
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
    // CENTRO Y ENCUADRE, elegidos midiendo el GIRO COMPLETO, no las 3 vistas
    // finales. Los tramos suman 360° (36 + 252 + 72), así que la cámara pasa por
    // ángulos intermedios que las vistas finales no representan: ahí el contenido
    // llegaba al 97.1% del cuadro —a unos 8 px del borde— y rozar la orilla es lo
    // que se veía como un parpadeo "mientras cambia de fase".
    //   · target (0.5, 0.8, -0.5) → peor extremo del giro 0.971 (rozaba)
    //   · target (-0.5, 2.3, 0)   → 0.922, óptimo de una búsqueda en rejilla
    // Con ese centro, FRUSTUM 13.9 deja el peor extremo en ~0.90: 10% de aire en
    // el peor instante, a cambio de solo un 3% de tamaño.
    // Si se mueve algo de sitio o cambia BESS_ESCALA, revalidar con
    // herramientas/medir-dominancia.html (reporta `barrido` y `optimo`).
    const view = { theta: Math.PI / 4, phi: Math.PI / 2 - 0.56, zoom: 1, target: new THREE.Vector3(-0.5, 2.3, 0) };
    const home = JSON.parse(JSON.stringify({ theta: view.theta, phi: view.phi, zoom: 1 }));
    const FRUSTUM = 13.9;
    function resize() {
      const a = W() / H();
      camera.left = -FRUSTUM * a; camera.right = FRUSTUM * a; camera.top = FRUSTUM; camera.bottom = -FRUSTUM;
      camera.updateProjectionMatrix(); renderer.setSize(W(), H());
    }
    function updateCamera() {
      const r = 60;
      camera.position.set(
        view.target.x + r * Math.sin(view.phi) * Math.sin(view.theta),
        view.target.y + r * Math.cos(view.phi),
        view.target.z + r * Math.sin(view.phi) * Math.cos(view.theta));
      camera.lookAt(view.target); camera.zoom = view.zoom; camera.updateProjectionMatrix();
    }
    resize(); updateCamera();
    window.addEventListener('resize', resize);

    // ----- controles (arrastrar = rotar, rueda = zoom, doble clic = reiniciar) -----
    let drag = null, autoRotate = !!options.autoRotate;
    const dom = renderer.domElement;
    // Los controles propios del render (arrastrar, rueda, doble clic) van
    // APAGADOS por defecto. En la landing chocarían con el pager: el manejador
    // de `wheel` llama preventDefault(), así que se tragaría el gesto que pasa
    // de diapositiva, y `touch-action:none` bloquearía el scroll en móvil.
    // Aquí el giro lo manda el cambio de fase, no el usuario.
    if (options.interactivo) { dom.style.touchAction = 'none'; dom.style.cursor = 'grab'; }
    if (options.interactivo) dom.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing'; });
    if (options.interactivo) dom.addEventListener('pointermove', e => {
      if (!drag) return;
      view.theta -= (e.clientX - drag.x) * 0.006;
      view.phi = Math.min(Math.PI / 2 - 0.08, Math.max(0.2, view.phi + (e.clientY - drag.y) * 0.004));
      drag = { x: e.clientX, y: e.clientY }; updateCamera();
    });
    const endDrag = () => { drag = null; dom.style.cursor = 'grab'; };
    if (options.interactivo) dom.addEventListener('pointerup', endDrag); dom.addEventListener('pointercancel', endDrag);
    if (options.interactivo) dom.addEventListener('wheel', e => { e.preventDefault(); view.zoom = Math.min(4, Math.max(0.5, view.zoom * (e.deltaY > 0 ? 0.92 : 1.08))); updateCamera(); }, { passive: false });
    function resetView() { Object.assign(view, home); updateCamera(); }
    if (options.interactivo) dom.addEventListener('dblclick', resetView);

    // ----- animación -----
    let raf, t0 = performance.now();
    // ---- giro por cambio de fase ----
    // Se gira el GRUPO `world`, no la cámara: las luces y el sol quedan fuera
    // de él, así que al girar cambia el sombreado — que es lo que hace que se
    // lea como un objeto girando sobre su eje y no como un plano deslizándose.
    // Se mueve la CÁMARA (azimut + elevación), no el grupo `world`. Es lo que
    // corresponde: el usuario eligió estas vistas arrastrando, y arrastrar mueve
    // la cámara. Girar el objeto daría un sombreado distinto al que vio, porque
    // el sol vive en la escena y no en el grupo.
    const RAD = Math.PI / 180;
    let vT = 0, vDur = 0, vProp = 0.625;   // fracción del tiempo ACELERANDO
    let azA = 0, azB = 0, elA = 0, elB = 0;
    // Easing ASIMÉTRICO: acelera durante `vProp` del tiempo y frena el resto.
    // Se construye con aceleración constante en cada tramo y la velocidad
    // EMPATADA en el empalme; si no, se sentiría un tirón justo al cambiar de
    // acelerar a frenar. De ½·a·p² + ½·(a·p)·(1-p) = 1 sale a = 2/p.
    // Arranca y termina en reposo, y es monótona (nunca se devuelve).
    function easeAsim(t){
      const p = vProp, a = 2 / p, vp = a * p;
      if (t <= p) return 0.5 * a * t * t;
      const d = t - p;
      return 0.5 * a * p * p + vp * d - (vp / (2 * (1 - p))) * d * d;
    }
    function irAVista(az, el, durSeg, propAcel){
      if (propAcel != null) vProp = Math.min(0.95, Math.max(0.05, propAcel));
      azA = view.theta; elA = view.phi;
      // SENTIDO ÚNICO: el delta se normaliza a [0, 360°), así que la cámara
      // siempre avanza y nunca se devuelve. Recorrer las tres vistas suma una
      // vuelta completa (36° + 252° + 72° = 360°).
      // Se probó el camino CORTO (delta a ±180°, que daría 36°, -108° y 72°) y
      // el usuario lo descartó: no le gusta que el giro se regrese, aunque los
      // tramos queden más parejos.
      const d = ((az * RAD - azA) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      azB = azA + d;
      elB = el * RAD;
      vDur = Math.max(0.001, durSeg || 1);
      vT = 0;
      return vDur;
    }
    function ponerVista(az, el){           // sin animación: para la vista inicial
      view.theta = az * RAD; view.phi = el * RAD; vT = vDur = 0; updateCamera();
    }
    const pulses = []; arrows.traverse(o => { if (o.userData.pulse) pulses.push(o.userData.pulse); });
    let tPrev = performance.now();
    function loop(now) {
      raf = requestAnimationFrame(loop);
      const t = (now - t0) / 1000;
      const dt = Math.max(0, (now - tPrev) / 1000); tPrev = now;
      pulses.forEach((m, i) => { m.emissiveIntensity = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.7)); });
      if (autoRotate && !drag) { view.theta += 0.0025; updateCamera(); }
      if (vT < vDur){
        // Avanza por TIEMPO REAL, no por cuadro: con `+= 1/60` iría al doble de
        // velocidad en una pantalla de 120 Hz y se eternizaría en un equipo
        // lento. Se capa el dt para que una pestaña que vuelve del fondo no dé
        // un salto brusco.
        vT = Math.min(vDur, vT + Math.min(0.05, dt));
        const u = vT / vDur;
        const e = easeAsim(u);   // asimétrico: acelera más tiempo del que frena
        view.theta = azA + (azB - azA) * e;      // azimut y elevación se mueven
        view.phi   = elA + (elB - elA) * e;      // juntas: un solo gesto
        updateCamera();
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(loop);

    return {
      scene, camera, renderer, world, resetView, irAVista, ponerVista, view,
      setAutoRotate: v => { autoRotate = !!v; },
      dispose: () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); renderer.dispose(); dom.remove(); },
    };
  }



export { mount as initSistema3D };
