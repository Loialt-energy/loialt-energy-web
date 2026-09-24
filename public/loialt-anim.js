// ============================================================
// LOIALT ANIM — módulo de animación y posicionamiento de los renders 3D
// Convención única (no negociable):
//  - Progreso/targets SIEMPRE con geometría viva (getBoundingClientRect
//    por frame); nunca scrollY/offsetTop.
//  - El posicionamiento vive AQUÍ, nunca en el boot de la página.
//  - Canvas 3D: NUNCA redimensionar por frame (queda en blanco). Resolución
//    base fija + transform:scale; re-baseline solo en reposo.
//
// RAYO GUÍA (guion) — DOS MODOS para máxima fluidez:
//  - PEGADO: el contenedor se monta DENTRO de la losa (position:absolute)
//    → viaja nativo con el scroll, cero seguimiento por frame, cero jitter.
//  - VOLANDO: portal a <body> (fixed) + translate3d SOLO durante las
//    coreografías: entrada a Críticos y viajes entre stops (caída en dos
//    tiempos: mueve manteniendo su plano → micro-pausa → ajusta ángulos).
// Presencias del guion: Críticos (entrada+dock sticky) · Gráfica (espera
// angulada) · Servicio (espera plana) · [Métricas y FAQ en pasos 5-6].
// El rayo del HERO es otra instancia y nunca sale del hero (intro intacta).
// ============================================================

export const VALUES = {
  // mode:'layout' = el render queda en su sitio del layout (página tal cual hoy)
  // mode:'fixed'  = centro en x(vw)/y(vh); w/h (vmin) se capturan al fijar
  heroLogo:   { mode:'layout', visible:true, x:30, y:52, scale:1, rx:0, ry:0, rz:0, z:12, opacity:1, spin:0.16 },
  lettermark: { mode:'layout', visible:true, x:50, y:50, scale:1, rx:0, ry:0, rz:0, z:12, opacity:1, spin:0 },
};

// INTRO — pose inicial de la separación preloader→hero (los dos renders del
// hero componen el logo oficial sobre el preloader y vuelan a su sitio).
// x/y en % del viewport = centro; scale relativo a su tamaño final en el hero.
// null = se calcula solo a partir del rect del hueco del preloader (.pl-wordmark).
export const INTRO = {
  duration: 0.6,          // segundos de vuelo
  heroLogo:   { x: null, y: null, scale: null },
  lettermark: { x: null, y: null, scale: null },
};

// GUIDE — knobs del rayo guía.
// ENTRADA A CRÍTICOS: losa asentada +delay → la luz entra desde fuera por la
// esquina sup-izq (con arco) y el rayo se materializa al llegar a la batería
// (reveal:1 = solo viaja la luz). Dock → LOIALT_BATTERY_ON. STICKY: acoplado
// se queda (pegado a la batería); re-arma al volver a Nosotros.
// VIAJES ENTRE STOPS: la losa destino asienta +tripDelay → 1er tiempo "travel"
// (cae manteniendo su plano) → micro-pausa → 2º tiempo "adjust" (se ajusta al
// nuevo plano). Reversa espejo.
export const GUIDE = {
  delay: 0.1,             // s tras asentarse Críticos antes de arrancar la entrada
  enter: 0.9,             // s totales de la entrada (anuncio + dock)
  scaleIn: 1.5,           // escala inicial de la entrada (× el frame del hero)
  fromX: -10, fromY: -10, // origen FUERA de la página (esquina sup-izq)
  reveal: 1,              // fracción del viaje en que el rayo se materializa (1 = solo luz)
  arc: 6,                 // comba del trayecto de entrada (vw)
  flip: 0,                // giro en Y (°) durante la entrada (0 = acopla de frente)
  haloMax: 0.56,          // intensidad del halo que ACOMPAÑA la entrada a Críticos
  fit: 1.6,               // lado del canvas = hueco × fit (margen de cámara)
  dx: 0, dy: 0,           // ajuste fino del acople (% del hueco)
  z: 40,                  // z-index del guía en Críticos (delante del contenido)
  // z-index DURANTE LOS VIAJES entre stops (2026-08-31, pedido del usuario).
  // Antes el vuelo heredaba el z del stop DESTINO (−1) ⇒ el rayo viajaba por
  // DETRÁS del contenido y se escondía tras textos, imágenes y la gráfica.
  // En vuelo va portaleado a <body> con position:fixed, así que compite con
  // los overlays fijos: nav y quicknav (9000), viñeta (9997) y grano (9998)
  // ⇒ 9999 lo deja por encima de absolutamente todo. Al aterrizar, mountInStop
  // le devuelve el z del stop (normalmente −1, detrás del contenido).
  zFly: 9999,
  // z del vuelo cuando el tramo toca la Gráfica o Servicio: ahí el render vive
  // DETRÁS del contenido y el usuario quiere que el viaje lo acompañe. -1 lo
  // deja por encima de los dos lienzos de flow-bg (-2 y -1, y el rayo se
  // portalea a <body> DESPUÉS de ellos, así que gana el desempate por orden de
  // DOM) y por debajo del contenido de las secciones.
  zFlyDetras: -1,
  tripDelay: 0,           // despega EN CUANTO empieza el gesto de scroll
  anticip: 0.15,          // s del ANTICIPO: se echa ligeramente hacia atrás antes de lanzarse
  // Viaje Métricas↔FAQ: UN solo trayecto directo, con poco arco, girando una
  // vuelta completa (360° en Y ⇒ aterriza con la misma vista), compactándose
  // a media ruta y aterrizando junto con la losa.
  travel: 1.2,            // s del viaje
  // Gráfica↔Servicio va MÁS CORTO (0.6 × 1.2 = 0.72 s). Ese tramo lo dispara el
  // AUTO-AVANCE de la gráfica, que mueve la losa en 0.9 s: con el viaje normal
  // el rayo aterrizaba 0.45 s DESPUÉS de que todo lo demás se había detenido.
  // 0.72 + 0.15 de anticipo = 0.87 s ≈ los 0.9 s de la losa.
  travelPeakSvc: 0.6,
  tripArc: 4,             // arco leve (vw de comba; espejo según dirección)
  tumble: 1,              // vueltas completas (360°) en Y durante el viaje
  shrink: 0.5,            // se COMPACTA a media ruta (viaja ligero, aterriza con masa)
  // (Rebase/overshoot al aterrizar — probado 2026-08-25, DESCARTADO: el usuario lo
  // sintió trabado. En su lugar, aterrizaje sin rebase con easeOutQuint: la
  // velocidad baja gradualmente hasta parar, sin pasarse y corregir. Ver tripFrame.)
  maxRes: 640,              // tope de RESOLUCIÓN del canvas del guía (px); tamaños mayores
                            // se logran con transform:scale (GPU) — evita render 4K a 60fps
  mStopRes: 384,            // igual, pero SOLO para las paradas de MÓVIL. No toca el acople
                            // de Críticos, que conserva `maxRes`: ahí el rayo protagoniza.
};

// STOPS — poses de ESPERA del guía por diapositiva.
// x/y en % de la losa (pegado: viaja nativo con ella) · s = escala × el frame
// del hero · z:-1 = DETRÁS del contenido (el glass lo refracta).
// Losas donde el render 3D vive DETRÁS del contenido: los viajes que las tocan
// vuelan al fondo en vez de por encima de todo.
const DETRAS = { peak: true, servicio: true };

