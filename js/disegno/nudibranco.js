// Disegno del nudibranco, visto di lato mentre striscia sulla roccia.
//
// Com'è fatto:
//  - il CORPO è basso e allungato: il "piede" segue la superficie della
//    roccia punto per punto (così si piega sulle gobbe), sopra c'è il mantello
//    colorato con il bordo giallo e una riga chiara sul dorso;
//  - davanti, sulla testa, due ANTENNE (rinofori) a clava, con le lamelle;
//  - dietro, sul dorso, il PENNACCHIO delle branchie, come un fiorellino;
//  - quando si spaventa antenne e branchie si ritirano.

import { velaColore, hsl } from '../util/colore.js';

export function disegnaNudibranco(ctx, n, L) {
  const sp = n.specie;
  const c = velaColore(sp.corpo, n.z);
  const bordo = velaColore(sp.bordo, n.z);
  const riga = velaColore(sp.riga, n.z);
  const branchie = velaColore(sp.branchie, n.z);
  const t = n.tempo;
  const lungo = L * (1 + n.allunga);
  const verso = n.giro >= 0 ? 1 : -1;

  // I punti del corpo, dalla coda (s = 0) alla testa (s = 1).
  const N = 14;
  const punti = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = n.x + n.giro * (s - 0.5) * lungo;
    const base = n.suolo(x);
    // Un dorso a cupola: più alto verso la testa, basso e sottile sulla coda,
    // arrotondato davanti.
    const cupola = Math.pow(Math.sin(Math.PI * Math.min(0.985, s * 0.92 + 0.04)), 0.65);
    const h = L * (0.02 + 0.2 * cupola * (0.75 + 0.25 * s));
    punti.push({ x, base, top: base - h, s });
  }
  const punto = (s) => punti[Math.round(s * N)];

  // Ombra di contatto.
  ctx.fillStyle = 'rgba(8, 18, 24, 0.3)';
  ctx.beginPath();
  ctx.ellipse(n.x, n.suolo(n.x) + L * 0.02, Math.abs(n.giro) * lungo * 0.55 + L * 0.08, L * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Branchie (dietro il corpo, così la base è nascosta).
  const pennacchio = (1 - n.ritirato * 0.9) * L * 0.2;
  const b = punto(0.22);
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.32 + Math.sin(t * 1.3 + k) * 0.06;
    const lung = pennacchio * (0.8 + 0.2 * Math.sin(t * 2 + k));
    const x1 = b.x + Math.cos(a) * lung * verso;
    const y1 = b.top + L * 0.02 + Math.sin(a) * lung;
    ctx.strokeStyle = hsl(branchie, -8);
    ctx.lineWidth = Math.max(0.8, L * 0.03);
    ctx.beginPath();
    ctx.moveTo(b.x, b.top + L * 0.03);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // Le piccole frange ai lati di ogni ramo.
    ctx.lineWidth = Math.max(0.5, L * 0.015);
    ctx.strokeStyle = hsl(branchie, 8);
    for (const q of [0.45, 0.75]) {
      const mx = b.x + (x1 - b.x) * q;
      const my = b.top + L * 0.03 + (y1 - b.top - L * 0.03) * q;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a - 0.7) * L * 0.04 * verso, my + Math.sin(a - 0.7) * L * 0.04);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(a + 0.7) * L * 0.04 * verso, my + Math.sin(a + 0.7) * L * 0.04);
      ctx.stroke();
    }
  }

  // Corpo: dal dorso alla base del piede.
  ctx.beginPath();
  punti.forEach((p, i) => (i ? ctx.lineTo(p.x, p.top) : ctx.moveTo(p.x, p.top)));
  for (let i = N; i >= 0; i--) ctx.lineTo(punti[i].x, punti[i].base + L * 0.02);
  ctx.closePath();
  const sfuma = ctx.createLinearGradient(0, n.y - L * 0.18, 0, n.y + L * 0.02);
  sfuma.addColorStop(0, hsl(c, 12));
  sfuma.addColorStop(1, hsl(c, -12));
  ctx.fillStyle = sfuma;
  ctx.fill();

  // Il bordo del mantello: una banda chiara e un filo giallo, appena sopra il piede.
  // Il bordo è increspato: un'onda leggera che scorre piano.
  for (const [colore, w, su] of [[riga, 0.025, 0.05], [bordo, 0.022, 0.025]]) {
    ctx.beginPath();
    punti.forEach((p, i) => {
      const y = p.base - L * su + Math.sin(p.s * 26 - t * 1.5) * L * 0.008;
      if (i) ctx.lineTo(p.x, y);
      else ctx.moveTo(p.x, y);
    });
    ctx.strokeStyle = hsl(colore, 0, 0.9);
    ctx.lineWidth = Math.max(0.8, L * w);
    ctx.stroke();
  }
  // La riga chiara sul dorso.
  ctx.beginPath();
  for (let i = 2; i <= N - 2; i++) {
    const p = punti[i];
    const y = p.top + (p.base - p.top) * 0.18;
    if (i === 2) ctx.moveTo(p.x, y);
    else ctx.lineTo(p.x, y);
  }
  ctx.strokeStyle = hsl(riga, 0, 0.8);
  ctx.lineWidth = Math.max(0.6, L * 0.02);
  ctx.stroke();
  // Qualche puntino scuro sul mantello.
  ctx.fillStyle = hsl(c, -c.l * 0.5, 0.7);
  for (const s of [0.32, 0.48, 0.63, 0.75]) {
    const p = punto(s);
    ctx.beginPath();
    ctx.arc(p.x, p.top + (p.base - p.top) * 0.45, Math.max(0.5, L * 0.015), 0, Math.PI * 2);
    ctx.fill();
  }

  // Antenne (rinofori) sulla testa: due clave con le lamelle.
  const antenna = (s, dx, colore) => {
    const p = punto(s);
    const alta = (1 - n.ritirato * 0.85) * L * 0.12;
    const ondeggia = Math.sin(t * 1.6 + dx * 10) * 0.12;
    const a = -Math.PI / 2 + 0.35 * verso + ondeggia;
    const x0 = p.x + dx * verso;
    const y0 = p.top + L * 0.02;
    const x1 = x0 + Math.cos(a) * alta;
    const y1 = y0 + Math.sin(a) * alta;
    ctx.strokeStyle = hsl(colore, -10);
    ctx.lineWidth = Math.max(0.7, L * 0.032);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    // La clava in punta, con le lamelle.
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = hsl(colore);
    ctx.beginPath();
    ctx.ellipse(0, -L * 0.03, L * 0.04, L * 0.055 * (1 - n.ritirato * 0.5), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hsl(colore, -22, 0.7);
    ctx.lineWidth = Math.max(0.4, L * 0.01);
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(-L * 0.03, -L * 0.03 + k * L * 0.025);
      ctx.lineTo(L * 0.03, -L * 0.03 + k * L * 0.025);
      ctx.stroke();
    }
    ctx.restore();
  };
  antenna(0.84, -L * 0.03, { ...branchie, l: branchie.l * 0.9 });
  antenna(0.88, L * 0.02, branchie);

  // Due piccoli tentacoli davanti alla bocca.
  const testa = punto(1);
  ctx.strokeStyle = hsl(c, 10);
  ctx.lineWidth = Math.max(0.6, L * 0.02);
  ctx.beginPath();
  ctx.moveTo(testa.x, testa.base - L * 0.04);
  ctx.lineTo(testa.x + verso * L * 0.07, testa.base - L * 0.01 + Math.sin(t * 2) * L * 0.01);
  ctx.stroke();
}
