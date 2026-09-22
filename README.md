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

Arrastrar el contenido de esta carpeta a Netlify.

⚠️ Al comprimir, comprimir el **CONTENIDO**, no la carpeta: si `index.html` queda dentro de un
subdirectorio, Netlify no lo encuentra.

```bash
zip -qr ../sitio.zip . -x ".git/*" ".DS_Store" "*/.DS_Store"
```

## Estructura

```
index.html              toda la landing (HTML + estilos + lógica, en un archivo)
aviso-privacidad.html   página legal, con sus propios estilos
404.html                página de error
public/
  *.js                  motor de animación, módulos 3D y diccionario de inglés
  *.webp / *.jpg        imágenes, ya optimizadas
robots.txt, sitemap.xml, _headers
```

## Dos cosas que conviene saber antes de editar

- **El sitio es bilingüe con un solo HTML.** El español está escrito en el markup; el inglés vive
  en `public/i18n.js`. Al cambiar un texto hay que cambiarlo en **los dos sitios**, o las dos
  versiones se contradicen.
- **Los archivos de `public/` se cachean fuerte.** Se cargan con `?v=N` al final; al modificar uno,
  subir ese número en `index.html` o el cambio no se verá.
