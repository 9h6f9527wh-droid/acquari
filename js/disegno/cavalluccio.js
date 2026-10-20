// Disegno del cavalluccio marino, visto di lato, nello stile dipinto della vasca.
//
// Com'è fatto (misure in L = altezza del cavalluccio, guardando a destra):
//  - il TRONCO è una linea curva (la "spina") dal collo al punto coda, con
//    lo spessore che cresce sul petto e sul ventre (nel maschio c'è la tasca);
//  - la CODA continua la spina: libera si arrotola a spirale in avanti,
//    aggrappata scende fino alla foglia e ci si avvolge intorno;
//  - sul corpo ci sono gli anelli ossei e una fila di piccoli bottoni sul dorso;
//  - la TESTA è da cavallo: un ovale con la coroncina in cima, l'occhio
//    grande e il muso a tubo;
//  - la PINNA DORSALE, trasparente, vibra veloce sulla schiena; una pinnetta
//    dietro la testa fa lo stesso.

import { velaColore, hsl } from '../util/colore.js';

// La spina del tronco, dal collo (sotto la testa) al punto coda (0, 0).
const TRONCO = [
  { x: 0.0, y: -0.7, w: 0.13 },
  { x: 0.04, y: -0.6, w: 0.15 },
  { x: 0.11, y: -0.48, w: 0.2 },
  { x: 0.14, y: -0.32, w: 0.23 },
  { x: 0.09, y: -0.15, w: 0.18 },
  { x: 0.0, y: 0.0, w: 0.12 },
];
// La coda libera, arrotolata a spirale in avanti.
const CODA_LIBERA = [
  { x: -0.05, y: 0.12 },
  { x: -0.04, y: 0.24 },
  { x: 0.03, y: 0.31 },
  { x: 0.1, y: 0.28 },
  { x: 0.11, y: 0.21 },
  { x: 0.06, y: 0.19 },
];
const SPESSORI_CODA = [0.09, 0.07, 0.055, 0.042, 0.032, 0.022];

// Ammorbidisce una linea spezzata (Catmull-Rom): "fitto" punti per tratto.
function morbida(punti, fitto) {
  const out = [];
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[Math.max(0, i - 1)];
    const p1 = punti[i];
    const p2 = punti[i + 1];
    const p3 = punti[Math.min(punti.length - 1, i + 2)];
    for (let k = 0; k < fitto; k++) {
      const t = k / fitto;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), w: p1.w + (p2.w - p1.w) * t });
    }
  }
  out.push({ ...punti[punti.length - 1] });
  // Direzione e normale in ogni punto.
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)];
    const b = out[Math.min(out.length - 1, i + 1)];
    const lung = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    out[i].nx = -(b.y - a.y) / lung;
    out[i].ny = (b.x - a.x) / lung;
  }
  return out;
}

