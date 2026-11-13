// ─────────────────────────────────────────────────────────────
//  SEO · se inyecta en index.html al compilar (vite.config.js)
// ─────────────────────────────────────────────────────────────
import { NAVES, PRECIO_M2, ESQUEMA, CONTACTO, fmt } from './data.js';

/**
 * Dominio final del sitio, SIN diagonal al final. Ej.: 'https://www.vizapark.com.mx'
 * Se usa para canonical, Open Graph, sitemap.xml y datos estructurados.
 * También se puede pasar al compilar: SITE_URL=https://... npm run build
 */
export const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

const desde = Math.min(...NAVES.map((n) => n.m2 * PRECIO_M2));
const disp = NAVES.filter((n) => n.estado === 'disponible').length;

export const FAQ = [
  ['¿Dónde se ubica Viza Park?',
    `Viza Park está en ${CONTACTO.direccion}, a 5 minutos de Av. 5 de Febrero y del centro de Querétaro, con conexión a Constituyentes, Bernardo Quintana y la carretera Querétaro – Celaya.`],
  ['¿Qué tamaño tienen las naves industriales?',
    'El parque cuenta con 64 naves industriales de 236 a 350 m². Cada nave tipo incluye recepción, sanitario, almacén, 3 cajones de estacionamiento y rampa para andén.'],
  ['¿Cuál es el precio de una nave en Viza Park?',
    `El precio de lista parte de ${fmt(desde)} más IVA (${fmt(PRECIO_M2)} por m²). Puedes calcular el precio exacto de cada nave disponible en el cotizador del sitio.`],
  ['¿Qué esquema de financiamiento ofrecen?',
    `Puedes adquirir tu nave con ${Math.round(ESQUEMA.enganche * 100)} % de enganche y ${ESQUEMA.meses} meses sin intereses sobre el ${Math.round((1 - ESQUEMA.enganche) * 100)} % restante. También hay opción de pago de contado.`],
  ['¿Cuántas naves hay disponibles?',
    `Actualmente hay ${disp} de 64 naves disponibles. En el master plan interactivo puedes ver en tiempo real cuáles están disponibles y cuáles apartadas.`],
  ['¿Qué servicios y amenidades tiene el parque?',
    'Acceso controlado con caseta de vigilancia, seguridad 24/7 con circuito cerrado de TV, infraestructura eléctrica subterránea, autoabasto de agua, administración del parque, andén común de carga y descarga y 4,521 m² de áreas verdes.'],
  ['¿Para qué giros sirven las naves?',
    'Están diseñadas para operaciones logísticas, almacenamiento y procesos ligeros, y se adaptan a sectores como automotriz, aeroespacial, alimentos, manufactura, tecnología, construcción y comercio.'],
  ['¿Es una buena inversión patrimonial?',
    `Además de usarla para tu empresa, puedes rentarla: el retorno estimado por renta es de ${Math.round(ESQUEMA.retornoRenta * 100)} % anual antes de IVA. Las proyecciones son estimaciones y no garantizan rendimientos futuros.`],
  ['¿Cómo agendo una visita?',
    `Llámanos o escríbenos por WhatsApp al ${CONTACTO.telefono}, o envía el formulario de contacto del sitio y un asesor te atenderá.`],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function faqHtml() {
  return FAQ.map(([q, a], i) =>
    `<details class="faq__item"${i === 0 ? ' open' : ''}><summary><h3>${esc(q)}</h3><span class="faq__icon" aria-hidden="true"></span></summary><p>${esc(a)}</p></details>`
  ).join('\n');
}

export function jsonLd() {
  const url = SITE_URL ? SITE_URL + '/' : undefined;
  const abs = (p) => (SITE_URL ? SITE_URL + p : p);
  const address = {
    '@type': 'PostalAddress',
    streetAddress: 'Carretera Estatal Km 3 S/N, Santa María Magdalena',
    addressLocality: 'Corregidora',
    addressRegion: 'Querétaro',
    postalCode: '76177',
    addressCountry: 'MX',
  };
  const graph = [
    {
      '@type': 'Organization', '@id': '#organizacion', name: 'Viza Park', url,
      logo: abs('/assets/brand/logo-alt.png'), telephone: '+52 442 494 9833',
      sameAs: [CONTACTO.instagram],
    },
    {
      '@type': 'LocalBusiness', '@id': '#parque', name: 'Viza Park · Parque Industrial',
      description: 'Parque industrial con 64 naves en venta de 236 a 350 m² en Corregidora, Querétaro.',
      url, image: abs('/assets/og-vizapark.jpg'), telephone: '+52 442 494 9833', priceRange: '$$$',
      address, areaServed: 'Querétaro', parentOrganization: { '@id': '#organizacion' },
      makesOffer: {
        '@type': 'Offer', priceCurrency: 'MXN', price: Math.round(desde), availability: 'https://schema.org/InStock',
        itemOffered: { '@type': 'Product', name: 'Nave industrial de 260 m²', description: 'Nave industrial con recepción, sanitario, almacén, 3 cajones y rampa para andén.' },
      },
    },
    {
      '@type': 'FAQPage', '@id': '#preguntas',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  if (url) graph.push({ '@type': 'WebSite', '@id': '#sitio', url, name: 'Viza Park', inLanguage: 'es-MX', publisher: { '@id': '#organizacion' } });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
