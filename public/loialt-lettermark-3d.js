// Wordmark "LOIALT ENERGY" (solo letras, sin rayo) en 3D — estático. Three.js vía esm.sh.
// Exporta initLettermark3D({ container, ink }) para montarlo en cualquier contenedor.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { SVGLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/SVGLoader.js';
import { RoomEnvironment } from 'https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
<path fill="#ffffff" d="M439.78,435.09h18.05v86.27h53.99v16.43h-72.04v-102.7Z"/>
<path fill="#ffffff" d="M520.91,486.74v-.29c0-28.9,22.3-53.11,53.84-53.11s53.55,23.91,53.55,52.82v.29c0,28.9-22.3,53.11-53.84,53.11s-53.55-23.91-53.55-52.82ZM609.38,486.74v-.29c0-19.95-14.52-36.53-34.92-36.53s-34.62,16.29-34.62,36.24v.29c0,19.95,14.52,36.53,34.92,36.53s34.62-16.29,34.62-36.24Z"/>
<path fill="#ffffff" d="M651.93,435.09h18.05v102.7h-18.05v-102.7Z"/>
<path fill="#ffffff" d="M734.52,434.36h16.73l45.19,103.43h-19.07l-10.42-24.79h-48.56l-10.56,24.79h-18.49l45.19-103.43ZM760.34,497.01l-17.75-41.08-17.61,41.08h35.36Z"/>
<path fill="#ffffff" d="M814.77,435.09h18.05v86.27h53.99v16.43h-72.04v-102.7Z"/>
<path fill="#ffffff" d="M916.88,451.82h-32.57v-16.73h83.33v16.73h-32.57v85.97h-18.19v-85.97Z"/>
<path fill="#ffffff" d="M441.23,569.63h31.19v1.28h-29.79v20.28h27.04v1.28h-27.04v20.54h30.11v1.28h-31.51v-44.65Z"/>
<path fill="#ffffff" d="M535.7,569.63h1.21l33.93,42.35v-42.35h1.34v44.65h-1.21l-33.93-42.35v42.35h-1.34v-44.65Z"/>
<path fill="#ffffff" d="M637.76,569.63h31.19v1.28h-29.79v20.28h27.04v1.28h-27.04v20.54h30.11v1.28h-31.51v-44.65Z"/>
<path fill="#ffffff" d="M732.23,569.63h18.24c5.8,0,10.08,1.47,12.82,4.21,2.04,2.04,3.19,4.85,3.19,8.29v.13c0,7.53-6,11.99-14.61,12.5l14.86,19.52h-1.72l-14.8-19.45h-16.58v19.45h-1.4v-44.65ZM749.77,593.55c10.33,0,15.31-4.91,15.31-11.23v-.13c0-7.08-5.48-11.29-14.73-11.29h-16.71v22.64h16.14Z"/>
<path fill="#ffffff" d="M827.78,592.08v-.13c0-11.93,8.48-23.09,22.07-23.09,6.82,0,11.03,2.04,15.5,5.74l-.89,1.08c-4.15-3.38-8.29-5.55-14.67-5.55-12.57,0-20.6,10.71-20.6,21.75v.13c0,11.61,7.65,21.75,20.67,21.75,6.63,0,12.12-2.93,15.88-6.12v-14.35h-16.46v-1.4h17.86v16.26c-4.21,3.83-10.14,6.89-17.35,6.89-13.97,0-22-10.52-22-22.96Z"/>
<path fill="#ffffff" d="M943.49,595.59l-18.88-25.96h1.66l17.99,24.75,17.79-24.75h1.66l-18.82,25.96v18.69h-1.4v-18.69Z"/>
</svg>`;

export function initLettermark3D({ container, ink = '#021838' } = {}){
  if(!container){ throw new Error('initLettermark3D: falta { container }'); }
  const w = () => container.clientWidth  || 1;
  const h = () => container.clientHeight || 1;

  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, w()/h(), 1, 20000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4d0de, 0.6));
  const key  = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(0.4, 0.95, 0.85); scene.add(key);
  const fill = new THREE.DirectionalLight(0xdbeeff, 0.6);  fill.position.set(-0.9, 0.15, 0.5); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xbfe0ff, 0.85); rim.position.set(-0.35, 0.55, -1.0); scene.add(rim);

  const pivot = new THREE.Group(); scene.add(pivot);
  const medida = buildLogo(pivot, ink);   // tamaño del modelo, para reencuadrar

  // ENCUADRE, recalculado en CADA cambio de tamaño (2026-09-07). Antes se
  // calculaba una sola vez al construir el logo y `onResize` solo actualizaba
  // `camera.aspect`, sin tocar la distancia. Como el contenedor cambia de
  // tamaño DESPUÉS de montarse —el hero asienta, cargan las fuentes, termina el
  // preloader—, el encuadre quedaba fijado con un aspecto que ya no era el
  // real y el wordmark salía recortado por los cuatro lados.
  const ALZA = 0.06;   // alzado de la cámara: da el leve ángulo desde arriba
  function encuadrar(){
    const a = w() / h();
    camera.aspect = a;
    const tanV = Math.tan(camera.fov * Math.PI / 360);
    // OJO: NO hay que compensar el alzado de la cámara aquí. Se intentó
    // (`tanV - ALZA`) razonando que el borde inferior queda a mayor ángulo, y es
    // falso: la cámara hace lookAt(0,0,0), así que al alzarla el frustum GIRA
    // con ella y el modelo sigue centrado en cuadro. Ese término metía un 29%
    // de distancia de más y encogía el wordmark del preloader casi un tercio.
    const fitH = (medida.y / 2) / tanV;
    const fitW = (medida.x / 2) / (tanV * a);
    // Margen del encuadre. Historia, porque tiene un punto óptimo estrecho:
    //   1.06 = como venía, A RAS — cualquier cambio de aspecto cortaba letras.
    //   1.20 = lo dejó seguro pero el wordmark del PRELOADER (que es este render
    //          3D, no el SVG del hero) se veía un 12% más chico.
    //   1.10 = aire suficiente para no recortar y ~96% del tamaño original.
    const dist = Math.max(fitH, fitW) * 1.1;
    camera.position.set(0, dist * ALZA, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  encuadrar();

  function render(){ renderer.render(scene, camera); }
  function onResize(){ encuadrar(); renderer.setSize(w(), h()); render(); }
  const ro = new ResizeObserver(onResize); ro.observe(container);
  render();

  function dispose(){ ro.disconnect(); renderer.dispose(); if(renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); }
  return { renderer, scene, camera, pivot, dispose };
}

function buildLogo(pivot, ink){
  const data = new SVGLoader().parse(SVG);
  const logo = new THREE.Group();
  const extrude = { depth:24, bevelEnabled:true, bevelThickness:3.5, bevelSize:2, bevelSegments:3, curveSegments:18 };
  data.paths.forEach((path)=>{
    const mat = new THREE.MeshPhysicalMaterial({ color:ink, metalness:0.3, roughness:0.32, clearcoat:0.5, clearcoatRoughness:0.32, envMapIntensity:1.1, side:THREE.DoubleSide });
    SVGLoader.createShapes(path).forEach((shape)=>{ logo.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, extrude), mat)); });
  });
  logo.scale.y = -1; // SVG y-abajo -> three y-arriba
  pivot.add(logo);
  pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(logo);
  logo.position.sub(box.getCenter(new THREE.Vector3()));
  return box.getSize(new THREE.Vector3());   // el encuadre lo hace initLettermark3D
}
