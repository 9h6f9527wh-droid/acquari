// Disegno di un pesce, nello stesso stile dipinto del resto della vasca.
//
// Il pesce è disegnato "di profilo", con il muso verso destra e il centro
// nell'origine; poi lo spostiamo, lo inclinamo e lo specchiamo se guarda a
// sinistra. Durante una girata viene stretto in larghezza: sembra che ruoti.
//
// Il corpo si piega come un'onda che va dalla testa alla coda: la testa si
// muove poco, la coda molto. L'ordine di disegno conta:
//   pinne dietro (dorsale, anale, coda) → corpo → bande → pinna pettorale → occhio.

import { velaColore, hsl } from '../util/colore.js';

const PUNTI = 22; // punti lungo il corpo: più sono, più il contorno è morbido

// Metà altezza del corpo nel punto s (0 = muso, 1 = attacco della coda).
function profilo(specie, s) {
  const p = specie.profilo;
  for (let i = 1; i < p.length; i++) {
    if (s <= p[i][0]) {
      const [s0, h0] = p[i - 1];
      const [s1, h1] = p[i];
      const f = (s - s0) / (s1 - s0);
      // Interpolazione morbida (non a spigoli) tra due punti del profilo.
      const g = f * f * (3 - 2 * f);
      return h0 + (h1 - h0) * g;
    }
  }
  return p[p.length - 1][1];
}

