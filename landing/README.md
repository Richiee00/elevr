# ELEVR — Landing page

Web estática (HTML + CSS + JS, sin build) para presentar ELEVR y captar la lista de espera.

## Estructura

- `index.html` — landing
- `privacidad.html`, `cookies.html` — páginas legales (rellena los campos resaltados `[...]`)
- `config.js` — **ajustes editables**: número de WhatsApp, endpoint del formulario, Instagram, Google Analytics
- `styles.css`, `main.js` — estilos y comportamiento
- `img/` — fotos (ver `img/LEEME.md`)
- `assets/` — favicon

## Antes de publicar

1. Sube las fotos a `img/`.
2. En `config.js`:
   - `whatsappNumber`: vuestro número real (p. ej. `34612345678`).
   - `formEndpoint`: crea un formulario gratis en [Formspree](https://formspree.io) y pega su URL
     (`https://formspree.io/f/xxxxxxx`). Los registros te llegarán por email y podrás exportarlos a CSV.
     Si lo dejas vacío, el formulario abre WhatsApp con los datos rellenados.
   - `gaId`: opcional, ID de Google Analytics 4. Con él activado aparece el aviso de cookies.
3. En `privacidad.html` y `cookies.html`, sustituye los textos `[...]` resaltados (titular, NIF, dirección, email).

## Ver en local

```bash
cd landing
python3 -m http.server 8080
# abre http://localhost:8080
```

## Publicar en Vercel (dominio propio)

1. En Vercel: **Add New → Project** → importa este repositorio.
2. En **Root Directory** elige `landing` y en Framework Preset, **Other** (sin comando de build).
3. Deploy. Después, en **Settings → Domains**, añade tu dominio cuando lo compres.
