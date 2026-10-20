// Disegno della seppia fiammeggiante, vista di lato.
//
// Com'è fatta (misure in L, guardando a destra, centro del mantello in 0,0):
//  - il MANTELLO è un ovale un po' gobbo, scuro (bruno-violaceo), con macchie
//    color crema sul dorso e piccole escrescenze;
//  - sulla pelle corrono ONDE di colore scure, dal davanti verso la coda
//    (le seppie le usano per "parlare" e per ipnotizzare le prede);
//  - la PINNA è un nastro sottile tutto intorno al mantello, sopra e sotto,
//    su cui scorre un'onda; il bordo è giallo;
//  - la TESTA ha un occhio grande con la pupilla a forma di "W";
//  - le BRACCIA formano un cono in avanti, con le punte gialle; le due di
//    sopra stanno alzate. Quando cammina, due braccia e due lembi sotto il
//    corpo poggiano sulla sabbia.

import { velaColore, hsl } from '../util/colore.js';
import { APPOGGI } from '../animali/seppia.js';

// Bordo del mantello: dall'alto (u = 0, davanti) giro completo.
function bordoMantello(u) {
  // u da 0 a 1: angolo intorno all'ovale.
  const a = u * Math.PI * 2;
  const x = -0.12 + Math.cos(a) * 0.3;
  // Sopra è gobbo (più alto verso la coda), sotto più piatto.
  const sopra = Math.sin(a) < 0;
  const y = Math.sin(a) * (sopra ? 0.21 + Math.max(0, -Math.cos(a)) * 0.03 : 0.15);
  return { x, y };
}

function mescolaLampo(c, lampo, t) {
  if (lampo <= 0) return c;
  // Lampeggia tra giallo e bianco mentre si spaventa.
  const acceso = 0.5 + 0.5 * Math.sin(t * 18);
  const lampoColore = acceso > 0.5 ? { h: 50, s: 90, l: 62 } : { h: 40, s: 30, l: 88 };
  // La tinta è un cerchio: si prende la strada più corta (dal viola al giallo
  // passando per il rosso, non per il blu).
  let dh = lampoColore.h - c.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return {
    h: (c.h + dh * lampo + 360) % 360,
    s: c.s + (lampoColore.s - c.s) * lampo,
    l: c.l + (lampoColore.l - c.l) * lampo,
  };
}

