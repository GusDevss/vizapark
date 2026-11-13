import { defineConfig } from 'vite';
import { SITE_URL, faqHtml, jsonLd } from './src/seo.js';

/** Inyecta SEO (FAQ, JSON-LD, URLs absolutas) en el HTML */
function transform(html) {
  let out = html.replace('%FAQ_HTML%', faqHtml()).replace('%JSON_LD%', jsonLd());
  if (SITE_URL) return out.replaceAll('%SITE_URL%', SITE_URL);
  // Sin dominio definido: se omiten canonical/og:url y las imágenes quedan relativas
  return out
    .split('\n')
    .filter((l) => !(/(rel="canonical"|og:url)/.test(l) && l.includes('%SITE_URL%')))
    .join('\n')
    .replaceAll('%SITE_URL%', '');
}

/** Genera robots.txt y, si hay dominio, sitemap.xml */
function generateBundle() {
  const today = new Date().toISOString().slice(0, 10);
  const robots = ['User-agent: *', 'Allow: /', 'Disallow: /contacto.php'];
  if (SITE_URL) robots.push('', `Sitemap: ${SITE_URL}/sitemap.xml`);
  this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' });
  if (!SITE_URL) return;
  const imgs = ['og-vizapark.jpg', 'img/hero-portada.webp', 'img/vialidad.webp', 'img/almacen.webp']
    .map((p) => `    <image:image><image:loc>${SITE_URL}/assets/${p}</image:loc></image:image>`).join('\n');
  this.emitFile({
    type: 'asset', fileName: 'sitemap.xml',
    source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${imgs}
  </url>
</urlset>
`,
  });
}

export default defineConfig({
  plugins: [{ name: 'vizapark-seo', transformIndexHtml: { order: 'pre', handler: transform }, generateBundle }],
  build: { assetsInlineLimit: 0 },
});
