// ============================================================
// LOIALT TUNE — panel de ajuste en vivo sobre la página real.
// Se activa con #tune en la URL. Edita VALUES (loialt-anim.js) en vivo.
// "Copiar valores" genera la tabla lista para pegar en loialt-anim.js.
// ============================================================

const SLIDERS = [
  { k:'x',       label:'x (vw)',    min:-50,  max:150, step:0.5  },
  { k:'y',       label:'y (vh)',    min:-50,  max:150, step:0.5  },
  { k:'scale',   label:'escala',    min:0.05, max:4,   step:0.01 },
  { k:'rx',      label:'rx (°)',    min:-180, max:180, step:1    },
  { k:'ry',      label:'ry (°)',    min:-180, max:180, step:1    },
  { k:'rz',      label:'rz (°)',    min:-180, max:180, step:1    },
  { k:'z',       label:'z-index',   min:-5,   max:60,  step:1    },
  { k:'opacity', label:'opacidad',  min:0,    max:1,   step:0.01 },
  { k:'spin',    label:'giro (rad/s)', min:-3, max:3,  step:0.01 },
];

export function initTune(api){
  const existing = document.getElementById('loialtTune');
  if (existing){ existing.style.display = ''; return; }
  const { values, labels } = api;

  const root = document.createElement('div');
  root.id = 'loialtTune';
  // Lenis se queda con la rueda de TODA la página (smoothWheel), así que aunque
  // el pager exima a este panel, el navegador nunca llegaba a hacer scroll
  // nativo dentro de él y la lista quedaba cortada sin poder bajar.
  // `data-lenis-prevent` es la vía que Lenis reconoce para saltarse un
  // contenedor scrolleable.
  root.setAttribute('data-lenis-prevent', '');
  root.innerHTML = `<style>
    #loialtTune{ position:fixed; top:12px; right:12px; z-index:100000; width:300px; max-height:calc(100vh - 24px);
      overflow:auto; overscroll-behavior:contain; background:rgba(4,16,36,.93); border:1px solid rgba(120,184,91,.35);
      border-radius:12px; color:#eaf0f7; font:11px/1.5 "JetBrains Mono",ui-monospace,monospace;
      -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); box-shadow:0 18px 50px rgba(0,0,0,.5); }
    #loialtTune *{ box-sizing:border-box; }
    #loialtTune .lt-head{ position:sticky; top:0; display:flex; align-items:center; justify-content:space-between;
      gap:8px; padding:10px 12px; background:rgba(4,16,36,.97); border-bottom:1px solid rgba(120,184,91,.25);
      cursor:move; user-select:none; touch-action:none; }
    #loialtTune.lt-min{ overflow:hidden; }
    #loialtTune.lt-min > :not(.lt-head){ display:none; }
    #loialtTune.lt-min .lt-head{ border-bottom:none; }
    #loialtTune .lt-title{ font-weight:700; letter-spacing:.12em; color:#78b85b; }
    #loialtTune .lt-copy{ border:1px solid #78b85b; background:transparent; color:#78b85b; border-radius:7px;
      padding:5px 10px; font:inherit; font-weight:700; cursor:pointer; }
    #loialtTune .lt-copy:hover{ background:#78b85b; color:#021838; }
    #loialtTune details{ border-bottom:1px solid rgba(255,255,255,.08); }
    #loialtTune summary{ padding:9px 12px; cursor:pointer; font-weight:700; letter-spacing:.06em; color:#cfe0d2;
      list-style:none; display:flex; justify-content:space-between; align-items:center; }
    #loialtTune summary::-webkit-details-marker{ display:none; }
    #loialtTune summary::after{ content:'+'; color:#78b85b; }
    #loialtTune details[open] summary::after{ content:'–'; }
    #loialtTune .lt-body{ padding:2px 12px 12px; display:grid; gap:6px; }
    #loialtTune .lt-row{ display:grid; grid-template-columns:78px 1fr 52px; gap:8px; align-items:center; }
    #loialtTune .lt-row label{ color:#9fb0c3; }
    #loialtTune input[type="range"]{ width:100%; accent-color:#78b85b; height:14px; }
    #loialtTune input[type="number"]{ width:100%; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.15);
      border-radius:5px; color:#eaf0f7; font:inherit; padding:2px 4px; }
    #loialtTune .lt-flags{ display:flex; gap:14px; padding:4px 0 2px; align-items:center; color:#9fb0c3; }
    #loialtTune .lt-flags label{ display:flex; gap:5px; align-items:center; cursor:pointer; }
    #loialtTune input[type="checkbox"]{ accent-color:#78b85b; }
    #loialtTune select{ background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.15); border-radius:5px;
      color:#eaf0f7; font:inherit; padding:2px 4px; }
    #loialtTune .lt-ok{ color:#78b85b; font-weight:700; }
    /* MODO COMPACTO en viewport angosto (2026-09-22). Afinar las paradas de
       MÓVIL obliga a tener el panel abierto EN ancho de móvil, y a 300px de
       ancho por todo el alto tapaba dos tercios de la pantalla: no se veía lo
       que se estaba ajustando, que es justo para lo que sirve el panel.
       Se encoge el PANEL, nunca la vista de la página. La lista sigue completa,
       solo se scrollea más (y el scroll ya funciona, por el atributo de Lenis).
       El panel además se puede ARRASTRAR por su cabecera y minimizar con «–».
       OJO: este CSS vive dentro de una plantilla de JS, así que aquí NO se
       pueden escribir comillas invertidas — cierran la cadena y tumban el
       módulo entero. Misma trampa que un cierre de hoja de estilos dentro de un
       comentario CSS. */
    @media (max-width:900px){
      #loialtTune{ width:11.6rem; max-height:40svh; top:8px; right:8px;
        font-size:10px; line-height:1.45; border-radius:9px; }
      #loialtTune .lt-head{ padding:6px 8px; gap:5px; }
      #loialtTune .lt-title{ font-size:9px; letter-spacing:.08em; }
      #loialtTune .lt-copy{ padding:3px 6px; font-size:9px; border-radius:5px; }
      #loialtTune summary{ padding:6px 8px; letter-spacing:.03em; }
      #loialtTune .lt-body{ padding:2px 8px 8px; gap:4px; }
      /* La columna de la etiqueta pasa de 78px a 52: a 186px de panel, 78 se
         comía el espacio del deslizador y quedaba inusable. */
      #loialtTune .lt-row{ grid-template-columns:52px 1fr 36px; gap:5px; }
      #loialtTune input[type="range"]{ height:12px; }
      #loialtTune input[type="number"]{ padding:1px 3px; }
      #loialtTune .lt-flags{ gap:8px; }
    }
</style>
  <div class="lt-head">
    <span class="lt-title">LOIALT · TUNE</span>
    <div style="display:flex; gap:6px;">
      <button class="lt-copy" type="button">Copiar valores</button>
      <button class="lt-copy lt-min-btn" type="button" aria-label="Minimizar" style="padding:5px 9px;">–</button>
      <button class="lt-copy lt-close" type="button" aria-label="Cerrar" style="padding:5px 8px;">×</button>
    </div>
  </div>
  <div class="lt-intro-btns" style="display:flex; gap:8px; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.08);">
    <button class="lt-copy lt-replay" type="button">↻ Replay intro</button>
    <button class="lt-copy lt-hold" type="button">Sostener intro</button>
  </div>`;

  const fmt = n => (typeof n === 'number' && !Number.isInteger(n)) ? +n.toFixed(2) : n;

  // --- Guardado por sección (localStorage; loialt-anim lo carga al iniciar) ---
  const LS_PREFIX = 'loialtTune:';
  function addSave(body, entries){
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; gap:8px; padding-top:6px;';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lt-copy'; b.textContent = '💾 Guardar';
    b.title = 'Guarda esta sección en el navegador: sobrevive recargas y nuevos prompts';
    b.addEventListener('click', () => {
      try{
        entries.forEach(en => {
          const src = en.pick ? Object.fromEntries(en.pick.map(k => [k, en.obj[k]])) : en.obj;
          // sella el guardado con el default del CÓDIGO vigente ahora mismo — si
          // luego el código cambia ese default, loialt-anim descarta este guardado
          // solo (ver TUNE_PRISTINE), en vez de pisarlo en silencio para siempre.
          const base = api.tunePristine && api.tunePristine[en.key];
          const payload = base ? { base, val: src } : src;
          localStorage.setItem(LS_PREFIX + en.key, JSON.stringify(payload));
        });
        b.textContent = 'Guardado ✓'; b.classList.add('lt-ok');
        setTimeout(() => { b.textContent = '💾 Guardar'; b.classList.remove('lt-ok'); }, 1200);
      }catch(e){}
    });
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'lt-copy'; c.textContent = 'olvidar';
    c.title = 'Borra lo guardado de esta sección (al recargar vuelven los valores del código)';
    c.addEventListener('click', () => {
      entries.forEach(en => localStorage.removeItem(LS_PREFIX + en.key));
      c.textContent = '✓'; setTimeout(() => { c.textContent = 'olvidar'; }, 1000);
    });
    wrap.append(b, c);
    body.appendChild(wrap);
  }

  // --- Secciones INTRO (pose inicial de la separación preloader→hero) ---
  const INTRO_SLIDERS = [
    { k:'x',     label:'x (vw)',  min:0,    max:100, step:0.25 },
    { k:'y',     label:'y (vh)',  min:0,    max:100, step:0.25 },
    { k:'scale', label:'escala',  min:0.05, max:3,   step:0.005 },
  ];
  const introLabels = { heroLogo:'INTRO · rayo (pose inicial)', lettermark:'INTRO · wordmark (pose inicial)' };
  for (const key of Object.keys(introLabels)){
    const v = api.intro[key]; if (!v) continue;
    const det = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = introLabels[key];
    det.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'lt-body';
    for (const c of INTRO_SLIDERS){
      const row = document.createElement('div');
      row.className = 'lt-row';
      const lab = document.createElement('label');
      lab.textContent = c.label;
      const rng = document.createElement('input');
      rng.type = 'range'; rng.min = c.min; rng.max = c.max; rng.step = c.step; rng.value = v[c.k] ?? c.min;
      const num = document.createElement('input');
      num.type = 'number'; num.min = c.min; num.max = c.max; num.step = c.step; num.value = fmt(v[c.k] ?? 0);
      const set = val => {
        val = parseFloat(val); if (Number.isNaN(val)) return;
        v[c.k] = val; rng.value = val; num.value = fmt(val);
        api.introApply();
      };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      // el auto-cálculo llena los null al sostener/replay: refrescar al abrir
      det.addEventListener('toggle', () => { if (v[c.k] != null){ rng.value = v[c.k]; num.value = fmt(v[c.k]); } });
      row.append(lab, rng, num);
      body.appendChild(row);
    }
    const durRow = document.createElement('div');
    durRow.className = 'lt-row';
    if (key === 'heroLogo'){
      const lab = document.createElement('label'); lab.textContent = 'vuelo (s)';
      const rng = document.createElement('input');
      rng.type = 'range'; rng.min = 0.1; rng.max = 3; rng.step = 0.05; rng.value = api.intro.duration;
      const num = document.createElement('input');
      num.type = 'number'; num.min = 0.1; num.max = 3; num.step = 0.05; num.value = api.intro.duration;
      const set = val => { val = parseFloat(val); if (Number.isNaN(val)) return;
        api.intro.duration = val; rng.value = val; num.value = val; };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      durRow.append(lab, rng, num);
      body.appendChild(durRow);
    }
    addSave(body, key === 'heroLogo'
      ? [{ key:'intro.heroLogo', obj:v, pick:['x','y','scale'] }, { key:'intro', obj:api.intro, pick:['duration'] }]
      : [{ key:'intro.lettermark', obj:v, pick:['x','y','scale'] }]);
    det.appendChild(body);
    root.appendChild(det);
  }

  for (const key of Object.keys(values)){
    const v = values[key];
    const det = document.createElement('details');
    if (key === 'heroLogo') det.open = true;
    const sum = document.createElement('summary');
    sum.textContent = labels[key] || key;
    det.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'lt-body';

    const flags = document.createElement('div');
    flags.className = 'lt-flags';
    const visLab = document.createElement('label');
    const vis = document.createElement('input');
    vis.type = 'checkbox'; vis.checked = v.visible;
    vis.addEventListener('input', () => { v.visible = vis.checked; api.apply(key); });
    visLab.append(vis, 'visible');
    const modeSel = document.createElement('select');
    for (const m of ['layout','fixed']){
      const o = document.createElement('option');
      o.value = m; o.textContent = (m === 'layout') ? 'modo: layout' : 'modo: fijado (vw/vh)';
      if (v.mode === m) o.selected = true;
      modeSel.appendChild(o);
    }
    modeSel.addEventListener('input', () => { v.mode = modeSel.value; api.apply(key); });
    flags.append(visLab, modeSel);
    body.appendChild(flags);

    for (const c of SLIDERS){
      const row = document.createElement('div');
      row.className = 'lt-row';
      const lab = document.createElement('label');
      lab.textContent = c.label;
      const rng = document.createElement('input');
      rng.type = 'range'; rng.min = c.min; rng.max = c.max; rng.step = c.step; rng.value = v[c.k];
      const num = document.createElement('input');
      num.type = 'number'; num.min = c.min; num.max = c.max; num.step = c.step; num.value = fmt(v[c.k]);
      const set = val => {
        val = parseFloat(val); if (Number.isNaN(val)) return;
        v[c.k] = val; rng.value = val; num.value = fmt(val);
        api.apply(key);
      };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      row.append(lab, rng, num);
      body.appendChild(row);
    }
    addSave(body, [{ key:'values.' + key, obj:v }]);
    det.appendChild(body);
    root.appendChild(det);
  }

  // --- Sección GUÍA · Críticos (entrada del rayo guía a la batería) ---
  (function(){
    const g = api.guide; if (!g) return;
    const det = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = 'GUÍA · Críticos (entrada)';
    det.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'lt-body';
    const rows = [
      { k:'delay',   label:'pausa (s)',        min:0,   max:1,   step:0.05 },
      { k:'enter',   label:'entrada (s)',      min:0.3, max:3,   step:0.05 },
      { k:'scaleIn', label:'escala inicio (×)',min:0.5, max:3,   step:0.05 },
      { k:'fromX',   label:'origen x (vw)',    min:-30, max:100, step:0.5 },
      { k:'fromY',   label:'origen y (vh)',    min:-30, max:100, step:0.5 },
      { k:'arc',     label:'arco (vw)',        min:-10, max:10,  step:0.5 },
      { k:'flip',    label:'giro entrada (°)', min:-360, max:360, step:5 },
      { k:'tripDelay', label:'pausa viaje (s)', min:0,  max:1,   step:0.05 },
      { k:'anticip', label:'anticipo (s)',     min:0,   max:0.6, step:0.05 },
      { k:'travel',  label:'viaje (s)',        min:0.15, max:2,  step:0.05 },
      { k:'tripArc', label:'arco (vh)',        min:-12, max:12,  step:0.5 },
      { k:'tumble',  label:'vueltas (360°)',   min:0,   max:2,   step:1 },
      { k:'shrink',  label:'compactado (0-1)', min:0,   max:0.8, step:0.05 },
            { k:'haloMax', label:'halo (entrada)', min:0, max:1, step:0.02 },
{ k:'fit',     label:'acople (fit)',     min:1,   max:3,   step:0.01 },
      { k:'dx',      label:'ajuste x (%)',     min:-60, max:60,  step:0.5 },
      { k:'dy',      label:'ajuste y (%)',     min:-60, max:60,  step:0.5 },
    ];
    for (const cfg of rows){
      if (g[cfg.k] == null) continue;
      const row = document.createElement('div');
      row.className = 'lt-row';
      const lab = document.createElement('label'); lab.textContent = cfg.label;
      const rng = document.createElement('input');
      rng.type = 'range'; rng.min = cfg.min; rng.max = cfg.max; rng.step = cfg.step; rng.value = g[cfg.k];
      const num = document.createElement('input');
      num.type = 'number'; num.min = cfg.min; num.max = cfg.max; num.step = cfg.step; num.value = fmt(g[cfg.k]);
      const set = val => {
        val = parseFloat(val); if (Number.isNaN(val)) return;
        g[cfg.k] = val; rng.value = val; num.value = fmt(val); // guideFrame lo lee en vivo
      };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      row.append(lab, rng, num);
      body.appendChild(row);
    }
    addSave(body, [{ key:'guide', obj:g }]);
    det.appendChild(body);
    root.appendChild(det);
  })();

  // --- Secciones de STOPS (poses de espera del guía por diapositiva) ---
  // El mismo constructor sirve para las de ESCRITORIO y las de MÓVIL: son dos
  // mapas hermanos y planos (STOPS / STOPS_M), no un objeto anidado — por eso
  // el exportador de abajo puede serializar los dos con el mismo `fmt`.
  const stopLabels = { tecnologia:'GUÍA · Tecnología (espera)', metrics:'GUÍA · Métricas (espera)', faq:'GUÍA · FAQ (espera)' };
  function seccionDeStop(sid, st, claveGuardado, rotulo){
    const det = document.createElement('details');
    const sum = document.createElement('summary');
    sum.textContent = rotulo;
    det.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'lt-body';
    const rows = [
      { k:'x',    label:'x (vw)',       min:-20, max:120, step:0.5 },
      { k:'y',    label:'y (vh)',       min:-20, max:120, step:0.5 },
      { k:'s',    label:'escala (×)',   min:0.2, max:5,   step:0.05 },
      { k:'rx',   label:'rx (°)',       min:-90, max:90,  step:1 },
      { k:'ry',   label:'ry (°)',       min:-90, max:90,  step:1 },
      { k:'op',   label:'opacidad',     min:0,   max:1,   step:0.01 },
      { k:'dim',  label:'brillo',       min:0.3, max:1,   step:0.02 },
      { k:'halo', label:'halo',         min:0,   max:1,   step:0.02 },
      { k:'z',    label:'z-index',      min:-2,  max:60,  step:1 },
    ];
    for (const cfg of rows){
      if (st[cfg.k] == null) continue;
      const row = document.createElement('div');
      row.className = 'lt-row';
      const lab = document.createElement('label'); lab.textContent = cfg.label;
      const rng = document.createElement('input');
      rng.type = 'range'; rng.min = cfg.min; rng.max = cfg.max; rng.step = cfg.step; rng.value = st[cfg.k];
      const num = document.createElement('input');
      num.type = 'number'; num.min = cfg.min; num.max = cfg.max; num.step = cfg.step; num.value = fmt(st[cfg.k]);
      const set = val => {
        val = parseFloat(val); if (Number.isNaN(val)) return;
        st[cfg.k] = val; rng.value = val; num.value = fmt(val); // renderStop lo lee en vivo
      };
      rng.addEventListener('input', () => set(rng.value));
      num.addEventListener('input', () => set(num.value));
      row.append(lab, rng, num);
      body.appendChild(row);
    }
    addSave(body, [{ key:claveGuardado, obj:st }]);
    det.appendChild(body);
    root.appendChild(det);
  }
  /* Cada parada de MÓVIL va JUSTO DEBAJO de su pareja de escritorio, no todas
     juntas al final: el panel mide ~4000px y al fondo no las encuentra nadie
     (pasó, 2026-09-22). Así además la pareja escritorio/móvil se lee de un
     vistazo. Se dibujan SIEMPRE, no solo por debajo de 900px, para poder
     exportarlas desde el escritorio — pero OJO: solo se ven EN VIVO mientras
     `matchMedia('(max-width:900px)')` coincida, así que para afinarlas hay que
     estar en el modo dispositivo de DevTools, o en el teléfono. */
  const stopsM = api.stopsM || {};
  for (const sid of Object.keys(api.stops || {})){
    const rotulo = stopLabels[sid] || ('GUÍA · ' + sid);
    seccionDeStop(sid, api.stops[sid], 'stop.' + sid, rotulo);
    if (stopsM[sid]) seccionDeStop(sid, stopsM[sid], 'stopM.' + sid, '📱 ' + rotulo + ' · MÓVIL');
  }
  // Por si algún día hay una parada de móvil sin equivalente en escritorio.
  for (const sid of Object.keys(stopsM)){
    if (!(api.stops || {})[sid]) seccionDeStop(sid, stopsM[sid], 'stopM.' + sid, '📱 GUÍA · ' + sid + ' · MÓVIL');
  }

  // --- Mover el panel (arrastrando la cabecera) + minimizar ---
  const head = root.querySelector('.lt-head');
  const minBtn = root.querySelector('.lt-min-btn');
  minBtn.addEventListener('click', () => {
    const min = root.classList.toggle('lt-min');
    minBtn.textContent = min ? '□' : '–';
    minBtn.setAttribute('aria-label', min ? 'Restaurar' : 'Minimizar');
  });
  let drag = null;
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return; // los botones no arrastran
    const r = root.getBoundingClientRect();
    // pasar de anclaje right → left para poder moverlo libre
    root.style.left = r.left + 'px'; root.style.top = r.top + 'px'; root.style.right = 'auto';
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const w = root.offsetWidth, h = root.offsetHeight;
    const x = Math.min(Math.max(e.clientX - drag.dx, -w + 60), innerWidth - 60);
    const y = Math.min(Math.max(e.clientY - drag.dy, 0), innerHeight - 40);
    root.style.left = x + 'px'; root.style.top = y + 'px';
  });
  head.addEventListener('pointerup', () => { drag = null; });
  head.addEventListener('pointercancel', () => { drag = null; });

  // --- Botones de intro ---
  root.querySelector('.lt-close').addEventListener('click', () => {
    root.style.display = 'none';
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch(e){}
  });
  root.querySelector('.lt-replay').addEventListener('click', () => api.replayIntro());
  const holdBtn = root.querySelector('.lt-hold');
  holdBtn.addEventListener('click', () => {
    if (api.introState() === 'hold'){ api.flyIntro(); holdBtn.textContent = 'Sostener intro'; }
    else { api.holdIntro(); holdBtn.textContent = 'Soltar (volar)'; }
  });

  // --- Copiar valores: tablas listas para pegar en loialt-anim.js ---
  const btn = root.querySelector('.lt-head .lt-copy');
  btn.addEventListener('click', async () => {
    const pad = Math.max(...Object.keys(values).map(k => k.length));
    const lines = Object.keys(values).map(k => {
      const v = values[k];
      const parts = [
        `mode:'${v.mode}'`, `visible:${v.visible}`,
        `x:${fmt(v.x)}`, `y:${fmt(v.y)}`,
        ...(v.w != null ? [`w:${fmt(v.w)}`, `h:${fmt(v.h)}`] : []),
        `scale:${fmt(v.scale)}`,
        `rx:${fmt(v.rx)}`, `ry:${fmt(v.ry)}`, `rz:${fmt(v.rz)}`,
        `z:${fmt(v.z)}`, `opacity:${fmt(v.opacity)}`, `spin:${fmt(v.spin)}`,
      ];
      return `  ${(k + ':').padEnd(pad + 1)} { ${parts.join(', ')} },`;
    });
    const iv = api.intro;
    const introLine = k => `  ${(k + ':').padEnd(12)} { x:${fmt(iv[k].x)}, y:${fmt(iv[k].y)}, scale:${fmt(iv[k].scale)} },`;
    const g = api.guide || {};
    const guideText = Object.keys(g).length
      ? `\n\nexport const GUIDE = {\n${Object.keys(g).map(k => `  ${k}: ${fmt(g[k])},`).join('\n')}\n};`
      : '';
    // Un solo serializador para los dos mapas: STOPS_M es plano a propósito,
    // justo para que `fmt` sirva igual (un objeto anidado saldría como
    // "[object Object]" y se pegaría corrupto en el código).
    const tabla = (nombre, mapa) => Object.keys(mapa).length
      ? `\n\nexport const ${nombre} = {\n${Object.keys(mapa).map(sid => `  ${sid}: { ${Object.keys(mapa[sid]).map(k => `${k}: ${fmt(mapa[sid][k])}`).join(', ')} },`).join('\n')}\n};`
      : '';
    const stopsText = tabla('STOPS', api.stops || {}) + tabla('STOPS_M', api.stopsM || {});
    const text = `// LOIALT TUNE — pegar en public/loialt-anim.js
export const VALUES = {
${lines.join('\n')}
};

export const INTRO = {
  duration: ${fmt(iv.duration)},
${introLine('heroLogo')}
${introLine('lettermark')}
};${guideText}${stopsText}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    console.log(text);
    btn.textContent = 'Copiado ✓'; btn.classList.add('lt-ok');
    setTimeout(() => { btn.textContent = 'Copiar valores'; btn.classList.remove('lt-ok'); }, 1400);
  });

  document.body.appendChild(root);
}
