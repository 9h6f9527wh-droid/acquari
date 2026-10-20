// Disegno del polpo, nello stesso stile dipinto del resto della vasca.
//
// Com'è fatto:
//  - il MANTELLO (il "sacco" che sembra la testa) è a goccia: allungato,
//    piegato all'indietro, più largo vicino agli occhi;
//  - sotto c'è la CORONA, da cui partono gli otto tentacoli: ogni tentacolo
//    nasce largo e arrotondato sotto il corpo (niente bordi squadrati) e si
//    assottiglia fino a una punta sottile che si arriccia;
//  - gli occhi stanno su due piccole protuberanze, con la pupilla a fessura.
//
// Due pose:
//  - A TERRA: ogni tentacolo va dalla corona alla sua punta appoggiata sulla
//    sabbia (vedi animali/polpo.js: le punte camminano come zampe), facendo un
//    piccolo arco. I tentacoli verso il fondo si disegnano prima del corpo,
//    quelli verso di noi dopo, con le ventose in vista.
//  - NUOTO (a getto): il mantello va avanti, i tentacoli stanno tutti dietro,
//    stretti durante la spinta e un po' aperti quando plana.
//
// Il colore mescola il suo rosso-arancio con il color sabbia (mimetismo) e si
// scurisce di colpo quando si spaventa.

import { velaColore, hsl } from '../util/colore.js';
import { inCoordinateCorpo } from '../animali/zampe.js';
import { BRACCIA } from '../animali/polpo.js';

// Mescola due colori. La tonalità è un cerchio (0 e 360 sono lo stesso rosso):
// prendiamo la strada più corta, così dal rosso-arancio allo scuro non si
// passa per il blu e il viola.
function mescola(a, b, f) {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { h: (a.h + dh * f + 360) % 360, s: a.s + (b.s - a.s) * f, l: a.l + (b.l - a.l) * f };
}

// Macchie del mantello (sempre uguali).
const MACCHIE = Array.from({ length: 12 }, (_, i) => ({
  u: ((i * 37) % 100) / 100 - 0.5,
  v: ((i * 61) % 100) / 100 - 0.5,
  m: 0.05 + ((i * 13) % 5) / 100,
}));

export function disegnaPolpo(ctx, p, L) {
  const t = p.tempo;
  // Colore: suo, mimetizzato con la sabbia, o scuro per lo spavento.
  let c = mescola({ h: 10, s: 65, l: 46 }, { h: 42, s: 22, l: 54 }, p.mimetismo);
  c = mescola(c, { h: 355, s: 70, l: 22 }, p.spaventato);
  c = velaColore(c, p.z);
  c = { ...c, l: c.l * (1 - p.buio * 0.75) };
  const colori = {
    c,
    scuro: { ...c, l: c.l * 0.72 },
    chiaro: { ...c, l: Math.min(85, c.l * 1.3 + 6) },
    ventose: { ...c, s: c.s * 0.5, l: Math.min(90, c.l * 1.5 + 12) },
  };

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (p.posa === 'nuoto') {
    // Il mantello punta nella direzione del nuoto; gli occhi restano in alto.
    ctx.rotate(p.angolo);
    if (Math.cos(p.angolo) < 0) ctx.scale(1, -1);
    disegnaNuoto(ctx, p, L, t, colori);
  } else {
    ctx.scale(p.verso, 1);
    disegnaTerra(ctx, p, L, t, colori);
  }
  ctx.restore();
}

// ---------- Pezzi ----------