export function disegnaPesce(ctx, pesce, larghezza, altezza) {
  const sp = pesce.specie;
  const L = pesce.lunghezza(larghezza, altezza);
  const Lc = L * 0.8; // corpo senza la coda
  const H = L * sp.altezza;

  // Colori velati dall'acqua (in base a z) e scuriti se è nella grotta.
  const colori = {};
  for (const [nome, c] of Object.entries(sp.colori)) {
    const v = velaColore(c, pesce.z);
    colori[nome] = { ...v, l: v.l * (1 - pesce.buio * 0.7) };
  }

  // Spina dorsale: posizione x e spostamento verticale (l'onda) per ogni punto.
  const onda = pesce.ampiezza;
  const spina = [];
  for (let i = 0; i <= PUNTI; i++) {
    const s = i / PUNTI;
    spina.push({
      s,
      x: Lc / 2 - s * Lc,
      y: Math.sin(pesce.fase - s * 2.6) * onda * s * s * L * 0.07,
      h: profilo(sp, s) * H * 0.5,
    });
  }
  const coda = spina[PUNTI];
  const angoloCoda = Math.atan2(coda.y - spina[PUNTI - 2].y, spina[PUNTI - 2].x - coda.x);
  // Punto del bordo superiore/inferiore in s.
  const sopra = (s) => {
    const p = puntoSpina(spina, s);
    return { x: p.x, y: p.y - p.h };
  };
  const sotto = (s) => {
    const p = puntoSpina(spina, s);
    return { x: p.x, y: p.y + p.h * 0.95 };
  };

  ctx.save();
  ctx.translate(pesce.x, pesce.y);
  const scalaVerso = Math.max(0.12, Math.abs(pesce.verso)) * Math.sign(pesce.verso || 1);
  ctx.scale(scalaVerso, 1);
  ctx.rotate(pesce.inclinazione);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bordo = Math.max(0.8, L * 0.014);

  // --- Pinna dorsale (dietro il corpo): due lobi, quello davanti più basso ---
  const t = pesce.fase;
  ctx.beginPath();
  const iniz = 0.3;
  const fine = 0.82;
  for (let i = 0; i <= 16; i++) {
    const s = iniz + ((fine - iniz) * i) / 16;
    const b = sopra(s);
    if (i === 0) ctx.moveTo(b.x, b.y + H * 0.05);
    const q = (s - iniz) / (fine - iniz);
    // Parte davanti più bassa e spinosa, parte dietro più alta e morbida.
    const lobo = q < 0.42 ? 0.55 + 0.2 * Math.sin((q / 0.42) * Math.PI) : 0.6 + 0.4 * Math.sin(((q - 0.42) / 0.58) * Math.PI);
    const alto = H * 0.2 * lobo * Math.sin(q * Math.PI) ** 0.7 * (1 + 0.05 * Math.sin(t * 1.3 + q * 4));
    ctx.lineTo(b.x - alto * 0.35, b.y - alto);
  }
  const fineD = sopra(fine);
  ctx.lineTo(fineD.x, fineD.y + H * 0.05);
  ctx.closePath();
  pinna(ctx, colori, bordo, 0.78);
  raggi(ctx, sopra, iniz, fine, -H * 0.2, colori, L);

  // --- Pinna anale (sotto) ---
  ctx.beginPath();
  const a0 = sotto(0.58);
  ctx.moveTo(a0.x, a0.y - H * 0.05);
  for (let i = 0; i <= 10; i++) {
    const q = i / 10;
    const b = sotto(0.58 + q * 0.24);
    const basso = H * 0.18 * Math.sin(q * Math.PI) ** 0.7 * (1 + 0.06 * Math.sin(t * 1.1 + q * 3));
    ctx.lineTo(b.x - basso * 0.3, b.y + basso);
  }
  const a1 = sotto(0.82);
  ctx.lineTo(a1.x, a1.y - H * 0.05);
  ctx.closePath();
  pinna(ctx, colori, bordo, 0.78);
  raggi(ctx, sotto, 0.6, 0.8, H * 0.16, colori, L);

  // --- Pinna ventrale (piccola, sotto il petto) ---
  const v = sotto(0.32);
  ctx.beginPath();
  ctx.ellipse(v.x - L * 0.03, v.y + H * 0.06, L * 0.055, H * 0.06, 0.5 + 0.15 * Math.sin(t), 0, Math.PI * 2);
  pinna(ctx, colori, bordo);

  // --- Coda: un ventaglio arrotondato che segue il colpo della coda ---
  ctx.save();
  ctx.translate(coda.x, coda.y);
  ctx.rotate(-angoloCoda * 1.6);
  const Lt = L * 0.26;
  const hc = coda.h;
  ctx.beginPath();
  ctx.moveTo(0, -hc);
  ctx.quadraticCurveTo(-Lt * 0.5, -hc - Lt * 0.35, -Lt, -Lt * 0.62);
  ctx.quadraticCurveTo(-Lt * 1.12, 0, -Lt, Lt * 0.62);
  ctx.quadraticCurveTo(-Lt * 0.5, hc + Lt * 0.35, 0, hc);
  ctx.closePath();
  pinna(ctx, colori, bordo);
  // Raggi della coda.
  ctx.strokeStyle = hsl(colori.pinne, -12, 0.35);
  ctx.lineWidth = Math.max(0.5, L * 0.006);
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath();
    ctx.moveTo(0, k * hc * 0.3);
    ctx.lineTo(-Lt * 0.92, k * Lt * 0.26);
    ctx.stroke();
  }
  ctx.restore();

  // --- Corpo ---
  ctx.beginPath();
  for (let i = 0; i <= PUNTI; i++) {
    const p = spina[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y - p.h);
  }
  for (let i = PUNTI; i >= 0; i--) {
    const p = spina[i];
    ctx.lineTo(p.x, p.y + p.h * 0.95);
  }
  ctx.closePath();
  // Sfumatura: dorso più scuro, ventre più chiaro (luce dall'alto).
  const corpo = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
  corpo.addColorStop(0, hsl(colori.corpo, -8));
  corpo.addColorStop(0.45, hsl(colori.corpo, 2));
  corpo.addColorStop(1, hsl(colori.ventre, 4));
  ctx.fillStyle = corpo;
  ctx.fill();

  ctx.save();
  ctx.clip();
  // Bande bianche con il bordo nero. Sono un po' curve, come quelle vere.
  for (const banda of sp.bande) {
    for (const [extra, colore] of [[0.022, colori.bordi], [0, colori.bande]]) {
      const w = banda.larghezza + extra;
      const s0 = banda.dove - w;
      const s1 = banda.dove + w;
      const top0 = puntoSpina(spina, s0);
      const top1 = puntoSpina(spina, s1);
      ctx.beginPath();
      ctx.moveTo(top0.x, top0.y - H);
      ctx.quadraticCurveTo(top0.x + banda.curva * Lc, top0.y, top0.x, top0.y + H);
      ctx.lineTo(top1.x, top1.y + H);
      ctx.quadraticCurveTo(top1.x + banda.curva * Lc, top1.y, top1.x, top1.y - H);
      ctx.closePath();
      ctx.fillStyle = hsl(colore);
      ctx.fill();
    }
  }
  // Ombra sul ventre e luce sul dorso: danno volume.
  const volume = ctx.createLinearGradient(0, -H * 0.5, 0, H * 0.5);
  volume.addColorStop(0, 'rgba(255, 245, 210, 0.15)');
  volume.addColorStop(0.35, 'rgba(255, 245, 210, 0)');
  volume.addColorStop(0.7, 'rgba(20, 10, 0, 0)');
  volume.addColorStop(1, 'rgba(20, 10, 0, 0.25)');
  ctx.fillStyle = volume;
  ctx.fillRect(-L, -H, L * 2, H * 2);
  // Linea dell'opercolo (la "guancia").
  const op = puntoSpina(spina, 0.17);
  ctx.beginPath();
  ctx.moveTo(op.x + L * 0.01, op.y - op.h * 0.7);
  ctx.quadraticCurveTo(op.x - L * 0.035, op.y, op.x + L * 0.01, op.y + op.h * 0.7);
  ctx.strokeStyle = hsl(colori.corpo, -18, 0.3);
  ctx.lineWidth = Math.max(0.6, L * 0.008);
  ctx.stroke();
  ctx.restore();

  // Contorno sottile e scuro, come una pennellata leggera.
  ctx.strokeStyle = hsl(colori.bordi, 0, 0.4);
  ctx.lineWidth = bordo * 0.5;
  ctx.stroke();

  // --- Pinna pettorale (sul fianco, sopra il corpo): sbatte come un remo ---
  const pp = puntoSpina(spina, 0.3);
  ctx.save();
  ctx.translate(pp.x, pp.y + pp.h * 0.25);
  ctx.rotate(0.5 + 0.35 * Math.sin(pesce.fase * 1.4));
  // Trasparente, a forma di goccia, con qualche raggio: niente contorno spesso.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.06, -H * 0.13, -L * 0.13, -H * 0.02);
  ctx.quadraticCurveTo(-L * 0.07, H * 0.1, 0, 0);
  ctx.fillStyle = hsl(colori.pinne, 10, 0.55);
  ctx.fill();
  ctx.strokeStyle = hsl(colori.bordi, 0, 0.45);
  ctx.lineWidth = bordo * 0.5;
  ctx.stroke();
  ctx.strokeStyle = hsl(colori.pinne, -15, 0.35);
  for (const k of [-0.06, 0, 0.05]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-L * 0.11, H * k);
    ctx.stroke();
  }
  ctx.restore();

  // --- Occhio ---
  const oc = puntoSpina(spina, 0.1);
  const r = H * 0.11;
  const ox = oc.x;
  const oy = oc.y - H * 0.08;
  ctx.beginPath();
  ctx.arc(ox, oy, r, 0, Math.PI * 2);
  ctx.fillStyle = hsl(colori.occhio, 15);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox + r * 0.1, oy, r * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = hsl({ h: 0, s: 0, l: 4 });
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox - r * 0.2, oy - r * 0.3, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * (1 - pesce.buio)})`;
  ctx.fill();
  // Bocca.
  ctx.beginPath();
  ctx.moveTo(Lc / 2 - L * 0.005, H * 0.04);
  ctx.quadraticCurveTo(Lc / 2 - L * 0.03, H * 0.08, Lc / 2 - L * 0.05, H * 0.06);
  ctx.strokeStyle = hsl(colori.bordi, 0, 0.6);
  ctx.lineWidth = Math.max(0.6, L * 0.01);
  ctx.stroke();

  ctx.restore();
}

// Punto della spina dorsale in una posizione s qualsiasi (tra due punti calcolati).
function puntoSpina(spina, s) {
  const k = Math.max(0, Math.min(spina.length - 1.001, s * (spina.length - 1)));
  const i = Math.floor(k);
  const f = k - i;
  const a = spina[i];
  const b = spina[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: a.h + (b.h - a.h) * f };
}

// Raggi di una pinna: linee sottili dalla base verso il bordo.
function raggi(ctx, bordoCorpo, s0, s1, altezza, colori, L) {
  ctx.strokeStyle = hsl(colori.pinne, -18, 0.35);
  ctx.lineWidth = Math.max(0.5, L * 0.005);
  for (let i = 1; i < 7; i++) {
    const b = bordoCorpo(s0 + ((s1 - s0) * i) / 7);
    const q = i / 7;
    const lungo = altezza * Math.sin(q * Math.PI) ** 0.7;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - Math.abs(lungo) * 0.35, b.y + lungo * 0.9);
    ctx.stroke();
  }
}

// Colora una pinna: semitrasparente, con il bordo nero tipico del pagliaccio.
function pinna(ctx, colori, bordo, trasparenza = 0.88) {
  const alfa = ctx.globalAlpha;
  ctx.fillStyle = hsl(colori.pinne, 6, trasparenza * alfa);
  ctx.fill();
  ctx.strokeStyle = hsl(colori.bordi, 0, 0.75 * alfa);
  ctx.lineWidth = bordo;
  ctx.stroke();
}

// Ombra morbida sulla sabbia sotto il pesce: più è vicino al fondo, più è scura.
export function disegnaOmbra(ctx, pesce, larghezza, altezza) {
  if (pesce.dentroTana) return;
  const L = pesce.lunghezza(larghezza, altezza);
  const fondo = pesce.fondale.profondita(Math.min(1, Math.max(0, pesce.x / larghezza)), pesce.z) * altezza;
  const distanza = fondo - pesce.y;
  const forza = Math.max(0, 1 - distanza / (altezza * 0.35)) * 0.3 * (1 - pesce.buio);
  if (forza < 0.02) return;
  const largo = L * (0.45 + 0.25 * (1 - distanza / (altezza * 0.35)));
  const ombra = ctx.createRadialGradient(pesce.x, fondo, 0, pesce.x, fondo, largo);
  ombra.addColorStop(0, `rgba(5, 20, 25, ${forza})`);
  ombra.addColorStop(1, 'rgba(5, 20, 25, 0)');
  ctx.fillStyle = ombra;
  ctx.beginPath();
  ctx.ellipse(pesce.x, fondo, largo, largo * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
}
