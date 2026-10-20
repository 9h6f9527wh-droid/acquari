// Disegno del polpo, nello stesso stile dipinto del resto della vasca.
//
// Due pose:
//  - A TERRA (striscia o riposa): il "sacco" della testa sta in alto, un po'
//    piegato all'indietro; gli otto tentacoli partono da sotto gli occhi e si
//    appoggiano sul fondo, con le punte che si arricciano.
//  - NUOTO (a getto): il sacco va avanti, i tentacoli stanno tutti dietro,
//    stretti durante la spinta e un po' aperti quando plana.
//
// Il colore mescola il suo rosso-arancio con il color sabbia (mimetismo) e si
// scurisce di colpo quando si spaventa.

import { velaColore, hsl } from '../util/colore.js';

const BRACCIA = 8;
const PEZZI = 12;
// Verso dove si allunga ogni tentacolo sulla sabbia, in profondità: positivo
// = verso di noi (sullo schermo scende), negativo = verso il fondo (sale).
// Così a terra i tentacoli si aprono a raggiera, come una stella.
const PROFONDITA_BRACCIA = [-0.07, 0.13, -0.03, 0.17, 0.15, -0.04, 0.11, -0.08];

// Mescola due colori. La tonalità è un cerchio (0 e 360 sono lo stesso rosso):
// prendiamo la strada più corta, così dal rosso-arancio allo scuro non si
// passa per il blu e il viola.
function mescola(a, b, f) {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { h: (a.h + dh * f + 360) % 360, s: a.s + (b.s - a.s) * f, l: a.l + (b.l - a.l) * f };
}

// Macchie del sacco (sempre uguali).
const MACCHIE = Array.from({ length: 11 }, (_, i) => ({
  a: (i * 2.4) % (Math.PI * 2),
  r: 0.25 + ((i * 37) % 60) / 100,
  m: 0.06 + ((i * 13) % 5) / 100,
}));

export function disegnaPolpo(ctx, p, L) {
  const t = p.tempo;
  // Colore: suo, mimetizzato con la sabbia, o scuro per lo spavento.
  let c = mescola({ h: 10, s: 65, l: 46 }, { h: 42, s: 22, l: 54 }, p.mimetismo);
  c = mescola(c, { h: 355, s: 70, l: 22 }, p.spaventato);
  c = velaColore(c, p.z);
  c = { ...c, l: c.l * (1 - p.buio * 0.75) };
  const scuro = { ...c, l: c.l * 0.7 };
  const chiaro = { ...c, l: Math.min(85, c.l * 1.35 + 6) };

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (p.posa === 'nuoto') {
    // La testa punta nella direzione del nuoto; gli occhi restano in alto.
    ctx.rotate(p.angolo);
    if (Math.cos(p.angolo) < 0) ctx.scale(1, -1);
    disegnaNuoto(ctx, p, L, t, c, scuro, chiaro);
  } else {
    ctx.scale(p.verso, 1);
    disegnaTerra(ctx, p, L, t, c, scuro, chiaro);
  }
  ctx.restore();
}

