// ============================================================================
// /api/contacto — recibe el formulario de la landing.
//
// Sustituye a Netlify Forms, que no tiene equivalente en Vercel. Hace tres
// cosas: guarda la fila en Supabase, sube el recibo al bucket privado y manda
// el aviso por correo.
//
// ⚠️ VARIABLES DE ENTORNO (Vercel → Settings → Environment Variables):
//   SUPABASE_URL          https://<ref>.supabase.co
//   SUPABASE_SERVICE_KEY  la clave `service_role`  ← SECRETA, se salta RLS
//   RESEND_API_KEY        para el aviso por correo  (opcional)
//   AVISO_PARA            destinatario del aviso    (por defecto el de Loialt)
//
// La clave de servicio NO puede ir nunca en el navegador: se salta todas las
// reglas de la base. Por eso esto vive en el servidor, que es justo lo que
// Netlify no ofrecía y por lo que en su día se descartó Resend.
// ============================================================================

export const config = { api: { bodyParser: false } };

const TOPE_BYTES = 4 * 1024 * 1024;   // 4 MB · ver la nota del esquema SQL
const TIPOS_OK = ['application/pdf', 'image/jpeg', 'image/png'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const URL_SB = process.env.SUPABASE_URL;
  const KEY_SB = process.env.SUPABASE_SERVICE_KEY;
  if (!URL_SB || !KEY_SB) {
    // Se registra en el log pero al visitante se le da un error genérico: no
    // conviene contarle a un desconocido cómo está montado el servidor.
    console.error('[contacto] faltan SUPABASE_URL o SUPABASE_SERVICE_KEY');
    return res.status(500).json({ error: 'Configuración incompleta' });
  }

  let campos, archivo;
  try {
    ({ campos, archivo } = await leerMultipart(req));
  } catch (e) {
    return res.status(e.codigo === 'GRANDE' ? 413 : 400).json({ error: e.message });
  }

  // Trampa para robots: el campo está fuera de pantalla, un humano nunca lo
  // rellena. Se responde 200 a propósito — si se devolviera un error, el robot
  // aprendería a evitarlo.
  if ((campos['bot-field'] || '').trim()) return res.status(200).json({ ok: true });

  const email  = (campos.email  || '').trim();
  const nombre = (campos.nombre || '').trim();
  if (!email || !nombre) return res.status(400).json({ error: 'Faltan el correo o el nombre' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Correo no válido' });

  // ── El recibo va primero: si falla la subida, no se guarda una fila que
  //    apunte a un archivo inexistente.
  let recibo_ruta = null;
  if (archivo && archivo.datos.length) {
    if (!TIPOS_OK.includes(archivo.tipo)) {
      return res.status(415).json({ error: 'El recibo debe ser PDF, JPG o PNG' });
    }
    const limpio = archivo.nombre.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80);
    const ruta = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${limpio}`;
    const r = await fetch(`${URL_SB}/storage/v1/object/recibos/${ruta}`, {
      method: 'POST',
      headers: {
        // ⚠️ Las DOS cabeceras. La llamada a la tabla ya las mandaba, pero esta
        // solo llevaba `Authorization` y Storage devolvía error: con las claves
        // nuevas (`sb_secret_…`) hace falta también `apikey`. Se detectó porque
        // el envío SIN adjunto daba 200 y CON adjunto daba 502 (2026-09-24).
        apikey: KEY_SB,
        Authorization: `Bearer ${KEY_SB}`,
        'Content-Type': archivo.tipo,
        'x-upsert': 'false',
      },
      body: archivo.datos,
    });
    if (!r.ok) {
      console.error('[contacto] subida del recibo falló:', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ error: 'No se pudo guardar el recibo' });
    }
    recibo_ruta = ruta;
  }

  const fila = {
    email,
    nombre,
    apellido:      campos.apellido        || null,
    empresa:       campos.empresa         || null,
    giro:          campos.giro            || null,
    telefono:      campos.telefono        || null,
    region:        campos.region          || null,
    tarifa_cfe:    campos['tarifa-cfe']   || null,
    gasto_mensual: campos['gasto-mensual']|| null,
    calificacion:  campos.calificacion    || null,
    origen:        campos.origen          || null,
    recibo_ruta,
    recibo_nombre: archivo ? archivo.nombre : null,
    user_agent:    (req.headers['user-agent'] || '').slice(0, 400),
    ip:            (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null,
  };

  const ins = await fetch(`${URL_SB}/rest/v1/contactos`, {
    method: 'POST',
    headers: {
      apikey: KEY_SB,
      Authorization: `Bearer ${KEY_SB}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(fila),
  });
  if (!ins.ok) {
    console.error('[contacto] insert falló', ins.status, await ins.text());
    return res.status(502).json({ error: 'No se pudo guardar el envío' });
  }

  // ── El aviso por correo NO puede tumbar el envío. Si Resend falla, el lead
  //    ya está guardado en la base: se registra el fallo y se responde OK.
  try { await avisar(fila); }
  catch (e) { console.error('[contacto] aviso por correo falló:', e.message); }

  return res.status(200).json({ ok: true });
}

