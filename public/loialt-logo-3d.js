// Three.js + addons vía esm.sh (URLs completas: funcionan al abrir el archivo
// directamente y también bajo un bundler como Vite, sin necesidad de importmap).
import * as THREE from 'https://esm.sh/three@0.160.0';
import { SVGLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

/* ---- SVG del logo (sólo las dos rutas, con sus colores exactos) ---- */
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
  <path fill="#fbfbfb" d="M535.07,560.62l-45.47,51.82c-4.37,4.98-8.83,9.01-16.2,9l-168.02-.18c-11.23-.01-20.83-8.08-25.06-16.58-5.23-10.51-4.24-23,3.44-31.92l66.28-77.1,74.83-86.1,114.61-132.71,49.72-57.34c4.85-5.59,13.21-6.31,19.49-3.72s10.71,8.76,10.71,16.5l-.04,90.18c0,10.1-2.16,19.7-6.55,28.5l-7.86,15.77-99.1,148.01-21.48,31.85c-.85,1.26-.44,3.31.17,4.38.54.96,1.82,1.76,3.55,1.76h44.63c2-.01,3.45,1.48,3.9,2.67.72,1.9.03,3.42-1.53,5.21Z"/>
  <path fill="#78b85b" d="M471.54,805.23l6.57-66.86c1.36-13.83,6.41-27.24,14.59-38.67l114.51-160.08c1.77-2.47-1.68-5.12-3.77-5.12h-50.03c-1.58,0-2.91-1.12-3.45-1.91-.68-1-1.19-3.53-.03-4.84l56.2-63.57c3.2-3.62,9.29-4.83,14.12-4.83l152.29.21c17.74.02,30.62,16.06,30.39,32.84-.15,10.55-4.67,18.42-11.27,25.97l-35.83,40.94-86.17,98.95-174.67,200.79c-4.45,5.12-9.1,8.17-16.02,5.81-5.63-1.93-8.71-7.5-8.55-14.05l1.11-45.56Z"/>
</svg>`;

/**
 * Monta el logo 3D dentro de un contenedor.
 * @param {Object}  opts
 * @param {HTMLElement} opts.container         elemento donde se inserta el canvas (se dimensiona a él)
 * @param {boolean} [opts.interactive=true]    true = OrbitControls (arrastrar/zoom); false = solo gira (decorativo)
 * @param {boolean} [opts.autoRotate=true]     rotación automática
 * @param {number}  [opts.autoRotateSpeed=1.6] velocidad de rotación
 * @returns {{renderer,scene,camera,pivot,dispose}} handles para animarlo/desmontarlo después
 */
export function initLogo3D({ container, interactive = true, autoRotate = true, autoRotateSpeed = 1.6 } = {}){
  if(!container){ throw new Error('initLogo3D: falta { container }'); }

  let renderer, scene, camera, controls, pivot, ro, raf;
  const clock = new THREE.Clock();

  const w = () => container.clientWidth  || 1;
  const h = () => container.clientHeight || 1;

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  // entorno para reflejos (studio)
  // blur alto del entorno: reflejos brillantes pero SUAVES (sin que los paneles
  // rectangulares del estudio se marquen como cuadrícula en las caras pulidas)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.35).texture;

  camera = new THREE.PerspectiveCamera(32, w()/h(), 1, 8000);

  // ---- luces ----
  // Ambiente de estudio (scene.environment) = reflejos envolventes; se conserva.
  // Hemisférica BAJADA .55→.30 (2026-08-31, a pedido del usuario): es relleno
  // sin dirección, así que levantaba las zonas en sombra y aplanaba el
  // contraste. Con menos relleno las sombras caen más y el foco verde rasante
  // resalta — un destello se percibe por CONTRASTE, no por brillo absoluto.
  scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x03122a, 0.30));

  pivot = new THREE.Group();
  scene.add(pivot);

  buildLogo(camera, pivot, controls);

  // ---- 3 focos (fijos en la escena: al girar el rayo, los brillos recorren sus caras) ----
  // Blanco de frente a la cara + cenital + verde rasante desde abajo.
  const R = camera.userData.dist || 1200;
  function foco(color, intensity, x, y, z){
    const s = new THREE.SpotLight(color, intensity);
    s.position.set(x, y, z);
    s.angle = Math.PI/4.5; s.penumbra = 0.65; s.decay = 0;
    s.target.position.set(0,0,0);
    scene.add(s); scene.add(s.target);
    return s;
  }
  foco(0xffffff, 0.8, 0, 0, R*0.9);   // frente, a la cara
  // Los DOS focos ÁMBAR (#ffd08a, 0.8 c/u, azimut +45° y −120° arriba de la
  // cabeza) se QUITARON el 2026-08-31 a pedido del usuario: el ámbar es casi el
  // opuesto cromático del verde de marca, así que desaturaba el foco verde
  // rasante justo donde se cruzaban. Además el ámbar aquí no era color de
  // identidad del rayo (en el sitio es el color de "pico/tensión" de la
  // gráfica). Sin ellos el rayo queda en blanco + verde, más limpio de marca.
  // Foco CENITAL (guion "rayo guía"): key light blanco desde arriba — el
  // "foco de escenario" que baña la cara superior y recorre los biseles al girar.
  foco(0xffffff, 1.3, 0, R*1.1, R*0.35);
  // Foco VERDE RASANTE DESDE ABAJO (2026-08-31, pedido del usuario): mira al
  // rayo de abajo hacia arriba y en diagonal (azimut −35°, delante y a la
  // izquierda). Al girar el rayo (spin del hero / tumble de los viajes del
  // guía) prende y apaga los biseles INFERIORES —que ningún otro foco toca,
  // los otros 4 vienen de frente o de arriba— y eso produce los destellos
  // verdes que acompañan el viaje. Vive en el rig compartido de initLogo3D ⇒
  // aplica a TODAS las vistas del rayo: hero, guía y el compuesto del preloader.
  const VERDE = 0x82bd67;                 // --energy (verde de marca)
  // Posición en ESFÉRICAS para que los dos ángulos sean explícitos y se puedan
  // tocar por separado (antes iban mezclados en x/y/z sueltos y no se veía qué
  // se estaba ajustando):
  //   azV   = giro horizontal (−35° ⇒ a la izquierda del eje de cámara)
  //   elevV = cuánto está POR DEBAJO (0° = a la altura de la cara · 90° = justo
  //           abajo del rayo). El valor original equivalía a 53.7°, o sea casi
  //           debajo: le llegaba de canto a la CARA (61° respecto de su normal,
  //           ~48% de incidencia) y de frente a los biseles inferiores (~81%)
  //           ⇒ por eso el destello salía SOLO en el contorno. Bajado a 30°
  //           la cara sube a ~71% de incidencia y el destello también entra en
  //           ella, sin perder la dirección "de abajo hacia arriba".
  const azV = -35 * Math.PI/180, elevV = 30 * Math.PI/180, distV = R*0.93;
  const focoVerde = foco(VERDE, 2.8,
    distV*Math.cos(elevV)*Math.sin(azV),
    -distV*Math.sin(elevV),
    distV*Math.cos(elevV)*Math.cos(azV));
  // Cono más CERRADO y con borde más definido que los otros cuatro (que usan
  // angle PI/4.5 + penumbra .65, pensados para baño suave): un haz más duro
  // concentra el especular y es lo que convierte el brillo en DESTELLO cuando
  // la cara pasa por delante. Los knobs para dosificarlo son estos tres.
  focoVerde.angle = Math.PI/5.5;
  focoVerde.penumbra = 0.45;

  if(interactive){
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 2200;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = autoRotateSpeed;
    controls.target.set(0,0,0);
    controls.update();
  }

  // Re-dimensiona con el contenedor (no con la ventana)
  onResize();
  ro = new ResizeObserver(onResize);
  ro.observe(container);

  function onResize(){
    camera.aspect = w()/h();
    camera.updateProjectionMatrix();
    renderer.setSize(w(), h());
  }

  function animate(){
    raf = requestAnimationFrame(animate);
    if(controls){
      controls.update();
    } else if(autoRotate){
      // decorativo: gira el pivot manualmente (no captura puntero ni scroll)
      pivot.rotation.y += autoRotateSpeed * 0.0045 * (clock.getDelta() * 60);
    }
    renderer.render(scene, camera);
  }
  animate();

  function dispose(){
    if(raf) cancelAnimationFrame(raf);
    if(ro) ro.disconnect();
    if(controls) controls.dispose();
    renderer.dispose();
    if(renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  }

  return { renderer, scene, camera, pivot, dispose };
}

function buildLogo(camera, pivot, controls){
  const loader = new SVGLoader();
  const data = loader.parse(SVG);

  const logo = new THREE.Group();
  const extrude = { depth:78, bevelEnabled:true, bevelThickness:12, bevelSize:7, bevelSegments:4, curveSegments:24 };

  data.paths.forEach((path)=>{
    const color = path.color; // color exacto del fill del SVG
    const mat = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.4,     // textura metálica (nivel pedido: 0.4)
      roughness: 0.25,    // más pulido: reflejos definidos ("comandante")
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide
    });
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape)=>{
      const geo = new THREE.ExtrudeGeometry(shape, extrude);
      const mesh = new THREE.Mesh(geo, mat);
      logo.add(mesh);
    });
  });

  // SVG usa Y hacia abajo -> volteamos en Y (DoubleSide evita problemas de winding)
  logo.scale.y = -1;
  pivot.add(logo);

  // centrar en el origen
  pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(logo);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  logo.position.sub(center);

  // encuadre de cámara
  const maxDim = Math.max(size.x, size.y, size.z);
  const dist = (maxDim/2) / Math.tan((camera.fov*Math.PI/180)/2) * 1.55;
  camera.position.set(dist*0.16, dist*0.10, dist);
  camera.lookAt(0,0,0);
  if(controls){ controls.target.set(0,0,0); controls.update(); }
  camera.userData.dist = dist;
}
