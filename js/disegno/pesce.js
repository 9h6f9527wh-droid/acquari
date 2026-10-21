// Disegno di un pesce, nello stesso stile dipinto del resto della vasca.
// Tutto quello che cambia da specie a specie (forma, pinne, coda, disegni
// sulla pelle, colori) sta nella sua scheda in pesci/specie.js.
//
// Il pesce è disegnato "di profilo", con il muso verso destra e il centro
// nell'origine; poi lo spostiamo, lo inclinamo e lo specchiamo se guarda a
// sinistra. Durante una girata viene stretto in larghezza: sembra che ruoti.
//
// Il corpo si piega come un'onda che va dalla testa alla coda: la testa si
// muove poco, la coda molto. L'ordine di disegno conta:
//   pinne dietro (dorsali, anali, ventrale, coda) → corpo → disegni sulla pelle
//   → pinna pettorale → occhio.

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

// Quanto è alta una pinna nel punto q (da 0 = inizio a 1 = fine della pinna).
const FORME_PINNA = {
  // Parte davanti più bassa e spinosa, parte dietro più alta e morbida.
  doppia: (q) => (q < 0.42 ? 0.55 + 0.2 * Math.sin((q / 0.42) * Math.PI) : 0.6 + 0.4 * Math.sin(((q - 0.42) / 0.58) * Math.PI)) * Math.sin(q * Math.PI) ** 0.7,
  // Lunga e bassa, quasi uguale per tutta la lunghezza.
  lunga: (q) => Math.sin(q * Math.PI) ** 0.45,
  // Alta e appuntita.
  spina: (q) => Math.sin(q * Math.PI) ** 1.3,
  // Si alza e si allunga verso il fondo, come una vela.
  vela: (q) => Math.sin(Math.min(1, q * 1.15) * Math.PI * 0.5) ** 0.8 * (1 - Math.max(0, q - 0.85) * 4),
};

