// ─────────────────────────────────────────────────────────────
//  VIZA PARK · Datos editables del sitio
//  Aquí se actualiza la disponibilidad, precios y contacto.
// ─────────────────────────────────────────────────────────────

/** Naves apartadas / vendidas (según Excel de ventas, nov 2026). */
export const APARTADAS = [1, 2, 4, 5, 6, 11, 12, 33, 34, 47, 48];

/** Precio de lista de una nave de 260 m² (MXN, IVA incluido). Las demás naves
 *  se calculan proporcional a su superficie. */
export const PRECIO_260 = 4985000;
export const PRECIO_M2 = PRECIO_260 / 260; // ≈ $19,173 por m², IVA incluido
export const precioNave = (nv) => Math.round((nv.m2 * PRECIO_260) / 260);

/** Esquema de financiamiento vigente */
export const ESQUEMA = {
  enganche: 0.30,       // 30 % de enganche
  meses: 18,            // 18 MSI sobre el 70 % restante
  plusvaliaAnual: 0.1795, // rendimiento en plusvalía anual (presentación comercial)
  retornoRenta: 0.10,     // renta anual estimada (antes de IVA) sobre el precio de la nave
};

export const CONTACTO = {
  telefono: '442 494 9833',
  whatsapp: '524424949833',
  facebook: 'https://www.facebook.com/search/top?q=Viza%20Park%20Quer%C3%A9taro',
  instagram: 'https://www.instagram.com/vizaparkqueretaro/',
  youtube: 'eIgcRj_V10g',
  direccion: 'Carretera Estatal Km 3 S/N, Santa María Magdalena, 76177 Corregidora, Qro.',
  maps: 'https://www.google.com/maps/search/?api=1&query=Viza+Park+Santa+Mar%C3%ADa+Magdalena+Corregidora+Quer%C3%A9taro',
};

/** Superficie de cada nave (m²) — tabla oficial de superficies. */
const M2 = {
  14: 323.88, 34: 236.98, 35: 336.98,
  49: 313.48, 50: 267.69, 51: 273.36, 52: 279.04, 53: 284.72, 54: 290.39,
  55: 296.07, 56: 301.75, 57: 307.42, 58: 313.09, 59: 318.76, 60: 324.45,
  61: 330.13, 62: 335.81, 63: 341.48, 64: 347.51,
};

/** Módulo (núcleo) al que pertenece cada nave */
function moduloDe(n) {
  if (n <= 2) return 1;
  if (n <= 6) return 2;
  if (n <= 19) return n >= 11 && n <= 13 ? 4 : 3;
  if (n <= 22) return 4;
  if (n <= 48) return 5;
  return 6;
}

// ── Geometría del master plan (coordenadas del SVG, viewBox 0 0 800 1000)
function row(from, to, x0, x1, y0, y1) {
  const out = {};
  const w = (x1 - x0) / (to - from + 1);
  for (let n = from; n <= to; n++) {
    const x = x0 + (n - from) * w;
    out[n] = [[x, y0], [x + w, y0], [x + w, y1], [x, y1]];
  }
  return out;
}
function col(from, to, x0, x1, y0, y1) {
  const out = {};
  const h = (y1 - y0) / (to - from + 1);
  for (let n = from; n <= to; n++) {
    const y = y0 + (n - from) * h;
    out[n] = [[x0, y], [x1, y], [x1, y + h], [x0, y + h]];
  }
  return out;
}

const GEO = {
  ...row(1, 2, 435, 513, 150, 243),
  ...col(3, 6, 620, 716, 84, 244),
  ...row(7, 10, 354, 513, 323, 418),
  ...row(11, 13, 565, 685, 323, 418),
  14: [[302, 418], [315, 418], [315, 515], [248, 515]],
  ...row(15, 19, 315, 513, 418, 515),
  ...row(20, 22, 565, 685, 418, 515),
  ...row(23, 34, 208, 685, 592, 690),
  35: [[152, 690], [168, 690], [168, 787], [99, 787]],
  ...row(36, 48, 168, 685, 690, 787),
  49: [[70, 862], [122, 862], [122, 964], [70, 962]],
  ...row(50, 64, 122, 716, 862, 966),
};

export const NAVES = Array.from({ length: 64 }, (_, i) => {
  const n = i + 1;
  return {
    n,
    m2: M2[n] ?? 260,
    modulo: moduloDe(n),
    estado: APARTADAS.includes(n) ? 'apartada' : 'disponible',
    pts: GEO[n],
  };
});

export const MODULOS = {
  1: '520 m²', 2: '1,040 m²', 3: '2,658 m²', 4: '1,560 m²', 5: '6,835 m²', 6: '4,084 m²',
};

export const fmt = (v) =>
  v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