// UNIFICACIÓN DEL TAMAÑO (2026-09-03). Las cuatro últimas losas mostraban el
// rayo a tres tamaños distintos y se leía como si apareciera al azar. La causa:
// `s` se multiplica por DOS bases diferentes según el stop —
//     ref:'section'  ->  alto de la sección / 3   (~271 px)
//     sin ref        ->  heroFrameW()             (~500 px)
// así que Métricas y FAQ, ambas con s:3, medían 1500 y 813 px respectivamente,
// contra los 600 de Tecnología y Productos. Se quitó el `ref` de FAQ y las
// cuatro quedaron en s:1.2 (~600 px), op 0.8 y dim 1. La alternancia
// izquierda-derecha SÍ se conserva: es ritmo, no desorden.
export const STOPS = {
  // (Gráfica y Servicio se probaron y se DESCARTARON — no aportaban.)
  // Paso 3 · SOLUCIÓN (agregado 2026-08-31): PRIMERA espera del viaje. El guía
  // se despega del dock de Críticos y reaparece aquí, en el hueco que el
  // rediseño "ficha técnica" (2026-08-26) dejó RESERVADO para esto:
  // .sol-render-spot, columna derecha, debajo de la ficha 03.
  // Geometría MEDIDA (no estimada — lección del bug de tamaño de Tecnología):
  // el área libre de esa columna va de abajo de la ficha 03 a la quicknav, y
  // resulta ~588×299 px @1440×900 · ~706×349 @1920×1080 · ~962×507 @2560×1440,
  // con el centro SIEMPRE en ~73% / ~71.5% de la losa (proporción estable).
  // s:0.5 × heroFrameW ⇒ ~250 / 295 / 402 px: entra con margen en los tres
  // tamaños sin acercarse al borde ni a la ficha 03. Mismo tratamiento visual
  // que Tecnología (la otra losa de DÍA): atenuado y detrás del contenido.
  // AFINADO EN #tune POR EL USUARIO (2026-08-31): más a la derecha y abajo,
  // 2.4× más grande (s .5→1.2) y a plena presencia (op/dim a 1, sin atenuar) —
  // aquí el guía SÍ protagoniza, al revés que en Tecnología/Métricas/FAQ donde
  // acompaña de fondo. Con s:1.2 mide ~600 px @1440 y desborda a propósito el
  // hueco libre medido (299 px): `#what` tiene overflow:hidden, así que la
  // parte de abajo se recorta contra el borde de la losa (sangrado buscado).
  what:    { x: 76, y: 74.5, s: 1.2, rx: 0, ry: 0, op: 1, dim: 1, halo: 0, breathe: 1, z: -1 },
  // Paso 3½ · GRÁFICA (2026-08-31, PARTE 1 del viaje pedido por el usuario):
  // viniendo de Solución el guía se COMPACTA (600 px en Solución → 250 px aquí)
  // y aterriza ABAJO de la losa, apenas a la derecha del centro. Posición
  // afinada por el usuario en #tune. z:-1 lo mete DETRÁS de .peak-inner, que
  // es burbuja glass real (backdrop-filter blur(22px)+distorsión, medido) ⇒ el
  // vidrio lo refracta y queda como resplandor, no como objeto encima.
  // GIRO: vuelta COMPLETA, igual que todos los tramos (2026-09-01). Antes daba
  // media aquí y media al salir a Servicio; se quitó porque dejaba el rayo
  // volteado de Tecnología en adelante (ver tripFrame → legTumble).
  // Esta losa AUTO-AVANZA sola a Servicio (PEAK_AUTO_ADVANCE en initPeak):
  // de ahí sale la PARTE 2 del viaje, que se implementa aparte.
  peak:    { x: 50.5, y: 55, s: 3.45, rx: 0, ry: 0, op: 0.75, dim: 1, halo: 0, breathe: 1, z: -1 },   // 2026-09-01: el usuario lo subió al CENTRO de la losa y lo agrandó (0.5→1.45). z:-1 lo deja DETRÁS del contenido: la burbuja .peak-inner es vidrio real (backdrop-filter), así que lo refracta y queda como resplandor tras la gráfica.
  // Paso 3¾ · SERVICIO (2026-08-31, PARTE 2 del viaje): el tramo Gráfica→aquí
  // es un vuelo CONTINUO — se desplaza, escala y gira desde el primer frame,
  // con vuelta COMPLETA propia (2026-09-01; antes completaba la media pendiente
  // de la Gráfica, ver tripFrame → legTumble).
  // HISTORIA (para no volver a intentarlo sin querer): se probó una fase
  // ANCLADA ('hold') en la que el guía conservaba su posición de pantalla
  // durante el cambio de losa y solo se movía al aterrizar. Fue un pedido
  // explícito del usuario, pero al verlo lo DESCARTÓ: se leía "en dos partes".
  // El guion vigente es un solo movimiento continuo desde que arranca el viaje.
  // AFINADO EN #tune POR EL USUARIO: esquina inferior-derecha y **z:6 = DELANTE
  // del contenido** — es el único stop del viaje con z positivo. Es a propósito:
  // el lado derecho de esta losa lo ocupa una FOTO OPACA (.svc-panel-media,
  // medida 489×341 px centrada en x:75% y:67%); con el z:-1 del resto de stops
  // el guía quedaba enterrado tras ella. Con z:6 se monta encima y sí se ve.
  // 2026-09-01: el usuario lo bajó y achicó — y 85.5→88.5, s 0.85→0.6
  // (de ~425 px a ~300 px @1440), o sea más discreto y más pegado al borde.
  // 2026-09-01 (2ª pasada del usuario): x 87.5→73, y 88.5→59, s 0.6→1.4,
  // dim 1→0.88 y **z 6→-1**. Con eso deja de ser un adorno en la esquina y pasa
  // a cruzar la losa por DETRÁS del texto y del render 3D, atenuado.
  // Estuvo OCULTO (op:0) un rato, mientras se definía cómo convivía con el
  // render 3D del sistema; el usuario resolvió mandarlo al fondo en vez de
  // esconderlo. Ojo: era el único stop con z POSITIVO, y ese z:6 existía porque
  // antes el lado derecho lo tapaba una foto opaca — hoy ese hueco lo ocupa el
  // render, que tiene fondo transparente, así que ya no hace falta.
  // **NO QUITAR EL STOP**: `neighborStop()` solo mira la sección inmediatamente
  // vecina, así que sin parada aquí se rompe el viaje continuo
  // Gráfica→Servicio→Tecnología y el guía se desvanecería en vez de volar.
  // Afinado en #tune por el usuario (2026-09-07): baja un poco (y 60→63), se
  // encoge (s 1.3→1.25), se atenúa (op .75→.65) y ESTRENA HALO (0→0.34) — es la
  // primera parada que usa el halo por stop que se reimplantó el 2026-09-07;
  // las demás siguen en 0. Acompaña al render 3D del sistema, que en esta losa
  // es el protagonista, así que el guía va de fondo y con resplandor suave.
  servicio:{ x: 73, y: 63, s: 1.25, rx: 0, ry: 0, op: 0.65, dim: 0.8, halo: 0.34, breathe: 1, z: -1 },
  // Paso 4 · TECNOLOGÍA (agregado 2026-08-24): arranca esta 2ª mitad del viaje
  // en la esquina superior-derecha de la losa. De aquí continúa a Métricas.
  // Mismo unit base que metrics (sin ref:'section') → tamaño consistente
  // entre ambos, el viaje no "brinca" al pasar de uno a otro.
  // AFINADO EN #tune POR EL USUARIO (2026-08-31): pasa de acento discreto de
  // fondo a PLENA PRESENCIA — `op` .5→1 y `dim` .72→.92 (casi sin atenuar),
  // misma dirección que ya se tomó en Solución. Además baja un poco (`y`
  // 32.5→36) y se inclina hacia atrás (`rx` 0→−8), que es el primer stop del
  // viaje con giro en X: deja de estar de frente plano y muestra cara.
  tecnologia: { x: 19.5, y: 29.5, s: 1, rx: -8, ry: 0, op: 0.8, dim: 1, halo: 0, breathe: 1, z: -1 },   // afinado en #tune (2026-09-03)
  // Paso 5 · MÉTRICAS: el guía te ESPERA de fondo — 3×, pegado al lado
  // izquierdo (sangra por el borde), 75% de opacidad, detrás de las cifras.
  // op bajada + dim (brightness) para que el contenido lea sobre sus caras claras;
  // breathe:1 = respiración leve en reposo (animación CSS #guideLogo3D.g-breathe)
  // Paso 4½ · PRODUCTOS (2026-09-03). Parada nueva: sin ella el tramo
  // Tecnología→Métricas quedaba roto, porque neighborStop() solo mira la sección
  // INMEDIATAMENTE vecina y Productos quedó en medio. Valores de arranque
  // conservadores (izquierda, atenuado, detrás del contenido); el usuario los
  // afina en #tune, que arma su sección sola recorriendo STOPS.
  productos: { x: 80, y: 32, s: 1, rx: 0, ry: 0, op: 0.8, dim: 1, halo: 0, breathe: 1, z: -1 },     // afinado en #tune: x 74.5→80 el 2026-09-15, para que el rayo no se empalme con la entradilla
  // Paso 4¾ · FINANCIAMIENTO (2026-09-21). Losa nueva entre Productos y
  // Métricas. **NO QUITAR ESTA PARADA**: neighborStop() solo mira la sección
  // inmediatamente vecina y no salta las que no tienen stop, así que sin ella
  // el rayo se desvanece al entrar aquí y reaparece de golpe en Métricas —
  // exactamente lo que obligó a crear la parada de Productos.
  // Alterna lado con Productos (x 80) y repite el tamaño discreto de
  // Tecnología. Valores de arranque: afinar en #tune, que genera su panel solo.
  financiamiento: { x: 81, y: 25.5, s: 0.7, rx: 0, ry: 0, op: 1, dim: 1, halo: 0, breathe: 1, z: -1 },
  metrics: { x: 12, y: 54.5, s: 3, rx: 0, ry: 0, op: 0.6, dim: 0.86, halo: 0, breathe: 1, z: -1 },   // afinado por el usuario en #tune (2026-09-03)
  // Paso 6 · FAQ: lado OPUESTO (columna libre derecha), mismas propiedades y vista.
  // ref:'section' → la escala usa como unidad ⅓ de la ALTURA de la losa
  // (s:3 = tan alto como la diapositiva, sin contar el footer)
  faq:     { x: 92, y: 56, s: 2.75, rx: 0, ry: 0, op: 0.7, dim: 0.88, halo: 0, breathe: 1, z: -1 },  // afinado por el usuario en #tune (2026-09-03)
};

/* PARADAS DE MÓVIL (2026-09-22) ───────────────────────────────────────────────
   El rayo ya NO se apaga fuera de Críticos en el teléfono: está PRESENTE DE
   FONDO en varias losas. Lo que sigue muerto en móvil son los VIAJES — aparece
   y desaparece con su losa, no vuela entre ellas.

   Por qué ahora sí se puede, si el comentario viejo decía que castigaba al GPU:
   `initLogo3D` corre un `requestAnimationFrame` INCONDICIONAL que nunca mira si
   el lienzo se ve, así que el teléfono llevaba meses pagando el DIBUJO de un
   canvas en `display:none`. Hacerlo visible cuesta composición, no dibujo.

   ⚠️ MAPA APARTE, NO UN `m:{}` DENTRO DE CADA STOP. El exportador de #tune
   serializa cada parada con `fmt(st[k])`, y `fmt` sobre un objeto emite
   "[object Object]": el botón «Copiar valores» sacaría basura y se pegaría así
   en el código. Siendo plano, se reusa el mismo serializador sin tocarlo, los
   valores de escritorio (afinados a mano por el usuario) quedan en otro objeto
   donde no se pueden pisar por accidente, y EL CONJUNTO DE CLAVES DE ESTE MAPA
   ES LA LISTA BLANCA: no hay una segunda lista que mantener sincronizada.

   ⚠️ LA UNIDAD DE `s` AQUÍ ES ~215 px, NO ~500. En móvil `.frame` mide
   `min(62%,30svh)` ⇒ `heroFrameW()` ≈ 217 px en un teléfono de 390. Copiar un
   `s` de escritorio da un rayo del triple de lo que se espera.

   ⚠️ `dim` VA CLAVADO EN 1 A PROPÓSITO. `mountInStop` lo aplica como
   `filter:brightness()`, y un filtro CSS sobre un lienzo que repinta cada cuadro
   fuerza una pasada de filtro POR CUADRO — justo el fallo del que hablan las
   tres reglas de oro de la foto estática. Se atenúa con `op`, que es composición
   barata. El control se expone igual en #tune, pero el valor entregado es 1.

   NO están las losas de DÍA (Solución, Tecnología) y es un límite REAL, no una
   preferencia: en móvil esas losas pintan su propio fondo opaco y `.section` no
   crea contexto de apilamiento, así que un hijo en `z:-1` se pinta ANTES que ese
   fondo y queda INVISIBLE. Si algún día se quieren, hace falta
   `@media(max-width:900px){ section[data-theme="day"]{ isolation:isolate } }`. */
