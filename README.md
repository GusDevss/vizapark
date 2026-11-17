# Viza Park · Sitio web

Sitio cinematográfico para **Viza Park**, parque industrial en Corregidora, Querétaro.
Se construye con [Vite](https://vitejs.dev), [GSAP + ScrollTrigger](https://gsap.com) (animaciones con scroll) y [Lenis](https://lenis.darkroom.engineering) (scroll suave).

## Secciones

1. **Intro**: pantalla de carga con el logo, seguida del título "Inversión patrimonial premium" con efecto de zoom.
2. **Recorrido**: secuencia de 151 cuadros del video que avanza con el scroll, con textos que aparecen sobre ella. Incluye un botón que abre el video completo de YouTube.
3. **Manifiesto y cifras**: el texto se ilumina palabra por palabra y los contadores se animan.
4. **Galería horizontal** fijada en pantalla: vialidad, andén, recepción y almacén.
5. **Nave tipo**: la planta se revela con una animación y muestra pines con cada espacio.
6. **Master plan interactivo**: las 64 naves están en el plano. Al pasar el cursor se ve un tooltip y al hacer clic se abre la ficha con precio, enganche y mensualidad. Hay filtros por disponibilidad y por módulo.
7. **Desarrollo integral**: amenidades.
8. **Ubicación**: mapa con anillos de 3, 4 y 5 km.
9. **Sectores**: órbita que gira con el scroll.
10. **Cotizador**: se elige la nave, el enganche (30–100 %), el plazo (6, 12 o 18 MSI) y si se muestra el IVA. Incluye una gráfica de plusvalía, envío por WhatsApp e impresión a PDF.
11. **Contacto**: el formulario envía el mensaje por WhatsApp.

## Actualizar disponibilidad, precios y contacto

Todo está en **`src/data.js`**:

```js
export const APARTADAS = [1, 2, 4, 5, 6, 11, 12, 33, 34, 47, 48]; // naves apartadas/vendidas
export const PRECIO_260 = 4985000;                                  // precio de una nave de 260 m², IVA incluido (las demás: proporcional al metraje)
export const ESQUEMA = { enganche: 0.30, meses: 18, ... };
export const CONTACTO = { telefono, whatsapp, instagram, ... };
```

Para apartar una nave, agrega su número a `APARTADAS` y vuelve a publicar el sitio.

## Formulario por correo (Hostinger)

`public/contacto.php` envía el formulario con `mail()` de PHP. Edita la línea:

```php
$DESTINO = 'CAMBIAR@tudominio.com';
```

Conviene que el destino sea un correo creado en hPanel → Correos. El formulario también puede enviarse por WhatsApp.

## SEO

- Título, descripción, Open Graph y Twitter Cards en `index.html`.
- Datos estructurados (LocalBusiness, Organization y FAQPage) y preguntas frecuentes generados desde `src/seo.js`.
- `robots.txt` y `sitemap.xml` se generan al compilar.
- Para URLs absolutas (canonical, og:url y sitemap), compila con el dominio:

```bash
SITE_URL=https://www.tudominio.com npm run build
```

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera /dist para publicar
```

Para Hostinger, sube el contenido de `/dist` a `public_html`.
