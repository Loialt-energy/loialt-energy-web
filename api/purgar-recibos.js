// ============================================================================
// /api/purgar-recibos — borra los recibos de luz que ya cumplieron su plazo.
//
// POR QUÉ EXISTE: `aviso-privacidad.html` §2.1 promete eliminar el recibo «al
// concluir la evaluación o, a más tardar, a los doce meses». Eso es una
// obligación legal, y hasta ahora dependía de que alguien se acordara de entrar
// al panel cada trimestre. Una promesa que se cumple sólo si alguien se acuerda
// es una promesa que tarde o temprano se incumple.
//
// Lo dispara el cron de Vercel (ver `crons` en vercel.json), todos los días.
// Correrlo a diario no borra de más —el corte son 12 meses— y en cambio
// garantiza que ningún archivo pase un día del plazo prometido.
//
// ⚠️ VARIABLES DE ENTORNO (Vercel → Settings → Environment Variables):
//   SUPABASE_URL          ya existe, la usa /api/contacto
//   SUPABASE_SERVICE_KEY  ya existe, la usa /api/contacto
//   CRON_SECRET           NUEVA. Sin ella el endpoint se niega a actuar.
//
// Se puede llamar a mano con `?seco=1` para ver qué borraría sin borrar nada.
// ============================================================================

const MESES = 12;
const BUCKET = 'recibos';

export default async function handler(req, res) {
  // ── Puerta: sólo el cron de Vercel, o quien tenga el secreto ──────────────
  // Sin CRON_SECRET configurada el endpoint NO actúa. Es a propósito: es
  // preferible que la purga no corra —y se note en el log— a que quede un
  // endpoint destructivo abierto a cualquiera que adivine la ruta.
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    console.error('[purga] falta CRON_SECRET: no se purga nada');
    return res.status(503).json({ error: 'Purga no configurada' });
  }
  if (req.headers.authorization !== `Bearer ${secreto}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const URL_SB = process.env.SUPABASE_URL;
  const KEY_SB = process.env.SUPABASE_SERVICE_KEY;
  if (!URL_SB || !KEY_SB) {
    console.error('[purga] faltan SUPABASE_URL o SUPABASE_SERVICE_KEY');
    return res.status(500).json({ error: 'Configuración incompleta' });
  }

  const seco = 'seco' in (req.query || {});
  const corte = new Date(Date.now() - MESES * 30.44 * 24 * 3600 * 1000);
  const corteISO = corte.toISOString();
  const cabeceras = { apikey: KEY_SB, Authorization: `Bearer ${KEY_SB}` };

  const resumen = { corte: corteISO, seco, filas: 0, archivos: 0, huerfanos: 0, errores: [] };

  // ── 1 · Recibos referenciados desde la tabla ──────────────────────────────
  let filas = [];
  try {
    const r = await fetch(
      `${URL_SB}/rest/v1/contactos` +
      `?select=id,recibo_ruta&recibo_ruta=not.is.null&created_at=lt.${corteISO}`,
      { headers: cabeceras });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    filas = await r.json();
  } catch (e) {
    // Si `created_at` no existiera, aquí se ve en claro en el log en vez de
    // fallar en silencio y dar la purga por hecha.
    console.error('[purga] no se pudo consultar contactos:', e.message);
    return res.status(502).json({ error: 'No se pudo consultar contactos', detalle: e.message });
  }

  for (const f of filas) {
    if (!seco) {
      const ok = await borrarObjeto(URL_SB, cabeceras, f.recibo_ruta, resumen);
      if (!ok) continue;
      // El archivo se va primero: si luego falla el UPDATE, la próxima pasada
      // reintenta sobre un objeto ya inexistente, que Storage acepta sin ruido.
      // Al revés quedaría una fila limpia apuntando a un archivo vivo.
      const u = await fetch(`${URL_SB}/rest/v1/contactos?id=eq.${f.id}`, {
        method: 'PATCH',
        headers: { ...cabeceras, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ recibo_ruta: null, recibo_nombre: null }),
      });
      if (!u.ok) { resumen.errores.push(`fila ${f.id}: ${u.status}`); continue; }
    }
    resumen.filas++;
    resumen.archivos++;
  }

  // ── 2 · Huérfanos: archivos sin fila que los apunte ───────────────────────
  // Pasan cuando la subida funciona y el INSERT posterior falla. Un barrido que
  // sólo mirara la tabla no los vería NUNCA, y seguirían ahí para siempre.
  // Se aprovecha que `/api/contacto` guarda bajo `AAAA-MM-DD/…`: basta leer el
  // nombre de la carpeta para saber si ya venció.
  try {
    const carpetas = await listar(URL_SB, cabeceras, '');
    for (const c of carpetas) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.name)) continue;
      if (new Date(c.name + 'T23:59:59Z') >= corte) continue;
      for (const o of await listar(URL_SB, cabeceras, c.name)) {
        const ruta = `${c.name}/${o.name}`;
        if (!seco && !(await borrarObjeto(URL_SB, cabeceras, ruta, resumen))) continue;
        resumen.huerfanos++;
      }
    }
  } catch (e) {
    resumen.errores.push(`listado: ${e.message}`);
  }

  console.log('[purga]', JSON.stringify(resumen));
  return res.status(200).json(resumen);
}

async function borrarObjeto(URL_SB, cabeceras, ruta, resumen) {
  const r = await fetch(`${URL_SB}/storage/v1/object/${BUCKET}/${encodeURI(ruta)}`,
    { method: 'DELETE', headers: cabeceras });
  // 404 = ya no estaba; cuenta como éxito, que es lo que se quería lograr.
  if (r.ok || r.status === 404) return true;
  resumen.errores.push(`archivo ${ruta}: ${r.status}`);
  return false;
}

async function listar(URL_SB, cabeceras, prefijo) {
  const r = await fetch(`${URL_SB}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { ...cabeceras, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: prefijo, limit: 1000, offset: 0 }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
  return await r.json();
}