const STOPS_M = {
  peak:      { x: 50, y: 50, s: 1.35, rx: 0, ry: 0, op: 0.45, dim: 1, halo: 0, breathe: 1, z: -1 },
  productos: { x: 24, y: 20, s: 1.00, rx: 0, ry: 0, op: 0.40, dim: 1, halo: 0, breathe: 1, z: -1 },
  metrics:   { x: 18, y: 42, s: 1.50, rx: 0, ry: 0, op: 0.20, dim: 1, halo: 0, breathe: 1, z: -1 },
  faq:       { x: 84, y: 34, s: 1.40, rx: 0, ry: 0, op: 0.20, dim: 1, halo: 0, breathe: 1, z: -1 },
};

// Overrides guardados desde el panel #tune (botón 💾 por sección).
// AUTO-INVALIDACIÓN (agregado 2026-08-25, bug recurrente): cada guardado queda
// "sellado" con el default del CÓDIGO vigente al momento de guardar (`base`).
// Si luego cambiamos ese default en el código (como con el tamaño de Tecnología),
// el `base` guardado ya no coincide con el default actual → el override se
// descarta solo en la siguiente carga, en vez de pisar el fix en silencio para
// siempre. TUNE_PRISTINE también se expone en la API para que #tune pueda
// sellar sus guardados nuevos con el default correcto.
const LS_PREFIX = 'loialtTune:';
const TUNE_PRISTINE = {};
function lsMerge(key, obj){
  TUNE_PRISTINE[key] = JSON.parse(JSON.stringify(obj)); // default del código, ANTES de mezclar
  try{
    const s = localStorage.getItem(LS_PREFIX + key); if (!s) return;
    const saved = JSON.parse(s);
    const wrapped = saved && typeof saved === 'object' && saved.val && saved.base;
    if (!wrapped || JSON.stringify(saved.base) !== JSON.stringify(TUNE_PRISTINE[key])){
      // formato viejo (guardado antes de este fix) o el código cambió desde que
      // se guardó → obsoleto, se descarta (el default del código vuelve a mandar)
      localStorage.removeItem(LS_PREFIX + key);
      return;
    }
    for (const k in saved.val) if (k in obj) obj[k] = saved.val[k];
  }catch(e){}
}
export function loadTuneSaved(){
  Object.keys(VALUES).forEach(k => lsMerge('values.' + k, VALUES[k]));
  lsMerge('intro', INTRO); // duration
  lsMerge('intro.heroLogo', INTRO.heroLogo);
  lsMerge('intro.lettermark', INTRO.lettermark);
  lsMerge('guide', GUIDE);
  Object.keys(STOPS).forEach(k => lsMerge('stop.' + k, STOPS[k]));
  Object.keys(STOPS_M).forEach(k => lsMerge('stopM.' + k, STOPS_M[k]));
}

export const LABELS = {
  heroLogo:   'HERO · isotipo (rayo)',
  lettermark: 'HERO · wordmark',
};

const D2R = Math.PI / 180;
const FIXED_PROPS = ['position','left','top','width','height','margin','zIndex','pointerEvents'];
const TRAVELERS = ['heroLogo','lettermark'];
const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3); // arranca rápido, llega frenando
// Aterrizaje MUY gradual (sin rebase): la velocidad baja cada vez más despacio
// según se acerca al destino — nunca llega y corrige, solo frena hasta parar.
const easeOutQuint = t => 1 - Math.pow(1 - t, 5);
const lerp = (a, b, t) => a + (b - a) * t;