// Un tentacolo: striscia che si assottiglia, lungo una "spina" di punti.
function tentacolo(ctx, punti, spessore, c, scuro, chiaro, ventose) {
  const sopra = [];
  const sotto = [];
  for (let i = 0; i < punti.length; i++) {
    const a = punti[Math.max(0, i - 1)];
    const b = punti[Math.min(punti.length - 1, i + 1)];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const w = (spessore * (1 - (i / (punti.length - 1)) * 0.88)) / 2;
    sopra.push({ x: punti[i].x - Math.sin(ang) * w, y: punti[i].y + Math.cos(ang) * w });
    sotto.push({ x: punti[i].x + Math.sin(ang) * w, y: punti[i].y - Math.cos(ang) * w });
  }
  ctx.beginPath();
  sopra.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  for (let i = sotto.length - 1; i >= 0; i--) ctx.lineTo(sotto[i].x, sotto[i].y);
  ctx.closePath();
  ctx.fillStyle = hsl(c);
  ctx.fill();
  ctx.strokeStyle = hsl(scuro, 0, 0.5);
  ctx.lineWidth = Math.max(0.5, spessore * 0.08);
  ctx.stroke();
  // Ventose chiare lungo un lato.
  if (ventose) {
    ctx.fillStyle = hsl(chiaro, 0, 0.85);
    for (let i = 1; i < punti.length - 2; i += 2) {
      const w = (spessore * (1 - (i / (punti.length - 1)) * 0.88)) / 2;
      ctx.beginPath();
      ctx.arc(sotto[i].x * 0.7 + punti[i].x * 0.3, sotto[i].y * 0.7 + punti[i].y * 0.3, Math.max(0.6, w * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function sacco(ctx, cx, cy, rx, ry, rotazione, c, scuro, chiaro, gonfio) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotazione);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * gonfio, ry, 0, 0, Math.PI * 2);
  const corpo = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 0, 0, 0, Math.max(rx, ry) * 1.1);
  corpo.addColorStop(0, hsl(chiaro));
  corpo.addColorStop(0.6, hsl(c));
  corpo.addColorStop(1, hsl(scuro));
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Macchie e piccole verruche: la pelle del polpo è a chiazze.
  for (const m of MACCHIE) {
    ctx.fillStyle = hsl(scuro, 0, 0.45);
    ctx.beginPath();
    ctx.ellipse(Math.cos(m.a) * rx * m.r, Math.sin(m.a) * ry * m.r, rx * m.m * 1.6, ry * m.m, m.a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function occhio(ctx, x, y, r, buio) {
  ctx.fillStyle = `hsl(42, 70%, ${55 * (1 - buio * 0.5)}%)`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupilla a fessura orizzontale, come nei polpi veri.
  ctx.fillStyle = 'rgba(10, 5, 5, 0.95)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nel buio della grotta gli occhi brillano un po'.
  ctx.fillStyle = `rgba(255, 250, 220, ${0.5 + buio * 0.4})`;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function disegnaTerra(ctx, p, L, t, c, scuro, chiaro) {
  const respiro = 1 + 0.05 * Math.sin(t * 1.8);
  // Quando riposa è più schiacciato a terra; quando striscia ondeggia un po'.
  const basso = 0.8 + 0.2 * p.movimento;
  const ondeggio = Math.sin(t * 3) * L * 0.02 * p.movimento;
  const base = { x: L * 0.08, y: -L * 0.16 * basso + ondeggio };

  // Tentacoli: quattro verso dietro e quattro verso davanti, appoggiati al fondo.
  const lunghezza = L * 0.75;
  const tutti = [];
  for (let i = 0; i < BRACCIA; i++) {
    const q = i / (BRACCIA - 1); // da 0 (dietro) a 1 (davanti)
    const lato = q * 2 - 1;
    let angolo = Math.PI / 2 - lato * 1.35; // verso il basso, aperti a ventaglio
    // Strisciando, i tentacoli davanti si allungano in avanti a turno.
    angolo -= Math.sin(t * 2.6 + i * 0.9) * 0.3 * p.movimento * Math.sign(lato || 1);
    const punti = [{ ...base }];
    let x = base.x + lato * L * 0.05;
    let y = base.y;
    const passo = (lunghezza * (0.85 + ((i * 7) % 4) * 0.06)) / PEZZI;
    for (let k = 1; k <= PEZZI; k++) {
      const s = k / PEZZI;
      // La punta si arriccia verso l'alto, e ondeggia piano.
      const arriccia = Math.sign(lato || 0.5) * s * s * 1.6;
      const onda = Math.sin(t * 2 + i * 1.3 + s * 4) * 0.25 * s;
      const a = angolo - arriccia + onda;
      x += Math.cos(a) * passo;
      y += Math.sin(a) * passo;
      // Il fondo: ogni tentacolo si appoggia sulla sabbia alla sua profondità
      // (più vicino a noi = più in basso sullo schermo) e lì si stende.
      const fondo = PROFONDITA_BRACCIA[i] * L * Math.min(1, s * 2.2);
      if (y > fondo) y = fondo - s * L * 0.01;
      punti.push({ x, y });
    }
    tutti.push(punti);
  }
  const lontani = tutti.map((punti, i) => ({ punti, i })).filter((b) => PROFONDITA_BRACCIA[b.i] <= 0);
  const vicini = tutti.map((punti, i) => ({ punti, i })).filter((b) => PROFONDITA_BRACCIA[b.i] > 0);

  // Membrana: la "gonna" di pelle che unisce l'attacco dei tentacoli.
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - L * 0.04);
  for (const punti of tutti) {
    const q = punti[3];
    ctx.lineTo(q.x, q.y);
  }
  ctx.closePath();
  ctx.fillStyle = hsl({ ...c, l: c.l * 0.88 });
  ctx.fill();

  // Prima i tentacoli lontani (più scuri, in ombra)...
  for (const b of lontani) tentacolo(ctx, b.punti, L * 0.1, { ...c, l: c.l * 0.82 }, scuro, chiaro, false);

  // ...poi il "collo" che unisce testa e tentacoli...
  ctx.beginPath();
  ctx.ellipse(base.x - L * 0.04, base.y - L * 0.07, L * 0.16, L * 0.1, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = hsl(c);
  ctx.fill();

  // ...il sacco della testa, in alto e piegato all'indietro...
  sacco(ctx, -L * 0.12, -L * 0.42 * basso + ondeggio, L * 0.3, L * 0.22, -0.55, c, scuro, chiaro, respiro);
  // ...e per ultimi i tentacoli vicini a noi, con le ventose in vista.
  for (const b of vicini) tentacolo(ctx, b.punti, L * 0.115, c, scuro, chiaro, true);
  // Occhi sopra la base dei tentacoli.
  occhio(ctx, L * 0.13, -L * 0.28 * basso + ondeggio, L * 0.05, p.buio);
}

function disegnaNuoto(ctx, p, L, t, c, scuro, chiaro) {
  // Spinta: tentacoli stretti; planata: un po' aperti, come un ombrello.
  const spinta = Math.max(0, Math.sin(t * (p.stato === 'spavento' ? 5 : 3))) ** 2;
  const apertura = 1 - spinta * 0.7;
  for (let i = 0; i < BRACCIA; i++) {
    const lato = (i / (BRACCIA - 1)) * 2 - 1;
    const punti = [{ x: -L * 0.02, y: lato * L * 0.04 }];
    for (let k = 1; k <= PEZZI; k++) {
      const s = k / PEZZI;
      punti.push({
        x: -L * 0.02 - s * L * 0.8,
        // Ondeggiano mentre lo seguono, e le punte si arricciano un po'.
        y: L * (lato * (0.04 + s * 0.16 * apertura) + Math.sin(t * 4 - s * 5 + i) * 0.05 * s + lato * s ** 3 * 0.08),
      });
    }
    tentacolo(ctx, punti, L * 0.09, c, scuro, chiaro, false);
  }
  // Il sacco davanti, allungato nella direzione del nuoto.
  const gonfio = 1 + 0.12 * Math.sin(t * (p.stato === 'spavento' ? 5 : 3) + 1.5);
  sacco(ctx, L * 0.22, -L * 0.02, L * 0.24, L * 0.15, 0, c, scuro, chiaro, gonfio);
  occhio(ctx, L * 0.03, -L * 0.08, L * 0.045, p.buio);
}
