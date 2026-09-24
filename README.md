# Loialt Energy — sitio web

Sitio estático, sin paso de compilación: **lo que está aquí es exactamente lo que se publica.**

## Ver en local

No usar Node ni Vite: el código referencia rutas `/public/...` que solo resuelven
con un servidor estático desde la raíz.

```bash
python3 -m http.server 5173
```

Abrir en **http://127.0.0.1:5173/** (IPv4, no `localhost`).

## Publicar

**Publicar es un `git push`.** El repo está conectado a Vercel: cada empujón a `main`
despliega producción, y cada rama o pull request genera una **URL de vista previa** para
revisar antes de que llegue al público.

```bash
git add -A && git commit -m "qué cambió" && git push
```

No hay que arrastrar carpetas ni comprimir nada.

## Estructura

```
index.html              toda la landing (HTML + estilos + lógica, en un archivo)
aviso-privacidad.html   página legal, con sus propios estilos
404.html                página de error
public/
  *.js                  motor de animación, módulos 3D y diccionario de inglés
  *.webp / *.jpg        imágenes, ya optimizadas
robots.txt, sitemap.xml, vercel.json
```

### Sobre `vercel.json`

Lleva las cabeceras de seguridad (`X-Frame-Options`, `Referrer-Policy`, etc.).

⚠️ **No se le pueden poner comentarios ni claves propias**: Vercel valida el archivo contra
un esquema y rechaza lo que no reconoce.

⚠️ **A propósito no define cachés largas.** Los `.js` llevan `?v=N` y se podrían cachear,
pero las imágenes no tienen ese sufijo: un `max-age` de un año serviría la versión vieja si
se reemplaza un archivo con el mismo nombre.

## Tres cosas que conviene saber antes de editar

- **El sitio es bilingüe con un solo HTML.** El español está escrito en el markup; el inglés
  vive en `public/i18n.js`. Al cambiar un texto hay que cambiarlo en **los dos sitios**, o las
  dos versiones se contradicen.
- **Los archivos de `public/` se cachean fuerte.** Se cargan con `?v=N` al final; al modificar
  uno, subir ese número en `index.html` o el cambio no se verá.
- **Usa las vistas previa.** Antes de empujar a `main`, haz una rama: Vercel te da una URL con
  el cambio ya montado. Es la forma de ver una animación o un ajuste de altura sin arriesgar
  el sitio en vivo.