// Un tentacolo lungo una "spina" di punti: base larga e ARROTONDATA, punta
// sottile. Il contorno scuro corre solo sui due lati (non sulla base), così
// l'attacco al corpo non si vede.
function tentacolo(ctx, punti, spessore, colori, ventose, ombra = 1) {
  const n = punti.length;
  const sx = [];
  const dx = [];
  for (let i = 0; i < n; i++) {
    const a = punti[Math.max(0, i - 1)];
    const b = punti[Math.min(n - 1, i + 1)];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const w = (spessore * Math.max(0.06, 1 - (i / (n - 1)) ** 0.9 * 0.94)) / 2;
    sx.push({ x: punti[i].x - Math.sin(ang) * w, y: punti[i].y + Math.cos(ang) * w });
    dx.push({ x: punti[i].x + Math.sin(ang) * w, y: punti[i].y - Math.cos(ang) * w });
  }
  const colore = { ...colori.c, l: colori.c.l * ombra };
  ctx.beginPath();
  ctx.moveTo(sx[0].x, sx[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(sx[i].x, sx[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(dx[i].x, dx[i].y);
  // Base arrotondata: un mezzo cerchio che chiude il tentacolo dalla parte del corpo.
  const a0 = Math.atan2(punti[1].y - punti[0].y, punti[1].x - punti[0].x);
  ctx.arc(punti[0].x, punti[0].y, spessore / 2, a0 - Math.PI / 2, a0 + Math.PI / 2, true);
  ctx.closePath();
  ctx.fillStyle = hsl(colore);
  ctx.fill();
  // Contorno solo sui lati, dalla metà del primo tratto in poi.
  ctx.strokeStyle = hsl(colori.scuro, 0, 0.45);
  ctx.lineWidth = Math.max(0.5, spessore * 0.06);
  for (const lato of [sx, dx]) {
    ctx.beginPath();
    lato.slice(2).forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.stroke();
  }
  // Ventose chiare lungo il lato di sotto, sempre più piccole verso la punta.
  if (ventose) {
    ctx.fillStyle = hsl(colori.ventose, 0, 0.85 * ombra);
    for (let i = 3; i < n - 2; i += 2) {
      const w = (spessore * (1 - (i / (n - 1)) * 0.94)) / 2;
      ctx.beginPath();
      ctx.arc(dx[i].x * 0.65 + punti[i].x * 0.35, dx[i].y * 0.65 + punti[i].y * 0.35, Math.max(0.6, w * 0.42), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Spina di un tentacolo a terra: dalla base, un arco che arriva alla punta
// appoggiata, e poi un ricciolo finale verso l'alto.
function spinaTerra(base, punta, L, t, i) {
  const punti = [];
  const dx = punta.x - base.x;
  // Il punto di controllo dell'arco: un po' in alto (i tentacoli si inarcano).
  const cx = base.x + dx * 0.45;
  const cy = Math.min(base.y, punta.y) - L * 0.1 - Math.abs(dx) * 0.15;
  const N = 12;
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const u = 1 - s;
    punti.push({ x: u * u * base.x + 2 * u * s * cx + s * s * punta.x, y: u * u * base.y + 2 * u * s * cy + s * s * punta.y });
  }
  // Ricciolo: la punta continua un poco e si arriccia all'insù, ondeggiando.
  let ang = Math.atan2(punta.y - cy, punta.x - cx);
  let x = punta.x;
  let y = punta.y;
  const giro = (dx >= 0 ? -1 : 1) * (0.55 + 0.15 * Math.sin(t * 1.5 + i));
  for (let k = 1; k <= 4; k++) {
    ang += giro;
    x += Math.cos(ang) * L * 0.04;
    y += Math.sin(ang) * L * 0.04;
    punti.push({ x, y });
  }
  return punti;
}

// Il mantello a goccia: più largo davanti (vicino agli occhi), più stretto e
// tondeggiante in fondo. "rotazione" lo piega (all'indietro, a terra).
function mantello(ctx, cx, cy, lungo, largo, rotazione, colori, gonfio) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotazione);
  ctx.beginPath();
  for (let k = 0; k <= 32; k++) {
    const a = (k / 32) * Math.PI * 2;
    // Goccia: dalla parte degli occhi (cos < 0) più larga, in fondo più stretta.
    const spessore = largo * gonfio * (0.84 - 0.16 * Math.cos(a));
    const x = Math.cos(a) * lungo;
    const y = Math.sin(a) * spessore;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -largo, 0, largo);
  corpo.addColorStop(0, hsl(colori.chiaro));
  corpo.addColorStop(0.55, hsl(colori.c));
  corpo.addColorStop(1, hsl(colori.scuro));
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Macchie e chiazze della pelle.
  ctx.fillStyle = hsl(colori.scuro, 0, 0.45);
  for (const m of MACCHIE) {
    ctx.beginPath();
    ctx.ellipse(m.u * lungo * 1.6, m.v * largo * 1.5, lungo * m.m * 1.4, largo * m.m * 1.1, m.u, 0, Math.PI * 2);
    ctx.fill();
  }
  // Riflesso di luce sul dorso.
  const luce = ctx.createRadialGradient(lungo * 0.1, -largo * 0.5, 0, lungo * 0.1, -largo * 0.5, lungo * 0.7);
  luce.addColorStop(0, 'rgba(255, 240, 220, 0.22)');
  luce.addColorStop(1, 'rgba(255, 240, 220, 0)');
  ctx.fillStyle = luce;
  ctx.fillRect(-lungo, -largo * 1.5, lungo * 2, largo * 3);
  ctx.restore();
  ctx.restore();
}

function occhio(ctx, x, y, r, colori, buio) {
  // Protuberanza della pelle intorno all'occhio.
  ctx.fillStyle = hsl(colori.c, 4);
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.1, r * 1.5, r * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(42, 70%, ${55 * (1 - buio * 0.5)}%)`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupilla a fessura orizzontale, come nei polpi veri.
  ctx.fillStyle = 'rgba(10, 5, 5, 0.95)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nel buio della grotta gli occhi brillano un po'.
  ctx.fillStyle = `rgba(255, 250, 220, ${0.5 + buio * 0.4})`;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- Pose ----------

function disegnaTerra(ctx, p, L, t, colori) {
  const respiro = 1 + 0.05 * Math.sin(t * 1.8);
  // Il corpo scivola basso e regolare, con un leggerissimo su e giù.
  const alto = L * (0.2 + 0.02 * Math.sin(t * 1.2)) * (p.dentroTana ? 0.8 : 1);
  const corona = { x: L * 0.04, y: -alto };

  // Tentacoli: dalla corona alla punta appoggiata (in coordinate del corpo).
  const tentacoli = BRACCIA.map((b, i) => {
    const piede = p.braccia.piedi[i];
    const punta = piede ? inCoordinateCorpo(piede.x, piede.y, p.x, p.y, p.verso, 0) : { x: b.avanti * L, y: b.profondita * L };
    // Le basi si dispongono lungo la corona, in ordine da dietro a davanti.
    const base = { x: corona.x + (i / (BRACCIA.length - 1) - 0.5) * L * 0.2, y: corona.y + L * 0.03 };
    return { b, punti: spinaTerra(base, punta, L, t, i) };
  });

  // 1. Tentacoli verso il fondo (in ombra).
  for (const x of tentacoli.filter((q) => q.b.profondita <= 0)) tentacolo(ctx, x.punti, L * 0.13, colori, false, 0.8);

  // 2. Corona: il corpo sotto il mantello, dove nascono i tentacoli. Copre le basi.
  ctx.beginPath();
  ctx.ellipse(corona.x, corona.y + L * 0.02, L * 0.17, L * 0.09, 0, 0, Math.PI * 2);
  ctx.fillStyle = hsl(colori.c, -2);
  ctx.fill();

  // 3. Mantello a goccia: la parte larga attaccata vicino agli occhi (davanti,
  //    in basso), la punta stretta verso dietro e in alto, come nei polpi veri.
  const inclinazione = -2.45 + Math.sin(t * 0.9) * 0.05;
  mantello(ctx, corona.x - L * 0.17, corona.y - L * 0.14, L * 0.27, L * 0.2, inclinazione, colori, respiro);

  // 4. Tentacoli verso di noi, con le ventose in vista.
  for (const x of tentacoli.filter((q) => q.b.profondita > 0)) tentacolo(ctx, x.punti, L * 0.14, colori, true);

  // 5. Occhio, sopra la corona.
  occhio(ctx, corona.x + L * 0.08, corona.y - L * 0.06, L * 0.045, colori, p.buio);
}

function disegnaNuoto(ctx, p, L, t, colori) {
  // Spinta: tentacoli stretti; planata: un po' aperti, come un ombrello.
  const ritmo = p.stato === 'spavento' ? 5 : 3;
  const spinta = Math.max(0, Math.sin(t * ritmo)) ** 2;
  const apertura = 1 - spinta * 0.7;
  const lista = BRACCIA.map((b, i) => {
    const lato = (i / (BRACCIA.length - 1)) * 2 - 1;
    const punti = [];
    for (let k = 0; k <= 14; k++) {
      const s = k / 14;
      punti.push({
        x: -s * L * 0.85,
        // Ondeggiano mentre lo seguono, e le punte si arricciano un po'.
        y: L * (lato * (0.04 + s * 0.14 * apertura) + Math.sin(t * 4 - s * 5 + i) * 0.04 * s + lato * s ** 3 * 0.06),
      });
    }
    return { b, punti };
  });
  for (const x of lista.filter((q) => q.b.profondita <= 0)) tentacolo(ctx, x.punti, L * 0.11, colori, false, 0.82);
  // Il mantello davanti, allungato nella direzione del nuoto (la punta avanti).
  const gonfio = 1 + 0.12 * Math.sin(t * ritmo + 1.5);
  mantello(ctx, L * 0.2, -L * 0.01, L * 0.27, L * 0.13, 0, colori, gonfio);
  for (const x of lista.filter((q) => q.b.profondita > 0)) tentacolo(ctx, x.punti, L * 0.11, colori, true);
  occhio(ctx, L * 0.02, -L * 0.07, L * 0.04, colori, p.buio);
}