// ── Aviso por correo ────────────────────────────────────────────────────────
// El correo lista campo y valor tal cual, para que quien lo abra pueda
// contestar sin entrar a Supabase. Es el mismo criterio que tenía el aviso de
// Netlify Forms.
async function avisar(f) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) return;                       // sin clave, no hay aviso y no pasa nada
  const para = process.env.AVISO_PARA || 'contacto@loialtenergy.com';
  const filas = [
    ['Correo', f.email], ['Nombre', [f.nombre, f.apellido].filter(Boolean).join(' ')],
    ['Empresa', f.empresa], ['Giro', f.giro], ['Teléfono', f.telefono], ['Zona', f.region],
    ['Tarifa CFE', f.tarifa_cfe], ['Gasto mensual', f.gasto_mensual],
    ['Calificación', f.calificacion], ['Origen', f.origen],
    ['Recibo', f.recibo_nombre ? `adjuntó «${f.recibo_nombre}» (está en Supabase › Storage › recibos)` : 'no adjuntó'],
  ].filter(([, v]) => v);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Loialt Energy <no-responder@loialtenergy.com>',
      to: [para],
      reply_to: f.email,               // responder va directo al prospecto
      subject: `Nuevo contacto — ${f.email}`,
      html: `<h2>Nuevo contacto desde loialtenergy.com</h2><table cellpadding="6">${
        filas.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapar(String(v))}</td></tr>`).join('')
      }</table>`,
    }),
  });
}

const escapar = (s) => s.replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Lectura del multipart ───────────────────────────────────────────────────
// A mano y sin dependencias: el formulario tiene una docena de campos y un
// archivo, así que meter una librería de parseo aquí sería más superficie de
// la que ahorra. Se corta en TOPE_BYTES para no cargar en memoria algo que
// Vercel va a rechazar igualmente.
async function leerMultipart(req) {
  const ct = req.headers['content-type'] || '';
  const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!/multipart\/form-data/i.test(ct) || !m) {
    const e = new Error('Se esperaba multipart/form-data'); e.codigo = 'FORMATO'; throw e;
  }
  const limite = Buffer.from(`--${m[1] || m[2]}`);

  const trozos = []; let total = 0;
  for await (const t of req) {
    total += t.length;
    if (total > TOPE_BYTES) {
      const e = new Error('El archivo supera los 4 MB'); e.codigo = 'GRANDE'; throw e;
    }
    trozos.push(t);
  }
  const cuerpo = Buffer.concat(trozos);

  const campos = {}; let archivo = null;
  let i = cuerpo.indexOf(limite);
  while (i !== -1) {
    const sig = cuerpo.indexOf(limite, i + limite.length);
    if (sig === -1) break;
    const parte = cuerpo.slice(i + limite.length, sig);
    const corte = parte.indexOf('\r\n\r\n');
    if (corte !== -1) {
      const cab = parte.slice(0, corte).toString('utf8');
      const val = parte.slice(corte + 4, parte.length - 2);      // -2 = el \r\n final
      const nom = cab.match(/name="([^"]*)"/i);
      const fic = cab.match(/filename="([^"]*)"/i);
      if (nom) {
        if (fic && fic[1]) {
          const tipo = (cab.match(/Content-Type:\s*([^\r\n]+)/i) || [, ''])[1].trim();
          archivo = { campo: nom[1], nombre: fic[1], tipo, datos: val };
        } else {
          campos[nom[1]] = val.toString('utf8');
        }
      }
    }
    i = sig;
  }
  return { campos, archivo };
}