export function disegnaPesce(ctx, pesce, larghezza, altezza) {
  const sp = pesce.specie;
  const L = pesce.lunghezza(larghezza, altezza);
  const Lc = L * 0.8; // corpo senza la coda
  const H = L * sp.altezza;
  const t = pesce.fase;

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
    let h = profilo(sp, s) * H * 0.5;
    // Il pesce palla gonfio diventa quasi una palla: il profilo si arrotonda
    // fino a un cerchio (ma l'attacco della coda resta stretto).
    if (pesce.gonfio > 0) {
      const tondo = Math.sqrt(Math.max(0, 1 - (2 * Math.min(s, 0.97) - 1) ** 2)) * Lc * 0.5;
      h += (Math.max(tondo, h * 0.7) - h) * pesce.gonfio;
    }
    spina.push({
      s,
      x: Lc / 2 - s * Lc,
      y: Math.sin(t - s * 2.6) * onda * s * s * L * 0.07,
      h,
    });
  }
  const coda = spina[PUNTI];
  const angoloCoda = Math.atan2(coda.y - spina[PUNTI - 2].y, spina[PUNTI - 2].x - coda.x);
  // Punti del bordo superiore/inferiore, e un punto qualsiasi (s, v) del corpo.
  const sopra = (s) => {
    const p = puntoSpina(spina, s);
    return { x: p.x, y: p.y - p.h };
  };
  const sotto = (s) => {
    const p = puntoSpina(spina, s);
    return { x: p.x, y: p.y + p.h * 0.95 };
  };
  const sulCorpo = (s, v) => {
    const p = puntoSpina(spina, Math.min(1, s));
    return { x: p.x - Math.max(0, s - 1) * Lc, y: p.y + v * p.h };
  };

  ctx.save();
  ctx.translate(pesce.x, pesce.y);
  const scalaVerso = Math.max(0.12, Math.abs(pesce.verso)) * Math.sign(pesce.verso || 1);
  ctx.scale(scalaVerso, 1);
  ctx.rotate(pesce.inclinazione);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const bordo = Math.max(0.8, L * 0.014);
  const pinne = sp.pinne;

  // --- Pinne dorsali e anali (dietro il corpo) ---
  for (const pd of pinne.dorsali) pinnaLunga(ctx, pd, sopra, -1, H, L, t, colori, bordo);
  for (const pa of pinne.anali) pinnaLunga(ctx, pa, sotto, 1, H, L, t, colori, bordo);

  // --- Pinna ventrale (sotto il petto) ---
  if (pinne.ventrale) {
    const m = pinne.ventrale.misura;
    const v = sotto(0.32);
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(0.6 + 0.15 * Math.sin(t));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-L * 0.04 * m, H * 0.12 * m, -L * 0.11 * m, H * 0.02);
    ctx.quadraticCurveTo(-L * 0.05 * m, -H * 0.02, 0, 0);
    pinna(ctx, colori, bordo, pinne.ventrale.scura ? 0.9 : 0.78, pinne.ventrale.scura ? 'bordi' : 'pinne');
    ctx.restore();
  }

  // --- Coda ---
  disegnaCoda(ctx, pinne.coda, coda, angoloCoda, L, colori, bordo);

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
  for (const decoro of sp.decori) disegnaDecoro(ctx, decoro, spina, sulCorpo, H, Lc, L, colori);
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

  // Le spine del pesce palla: quando si gonfia spuntano tutto intorno al corpo.
  if (pesce.gonfio > 0.15) {
    const lunga = L * 0.065 * (pesce.gonfio - 0.15) / 0.85;
    ctx.strokeStyle = hsl(colori.corpo, -18, 0.9);
    ctx.lineWidth = Math.max(0.6, L * 0.008);
    ctx.beginPath();
    for (let i = 2; i < PUNTI - 1; i++) {
      for (const lato of [-1, 1]) {
        const p = spina[i];
        const y = p.y + lato * p.h * (lato > 0 ? 0.95 : 1);
        // Verso l'esterno e un po' all'indietro (la testa è verso x positivo).
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x - lunga * 0.4, y + lato * lunga);
      }
    }
    ctx.stroke();
  }

  // "Bisturi" del pesce chirurgo: una piccola spina gialla vicino alla coda.
  if (sp.bisturi) {
    const b = sulCorpo(0.9, 0.05);
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, L * 0.03, H * 0.04, 0, 0, Math.PI * 2);
    ctx.fillStyle = hsl(colori.coda, 0, 0.9);
    ctx.fill();
  }

  // --- Pinna pettorale (sul fianco, sopra il corpo): sbatte come un remo ---
  const pp = puntoSpina(spina, 0.3);
  ctx.save();
  ctx.translate(pp.x, pp.y + pp.h * 0.25);
  ctx.rotate(0.5 + 0.35 * Math.sin(t * 1.4));
  // Trasparente, a forma di goccia, con qualche raggio: niente contorno spesso.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.06, -H * 0.13, -L * 0.13, -H * 0.02);
  ctx.quadraticCurveTo(-L * 0.07, H * 0.1, 0, 0);
  const coloreP = colori[pinne.pettorale || 'pinne'];
  ctx.fillStyle = hsl(coloreP, 10, 0.55);
  ctx.fill();
  ctx.strokeStyle = hsl(colori.bordi, 0, 0.45);
  ctx.lineWidth = bordo * 0.5;
  ctx.stroke();
  ctx.strokeStyle = hsl(coloreP, -15, 0.35);
  for (const k of [-0.06, 0, 0.05]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-L * 0.11, H * k);
    ctx.stroke();
  }
  ctx.restore();

  // --- Occhio ---
  const oc = puntoSpina(spina, sp.occhio.dove);
  const r = H * sp.occhio.misura;
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

