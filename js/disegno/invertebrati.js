// Disegno degli abitanti del fondo che non sono pesci: il gambero pulitore
// e il paguro (con le sue conchiglie). Stesso stile dipinto dei pesci:
// forme morbide, luce dall'alto, colori velati se sono lontani.
//
// Tutti sono disegnati con il muso verso destra e l'origine dove poggiano
// le zampe; poi vengono girati se guardano a sinistra.

import { velaColore, hsl } from '../util/colore.js';
import { inCoordinateCorpo } from '../animali/zampe.js';

function vela(c, z) {
  return velaColore(c, z);
}

// Una zampa a tre pezzi: dall'attacco al "ginocchio" e poi giù fino a terra.
function zampa(ctx, x0, y0, ginocchioX, ginocchioY, x1, y1, spessore, colore) {
  ctx.strokeStyle = colore;
  ctx.lineWidth = spessore;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(ginocchioX, ginocchioY);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// ---------- Gambero pulitore ----------

export function disegnaGambero(ctx, g, L) {
  const t = g.tempo;
  const rosso = hsl(vela({ h: 6, s: 80, l: 50 }, g.z));
  const rossoScuro = hsl(vela({ h: 2, s: 75, l: 34 }, g.z));
  const bianco = hsl(vela({ h: 40, s: 30, l: 95 }, g.z));
  const biancoTrasp = hsl(vela({ h: 15, s: 40, l: 88 }, g.z), 0, 0.9);

  // Ombra di contatto sulla roccia: fa capire che ci sta appoggiato sopra.
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angolo * g.verso);
  const ombra = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.4);
  ombra.addColorStop(0, 'rgba(5, 15, 20, 0.45)');
  ombra.addColorStop(1, 'rgba(5, 15, 20, 0)');
  ctx.fillStyle = ombra;
  ctx.beginPath();
  ctx.ellipse(0, L * 0.01, L * 0.4, L * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  // Poggia sulla roccia e si inclina come lei.
  ctx.translate(g.x, g.y);
  ctx.scale(g.verso, 1);
  ctx.rotate(g.angolo);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Si dondola avanti e indietro (i piedi restano fermi: si muove solo il corpo),
  // come fanno i gamberi pulitori per farsi notare.
  const dondolo = g.stato === 'attesa' ? Math.sin(t * 2.2) * L * 0.035 : 0;
  const alzata = g.alzata;

  // Spina del corpo: dalla testa (s = 0) alla coda (s = 1), arcuata verso
  // l'alto. Quando pulisce, la parte davanti si solleva verso il pesce.
  const punto = (s) => ({
    x: L * (0.42 - s * 0.85) + dondolo * (1 - s * 0.5),
    y: -L * (0.2 + 0.12 * Math.sin(Math.PI * s * 0.9) - 0.1 * s * s) - alzata * L * 0.3 * (1 - s) ** 1.6,
  });
  // Carapace robusto davanti, addome che si assottiglia verso la coda.
  const spessore = (s) => L * (s < 0.35 ? 0.13 - s * 0.05 : 0.115 - (s - 0.35) * 0.1);

  // Zampe (dietro il corpo): cinque, sottili e trasparenti. I piedi stanno
  // dove li ha appoggiati la camminata (vedi animali/zampe.js).
  g.zampe.piedi.forEach((piede, i) => {
    if (!piede) return;
    const s = 0.12 + i * 0.07;
    const p = punto(s);
    const f = inCoordinateCorpo(piede.x, piede.y, g.x, g.y, g.verso, g.angolo);
    const attacco = { x: p.x, y: p.y + spessore(s) * 0.6 };
    // Il "ginocchio" sta un po' più in alto e in avanti, a metà strada.
    const ginocchio = { x: (attacco.x + f.x) / 2 + L * 0.04, y: Math.min(attacco.y, f.y) - L * 0.03 };
    zampa(ctx, attacco.x, attacco.y, ginocchio.x, ginocchio.y, f.x, f.y, Math.max(1, L * 0.02), biancoTrasp);
  });

  // Ventaglio della coda.
  const coda = punto(1);
  ctx.save();
  ctx.translate(coda.x, coda.y);
  for (const a of [-0.5, -0.2, 0.1, 0.4]) {
    ctx.save();
    ctx.rotate(Math.PI + a + Math.sin(t * 1.5) * 0.05);
    ctx.beginPath();
    ctx.ellipse(L * 0.09, 0, L * 0.1, L * 0.035, 0, 0, Math.PI * 2);
    ctx.fillStyle = rosso;
    ctx.fill();
    ctx.fillStyle = bianco;
    ctx.beginPath();
    ctx.arc(L * 0.16, 0, L * 0.015, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Corpo: una striscia che si assottiglia verso la coda.
  const N = 14;
  const sopra = [];
  const sotto = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = punto(s);
    const w = spessore(s);
    sopra.push({ x: p.x, y: p.y - w });
    sotto.push({ x: p.x, y: p.y + w * 0.8 });
  }
  ctx.beginPath();
  // Rostro: la punta in avanti sulla testa.
  ctx.moveTo(L * 0.56, -L * 0.24);
  sopra.forEach((p) => ctx.lineTo(p.x, p.y));
  for (let i = sotto.length - 1; i >= 0; i--) ctx.lineTo(sotto[i].x, sotto[i].y);
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -L * 0.35, 0, -L * 0.1);
  corpo.addColorStop(0, rosso);
  corpo.addColorStop(1, rossoScuro);
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Striscia bianca sul dorso, con una linea rossa sottile in mezzo.
  ctx.beginPath();
  sopra.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  for (let i = sopra.length - 1; i >= 0; i--) ctx.lineTo(sopra[i].x, sopra[i].y + spessore(i / N) * 0.7);
  ctx.closePath();
  ctx.fillStyle = bianco;
  ctx.fill();
  ctx.beginPath();
  sopra.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y + spessore(i / N) * 0.35) : ctx.lineTo(p.x, p.y + spessore(i / N) * 0.35)));
  ctx.strokeStyle = rosso;
  ctx.lineWidth = Math.max(0.6, L * 0.01);
  ctx.stroke();
  // Segmenti dell'addome.
  ctx.strokeStyle = 'rgba(80, 10, 0, 0.3)';
  ctx.lineWidth = Math.max(0.5, L * 0.008);
  for (const s of [0.4, 0.52, 0.64, 0.76, 0.88]) {
    const p = punto(s);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - spessore(s));
    ctx.quadraticCurveTo(p.x - L * 0.02, p.y, p.x, p.y + spessore(s));
    ctx.stroke();
  }
  ctx.restore();

  // Occhio sul peduncolo.
  const testa = punto(0);
  ctx.fillStyle = hsl(vela({ h: 0, s: 0, l: 5 }, g.z));
  ctx.beginPath();
  ctx.arc(testa.x + L * 0.03, testa.y - L * 0.08, L * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Chele piccole davanti (quelle che puliscono): quando lavora si allungano
  // in su verso il pesce e si muovono svelte.
  // Quando fruga sulla sabbia le chele si muovono svelte verso il basso.
  const fruga = g.stato === 'fruga' ? 1 : 0;
  const lavoro = 0.3 + alzata * 0.7 + fruga * 0.5;
  for (const k of [0, 1]) {
    const mossa = Math.sin(t * (alzata > 0.5 || fruga ? 10 : 2) + k * 2) * L * 0.04 * lavoro + fruga * L * 0.05;
    const su = alzata * L * 0.14;
    zampa(ctx, testa.x, testa.y + L * 0.04, testa.x + L * 0.1, testa.y - L * 0.02 - su * 0.5 + mossa, testa.x + L * 0.2, testa.y - L * 0.06 - su + mossa, Math.max(0.8, L * 0.016), biancoTrasp);
  }

  // Antenne bianche lunghe: salgono e si piegano all'indietro, ondeggiando.
  ctx.strokeStyle = bianco;
  ctx.lineWidth = Math.max(0.6, L * 0.01);
  for (const k of [0, 1]) {
    const o = Math.sin(t * 1.3 + k * 1.7) * L * 0.15;
    ctx.beginPath();
    ctx.moveTo(testa.x + L * 0.08, testa.y - L * 0.06);
    ctx.bezierCurveTo(
      testa.x + L * (0.32 + k * 0.06), testa.y - L * (0.5 + k * 0.1) + o * 0.3,
      testa.x - L * (0.1 - k * 0.06) + o, testa.y - L * (0.85 + k * 0.06),
      testa.x - L * (0.5 + k * 0.15) + o, testa.y - L * (0.62 + k * 0.12),
    );
    ctx.stroke();
  }
  // Antennule corte davanti, che si muovono di continuo.
  ctx.lineWidth = Math.max(0.5, L * 0.008);
  for (const k of [0, 1]) {
    const o = Math.sin(t * 4 + k * 3) * L * 0.05;
    ctx.beginPath();
    ctx.moveTo(testa.x + L * 0.1, testa.y - L * 0.04);
    ctx.quadraticCurveTo(testa.x + L * 0.3, testa.y - L * 0.12 + o, testa.x + L * 0.42, testa.y - L * (0.05 + k * 0.08) + o);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Paguro e conchiglie ----------

// Conchiglia a spirale vista di lato: la punta verso dietro, l'apertura davanti in basso.
export function disegnaConchiglia(ctx, x, y, L, verso, tipo, z, vuota = false) {
  const colore = vela(tipo.colore, z);
  const strisce = vela(tipo.strisce, z);
  const m = L * tipo.misura;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(verso, 1);
  // Ombra sulla sabbia.
  const ombra = ctx.createRadialGradient(0, 0, 0, 0, 0, m * 0.6);
  ombra.addColorStop(0, 'rgba(10, 20, 25, 0.35)');
  ombra.addColorStop(1, 'rgba(10, 20, 25, 0)');
  ctx.fillStyle = ombra;
  ctx.beginPath();
  ctx.ellipse(0, 0, m * 0.6, m * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Corpo della conchiglia: l'ultimo giro è largo e tondo davanti, poi i giri
  // salgono a gradini, sempre più piccoli, fino alla punta in alto dietro.
  ctx.beginPath();
  ctx.moveTo(m * 0.34, -m * 0.08);
  ctx.quadraticCurveTo(m * 0.44, -m * 0.55, m * 0.04, -m * 0.62);
  ctx.quadraticCurveTo(-m * 0.14, -m * 0.62, -m * 0.24, -m * 0.68);
  ctx.quadraticCurveTo(-m * 0.34, -m * 0.72, -m * 0.42, -m * 0.76);
  ctx.quadraticCurveTo(-m * 0.5, -m * 0.8, -m * 0.56, -m * 0.8); // la punta
  ctx.quadraticCurveTo(-m * 0.66, -m * 0.62, -m * 0.54, -m * 0.4);
  ctx.quadraticCurveTo(-m * 0.36, -m * 0.06, 0, -m * 0.01);
  ctx.quadraticCurveTo(m * 0.22, m * 0.01, m * 0.34, -m * 0.08);
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -m * 0.6, 0, 0);
  corpo.addColorStop(0, hsl(colore, 14));
  corpo.addColorStop(1, hsl(colore, -16));
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Giri della spirale e strisce.
  ctx.strokeStyle = hsl(strisce, 0, 0.7);
  ctx.lineWidth = Math.max(0.8, m * 0.025);
  // Le "cuciture" tra un giro e l'altro: curve che scendono in diagonale.
  for (const [x0, y0, x1, y1] of [[-0.24, -0.68, -0.46, -0.36], [-0.42, -0.76, -0.56, -0.56], [0.04, -0.6, -0.3, -0.1]]) {
    ctx.beginPath();
    ctx.moveTo(x0 * m, y0 * m);
    ctx.quadraticCurveTo((x0 + 0.05) * m, ((y0 + y1) / 2 + 0.05) * m, x1 * m, y1 * m);
    ctx.stroke();
  }
  // Strisce di colore che seguono i giri.
  ctx.lineWidth = Math.max(0.6, m * 0.02);
  ctx.strokeStyle = hsl(strisce, 0, 0.35);
  for (let i = 0; i < 5; i++) {
    const k = i * 0.1;
    ctx.beginPath();
    ctx.moveTo((0.3 - k) * m, (-0.5 + k * 0.4) * m);
    ctx.quadraticCurveTo((0.0 - k) * m, (-0.28 + k * 0.6) * m, (-0.2 - k * 0.6) * m, (-0.08 - k * 0.2) * m);
    ctx.stroke();
  }
  // Luce dall'alto.
  const luce = ctx.createRadialGradient(-m * 0.05, -m * 0.5, 0, -m * 0.05, -m * 0.5, m * 0.4);
  luce.addColorStop(0, 'rgba(255, 250, 230, 0.35)');
  luce.addColorStop(1, 'rgba(255, 250, 230, 0)');
  ctx.fillStyle = luce;
  ctx.fillRect(-m, -m, m * 2, m);
  ctx.restore();
  // Apertura: un ovale scuro davanti (rosato sul bordo).
  ctx.beginPath();
  ctx.ellipse(m * 0.22, -m * 0.2, m * 0.13, m * 0.17, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = hsl(vela({ h: 350, s: 35, l: 72 }, z));
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(m * 0.23, -m * 0.2, m * 0.09, m * 0.13, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = vuota ? 'rgba(20, 10, 12, 0.85)' : 'rgba(60, 20, 20, 0.85)';
  ctx.fill();
  ctx.restore();
}

export function disegnaPaguro(ctx, p, L, conchiglia) {
  const t = p.tempo;
  const rosso = hsl(vela({ h: 10, s: 75, l: 48 }, p.z));
  const rossoChiaro = hsl(vela({ h: 18, s: 80, l: 60 }, p.z));
  const bianco = hsl(vela({ h: 40, s: 30, l: 92 }, p.z));
  const nero = hsl(vela({ h: 0, s: 0, l: 6 }, p.z));
  // Durante il trasloco il corpo esce dalla conchiglia e si sposta verso l'altra.
  const spostamento = p.stato === 'esce' ? p.fuori * L * 0.7 : 0;
  const fuori = p.fuori;
  const trasloco = p.stato === 'esce' || p.stato === 'entra';
  // Quando cammina la conchiglia dondola appena, a ogni passo, e poggia sulla sabbia.
  const dondolo = Math.sin(t * 9) * L * 0.012 * p.dondolo;

  // Ombra di contatto sotto il corpo e le zampe.
  const ombra = ctx.createRadialGradient(p.x + p.verso * L * 0.15, p.y, 0, p.x + p.verso * L * 0.15, p.y, L * 0.5);
  ombra.addColorStop(0, 'rgba(5, 15, 20, 0.35)');
  ombra.addColorStop(1, 'rgba(5, 15, 20, 0)');
  ctx.fillStyle = ombra;
  ctx.beginPath();
  ctx.ellipse(p.x + p.verso * L * 0.15, p.y, L * 0.5, L * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.verso, 1);
  ctx.rotate(Math.sin(t * 9 + 1) * 0.03 * p.dondolo);
  disegnaConchiglia(ctx, 0, L * 0.02 + dondolo, L, 1, conchiglia, p.z);
  ctx.translate(spostamento, dondolo);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const bocca = { x: L * 0.22, y: -L * 0.2 }; // da dove esce, l'apertura della conchiglia

  // Addome molle e arricciato: si vede solo quando è fuori dalla conchiglia.
  if (fuori > 0.05) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fuori * 1.5);
    ctx.beginPath();
    ctx.ellipse(bocca.x - L * 0.2, bocca.y + L * 0.02, L * 0.2 * fuori + L * 0.05, L * 0.1, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = hsl(vela({ h: 15, s: 45, l: 72 }, p.z));
    ctx.fill();
    ctx.strokeStyle = hsl(vela({ h: 10, s: 40, l: 55 }, p.z), 0, 0.5);
    ctx.lineWidth = Math.max(0.6, L * 0.012);
    ctx.beginPath();
    ctx.arc(bocca.x - L * 0.3, bocca.y + L * 0.03, L * 0.06, 0, Math.PI * 1.6);
    ctx.stroke();
    ctx.restore();
  }

  // Zampe: quattro, a tre pezzi. I piedi stanno dove li ha appoggiati la
  // camminata (vedi animali/zampe.js); durante il trasloco restano vicini al corpo.
  const spess = Math.max(1.2, L * 0.05);
  p.zampe.piedi.forEach((piede, i) => {
    const attacco = { x: bocca.x - L * (0.02 + i * 0.03), y: bocca.y + L * 0.04 };
    let f = { x: attacco.x + L * (0.13 - i * 0.06), y: 0 };
    if (piede && !trasloco) f = inCoordinateCorpo(piede.x, piede.y, p.x, p.y, p.verso, 0);
    f.x -= spostamento;
    f.y -= dondolo;
    // Il "ginocchio" sta in alto, a metà strada: le zampe del paguro sono arcuate.
    const ginocchio = { x: (attacco.x + f.x) / 2 + L * 0.05, y: Math.min(attacco.y, f.y) - L * 0.07 };
    zampa(ctx, attacco.x, attacco.y, ginocchio.x, ginocchio.y, f.x, f.y, spess, i % 2 ? rosso : rossoChiaro);
    // Punta chiara della zampa.
    ctx.fillStyle = bianco;
    ctx.beginPath();
    ctx.arc(f.x, f.y, spess * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });

  // Testa con gli occhi sui peduncoli e le antenne.
  const testa = { x: bocca.x + L * 0.08, y: bocca.y - L * 0.05 };
  ctx.fillStyle = rosso;
  ctx.beginPath();
  ctx.ellipse(testa.x, testa.y, L * 0.08, L * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const k of [0, 1]) {
    const ox = testa.x + L * (0.04 + k * 0.03);
    const oy = testa.y - L * (0.16 + k * 0.02) + Math.sin(t * 2 + k) * L * 0.01;
    ctx.strokeStyle = rossoChiaro;
    ctx.lineWidth = Math.max(0.8, L * 0.02);
    ctx.beginPath();
    ctx.moveTo(testa.x + L * 0.02, testa.y - L * 0.03);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.fillStyle = nero;
    ctx.beginPath();
    ctx.arc(ox, oy, L * 0.022, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rossoChiaro;
  ctx.lineWidth = Math.max(0.5, L * 0.01);
  for (const k of [0, 1]) {
    const o = Math.sin(t * 2.5 + k * 2) * L * 0.06;
    ctx.beginPath();
    ctx.moveTo(testa.x + L * 0.06, testa.y - L * 0.02);
    ctx.quadraticCurveTo(testa.x + L * 0.3, testa.y - L * 0.25 + o, testa.x + L * (0.45 - k * 0.1), testa.y - L * (0.1 + k * 0.12) + o);
    ctx.stroke();
  }

  // Chele: una grande e una piccola. Quando fruga scendono a turno nella sabbia.
  const chela = (grande, ritmo) => {
    const giu = p.stato === 'fruga' ? Math.max(0, Math.sin(p.fruga + ritmo)) : 0;
    const m = grande ? 1 : 0.65;
    const spalla = { x: testa.x + L * 0.02, y: testa.y + L * 0.06 };
    const gomito = { x: spalla.x + L * 0.12 * m, y: spalla.y - L * 0.02 + giu * L * 0.04 };
    const pinza = { x: gomito.x + L * 0.1 * m, y: gomito.y + L * 0.06 * m + giu * L * 0.1 };
    zampa(ctx, spalla.x, spalla.y, gomito.x, gomito.y, pinza.x, pinza.y, spess * m * 1.2, rosso);
    ctx.save();
    ctx.translate(pinza.x, pinza.y);
    ctx.rotate(0.5 + giu * 0.5);
    ctx.beginPath();
    ctx.ellipse(L * 0.05 * m, 0, L * 0.08 * m, L * 0.045 * m, 0, 0, Math.PI * 2);
    ctx.fillStyle = rossoChiaro;
    ctx.fill();
    // Puntini bianchi sulla chela grande.
    if (grande) {
      ctx.fillStyle = bianco;
      for (const [a, b] of [[0.02, -0.015], [0.06, 0.01], [0.09, -0.01]]) {
        ctx.beginPath();
        ctx.arc(a * L, b * L, L * 0.01, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Le due dita della pinza, che si aprono e chiudono.
    const apre = 0.15 + 0.15 * Math.sin(t * 3 + ritmo);
    ctx.strokeStyle = rosso;
    ctx.lineWidth = spess * m * 0.8;
    ctx.beginPath();
    ctx.moveTo(L * 0.1 * m, 0);
    ctx.lineTo(L * 0.17 * m, -L * apre * 0.2 * m);
    ctx.moveTo(L * 0.1 * m, L * 0.01);
    ctx.lineTo(L * 0.16 * m, L * apre * 0.2 * m);
    ctx.stroke();
    ctx.restore();
  };
  chela(false, 2);
  chela(true, 0);
  ctx.restore();
}
