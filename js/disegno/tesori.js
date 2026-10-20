// I "tesori" che il polpo raccoglie e ammucchia davanti alla sua grotta:
// piccoli oggetti appoggiati sulla sabbia.
//  - ventaglio:  conchiglia a ventaglio (capasanta) con le coste a raggiera;
//  - chiocciola: conchiglietta a punta, color crema con le strisce;
//  - sasso:      un ciottolo liscio e chiaro;
//  - riccio:     il guscio vuoto di un riccio di mare, tondo e puntinato;
//  - vetro:      un pezzetto di vetro levigato dal mare, verde e trasparente.
//
// (x, y) è il punto in cui tocca la sabbia; "m" è la misura in punti.

import { velaColore, hsl } from '../util/colore.js';

export function disegnaTesoro(ctx, tipo, x, y, m, z, giro = 0) {
  const colore = (c) => velaColore(c, z);
  ctx.save();
  ctx.translate(x, y);
  // Ombra sotto.
  ctx.fillStyle = 'rgba(10, 20, 25, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, m * 0.6, m * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineJoin = 'round';

  if (tipo === 'ventaglio') {
    const c = colore({ h: 18 + giro * 4, s: 55, l: 66 });
    ctx.rotate(Math.sin(giro) * 0.25);
    ctx.fillStyle = hsl(c);
    ctx.beginPath();
    ctx.moveTo(0, -m * 0.08);
    // Il bordo a onde, dove finiscono le coste.
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI + (k / 8) * Math.PI;
      const r = m * (0.5 + (k % 2) * 0.04);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.75 - m * 0.05);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hsl(c, -22, 0.7);
    ctx.lineWidth = Math.max(0.6, m * 0.04);
    for (let k = 1; k < 8; k++) {
      const a = Math.PI + (k / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, -m * 0.06);
      ctx.lineTo(Math.cos(a) * m * 0.46, Math.sin(a) * m * 0.34 - m * 0.05);
      ctx.stroke();
    }
    // Le "orecchiette" alla base.
    ctx.fillStyle = hsl(c, -10);
    ctx.fillRect(-m * 0.14, -m * 0.1, m * 0.28, m * 0.08);
  } else if (tipo === 'chiocciola') {
    const c = colore({ h: 38, s: 45, l: 76 });
    ctx.rotate(-0.35 + Math.sin(giro) * 0.2);
    ctx.fillStyle = hsl(c);
    ctx.beginPath();
    ctx.moveTo(-m * 0.5, -m * 0.12);
    ctx.quadraticCurveTo(-m * 0.1, -m * 0.38, m * 0.5, -m * 0.16);
    ctx.quadraticCurveTo(m * 0.1, m * 0.02, -m * 0.5, -m * 0.12);
    ctx.fill();
    ctx.strokeStyle = hsl(colore({ h: 22, s: 50, l: 42 }), 0, 0.75);
    ctx.lineWidth = Math.max(0.6, m * 0.05);
    for (let k = 1; k <= 3; k++) {
      const xx = -m * 0.5 + k * m * 0.25;
      ctx.beginPath();
      ctx.moveTo(xx, -m * 0.3 + k * 0.02 * m);
      ctx.lineTo(xx + m * 0.06, -m * 0.06);
      ctx.stroke();
    }
    ctx.fillStyle = hsl(c, -30, 0.8);
    ctx.beginPath();
    ctx.ellipse(m * 0.38, -m * 0.12, m * 0.08, m * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (tipo === 'sasso') {
    const c = colore({ h: 30 + giro * 20, s: 8, l: 70 });
    const g = ctx.createLinearGradient(0, -m * 0.4, 0, 0);
    g.addColorStop(0, hsl(c, 10));
    g.addColorStop(1, hsl(c, -20));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, -m * 0.17, m * 0.42, m * 0.22, Math.sin(giro) * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-m * 0.12, -m * 0.28, m * 0.15, m * 0.05, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (tipo === 'riccio') {
    const c = colore({ h: 280, s: 20, l: 72 });
    ctx.fillStyle = hsl(c);
    ctx.beginPath();
    ctx.ellipse(0, -m * 0.2, m * 0.4, m * 0.25, 0, Math.PI, 0);
    ctx.quadraticCurveTo(m * 0.3, 0, 0, 0);
    ctx.quadraticCurveTo(-m * 0.3, 0, -m * 0.4, -m * 0.2);
    ctx.fill();
    // File di puntini che scendono dalla cima.
    ctx.fillStyle = hsl(c, -24, 0.8);
    for (let fila = -2; fila <= 2; fila++) {
      for (let k = 0; k < 4; k++) {
        const q = k / 4;
        ctx.beginPath();
        ctx.arc(fila * m * 0.08 * (0.4 + q), -m * 0.42 + q * m * 0.36, Math.max(0.4, m * 0.025), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (tipo === 'vetro') {
    const c = colore({ h: 150, s: 45, l: 58 });
    ctx.rotate(Math.sin(giro) * 0.3);
    ctx.fillStyle = hsl(c, 0, 0.6);
    ctx.beginPath();
    ctx.moveTo(-m * 0.35, -m * 0.05);
    ctx.lineTo(-m * 0.2, -m * 0.3);
    ctx.lineTo(m * 0.25, -m * 0.26);
    ctx.lineTo(m * 0.38, -m * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(230, 255, 245, 0.45)';
    ctx.beginPath();
    ctx.moveTo(-m * 0.15, -m * 0.24);
    ctx.lineTo(m * 0.12, -m * 0.22);
    ctx.lineTo(m * 0.05, -m * 0.16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