// Pinna dorsale (lato = -1, verso l'alto) o anale (lato = 1, verso il basso).
function pinnaLunga(ctx, p, bordoCorpo, lato, H, L, t, colori, bordo) {
  const forma = FORME_PINNA[p.forma];
  const passi = 16;
  ctx.beginPath();
  const a = bordoCorpo(p.da);
  ctx.moveTo(a.x, a.y - lato * H * 0.05);
  for (let i = 0; i <= passi; i++) {
    const q = i / passi;
    const b = bordoCorpo(p.da + (p.a - p.da) * q);
    // Ondeggia appena, come mossa dall'acqua.
    const alto = H * p.altezza * forma(q) * (1 + 0.05 * Math.sin(t * 1.3 + q * 4));
    ctx.lineTo(b.x - alto * p.piega, b.y + lato * alto);
  }
  const z = bordoCorpo(p.a);
  ctx.lineTo(z.x, z.y - lato * H * 0.05);
  ctx.closePath();
  // Le pinne "scure" (cardinale di Banggai) usano il colore delle barre nere.
  const nomeColore = p.scura && colori.barre ? 'barre' : 'pinne';
  pinna(ctx, colori, bordo, p.scura ? 0.72 : 0.78, nomeColore, p.bordoNero);
  // Raggi della pinna: linee sottili dalla base verso il bordo.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = hsl(colori.pinne, -18, 0.35);
  ctx.lineWidth = Math.max(0.5, L * 0.005);
  for (let i = 1; i < 8; i++) {
    const q = i / 8;
    const b = bordoCorpo(p.da + (p.a - p.da) * q);
    const lungo = H * p.altezza * forma(q) * 1.1;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - lungo * p.piega, b.y + lato * lungo);
    ctx.stroke();
  }
  // Puntini bianchi sulle pinne (cardinale di Banggai).
  if (p.puntini && colori.puntini) {
    ctx.fillStyle = hsl(colori.puntini, 0, 0.85);
    for (let i = 1; i < 7; i++) {
      const q = i / 7;
      const b = bordoCorpo(p.da + (p.a - p.da) * q);
      const lungo = H * p.altezza * forma(q);
      for (const f of [0.35, 0.7]) {
        ctx.beginPath();
        ctx.arc(b.x - lungo * p.piega * f, b.y + lato * lungo * f, Math.max(0.6, L * 0.01), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function disegnaCoda(ctx, c, coda, angoloCoda, L, colori, bordo) {
  ctx.save();
  ctx.translate(coda.x, coda.y);
  ctx.rotate(-angoloCoda * 1.6);
  const Lt = L * c.lunghezza;
  const hc = coda.h;
  ctx.beginPath();
  ctx.moveTo(0, -hc);
  if (c.forma === 'ventaglio') {
    ctx.quadraticCurveTo(-Lt * 0.5, -hc - Lt * 0.35, -Lt, -Lt * 0.62);
    ctx.quadraticCurveTo(-Lt * 1.12, 0, -Lt, Lt * 0.62);
    ctx.quadraticCurveTo(-Lt * 0.5, hc + Lt * 0.35, 0, hc);
  } else if (c.forma === 'tronca') {
    ctx.quadraticCurveTo(-Lt * 0.5, -hc - Lt * 0.3, -Lt * 0.95, -Lt * 0.68);
    ctx.quadraticCurveTo(-Lt * 0.78, 0, -Lt * 0.95, Lt * 0.68);
    ctx.quadraticCurveTo(-Lt * 0.5, hc + Lt * 0.3, 0, hc);
  } else {
    // Forcuta: due lobi lunghi con un'incavatura profonda in mezzo.
    ctx.quadraticCurveTo(-Lt * 0.55, -hc - Lt * 0.2, -Lt, -Lt * 0.72);
    ctx.quadraticCurveTo(-Lt * 0.7, -Lt * 0.25, -Lt * 0.42, 0);
    ctx.quadraticCurveTo(-Lt * 0.7, Lt * 0.25, -Lt, Lt * 0.72);
    ctx.quadraticCurveTo(-Lt * 0.55, hc + Lt * 0.2, 0, hc);
  }
  ctx.closePath();
  pinna(ctx, colori, bordo, 0.85, 'coda', c.bordi);
  // Raggi della coda.
  ctx.strokeStyle = hsl(colori.coda, -14, 0.35);
  ctx.lineWidth = Math.max(0.5, L * 0.006);
  for (let k = -2; k <= 2; k++) {
    ctx.beginPath();
    ctx.moveTo(0, k * hc * 0.3);
    ctx.lineTo(-Lt * (c.forma === 'forcuta' ? 0.6 + Math.abs(k) * 0.15 : 0.88), k * Lt * 0.26);
    ctx.stroke();
  }
  ctx.restore();
}

function disegnaDecoro(ctx, d, spina, sulCorpo, H, Lc, L, colori) {
  if (d.tipo === 'bande') {
    // Strisce verticali un po' curve; con il bordo, prima si disegna la
    // striscia scura un po' più larga e poi quella chiara sopra.
    const passate = d.bordo ? [[0.022, d.bordo], [0, d.colore]] : [[0, d.colore]];
    for (const banda of d.elenco) {
      for (const [extra, nome] of passate) {
        const w = banda.larghezza + extra;
        const top0 = puntoSpina(spina, banda.dove - w);
        const top1 = puntoSpina(spina, banda.dove + w);
        ctx.beginPath();
        ctx.moveTo(top0.x, top0.y - H);
        ctx.quadraticCurveTo(top0.x + banda.curva * Lc, top0.y, top0.x, top0.y + H);
        ctx.lineTo(top1.x, top1.y + H);
        ctx.quadraticCurveTo(top1.x + banda.curva * Lc, top1.y, top1.x, top1.y - H);
        ctx.closePath();
        ctx.fillStyle = hsl(colori[nome]);
        ctx.fill();
      }
    }
  } else if (d.tipo === 'forma') {
    // Una macchia dai contorni morbidi; i "buchi" vengono riempiti con il
    // colore del corpo, così sembrano parti del corpo rimaste libere.
    tracciaMorbida(ctx, d.punti.map(([s, v]) => sulCorpo(s, v)));
    ctx.fillStyle = hsl(colori[d.colore]);
    ctx.fill();
    for (const buco of d.buchi || []) {
      tracciaMorbida(ctx, buco.map(([s, v]) => sulCorpo(s, v)));
      ctx.fillStyle = hsl(colori.corpo, 2);
      ctx.fill();
    }
  } else if (d.tipo === 'puntini') {
    ctx.fillStyle = hsl(colori[d.colore], 0, 0.85);
    for (const p of d.elenco) {
      const q = sulCorpo(p.s, p.v);
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.6, p.r * L), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Disegna una forma morbida che passa vicino ai punti dati (chiusa).
function tracciaMorbida(ctx, punti) {
  const n = punti.length;
  const meta = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const inizio = meta(punti[n - 1], punti[0]);
  ctx.beginPath();
  ctx.moveTo(inizio.x, inizio.y);
  for (let i = 0; i < n; i++) {
    const m = meta(punti[i], punti[(i + 1) % n]);
    ctx.quadraticCurveTo(punti[i].x, punti[i].y, m.x, m.y);
  }
  ctx.closePath();
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

// Colora una pinna: semitrasparente, con il bordo scuro. "bordoNero" lo rende
// più marcato (come nel pesce chirurgo).
function pinna(ctx, colori, bordo, trasparenza = 0.88, nome = 'pinne', bordoNero = true) {
  const alfa = ctx.globalAlpha;
  ctx.fillStyle = hsl(colori[nome], 6, trasparenza * alfa);
  ctx.fill();
  ctx.strokeStyle = hsl(colori.bordi, 0, (bordoNero ? 0.75 : 0.35) * alfa);
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