export function initLoialtAnim(registry){
  // registry: { key: { el, handle, selfRender? } }
  // handle = lo que devuelve init…3D: { renderer, scene, camera, pivot|group }
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadTuneSaved(); // aplicar lo guardado con 💾 antes de posicionar nada
  const items = {};
  for (const key of Object.keys(registry)){
    const def = registry[key];
    if (!def || !def.el || !def.handle) continue;
    const pivot = def.handle.pivot || def.handle.group || null;
    items[key] = {
      key, el: def.el, handle: def.handle, pivot,
      selfRender: !!def.selfRender, // true = el módulo 3D ya corre su propio rAF (no re-renderizar)
      base: pivot ? { x: pivot.rotation.x, y: pivot.rotation.y, z: pivot.rotation.z } : { x:0, y:0, z:0 },
      spinAcc: 0,
      fixed: false,
    };
  }

  function renderNow(it){
    if (it.selfRender) return; // su propio loop pinta el próximo frame
    const h = it.handle;
    if (h.renderer && h.scene && h.camera) h.renderer.render(h.scene, h.camera);
  }

  function applyRotation(it){
    const val = VALUES[it.key];
    if (!it.pivot) return;
    it.pivot.rotation.set(
      it.base.x + val.rx * D2R,
      it.base.y + val.ry * D2R + it.spinAcc,
      it.base.z + val.rz * D2R
    );
  }

  function apply(key){
    const it = items[key]; if (!it) return;
    if (intro.active && TRAVELERS.includes(key)) return; // durante el intro manda introApply()
    const val = VALUES[key]; if (!val) return; // guide: lo maneja guideFrame, no apply()
    const s = it.el.style;
    if (val.mode === 'fixed'){
      if (!it.fixed){
        // capturar tamaño actual en vmin (determinista al pegar los valores)
        const r = it.el.getBoundingClientRect();
        const vmin = Math.min(innerWidth, innerHeight) / 100;
        if (val.w == null || val.h == null){
          val.w = Math.max(6, +(r.width  / vmin).toFixed(2));
          val.h = Math.max(6, +(r.height / vmin).toFixed(2));
        }
        it.fixed = true;
      }
      s.position = 'fixed';
      s.left = val.x + 'vw';
      s.top  = val.y + 'vh';
      s.width  = val.w + 'vmin';
      s.height = val.h + 'vmin';
      s.margin = '0';
      s.zIndex = String(val.z);
      s.pointerEvents = 'none';
    } else if (it.fixed){
      FIXED_PROPS.forEach(p => { s[p] = ''; });
      it.fixed = false;
    }
    s.transformOrigin = 'center';
    const scale = (val.scale !== 1) ? `scale(${val.scale})` : '';
    s.transform = (val.mode === 'fixed')
      ? `translate(-50%,-50%) ${scale}`.trim()
      : scale;
    s.opacity = String(val.opacity);
    s.display = val.visible ? '' : 'none';
    applyRotation(it);
    renderNow(it);
  }

  function applyAll(){ Object.keys(items).forEach(apply); }

  // Progreso de scroll con geometría viva (compatible con pins de GSAP):
  // 0 = la sección asoma por abajo · 1 = terminó de salir por arriba
  function sectionProgress(el){
    const r = el.getBoundingClientRect();
    const total = r.height + innerHeight;
    return Math.min(1, Math.max(0, (innerHeight - r.top) / total));
  }

  /* ==========================================================
     INTRO · separación preloader → hero
     Los travelers (#heroLogo3D, #heroLettermark) se sacan a <body>
     (portal: sus ancestros tienen transform y romperían position:fixed),
     componen el logo oficial sobre el preloader y vuelan a su rect
     vivo del hero (el rayo persigue el float del .frame frame a frame).
     ========================================================== */
  const intro = { active:false, state:'idle', parts:{}, raf:0 };

  function targetRect(part){ return part.targetEl.getBoundingClientRect(); }

  function portalPart(key){
    const it = items[key]; if (!it) return null;
    const el = it.el;
    let targetEl, placeholder = null;
    if (key === 'lettermark'){
      placeholder = document.createElement('div');
      placeholder.className = el.className;   // mismo CSS ⇒ mismo hueco en el layout
      placeholder.style.visibility = 'hidden';
      el.replaceWith(placeholder);
      targetEl = placeholder;
    } else {
      targetEl = el.parentElement;            // .frame (el mount es absolute inset:0)
    }
    document.body.appendChild(el);
    const r = targetEl.getBoundingClientRect();
    Object.assign(el.style, {
      position:'fixed', width:r.width+'px', height:r.height+'px',
      margin:'0', zIndex:'10001', pointerEvents:'none', transformOrigin:'center',
    });
    return { key, el, it, targetEl, placeholder, parent: (key==='lettermark') ? null : targetEl };
  }

  function posePart(part){
    const pose = INTRO[part.key];
    part.el.style.left = pose.x + 'vw';
    part.el.style.top  = pose.y + 'vh';
    part.el.style.transform = `translate(-50%,-50%) scale(${pose.scale})`;
  }

  function autoPose(){
    // Derivar poses no definidas del hueco del logo en el preloader
    const slot = document.querySelector('#preloader .pl-wordmark');
    const iw = innerWidth, ih = innerHeight;
    let r = slot ? slot.getBoundingClientRect() : null;
    if (!r || r.width < 10) r = { left: iw*0.32, top: ih*0.30, width: iw*0.36, height: iw*0.36*315/812 };
    const lg = INTRO.heroLogo, lm = INTRO.lettermark;
    const pr = intro.parts;
    if (lg.x == null) lg.x = +((r.left + r.width*0.115) / iw * 100).toFixed(2);
    if (lg.y == null) lg.y = +((r.top  + r.height*0.50) / ih * 100).toFixed(2);
    if (lg.scale == null && pr.heroLogo){
      lg.scale = +((r.height*1.15) / targetRect(pr.heroLogo).height).toFixed(3);
    }
    if (lm.x == null) lm.x = +((r.left + r.width*0.615) / iw * 100).toFixed(2);
    if (lm.y == null) lm.y = +((r.top  + r.height*0.47) / ih * 100).toFixed(2);
    if (lm.scale == null && pr.lettermark){
      lm.scale = +((r.width*0.70) / targetRect(pr.lettermark).width).toFixed(3);
    }
  }

  function holdIntro(){
    if (intro.state === 'hold') return true;
    cancelAnimationFrame(intro.raf);
    if (intro.state !== 'fly'){
      for (const key of TRAVELERS){
        const part = portalPart(key);
        if (!part){ cancelIntro(); return false; }
        intro.parts[key] = part;
      }
      setLettermark2D(false); // replay del intro (#tune): vuelve a volar el 3D, no el plano
    }
    intro.active = true; intro.state = 'hold';
    // componer de frente: sin giro acumulado ni rx/ry/rz del estado hero
    for (const k of TRAVELERS){
      const it = items[k];
      if (it && it.pivot){ it.spinAcc = 0; it.pivot.rotation.set(it.base.x, it.base.y, it.base.z); renderNow(it); }
    }
    autoPose();
    TRAVELERS.forEach(k => intro.parts[k] && posePart(intro.parts[k]));
    return true;
  }

  function introApply(){ // el panel #tune mueve INTRO en vivo mientras está sostenido
    if (intro.state === 'hold') TRAVELERS.forEach(k => intro.parts[k] && posePart(intro.parts[k]));
  }

  function landIntro(){
    cancelAnimationFrame(intro.raf);
    for (const key of TRAVELERS){
      const part = intro.parts[key]; if (!part) continue;
      const el = part.el;
      if (part.placeholder){ part.placeholder.replaceWith(el); part.placeholder = null; }
      else if (part.parent){ part.parent.appendChild(el); }
      ['position','left','top','width','height','margin','zIndex','pointerEvents','transform','transformOrigin','opacity'].forEach(p => { el.style[p] = ''; });
    }
    intro.parts = {}; intro.active = false; intro.state = 'done';
    TRAVELERS.forEach(apply); // vuelven a mode:'layout'; el spin del rayo arranca aquí
    setLettermark2D(true); // al aterrizar en el hero, "LOIALT ENERGY" se vuelve 2D (a pedido del cliente)
  }

  // Aplana el wordmark del hero a 2D al aterrizar (esconde el canvas 3D, muestra
  // el SVG plano); on=false lo revierte para que un replay del intro (#tune)
  // se vea con el 3D volando de nuevo, como la primera vez.
  function setLettermark2D(on){
    const host = document.getElementById('heroLettermark'); if (!host) return;
    const canvas = host.querySelector('canvas');
    const flat = host.querySelector('.lettermark-2d');
    if (canvas) canvas.style.display = on ? 'none' : '';
    if (flat) flat.style.display = on ? '' : 'none';
  }

  function flyIntro(){
    if (intro.state !== 'hold') return false;
    intro.state = 'fly';
    const dur = Math.max(0.05, INTRO.duration || 0.4) * 1000;
    const t0 = performance.now();
    const from = {};
    TRAVELERS.forEach(k => { from[k] = { ...INTRO[k] }; });
    function frame(now){
      const t = Math.min(1, (now - t0) / dur);
      const e = easeInOutCubic(t);
      for (const key of TRAVELERS){
        const part = intro.parts[key]; if (!part) continue;
        const r = targetRect(part); // geometría viva: persigue el float del hero
        const tx = (r.left + r.width/2)  / innerWidth  * 100;
        const ty = (r.top  + r.height/2) / innerHeight * 100;
        part.el.style.left = lerp(from[key].x, tx, e) + 'vw';
        part.el.style.top  = lerp(from[key].y, ty, e) + 'vh';
        part.el.style.transform = `translate(-50%,-50%) scale(${lerp(from[key].scale, 1, e)})`;
      }
      if (t < 1){ intro.raf = requestAnimationFrame(frame); } else { landIntro(); }
    }
    intro.raf = requestAnimationFrame(frame);
    return true;
  }

  function cancelIntro(){ // sin animación: todo a su sitio (reduced motion / fallbacks)
    if (intro.state === 'idle' || intro.state === 'done'){ intro.active = false; return; }
    landIntro();
  }

  function replayIntro(){ // para afinar con #tune: repite todo el gesto
    const pre = document.getElementById('preloader');
    if (!holdIntro()) return;
    if (pre){
      pre.style.transition = 'none';
      pre.style.display = ''; pre.style.opacity = '1';
      pre.style.transform = 'none';
    }
    setTimeout(() => {
      if (pre){
        pre.style.transition = 'opacity .55s ease';
        pre.style.opacity = '0';
        setTimeout(() => { pre.style.display = 'none'; pre.style.transition = ''; }, 600);
      }
      flyIntro();
    }, 700);
  }

  function setupIntro(){
    const pre = document.getElementById('preloader');
    if (REDUCED || !pre || getComputedStyle(pre).display === 'none') return;
    if (!items.heroLogo || !items.lettermark) return;
    holdIntro();
    // Red de seguridad: si el preloader se oculta sin que nadie dispare el vuelo
    // (GSAP ausente, módulo cargado tarde…), volar/aterrizar igual.
    const mo = new MutationObserver(() => {
      const gone = pre.style.display === 'none' || pre.style.opacity === '0';
      if (gone && intro.state === 'hold'){ flyIntro() || cancelIntro(); }
      if (intro.state === 'done') mo.disconnect();
    });
    mo.observe(pre, { attributes:true, attributeFilter:['style'] });
  }

  /* ==========================================================
     RAYO GUÍA · pegado (en la losa) / volando (coreografías)
     ========================================================== */
  const guide = {
    mode: 'hidden',        // hidden | stuck | flying
    stuckAt: null,         // id de stop · 'dock' (batería)
    fade: 0,               // presencia (fade pegado)
    snap: '',              // snapshot del stop pegado (edición en vivo con #tune)
    trip: null,            // viaje entre stops
    entry: null,           // entrada a Críticos
    dockT: 0, batOn: false, armed: true, preGone: false,
    settleAt: 0, lastY: window.scrollY,
    baseSize: 200, frameEl: null, lastPose: null,
    // Compuerta de SOLUCIÓN: el guía no entra hasta que la animación de texto
    // de #what llega a su 3ª fase (las cifras). La abre initSolReveal() con el
    // evento 'loialt:solstats'. Es un LATCH (no se vuelve a cerrar): esa
    // animación corre con ScrollTrigger once:true, así que al regresar a la
    // losa más tarde el texto ya está puesto y el guía debe poder entrar igual.
    solGate: false,
    // Giro en Y ACUMULADO (grados, mod 360). Antes cada aterrizaje reaplicaba
    // el `ry` del stop y BORRABA lo girado en el vuelo: con vuelta completa no
    // se notaba (360° ≡ 0°), pero al meter medias vueltas el rayo aterrizaba y
    // se "corregía" de golpe. Ahora el giro se acumula aquí, mountInStop lo
    // suma al ry del stop, y el tramo siguiente ARRANCA de esta orientación
    // ⇒ aterriza volteado y se endereza viajando, sin brincos. (2026-08-31)
    ryAcc: 0,
  };
  const gEl = items.guide ? items.guide.el : null;
  // El halo se eliminó del guía el 2026-09-03 (el usuario no lo quería en la
  // Gráfica ni en Servicio), pero SÍ se conserva el de la ENTRADA a Críticos:
  // es la luz que llega desde fuera y de la que nace el rayo en la batería.
  // Vive SOLO en entryFrame y en el branch del dock; en stops y vuelos va a 0.
  const gHalo = gEl ? gEl.querySelector('.guide-halo') : null;
  // Opacidad del halo en stops y vuelos. Se reintrodujo el 2026-09-07 para poder
  // afinarlo desde #tune; arranca en 0 en todos los stops, así que la página no
  // cambia hasta que se suba un valor. La entrada a Críticos NO pasa por aquí:
  // esa usa GUIDE.haloMax y vive en entryFrame.
  function haloDe(v, fade){ return String((v || 0) * (fade != null ? fade : 1)); }
  document.addEventListener('loialt:solstats', () => { guide.solGate = true; });
  const mqMobile = window.matchMedia('(max-width: 900px)');
  /* La parada vigente según el ancho. En móvil manda STOPS_M, y si una losa no
     está en ese mapa devuelve null ⇒ el rayo no aparece ahí. Gate VIVO: se
     consulta al usarse, nunca se congela al inicializar. */
  function stopOf(id){ return mqMobile.matches ? (STOPS_M[id] || null) : (STOPS[id] || null); }
  function gCanvas(){ return gEl ? gEl.querySelector('canvas') : null; }

  function heroFrameW(){
    if (!guide.frameEl) guide.frameEl = document.querySelector('#hero .frame');
    return guide.frameEl ? guide.frameEl.getBoundingClientRect().width : 280;
  }

  function setPivot(rx, ry, rz){
    const it = items.guide;
    if (it && it.pivot) it.pivot.rotation.set(it.base.x + rx*D2R, it.base.y + ry*D2R, it.base.z + rz*D2R);
  }

  function sectionAtCenterId(){
    const mid = innerHeight / 2;
    const secs = document.querySelectorAll('section.section');
    for (const s of secs){
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) return s.id;
    }
    return null;
  }

  function neighborStop(id, dir){ // sección vecina (en la dirección del scroll) con stop
    const secs = Array.from(document.querySelectorAll('section.section'));
    const i = secs.findIndex(s => s.id === id);
    const nb = i >= 0 ? secs[i + dir] : null;
    return (nb && STOPS[nb.id]) ? nb.id : null;
  }

  function stopUnit(st, sr){ // unidad de escala: frame del hero, o ⅓ de la losa (ref:'section')
    return st.ref === 'section' ? sr.height / 3 : heroFrameW();
  }

  function computeStopPose(id){ // destino VIVO para coreografías (coords viewport)
    const st = stopOf(id); const sec = document.getElementById(id);
    if (!st || !sec) return null;
    const sr = sec.getBoundingClientRect();
    return {
      x: sr.left + (st.x/100) * sr.width,
      y: sr.top  + (st.y/100) * sr.height,
      size: Math.max(120, stopUnit(st, sr) * (st.s || 1)),
      rx: st.rx || 0, ry: st.ry || 0, rz: st.rz || 0,
      op: st.op != null ? st.op : 1,
      dim: st.dim != null ? st.dim : 1,
      halo: st.halo || 0,
      z: st.z != null ? st.z : -1,
    };
  }

  function hideGuide(){
    if (!gEl) return;
    document.body.appendChild(gEl);
    gEl.style.display = 'none';
    guide.mode = 'hidden'; guide.stuckAt = null; guide.fade = 0;
    if (gHalo) gHalo.style.opacity = '0';
    gEl.style.filter = '';
    gEl.classList.remove('g-breathe');
  }

  function mountInStop(id, fade){ // PEGADO en la losa del stop (nativo con el scroll)
    const st = stopOf(id); const sec = document.getElementById(id);
    if (!st || !sec || !gEl) return false;
    const sr = sec.getBoundingClientRect();
    const size = Math.max(120, stopUnit(st, sr) * (st.s || 1));
    const wasHidden = gEl.style.display === 'none';
    if (gEl.parentElement !== sec) sec.appendChild(gEl);
    // NO redimensionar el canvas al aterrizar (parpadea): conservar la
    // resolución base y expresar el tamaño con transform:scale. Re-baseline
    // solo si estaba oculto o la desviación es grande (y con opacidad 0).
    // La resolución se CAPEA a maxRes: los tamaños grandes van por scale (GPU).
    /* Tope de resolución MÁS BAJO en móvil, y SOLO aquí: el acople de Críticos
       (`mountInDock` y la entrada) conserva el suyo, porque ahí el rayo es el
       protagonista y debe verse igual que siempre. */
    const techo = mqMobile.matches ? (GUIDE.mStopRes || 384) : (GUIDE.maxRes || 640);
    const base = Math.min(size, techo);
    if (wasHidden || !guide.baseSize || base / guide.baseSize > 2 || base / guide.baseSize < 0.5){
      guide.baseSize = base;
      gEl.style.width = base + 'px'; gEl.style.height = base + 'px';
    }
    // offsets en px desde el borde de la losa (sin borde ⇒ mismo origen que el
    // rect del destino del vuelo en computeStopPose) → aterrizaje sin brinco
    Object.assign(gEl.style, {
      display: '', position: 'absolute',
      left: ((st.x != null ? st.x : 50)/100 * sr.width) + 'px',
      top:  ((st.y != null ? st.y : 50)/100 * sr.height) + 'px',
      margin: '0',
      zIndex: String(st.z != null ? st.z : -1),
      transform: `translate(-50%,-50%) scale(${size / guide.baseSize})`,
      opacity: String((st.op != null ? st.op : 1) * (fade != null ? fade : 1)),
      pointerEvents: 'none',
    });
    const cv = gCanvas(); if (cv) cv.style.opacity = '1';
    gEl.style.filter = st.dim ? `brightness(${st.dim})` : ''; // atenuar caras claras
    gEl.classList.toggle('g-breathe', !!st.breathe); // respiración leve en reposo
    setPivot(st.rx || 0, (st.ry || 0) + guide.ryAcc, st.rz || 0);   // + giro acumulado del viaje
    if (gHalo) gHalo.style.opacity = haloDe(st.halo, fade);
    guide.mode = 'stuck'; guide.stuckAt = id;
    guide.snap = JSON.stringify(st);
    return true;
  }

  function mountInDock(){ // PEGADO a la batería (sticky, nativo con la losa)
    const vis = document.querySelector('#problems .battery-vis');
    const well = document.querySelector('#problems .bat-well');
    if (!vis || !well || !gEl) return false;
    const vr = vis.getBoundingClientRect(), wr = well.getBoundingClientRect();
    if (vr.width < 4) return false;
    // Críticos (2026-08-26): .battery-vis puede vivir dentro de .crit-visual con un
    // transform:scale heredado (la batería "grande→esquina" de initCritSequence).
    // getBoundingClientRect() da coordenadas de PANTALLA (post-transform), pero
    // left/top/scale de abajo se aplican LOCALES dentro de .battery-vis → hay que
    // dividir entre k (escala heredada) para que el acople sea correcto en
    // cualquier punto de esa animación (incluida reduced-motion, que arranca
    // directo en la pose encogida). k===1 en el resto de la página (sin cambios).
    const k = vis.offsetWidth ? (vr.width / vis.offsetWidth) : 1;
    const side = (Math.max(wr.width, wr.height) * GUIDE.fit) / k;
    const cx = (wr.left + wr.width/2  + (GUIDE.dx/100) * wr.width  - vr.left) / k;
    const cy = (wr.top  + wr.height/2 + (GUIDE.dy/100) * wr.height - vr.top) / k;
    const wasHidden = gEl.style.display === 'none';
    if (gEl.parentElement !== vis) vis.appendChild(gEl);
    const dockBase = Math.min(side, GUIDE.maxRes || 640);
    if (wasHidden || !guide.baseSize || dockBase / guide.baseSize > 2 || dockBase / guide.baseSize < 0.5){
      guide.baseSize = dockBase;
      gEl.style.width = dockBase + 'px'; gEl.style.height = dockBase + 'px';
    }
    Object.assign(gEl.style, {
      display: '', position: 'absolute',
      left: cx + 'px',
      top:  cy + 'px',
      margin: '0',
      zIndex: String(GUIDE.z),
      transform: `translate(-50%,-50%) scale(${side / guide.baseSize})`,
      opacity: '1', pointerEvents: 'none',
    });
    const cv = gCanvas(); if (cv) cv.style.opacity = '1';
    gEl.style.filter = '';
    gEl.classList.remove('g-breathe');
    setPivot(0, GUIDE.flip || 0, 0);
    guide.mode = 'stuck'; guide.stuckAt = 'dock'; guide.snap = '';
    return true;
  }

  function portalGuide(){ // → volando (fixed en <body>), conservando su rect actual
    const r = gEl.getBoundingClientRect();
    gEl.classList.remove('g-breathe'); // el filter lo gestiona applyFly (atenuado continuo)
    document.body.appendChild(gEl);
    Object.assign(gEl.style, {
      display: '', position: 'fixed', left: '0px', top: '0px', margin: '0', pointerEvents: 'none',
    });
    guide.mode = 'flying';
    return { x: r.left + r.width/2, y: r.top + r.height/2, size: Math.max(1, r.width) };
  }

  function applyFly(p, fade){ // pose volando: SOLO transform (GPU), sin reflow
    guide.lastPose = p;
    const s = p.size / Math.max(1, guide.baseSize);
    gEl.style.zIndex = String(p.z);
    gEl.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%,-50%) scale(${s})`;
    gEl.style.opacity = String((p.op != null ? p.op : 1) * (fade != null ? fade : 1));
    if (gHalo) gHalo.style.opacity = haloDe(p.halo, fade);
    // el ATENUADO viaja con él (mismo brillo en vuelo y en reposo → sin destello)
    gEl.style.filter = (p.dim != null && p.dim < 1) ? `brightness(${p.dim})` : '';
    setPivot(p.rx || 0, p.ry || 0, p.rz || 0);
  }

  function entryFrame(dt){ // entrada a Críticos (volando): la luz entra, el rayo nace en la batería
    const en = guide.entry;
    const well = document.querySelector('#problems .bat-well');
    if (!well){ guide.entry = null; hideGuide(); return; }
    const wr = well.getBoundingClientRect();
    const side = Math.max(wr.width, wr.height) * GUIDE.fit;
    const wx = wr.left + wr.width/2  + (GUIDE.dx/100) * wr.width;
    const wy = wr.top  + wr.height/2 + (GUIDE.dy/100) * wr.height;
    en.u = Math.min(1, en.u + dt / Math.max(0.05, GUIDE.enter));
    const e = easeInOutCubic(en.u);
    const sx = (GUIDE.fromX/100) * innerWidth, sy = (GUIDE.fromY/100) * innerHeight;
    const x = lerp(sx, wx, e) + Math.sin(Math.PI * e) * (GUIDE.arc/100) * innerWidth;
    const y = lerp(sy, wy, e);
    const s = lerp(guide.entryScale0 || 1, side / Math.max(1, guide.baseSize), e);
    gEl.style.zIndex = String(GUIDE.z);
    gEl.style.opacity = '1';
    gEl.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%,-50%) scale(${s})`;
    if (gHalo) gHalo.style.opacity = String(Math.min(1, e * 1.6) * GUIDE.haloMax);
    const cv = gCanvas();
    if (cv) cv.style.opacity = String(Math.min(1, Math.max(0, (en.u - GUIDE.reveal) / Math.max(0.05, 0.85 - GUIDE.reveal))));
    setPivot(0, e * (GUIDE.flip || 0), 0);
    if (en.u >= 1){
      guide.entry = null; guide.dockT = 0;
      mountInDock();
      const cv2 = gCanvas(); if (cv2) cv2.style.opacity = '1';
      if (gHalo) gHalo.style.opacity = String(GUIDE.haloMax);   // se apaga en el dock
      if (!guide.batOn){ guide.batOn = true; guide.armed = false; if (window.LOIALT_BATTERY_ON) window.LOIALT_BATTERY_ON(); }
    }
  }

  function tripFrame(dt){ // viaje entre stops (volando): trayecto ÚNICO y directo
    const tr = guide.trip;
    const pb = computeStopPose(tr.to);
    if (!pb || !tr.pose){ guide.trip = null; hideGuide(); return; }
    const f = tr.pose; // pose CONGELADA de partida
    // ANTICIPO: se echa ligeramente hacia atrás antes de lanzarse
    if (tr.phase === 'anticipate'){
      tr.u = Math.min(1, tr.u + dt / Math.max(0.03, GUIDE.anticip));
      const e = easeInOutCubic(tr.u);
      const dx = pb.x - f.x, dy = pb.y - f.y;
      const d = Math.hypot(dx, dy) || 1;
      const pull = f.size * 0.16;
      // MISMO z que la fase de movimiento: si el anticipo volara por encima y el
      // movimiento por detrás, el rayo parpadearía de plano justo al despegar.
      applyFly({ ...f, x: f.x - (dx/d) * pull * e, y: f.y - (dy/d) * pull * e,
                 z: (DETRAS[tr.from] || DETRAS[tr.to]) ? GUIDE.zFlyDetras : GUIDE.zFly }, 1);
      if (tr.u >= 1){
        tr.pose = { ...f, x: f.x - (dx/d) * pull, y: f.y - (dy/d) * pull };
        tr.phase = 'move'; tr.u = 0;
      }
      return;
    }
    // VIAJE: directo con poco arco, una vuelta de 360°, compactándose.
    // UN SOLO eje de giro para los dos tramos (2026-08-25, a pedido del usuario):
    // Y ("puerta giratoria", de lado) — se probó X ("marometa", de arriba a
    // abajo) y no convenció; Y es el mismo giro que ya tenía Tecnología↔Métricas
    // antes de empezar a experimentar con ejes. El tramo Tecnología sigue
    // corriendo 20% más rápido (×0.8 GUIDE.travel).
    const tecLeg = tr.from === 'tecnologia' || tr.to === 'tecnologia';
    // Tramo Gráfica↔Servicio: más corto Y con una curva de frenado menos extrema.
    const psLeg = (tr.from === 'peak' && tr.to === 'servicio') ||
                  (tr.from === 'servicio' && tr.to === 'peak');
    const legTravel = GUIDE.travel * (tecLeg ? 0.8 : (psLeg ? (GUIDE.travelPeakSvc || 0.6) : 1));
    tr.u = REDUCED ? 1 : Math.min(1, tr.u + dt / Math.max(0.05, legTravel));
    // Aterrizaje SIN rebase (2026-08-25, a pedido del usuario — "como el parque":
    // que la velocidad baje gradualmente, no que se pase y corrija). easeOutQuint
    // frena mucho más despacio que el cubic anterior — se siente como que "se le
    // acaba la gasolina" suavemente en vez de topar con la pose final.
    // easeOutQuint deja una cola muerta: cubre el 99.76% del camino en el 70% del
    // tiempo, y el 30% restante se arrastra recorriendo 0.24%. En los tramos
    // largos eso se lee como "se le acaba la gasolina" y así lo pidió el usuario;
    // pero en Gráfica↔Servicio, que es corto y lo dispara el auto-avance, se
    // sentía TRABADO. Ahí va cubic: mismo carácter de frenado sin overshoot,
    // pero llega al 97% en el 70% del tiempo en vez del 99.76%.
    const e = psLeg ? easeOutCubic(tr.u) : easeOutQuint(tr.u);
    const arc = -Math.sin(Math.PI * e) * (GUIDE.tripArc/100) * innerHeight; // comba hacia ARRIBA (igual en ambas direcciones = espejo)
    // GIRO POR TRAMO: TODOS los tramos dan vuelta COMPLETA (GUIDE.tumble = 1).
    // HISTORIA (2026-09-01): antes los tramos que tocaban la GRÁFICA daban solo
    // MEDIA vuelta (`peakLeg ? 0.5 : GUIDE.tumble`), para que el giro se leyera
    // como UNO partido en dos con la losa de la gráfica a la mitad. Se quitó a
    // pedido del usuario: media vuelta deja `guide.ryAcc` en 180°, o sea el rayo
    // se QUEDA volteado, y como ese acumulado se arrastra a los stops siguientes
    // la CARA TRASERA quedaba a la vista en Tecnología (y de ahí en adelante).
    // Con 1 vuelta el acumulado vuelve a 0 en cada aterrizaje ⇒ el rayo siempre
    // se ve de frente. Si algún día se vuelve a querer media vuelta, hay que
    // resolver primero cómo enderezarlo antes de llegar a Tecnología.
    const legTumble = (GUIDE.tumble || 0);
    // Se interpola de la orientación REAL de despegue a la REAL de aterrizaje
    // (ambas ya con el acumulado incorporado), en vez de sumar el giro por
    // fuera: así el ángulo con el que llega es exactamente el que mountInStop
    // va a dejar fijo ⇒ cero corrección al aterrizar.
    // ryIni sale de la pose CONGELADA de despegue, no de recalcular el stop de
    // origen. Para un tramo normal son el mismo valor, pero si el viaje se
    // re-apunta en pleno vuelo esa pose trae la orientación REAL de ese
    // instante ⇒ el nuevo tramo continúa desde ahí en vez de brincar.
    // (Ya incluye el acumulado: la pose se congela con `ry + guide.ryAcc`.)
    const ryIni  = (f.ry || 0);
    const ryBase = (pb.ry || 0);
    // El aterrizaje SIEMPRE cae en un múltiplo exacto de vuelta sobre el ry del
    // stop ⇒ `ryAcc` queda en 0 y el rayo se ve de FRENTE en todos los stops.
    // Se elige el múltiplo más cercano a girar `legTumble` vueltas desde donde
    // se despegó. Antes se hacía `ryBase + tr.ryFrom + legTumble*360`, que solo
    // caía en múltiplo si se despegaba de uno: si el viaje se RE-APUNTABA en
    // pleno vuelo (el usuario vuelve a subir a media transición), `tr.ryFrom`
    // traía el ángulo vivo —digamos 200°— y el rayo aterrizaba a 200°, con la
    // cara de lado. Redondear a vuelta entera cierra ese hueco.
    const vueltas = Math.round((ryIni - ryBase) / 360 + legTumble);
    const ryFin  = ryBase + vueltas * 360;
    const dip = 1 - Math.sin(Math.PI * e) * (GUIDE.shrink || 0);
    applyFly({
      x: lerp(f.x, pb.x, e), y: lerp(f.y, pb.y, e) + arc,
      size: lerp(f.size, pb.size, e) * dip,
      rx: lerp(f.rx, pb.rx, e),
      ry: lerp(ryIni, ryFin, e),
      rz: lerp(f.rz, pb.rz, e),
      op: lerp(f.op, pb.op, e), dim: lerp(f.dim != null ? f.dim : 1, pb.dim, e),
      halo: lerp(f.halo || 0, pb.halo || 0, e),   // el halo se interpola en el viaje
      // Vuela POR DETRÁS si el tramo toca la Gráfica o Servicio (2026-09-01):
      // en esas dos losas el render 3D vive al fondo y el guía debe acompañarlo
      // en vez de pasarle por encima. Se mira `from` Y `to`, no solo el destino:
      // si solo se mirara el destino, al DESPEGAR de Servicio saltaría de golpe
      // de estar detrás a estar delante de todo.
      z: (DETRAS[tr.from] || DETRAS[tr.to]) ? GUIDE.zFlyDetras : GUIDE.zFly,
    }, 1);
    if (tr.u >= 1){
      // Persistir la orientación con la que llegó, para que mountInStop la
      // respete y el tramo siguiente arranque de ahí. Como ryFin siempre cae en
      // múltiplo exacto de 360 sobre el ry del stop, esto da SIEMPRE 0 ⇒ el rayo
      // aterriza de frente en todos los stops. Se conserva el mod (en vez de
      // fijar 0) porque es la fuente de verdad si alguien vuelve a meter giros
      // parciales: así el bug se vería en guideState().ryAcc y no en silencio.
      guide.ryAcc = ((ryFin % 360) + 360) % 360;
      const to = tr.to; guide.trip = null; guide.fade = 1;
      mountInStop(to, 1);

      return;
    }
    // reversa en pleno vuelo: nuevo destino desde la pose actual (espejo natural)
    const centerId = sectionAtCenterId();
    if (centerId && STOPS[centerId] && centerId !== tr.to){
      const nFrom = tr.to, nTo = centerId;
      const cur = { ...guide.lastPose };
      // ryFrom derivado de la orientación REAL de este instante (2026-08-31):
      // antes este re-target no lo pasaba y quedaba en 0 ⇒ el nuevo tramo
      // recalculaba el giro desde cero y el rayo pegaba un brinco de rotación.
      const nRyFrom = (cur.ry || 0) - ((STOPS[nFrom] && STOPS[nFrom].ry) || 0);
      guide.trip = { from: nFrom, to: nTo, phase: 'move', u: 0, ryFrom: nRyFrom, pose: cur };
    }
  }

  // ---- MÓVIL: carril sticky Métricas→FAQ con FOTO estática del isotipo (v2) ----
  // Reintento tras el postmortem 2026-08-18 (ver CLAUDE.md). Reglas de oro:
  //  · CERO trabajo por frame y CERO mutaciones de DOM durante el scroll.
  //  · La opacidad y el atenuado van HORNEADOS en los píxeles del snapshot
  //    (nada de opacity/filter en el DOM: obligaban a re-rasterizar la capa
  //    gigante sobre el canvas WebGL en cada frame).
  //  · will-change:transform → capa compositada propia en GPU.
  //  · Re-amarres SOLO por eventos (resize/orientación/click en FAQ, con
  //    debounce y guardas de cambio) — NUNCA ResizeObserver de body: la barra
  //    de URL móvil redimensiona el viewport al scrollear y disparaba
  //    re-escrituras de layout en plena scrolleada (el "trabado" de v75).
  const MZONE = { x: 88, s: 2.75, op: 0.22, dim: 0.72, z: -1 };
  /* (2026-09-22) La foto estática SOBRA si el rayo vivo ya cubre Métricas/FAQ:
     `#mzoneWrap` abarca LAS DOS losas, así que se verían dos rayos — y uno
     congelado junto a otro vivo y respirando se lee como fallo, no como estilo.
     La bandera es auto-consistente (deriva de STOPS_M, no hay nada que
     sincronizar a mano) y la función, su DOM y su bloque de tres reglas de oro
     SE QUEDAN en el archivo: dado el historial del «v75 trabado», un booleano
     tiene que poder devolver un respaldo ya probado. Borrar el código muerto
     solo cuando la versión viva sobreviva una publicación. */
  const MZONE_ON = !(STOPS_M.metrics || STOPS_M.faq);
  function mzRefresh(){
    const wrap = document.getElementById('mzoneWrap'); if (!wrap) return;
    const met = document.getElementById('metrics');
    const faq = document.getElementById('faq');
    if (!met || !faq) return;
    const mr = met.getBoundingClientRect(), fr = faq.getBoundingClientRect();
    const size = Math.round(Math.max(120, (mr.height / 3) * MZONE.s));
    const wrapH = Math.round(fr.bottom - mr.top) + 'px';   // termina EXACTO donde empieza el footer
    const sticky = wrap.firstChild, holder = sticky ? sticky.firstChild : null;
    if (wrap.style.height !== wrapH) wrap.style.height = wrapH;   // guardas: escribir SOLO si cambió
    const stTop = `calc(50svh - ${size/2}px)`, szPx = size + 'px';
    if (sticky && sticky.style.height !== szPx){ sticky.style.top = stTop; sticky.style.height = szPx; }
    if (holder && holder.style.width !== szPx){ holder.style.width = szPx; holder.style.height = szPx; }
  }
  function setupMZoneStatic(){
    if (!MZONE_ON) return;           // el rayo VIVO ya cubre esas losas
    if (!mqMobile.matches) return;
    if (document.getElementById('mzoneWrap')) return;   // idempotente
    const met = document.getElementById('metrics');
    const faq = document.getElementById('faq');
    const src = items.heroLogo;
    const cv = src && src.handle && src.handle.renderer ? src.handle.renderer.domElement : null;
    if (!met || !faq || !cv || !cv.width) return;        // aún no hay canvas: reintento posterior
    // foto en pose de reposo, con render síncrono (la copia nunca sale en blanco)
    const h = src.handle;
    const rot = src.pivot ? { x: src.pivot.rotation.x, y: src.pivot.rotation.y, z: src.pivot.rotation.z } : null;
    if (src.pivot) src.pivot.rotation.set(src.base.x, src.base.y, src.base.z);
    if (h.scene && h.camera) h.renderer.render(h.scene, h.camera);
    const snap = document.createElement('canvas');
    snap.width = cv.width; snap.height = cv.height;
    const sctx = snap.getContext('2d');
    sctx.globalAlpha = MZONE.op;                         // opacidad horneada
    sctx.drawImage(cv, 0, 0);
    sctx.globalCompositeOperation = 'source-atop';       // atenuado horneado (≈ brightness(dim))
    sctx.globalAlpha = 1 - MZONE.dim;
    sctx.fillStyle = '#000';
    sctx.fillRect(0, 0, snap.width, snap.height);
    if (rot && src.pivot){ src.pivot.rotation.set(rot.x, rot.y, rot.z); if (h.scene && h.camera) h.renderer.render(h.scene, h.camera); }
    const wrap = document.createElement('div'); wrap.id = 'mzoneWrap';
    const sticky = document.createElement('div'); sticky.id = 'mzoneSticky';
    const holder = document.createElement('div'); holder.id = 'mzoneHolder';
    Object.assign(wrap.style, { position:'absolute', left:'0', top:'0', width:'100%',
      zIndex:String(MZONE.z), pointerEvents:'none' });
    Object.assign(sticky.style, { position:'sticky', width:'100%' });
    Object.assign(holder.style, { position:'absolute', left:MZONE.x + '%', top:'50%',
      transform:'translate(-50%,-50%)', willChange:'transform' });   // capa GPU propia; SIN opacity/filter
    Object.assign(snap.style, { width:'100%', height:'100%', display:'block',
      animation: REDUCED ? 'none' : 'gBreathe 4.6s ease-in-out infinite' });   // respira (transform puro)
    holder.appendChild(snap); sticky.appendChild(holder); wrap.appendChild(sticky);
    met.appendChild(wrap);
    mzRefresh();
    // re-amarres por EVENTO (debounced), jamás por frame ni por observer de body
    let mzT = null;
    const later = () => { clearTimeout(mzT); mzT = setTimeout(mzRefresh, 250); };
    window.addEventListener('resize', later);
    window.addEventListener('orientationchange', later);
    faq.addEventListener('click', later);               // el acordeón cambia la altura de FAQ
  }
  // el canvas del hero puede tardar (preloader/carga) → reintenta hasta lograrlo
  let mzTries = 0;
  const mzTimer = MZONE_ON ? setInterval(() => {
    setupMZoneStatic();
    if (document.getElementById('mzoneWrap') || ++mzTries > 30) clearInterval(mzTimer);
  }, 700) : null;
  if (mqMobile.addEventListener) mqMobile.addEventListener('change', () => setTimeout(setupMZoneStatic, 300));

  // Fracción visible de la batería en el viewport (0..1) — free scroll móvil
  function batVisFrac(){
    const v = document.querySelector('#problems .battery-vis');
    if (!v) return 0;
    const r = v.getBoundingClientRect();
    if (!r.height) return 0;
    return Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height;
  }

  function guideFrame(dt, now){
    const it = items.guide; if (!it || !gEl) return;
    const prob = document.getElementById('problems');
    const pr = prob ? prob.getBoundingClientRect() : null;
    const probTop = pr ? pr.top : 1e9;
    const centerId = sectionAtCenterId();
    const moving = Math.abs(window.scrollY - guide.lastY) > 1.5;
    guide.lastY = window.scrollY;

    /* Re-arme de Críticos: SIEMPRE que la losa se abandona, y EN LOS DOS
       SENTIDOS. Al volver, la batería se carga desde cero y las 3 tarjetas
       vuelven a entrar escalonadas (2026-09-22, pedido del CLIENTE).
         OJO — esto REVIERTE la decisión del 2026-08-26, que era justo la
         contraria ("al subir a la diapositiva anterior no quiero que se
         reinicie la animación") y se implementó con el candado `guide.everBat`.
         Ese candado ya no existe: si vuelve a pedirse el comportamiento de
         quedarse cargada, hay que reintroducirlo aquí, no parchear más abajo.

       ⚠️ HACEN FALTA LAS DOS DIRECCIONES, y es el fallo con el que nació este
       cambio: la primera versión solo miraba `probTop > innerHeight * 0.9`, que
       es cierto únicamente cuando la losa queda POR DEBAJO de la ventana, o sea
       al salir HACIA ARRIBA. Bajando a Solución nunca se re-armaba, así que al
       volver desde abajo `guide.batOn` seguía en true y la rama de más abajo
       cortaba con `mountInDock()` sin repetir nada. La condición de móvil sí
       cubría los dos sentidos desde el principio. */
    /* MÓVIL: se mide la BATERÍA VISIBLE, no el rectángulo de la losa.
       Con el scroll libre las losas vecinas miden su contenido, así que
       `pr.top > innerHeight` casi nunca se cumple —MEDIDO: subiendo a Nosotros
       no se re-armaba nunca, y bajando a Solución el borde inferior de la losa
       cae EXACTAMENTE en 0, así que un `< 0` falla por un pelo—. `batVisFrac()`
       es indiferente a la dirección y al alto de las vecinas, y además reusa el
       umbral que ya gobierna la entrada (0.75 para entrar, 0.35 para abandonar):
       histéresis limpia con los números que ya estaban elegidos. */
    const movil = mqMobile.matches;
    const bajando = !movil && pr && pr.bottom < innerHeight * 0.1;
    const fuera = movil
      ? (batVisFrac() < 0.35)
      : (probTop > innerHeight * 0.9 || bajando);
    if (fuera){
      guide.armed = true;
      if (guide.batOn){ guide.batOn = false; if (window.LOIALT_BATTERY_OFF) window.LOIALT_BATTERY_OFF(); }
      /* ¿Hay quien recoja el rayo, o hay que esconderlo?
         Bajando EN ESCRITORIO sí: la rama del dock se lo entrega a la parada de
         la losa siguiente (`mountInStop`), y esconderlo aquí le quitaría ese
         relevo y daría un parpadeo.
         En cualquier otro caso NO, y hay que esconderlo:
           · hacia arriba no hay ninguna parada (Nosotros no tiene);
           · en MÓVIL no hay paradas en absoluto, así que si se deja acoplado se
             queda dentro de una losa fuera de pantalla y —peor— su propia rama
             del dock retorna antes de tiempo, impidiendo que la entrada se
             vuelva a disparar al regresar. */
      const hayRelevo = bajando && !(probTop > innerHeight * 0.9);
      if (guide.stuckAt === 'dock' && !hayRelevo) hideGuide();
      // Una entrada a medio vuelo sí se cancela en ambos sentidos.
      if (guide.entry){ guide.entry = null; hideGuide(); }
    }

    // MÓVIL (<900px): esperas y viajes DESACTIVADOS — el guía solo vive en
    // Críticos (entrada + dock); un render 3× detrás de un viewport angosto
    // estorba al contenido y castiga al GPU del teléfono
    if (mqMobile.matches){
      guide.trip = null;                                   // los VIAJES siguen muertos
      // (2026-09-22) Ya NO se esconde el rayo pegado a una parada: en móvil
      // ahora vive de fondo en las losas de STOPS_M. La red de seguridad del
      // vuelo obsoleto se conserva, por si un resize cruza el corte a media
      // coreografía de escritorio.
      if (guide.mode === 'flying' && !guide.entry) hideGuide();
      // Y si está pegado a una losa que NO es de móvil (p. ej. se cruzó el
      // corte desde escritorio), se va.
      if (guide.mode === 'stuck' && guide.stuckAt !== 'dock' && !STOPS_M[guide.stuckAt]) hideGuide();
    }

    // Si el usuario ABANDONA Críticos con la entrada en pleno vuelo, se cancela
    // (sin esto el rayo seguía volando sobre la siguiente losa y dejaba
    // estados a medias al regresar). armed queda intacto → al volver, replay.
    // Móvil: "abandonar" = la batería casi salió de vista (free scroll).
    const entryAway = mqMobile.matches
      ? batVisFrac() < 0.35
      : (centerId && centerId !== 'problems');
    if (guide.entry && entryAway){
      guide.entry = null; hideGuide();
    }

    // Coreografías volando en curso
    if (guide.entry){ entryFrame(dt); return; }
    if (guide.trip && guide.trip.phase !== 'waitGo'){ tripFrame(dt); return; }

    // Viaje programado ('waitGo'): despega tripDelay s tras INICIAR el gesto.
    // Mientras tanto el rayo sigue PEGADO a su losa vieja (se va nativo con
    // ella); al despegar persigue el destino VIVO (que aún viene llegando) →
    // efecto "te sigue de cerca" sin ir soldado al scroll.
    if (guide.trip){
      const tr = guide.trip;
      const secA = document.getElementById(tr.from);
      const aTop = secA ? secA.getBoundingClientRect().top : 1e9;
      if (Math.abs(aTop) <= 4 && !moving){ guide.trip = null; return; } // gesto abortado: la losa origen volvió a asentar
      if (REDUCED){ guide.trip = null; mountInStop(tr.to, 1); return; }

      tr.t = (tr.t || 0) + dt;
      if (tr.t >= GUIDE.tripDelay){
        const from = portalGuide();
        const a = STOPS[tr.from] || {};
        tr.ryFrom = guide.ryAcc;   // orientación con la que DESPEGA (lo girado antes)
        tr.pose = {
          x: from.x, y: from.y, size: from.size,
          // ry incluye el acumulado ⇒ el vuelo arranca exactamente en la pose
          // en la que estaba parado (sin brinco al despegar)
          rx: a.rx || 0, ry: (a.ry || 0) + guide.ryAcc, rz: a.rz || 0,
          op: a.op != null ? a.op : 1,
          dim: a.dim != null ? a.dim : 1,
          halo: a.halo || 0,
          z: (STOPS[tr.to] && STOPS[tr.to].z != null) ? STOPS[tr.to].z : -1,
        };
        tr.phase = (GUIDE.anticip > 0 && !REDUCED) ? 'anticipate' : 'move';
        tr.u = 0;
      }
      return;
    }

    // PEGADO en un stop
    if (guide.mode === 'stuck' && guide.stuckAt !== 'dock'){
      const cur = guide.stuckAt;
      const st = stopOf(cur);
      if (!st){ hideGuide(); return; }
      if (centerId === cur){
        // despegue anticipado: la losa empieza a irse → programa el viaje YA
        // (el temporizador corre desde el arranque del gesto)
        const sec = document.getElementById(cur);
        const srTop = sec ? sec.getBoundingClientRect().top : 0;
        // Solo escritorio: en móvil esto programaría un viaje que el candado
        // de arriba anula al cuadro siguiente — un cuadro perdido y un parpadeo.
        if (!mqMobile.matches && moving && Math.abs(srTop) > 12){
          const nb = neighborStop(cur, srTop < 0 ? 1 : -1);
          if (nb){ guide.trip = { from: cur, to: nb, phase: 'waitGo', t: 0, u: 0 }; return; }
        }
        // SOLUCIÓN (2026-08-31): entra en sincronía con el texto — espera a que
        // la animación de #what arranque su 3ª fase (las cifras en negritas) y
        // recién ahí sube de opacidad, en 0.7 s. Los demás stops conservan su
        // fade rápido de 0.25 s. Mientras la compuerta está cerrada el guía ya
        // está montado pero en opacidad 0 (invisible).
        const gated = cur === 'what' && !guide.solGate;
        if (!gated) guide.fade = Math.min(1, guide.fade + dt / (cur === 'what' ? 0.7 : 0.25));
        const snap = JSON.stringify(st);
        if (snap !== guide.snap){ mountInStop(cur, guide.fade); return; } // edición en vivo (#tune)
        gEl.style.opacity = String((st.op != null ? st.op : 1) * guide.fade);
        if (gHalo) gHalo.style.opacity = haloDe(st.halo, guide.fade);
      } else if (centerId && stopOf(centerId) && !mqMobile.matches){   // viajes: solo escritorio
        guide.trip = { from: cur, to: centerId, phase: 'waitGo', t: 0, u: 0 };
      } else {
        guide.fade -= dt / 0.25; // losa sin stop → se va con su losa y se desvanece
        if (guide.fade <= 0){ hideGuide(); return; }
        gEl.style.opacity = String((st.op != null ? st.op : 1) * guide.fade);
        if (gHalo) gHalo.style.opacity = haloDe(st.halo, guide.fade);
      }
      return;
    }

    // PEGADO al dock (sticky): el halo de la entrada se desvanece
    if (guide.mode === 'stuck' && guide.stuckAt === 'dock'){
      guide.dockT += dt;
      if (gHalo) gHalo.style.opacity = String(Math.max(0, 1 - guide.dockT / 0.5) * GUIDE.haloMax);
      if (centerId && stopOf(centerId)){ guide.fade = 0; mountInStop(centerId, 0); } // reaparece en el stop
      return;
    }

    // OCULTO: decidir presencia.
    /* ⚠️ CRÍTICOS SE EVALÚA PRIMERO. En móvil `batVisFrac() >= 0.75` y un
       `centerId` con parada pueden ser ciertos A LA VEZ (scroll libre, batería
       sticky alta); en escritorio no, porque el paginador hace que el centro sea
       `problems` siempre que estás en Críticos. Si se montara la parada antes,
       esa rama retorna y el acople no tendría turno nunca. Con la lista blanca
       actual la ventana está vacía, pero no conviene depender de eso. */
    const critAhora = (centerId === 'problems') || (mqMobile.matches && batVisFrac() >= 0.75);
    if (!critAhora && centerId && stopOf(centerId)){
      guide.fade = 0;
      mountInStop(centerId, 0); // fade-in lo hace el branch pegado
      return;
    }
    if (critAhora){
      if (guide.batOn){ mountInDock(); guide.dockT = 1; return; } // regresa al dock sticky ya cargado
      if (!guide.armed) return;
      // gate del preloader (refresh sobre Críticos): esperar a que desaparezca
      if (!guide.preGone){
        const pre = document.getElementById('preloader');
        guide.preGone = !pre || pre.style.display === 'none' || getComputedStyle(pre).display === 'none';
        if (!guide.preGone) return;
      }
      // Móvil: dispara en cuanto el 75% de la batería es visible, aunque el
      // scroll siga en movimiento (free scroll: la entrada persigue el hueco vivo).
      const landed = mqMobile.matches
        ? batVisFrac() >= 0.75
        : (probTop <= innerHeight * 0.04 && probTop > -innerHeight);
      if (landed && (!moving || mqMobile.matches)){
        if (!guide.settleAt) guide.settleAt = now;
        if ((now - guide.settleAt) / 1000 >= GUIDE.delay){
          const s0 = Math.max(120, heroFrameW() * GUIDE.scaleIn);
          const eb = Math.min(s0, GUIDE.maxRes || 640);
          document.body.appendChild(gEl);
          guide.baseSize = eb;
          guide.entryScale0 = s0 / eb; // tamaño visual inicial por transform
          Object.assign(gEl.style, {
            display: '', position: 'fixed', left: '0px', top: '0px',
            width: eb + 'px', height: eb + 'px', margin: '0', pointerEvents: 'none',
          });
          const cv = gCanvas(); if (cv) cv.style.opacity = '0';
          guide.mode = 'flying';
          guide.entry = { u: REDUCED ? 1 : 0 };
          guide.settleAt = 0;
        }
      } else guide.settleAt = 0;
      return;
    }
  }

  // Recalcular el montaje pegado al cambiar el tamaño de la ventana
  /* ⚠️ CON REBOTE, y es el mayor riesgo de regresión de todo esto: en móvil la
     barra de URL dispara `resize` MIENTRAS SCROLLEAS, y re-montar en caliente a
     media scrolleada fue la causa raíz documentada del «v75 trabado». Además se
     ignoran los cambios de solo-alto menores a 140px, que son justo esa barra
     apareciendo y desapareciendo. Nada de `ResizeObserver` sobre el body. */
  let rzT = 0, rzW = window.innerWidth, rzH = window.innerHeight;
  window.addEventListener('resize', () => {
    const dW = Math.abs(window.innerWidth - rzW), dH = Math.abs(window.innerHeight - rzH);
    if (mqMobile.matches && dW === 0 && dH < 140) return;   // jitter de la barra de URL
    rzW = window.innerWidth; rzH = window.innerHeight;
    clearTimeout(rzT);
    rzT = setTimeout(() => {
      if (guide.mode !== 'stuck') return;
      if (guide.stuckAt === 'dock') mountInDock();
      else if (guide.stuckAt) mountInStop(guide.stuckAt, guide.fade);
    }, mqMobile.matches ? 250 : 0);
  });

  if (gEl) hideGuide(); // estado inicial: oculto (el hero tiene su propio render)

  // Loop maestro — guía + spin idle de los renders en layout
  let last = performance.now();
  function tick(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    guideFrame(dt, now);
    for (const key of Object.keys(items)){
      // El rayo del hero NO gira hasta que la intro ATERRIZA. Antes la condición
      // era `intro.active`, que solo cubre 'hold' y 'fly': durante 'idle' —o sea
      // mientras la página carga y la pantalla de carga ya está a la vista— el
      // giro corría y acumulaba ángulo, así que el logo del preloader salía
      // volteado de lado en vez de de frente. (2026-09-07)
      if (intro.state !== 'done' && TRAVELERS.includes(key)) continue;
      const it = items[key], val = VALUES[key];
      if (!val || !val.visible || !val.spin || !it.pivot) continue;
      it.spinAcc += val.spin * dt;
      applyRotation(it);
      renderNow(it);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  setupIntro();
  applyAll();

  const api = {
    values: VALUES, intro: INTRO, guide: GUIDE, stops: STOPS, stopsM: STOPS_M, labels: LABELS, items,
    apply, applyAll, sectionProgress,
    holdIntro, flyIntro, replayIntro, cancelIntro, introApply,
    introState: () => intro.state,
    // Snapshot de SOLO LECTURA del guía — para depurar viajes/orientación desde
    // la consola o una prueba headless. La página no lo usa. `pivotRy` es el
    // giro en Y realmente aplicado (grados): sirve para detectar brincos al
    // aterrizar comparando cuadros consecutivos.
    guideState: () => ({
      mode: guide.mode, stuckAt: guide.stuckAt, flying: !!guide.trip,
      phase: guide.trip ? guide.trip.phase : null,
      leg: guide.trip ? (guide.trip.from + '→' + guide.trip.to) : null,
      ryAcc: guide.ryAcc, fade: +guide.fade.toFixed(2),
      pivotRy: (items.guide && items.guide.pivot)
        ? +(items.guide.pivot.rotation.y * 180 / Math.PI).toFixed(1) : null,
    }),
    tunePristine: TUNE_PRISTINE, // defaults del código por key (para que #tune selle sus guardados)
  };
  window.LOIALT_ANIM = api;
  return api;
}