export function disegnaCavalluccio(ctx, c, L) {
  const t = c.tempo;
  let colore = velaColore(c.colore, c.z);
  colore = { ...colore, s: Math.min(95, colore.s + c.acceso * 12), l: colore.l + c.acceso * 6 };
  const scuro = hsl({ ...colore, h: colore.h - 8 }, -colore.l * 0.4);
  const chiaro = hsl(colore, 16);

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.inclinazione);
  const verso = c.verso * (c.guarda || 1);
  ctx.scale(verso * L, L);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // La coda: libera o verso la foglia (e in mezzo, mentre si arrotola).
  let coda = CODA_LIBERA;
  let ancora = null;
  if (c.ancora && c.coda > 0) {
    // Il punto della foglia nelle coordinate del cavalluccio.
    const dx = c.ancora.x - c.x;
    const dy = c.ancora.y - c.y;
    const cos = Math.cos(-c.inclinazione);
    const sin = Math.sin(-c.inclinazione);
    ancora = { x: ((dx * cos - dy * sin) / L) * verso, y: (dx * sin + dy * cos) / L };
    const tesa = CODA_LIBERA.map((_, k) => {
      const q = (k + 1) / CODA_LIBERA.length;
      // Scende verso la foglia con una leggera curva all'indietro.
      return { x: ancora.x * q - Math.sin(Math.PI * q) * 0.05, y: ancora.y * q };
    });
    coda = CODA_LIBERA.map((p, k) => ({
      x: p.x + (tesa[k].x - p.x) * c.coda,
      y: p.y + (tesa[k].y - p.y) * c.coda,
    }));
  }
  const tronco = TRONCO.map((p, i) => (i === 3 && c.maschio ? { ...p, w: p.w * 1.15 } : p));
  const spina = morbida([...tronco, ...coda.map((p, k) => ({ ...p, w: SPESSORI_CODA[k] }))], 4);

  // Ombra leggera sotto (dà volume rispetto all'acqua).
  // Corpo: il contorno è la spina allargata ai due lati.
  ctx.beginPath();
  spina.forEach((p, i) => {
    const x = p.x + (p.nx * p.w) / 2;
    const y = p.y + (p.ny * p.w) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  for (let i = spina.length - 1; i >= 0; i--) {
    const p = spina[i];
    ctx.lineTo(p.x - (p.nx * p.w) / 2, p.y - (p.ny * p.w) / 2);
  }
  ctx.closePath();
  const corpo = ctx.createLinearGradient(-0.1, 0, 0.2, 0);
  corpo.addColorStop(0, scuro);
  corpo.addColorStop(0.55, hsl(colore));
  corpo.addColorStop(1, chiaro);
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.strokeStyle = hsl(colore, -colore.l * 0.55, 0.5);
  ctx.lineWidth = 0.012;
  ctx.stroke();

  // La tasca del maschio: una zona più chiara sul ventre.
  if (c.maschio) {
    ctx.fillStyle = hsl(colore, 14, 0.45);
    ctx.beginPath();
    ctx.ellipse(0.17, -0.27, 0.06, 0.1, -0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Anelli ossei: righe sottili di traverso, chiare con un filo d'ombra.
  for (let i = 3; i < spina.length - 2; i += 2) {
    const p = spina[i];
    const w = (p.w / 2) * 0.92;
    ctx.beginPath();
    ctx.moveTo(p.x + p.nx * w, p.y + p.ny * w);
    ctx.lineTo(p.x - p.nx * w, p.y - p.ny * w);
    ctx.strokeStyle = hsl(colore, -colore.l * 0.35, 0.45);
    ctx.lineWidth = 0.01;
    ctx.stroke();
  }
  // Bottoni sul dorso (il lato dietro, a sinistra).
  ctx.fillStyle = chiaro;
  for (let i = 2; i < spina.length - 6; i += 3) {
    const p = spina[i];
    const lato = p.nx < 0 ? 1 : -1; // il lato del dorso guarda indietro (x negativo)
    ctx.beginPath();
    ctx.arc(p.x + lato * p.nx * p.w * 0.5, p.y + lato * p.ny * p.w * 0.5, 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
  // Puntini bianchi sparsi sul tronco.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.55)';
  for (let k = 0; k < 7; k++) {
    const p = spina[4 + ((k * 3) % 14)];
    ctx.beginPath();
    ctx.arc(p.x + p.nx * p.w * (((k * 37) % 7) / 7 - 0.5) * 0.7, p.y + p.ny * p.w * 0.2, 0.008, 0, Math.PI * 2);
    ctx.fill();
  }

  // La coda arrotolata intorno alla foglia.
  if (ancora && c.coda > 0.6) {
    ctx.strokeStyle = hsl(colore, -colore.l * 0.15);
    ctx.lineWidth = 0.022;
    ctx.globalAlpha = (c.coda - 0.6) / 0.4;
    ctx.beginPath();
    ctx.ellipse(ancora.x + 0.012, ancora.y + 0.01, 0.035, 0.022, -0.3, Math.PI * 0.1, Math.PI * 1.7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Pinna dorsale: un ventaglio trasparente sulla schiena che vibra.
  const pinna = (i0, i1, alta, battito) => {
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const p = spina[i];
      const lato = p.nx < 0 ? 1 : -1;
      const x = p.x + lato * p.nx * p.w * 0.45;
      const y = p.y + lato * p.ny * p.w * 0.45;
      if (i === i0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = i1; i >= i0; i--) {
      const p = spina[i];
      const lato = p.nx < 0 ? 1 : -1;
      const q = (i - i0) / (i1 - i0);
      const onda = 1 + 0.3 * Math.sin(t * 22 * battito - q * 9);
      const h = p.w * 0.45 + alta * Math.sin(Math.PI * q) * onda;
      ctx.lineTo(p.x + lato * p.nx * h, p.y + lato * p.ny * h);
    }
    ctx.closePath();
    ctx.fillStyle = hsl(colore, 20, 0.35);
    ctx.fill();
    ctx.strokeStyle = hsl(colore, 24, 0.5);
    ctx.lineWidth = 0.006;
    ctx.stroke();
  };
  pinna(11, 17, 0.08, c.pinna);

  // --- La testa ---
  ctx.save();
  ctx.translate(0.03, -0.74);
  // Muso a tubo, un po' in giù.
  ctx.fillStyle = hsl(colore);
  ctx.beginPath();
  ctx.moveTo(0.05, -0.035);
  ctx.quadraticCurveTo(0.16, -0.015, 0.25, 0.02);
  ctx.lineTo(0.255, 0.058);
  ctx.quadraticCurveTo(0.16, 0.05, 0.05, 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hsl(colore, -colore.l * 0.55, 0.5);
  ctx.lineWidth = 0.01;
  ctx.stroke();
  // Testa: ovale inclinato.
  const testa = ctx.createLinearGradient(-0.08, -0.08, 0.1, 0.06);
  testa.addColorStop(0, scuro);
  testa.addColorStop(1, chiaro);
  ctx.fillStyle = testa;
  ctx.beginPath();
  ctx.ellipse(0.0, 0.0, 0.1, 0.075, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Coroncina in cima.
  ctx.fillStyle = hsl(colore, 6);
  ctx.beginPath();
  ctx.moveTo(-0.07, -0.04);
  ctx.lineTo(-0.075, -0.1);
  ctx.lineTo(-0.045, -0.075);
  ctx.lineTo(-0.035, -0.12);
  ctx.lineTo(-0.015, -0.07);
  ctx.lineTo(0.0, -0.095);
  ctx.lineTo(0.01, -0.055);
  ctx.closePath();
  ctx.fill();
  // Pinnetta dietro la testa.
  const vib = Math.sin(t * 18) * 0.012 * c.pinna;
  ctx.fillStyle = hsl(colore, 20, 0.4);
  ctx.beginPath();
  ctx.ellipse(-0.05, 0.07, 0.03, 0.045 + vib, -0.6, 0, Math.PI * 2);
  ctx.fill();
  // Occhio grande, con un raggio di striature intorno.
  ctx.strokeStyle = hsl(colore, -colore.l * 0.4, 0.6);
  ctx.lineWidth = 0.007;
  for (let k = 0; k < 5; k++) {
    const a = -0.6 + k * 0.5;
    ctx.beginPath();
    ctx.moveTo(0.03 + Math.cos(a) * 0.03, -0.005 + Math.sin(a) * 0.03);
    ctx.lineTo(0.03 + Math.cos(a) * 0.05, -0.005 + Math.sin(a) * 0.05);
    ctx.stroke();
  }
  ctx.fillStyle = 'hsl(45, 40%, 80%)';
  ctx.beginPath();
  ctx.arc(0.03, -0.005, 0.027, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10161c';
  ctx.beginPath();
  ctx.arc(0.034, -0.005, 0.017, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(0.027, -0.012, 0.006, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