export function disegnaSeppia(ctx, s, L) {
  const t = s.tempo;
  const base = mescolaLampo(velaColore({ h: 338, s: 42, l: 26 }, s.z), s.lampo * 0.7, t);
  const crema = velaColore({ h: 42, s: 55, l: 80 }, s.z);
  const giallo = velaColore({ h: 50, s: 92, l: 60 }, s.z);
  const rosa = velaColore({ h: 320, s: 55, l: 58 }, s.z);

  // Ombra sulla sabbia, più debole se sta in alto.
  const terra = s.y + L * (0.2 + s.alto);
  ctx.fillStyle = `rgba(10, 20, 25, ${0.28 / (1 + s.alto * 1.5)})`;
  ctx.beginPath();
  ctx.ellipse(s.x - s.verso * L * 0.05, terra, L * 0.42, L * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(s.x, s.y);
  // Quando si gira, il corpo si stringe e si riapre dall'altra parte.
  const giro = Math.sign(s.giro) * Math.max(0.15, Math.abs(s.giro));
  ctx.scale(giro * L, L);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const verso = Math.sign(s.giro) || 1;

  // --- Braccia (dietro la testa: quelle dal lato lontano) ---
  const braccio = (x0, y0, angolo, lungo, spessore, fase, colore) => {
    const pezzi = 6;
    const punti = [];
    let x = x0;
    let y = y0;
    let a = angolo;
    // Ogni braccio si piega piano e verso la punta si arriccia (verso l'alto
    // per quelle di sopra, verso il basso per quelle di sotto).
    const arriccia = angolo < -0.2 ? -0.16 : 0.12;
    for (let i = 0; i <= pezzi; i++) {
      const q = i / pezzi;
      punti.push({ x, y, w: spessore * (1 - q * 0.8) });
      a += Math.sin(t * 1.6 + fase + i * 0.6) * 0.06 + arriccia * q * 1.6;
      x += Math.cos(a) * (lungo / pezzi);
      y += Math.sin(a) * (lungo / pezzi);
    }
    // Il braccio è una forma piena che si assottiglia (non una fila di bastoncini).
    ctx.beginPath();
    for (let i = 0; i <= pezzi; i++) {
      const p = punti[i];
      const d = punti[Math.min(pezzi, i + 1)];
      const c0 = punti[Math.max(0, i - 1)];
      const an = Math.atan2(d.y - c0.y, d.x - c0.x);
      const xx = p.x + Math.sin(an) * p.w * 0.5;
      const yy = p.y - Math.cos(an) * p.w * 0.5;
      if (i) ctx.lineTo(xx, yy);
      else ctx.moveTo(xx, yy);
    }
    for (let i = pezzi; i >= 0; i--) {
      const p = punti[i];
      const d = punti[Math.min(pezzi, i + 1)];
      const c0 = punti[Math.max(0, i - 1)];
      const an = Math.atan2(d.y - c0.y, d.x - c0.x);
      ctx.lineTo(p.x - Math.sin(an) * p.w * 0.5, p.y + Math.cos(an) * p.w * 0.5);
    }
    ctx.closePath();
    const sfuma = ctx.createLinearGradient(x0, y0, punti[pezzi].x, punti[pezzi].y);
    sfuma.addColorStop(0, hsl(base, 6));
    sfuma.addColorStop(0.55, hsl(colore));
    sfuma.addColorStop(1, hsl(giallo));
    ctx.fillStyle = sfuma;
    ctx.fill();
  };
  braccio(0.27, 0.0, -0.15, 0.16, 0.06, 1, { ...rosa, l: rosa.l * 0.7 });
  braccio(0.27, 0.05, 0.3, 0.14, 0.055, 2, { ...rosa, l: rosa.l * 0.7 });

  // Braccia e lembi che camminano: vanno dal corpo ai piedi sulla sabbia.
  if (s.aTerra > 0.5) {
    s.zampe.piedi.forEach((p, i) => {
      if (!p) return;
      const px = (p.x - s.x) / (L * giro);
      const py = (p.y - s.y) / L;
      const davanti = APPOGGI[i].avanti > 0;
      const x0 = davanti ? 0.26 : APPOGGI[i].avanti * 0.8;
      const y0 = davanti ? 0.08 : 0.1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + px) / 2 + (davanti ? 0.04 : -0.03), (y0 + py) / 2, px, py);
      ctx.lineWidth = davanti ? 0.045 : 0.06;
      ctx.strokeStyle = davanti ? hsl(rosa) : hsl(base, 6);
      ctx.stroke();
      if (davanti) {
        ctx.fillStyle = hsl(giallo);
        ctx.beginPath();
        ctx.arc(px, py - 0.01, 0.018, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // --- Pinna intorno al mantello: un nastro su cui scorre un'onda ---
  const N = 40;
  const pinna = [];
  for (let i = 0; i <= N; i++) {
    const u = 0.04 + (i / N) * 0.92; // non davanti, dove c'è la testa
    const p = bordoMantello(u);
    const q = bordoMantello(u + 0.002);
    const lung = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = (q.y - p.y) / lung;
    const ny = -(q.x - p.x) / lung;
    // L'onda va dal davanti verso la coda (più veloce quando nuota).
    const ritmo = s.stato === 'spavento' ? 16 : 7;
    const w = 0.03 + 0.018 * Math.sin(u * 60 - t * ritmo);
    pinna.push({ x: p.x, y: p.y, ox: p.x + nx * w, oy: p.y + ny * w });
  }
  ctx.beginPath();
  pinna.forEach((p, i) => (i ? ctx.lineTo(p.ox, p.oy) : ctx.moveTo(p.ox, p.oy)));
  for (let i = pinna.length - 1; i >= 0; i--) ctx.lineTo(pinna[i].x, pinna[i].y);
  ctx.closePath();
  ctx.fillStyle = hsl(rosa, 10, 0.4);
  ctx.fill();
  ctx.beginPath();
  pinna.forEach((p, i) => (i ? ctx.lineTo(p.ox, p.oy) : ctx.moveTo(p.ox, p.oy)));
  ctx.strokeStyle = hsl(giallo, 0, 0.75);
  ctx.lineWidth = 0.008;
  ctx.stroke();

  // --- Mantello ---
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const p = bordoMantello(i / 48);
    if (i) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  }
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -0.2, 0, 0.14);
  corpo.addColorStop(0, hsl(base, 12));
  corpo.addColorStop(0.55, hsl(base));
  corpo.addColorStop(1, hsl(base, -base.l * 0.35));
  ctx.fillStyle = corpo;
  ctx.fill();
  ctx.clip();

  // Macchie color crema e rosa sul dorso (sempre uguali).
  for (let k = 0; k < 7; k++) {
    const x = -0.36 + k * 0.075 + Math.sin(k * 2.3) * 0.02;
    const y = -0.12 + Math.sin(k * 1.7) * 0.035;
    ctx.fillStyle = hsl(k % 3 === 0 ? rosa : crema, 0, 0.75);
    ctx.beginPath();
    ctx.ellipse(x, y, 0.045, 0.03, Math.sin(k) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Onde di colore: bande scure che corrono dal davanti verso la coda.
  const ritmoOnde = s.stato === 'cammina' ? 3 : s.stato === 'sosta' ? 1.2 : 2;
  for (let k = 0; k < 5; k++) {
    const pos = ((t * ritmoOnde * 0.12 + k / 5) % 1);
    const x = 0.18 - pos * 0.62;
    const forza = Math.sin(pos * Math.PI) * 0.4;
    const banda = ctx.createLinearGradient(x - 0.06, 0, x + 0.06, 0);
    banda.addColorStop(0, 'rgba(15, 5, 12, 0)');
    banda.addColorStop(0.5, `rgba(15, 5, 12, ${forza})`);
    banda.addColorStop(1, 'rgba(15, 5, 12, 0)');
    ctx.fillStyle = banda;
    ctx.fillRect(x - 0.06, -0.25, 0.12, 0.45);
  }
  // Un velo bianco sottile sul ventre e una luce sul dorso.
  ctx.fillStyle = 'rgba(255, 240, 245, 0.08)';
  ctx.fillRect(-0.5, 0.05, 0.7, 0.1);
  ctx.fillStyle = 'rgba(255, 245, 230, 0.12)';
  ctx.beginPath();
  ctx.ellipse(-0.18, -0.15, 0.25, 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Piccole escrescenze sul dorso (danno l'aria "fiammeggiante").
  for (let k = 0; k < 6; k++) {
    const p = bordoMantello(0.56 + k * 0.06);
    const h = 0.025 + 0.012 * Math.sin(t * 1.5 + k);
    ctx.fillStyle = hsl(k % 2 ? giallo : crema, 0, 0.9);
    ctx.beginPath();
    ctx.moveTo(p.x - 0.015, p.y + 0.005);
    ctx.quadraticCurveTo(p.x, p.y - h * 1.6, p.x + 0.015, p.y + 0.005);
    ctx.fill();
  }

  // --- Testa ---
  ctx.fillStyle = hsl(base, 4);
  ctx.beginPath();
  ctx.ellipse(0.2, 0.0, 0.11, 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hsl(rosa, -10, 0.5);
  ctx.beginPath();
  ctx.ellipse(0.25, 0.06, 0.06, 0.03, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Occhio con la pupilla a "W".
  ctx.fillStyle = hsl(velaColore({ h: 70, s: 40, l: 62 }, s.z));
  ctx.beginPath();
  ctx.ellipse(0.22, -0.035, 0.05, 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#120c10';
  ctx.lineWidth = 0.014;
  ctx.beginPath();
  ctx.moveTo(0.19, -0.05);
  ctx.quadraticCurveTo(0.2, -0.02, 0.212, -0.04);
  ctx.quadraticCurveTo(0.22, -0.015, 0.23, -0.04);
  ctx.quadraticCurveTo(0.24, -0.02, 0.25, -0.05);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(0.206, -0.058, 0.01, 0, Math.PI * 2);
  ctx.fill();

  // --- Braccia dal lato vicino: un cono in avanti, le due di sopra alzate ---
  braccio(0.27, -0.05, -0.7, 0.16, 0.065, 0, rosa);
  braccio(0.29, -0.01, -0.3, 0.17, 0.07, 0.7, rosa);
  braccio(0.29, 0.04, 0.1, 0.16, 0.07, 1.4, rosa);

  ctx.restore();
}
