// Il fondale della vasca, in due strati:
//  - LONTANO: colline di roccia sfumate nell'azzurro, come viste attraverso
//    tanta acqua (meno contrasto, colori più chiari).
//  - VICINO: la sabbia con le sue increspature, sassolini e rocce in primo piano,
//    illuminate dall'alto.
//
// Il fondale non si muove: lo dipingiamo una volta sola (e di nuovo solo
// se cambia la misura dello schermo), poi lo incolliamo a ogni fotogramma.

import { creaCasuale } from '../util/casuale.js';

const SEME = 2026;

function creaFoglio() {
  const foglio = document.createElement('canvas');
  return { foglio, ctx: foglio.getContext('2d') };
}

// Disegna una forma morbida che passa vicino ai punti dati (chiusa).
function tracciaMorbida(ctx, punti) {
  const n = punti.length;
  const meta = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const inizio = meta(punti[n - 1], punti[0]);
  ctx.beginPath();
  ctx.moveTo(inizio.x, inizio.y);
  for (let i = 0; i < n; i++) {
    const p = punti[i];
    const m = meta(p, punti[(i + 1) % n]);
    ctx.quadraticCurveTo(p.x, p.y, m.x, m.y);
  }
  ctx.closePath();
}

export class Fondale {
  constructor() {
    const caso = creaCasuale(SEME);

    // Forma del bordo della sabbia: somma di onde lente (in frazioni della vasca).
    this.ondeSabbia = [
      { ampiezza: 0.018, frequenza: 4.2, fase: caso.tra(0, 6.3) },
      { ampiezza: 0.009, frequenza: 9.5, fase: caso.tra(0, 6.3) },
      { ampiezza: 0.004, frequenza: 23, fase: caso.tra(0, 6.3) },
    ];
    this.ondeLontane = [
      { ampiezza: 0.04, frequenza: 3.1, fase: caso.tra(0, 6.3) },
      { ampiezza: 0.02, frequenza: 7.7, fase: caso.tra(0, 6.3) },
    ];

    // L'aeratore delle bolle sta tra le due rocce grandi a destra.
    this.aeratoreX = 0.8;

    // Rocce in primo piano: posizione e misura in frazioni, forma a caso.
    this.rocce = [
      { x: 0.73, misura: 0.12, schiacciata: 0.8 },
      { x: 0.86, misura: 0.075, schiacciata: 0.75 },
      { x: 0.2, misura: 0.09, schiacciata: 0.7 },
      { x: 0.26, misura: 0.045, schiacciata: 0.8 },
      { x: 0.5, misura: 0.035, schiacciata: 0.7 },
    ].map((r) => ({
      ...r,
      // Raggi irregolari attorno al centro: ogni roccia ha una forma sua.
      forma: Array.from({ length: 10 }, () => caso.tra(0.78, 1.12)),
      tinta: caso.tra(-12, 12),
    }));

    // Sassolini e granelli: tanti puntini, posizioni fisse.
    this.sassolini = Array.from({ length: 70 }, () => ({
      x: caso.prossimo(),
      profondita: caso.tra(0.1, 1), // 0 = sul bordo della sabbia, 1 = in basso
      misura: caso.tra(1.5, 4.5),
      tinta: caso.tra(-25, 20),
    }));
    this.granelli = Array.from({ length: 500 }, () => ({
      x: caso.prossimo(),
      profondita: caso.prossimo(),
      chiaro: caso.prossimo() < 0.5,
    }));

    this.lontano = creaFoglio();
    this.vicino = creaFoglio();
    this.larghezza = 0;
    this.altezza = 0;
  }

  // Altezza del bordo della sabbia (in frazioni) nel punto x (in frazioni).
  lineaSabbia(x) {
    let y = 0.855;
    for (const o of this.ondeSabbia) y += o.ampiezza * Math.sin(x * o.frequenza + o.fase);
    return y;
  }

  // Altezza delle colline lontane.
  lineaLontana(x) {
    let y = 0.76;
    for (const o of this.ondeLontane) y += o.ampiezza * Math.sin(x * o.frequenza + o.fase);
    return y;
  }

  prepara(larghezza, altezza) {
    // Stessa risoluzione dello schermo: così incollarli costa pochissimo.
    const densita = Math.min(window.devicePixelRatio || 1, 2);
    this.dipingiLontano(larghezza, altezza, densita);
    this.dipingiVicino(larghezza, altezza, densita);
    this.larghezza = larghezza;
    this.altezza = altezza;
  }

  dipingiLontano(l, a, densita) {
    const { foglio, ctx } = this.lontano;
    foglio.width = Math.round(l * densita);
    foglio.height = Math.round(a * densita);
    ctx.setTransform(densita, 0, 0, densita, 0, 0);
    ctx.clearRect(0, 0, l, a);

    // Due file di colline: la più lontana è più chiara (più "nebbia" d'acqua).
    const file = [
      { spostamento: -0.05, colore: 'rgba(40, 110, 135, 0.55)', scala: 1.3 },
      { spostamento: 0.0, colore: 'rgba(22, 78, 105, 0.75)', scala: 1 },
    ];
    for (const fila of file) {
      ctx.beginPath();
      ctx.moveTo(0, a);
      for (let i = 0; i <= 60; i++) {
        const x = i / 60;
        const y = this.lineaLontana(x * fila.scala + fila.spostamento * 3) + fila.spostamento;
        ctx.lineTo(x * l, y * a);
      }
      ctx.lineTo(l, a);
      ctx.closePath();
      ctx.fillStyle = fila.colore;
      ctx.fill();
    }
  }

  dipingiVicino(l, a, densita) {
    const { foglio, ctx } = this.vicino;
    foglio.width = Math.round(l * densita);
    foglio.height = Math.round(a * densita);
    ctx.setTransform(densita, 0, 0, densita, 0, 0);
    ctx.clearRect(0, 0, l, a);

    const passi = 80;
    const yBordo = (x) => this.lineaSabbia(x) * a;
    const cima = Math.min(...Array.from({ length: passi + 1 }, (_, i) => yBordo(i / passi)));

    // --- Sabbia ---
    ctx.beginPath();
    ctx.moveTo(0, a);
    for (let i = 0; i <= passi; i++) ctx.lineTo((i / passi) * l, yBordo(i / passi));
    ctx.lineTo(l, a);
    ctx.closePath();

    // Più chiara in cima (dove arriva la luce), più scura scendendo verso di noi.
    const sabbia = ctx.createLinearGradient(0, cima, 0, a);
    sabbia.addColorStop(0, '#c9b98f');
    sabbia.addColorStop(0.25, '#a8996f');
    sabbia.addColorStop(1, '#4f5550');
    ctx.fillStyle = sabbia;
    ctx.fill();

    // Velo azzurro: la sabbia è vista attraverso l'acqua.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(30, 95, 115, 0.28)';
    ctx.fillRect(0, cima, l, a - cima);

    // Increspature: linee chiare e sottili che seguono il bordo.
    ctx.lineCap = 'round';
    for (let fila = 1; fila <= 5; fila++) {
      const distanza = fila * (a - cima) * 0.14;
      ctx.lineWidth = 1.2 + fila * 0.25;
      ctx.strokeStyle = `rgba(240, 225, 180, ${0.22 - fila * 0.03})`;
      // A tratti, non continue.
      for (let tratto = 0; tratto < 6; tratto++) {
        const inizio = (tratto + (fila % 2) * 0.5) / 6;
        const fine = inizio + 0.11;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const x = inizio + ((fine - inizio) * i) / 12;
          const y = yBordo(x) + distanza + Math.sin(x * 40 + fila) * 2;
          if (i === 0) ctx.moveTo(x * l, y);
          else ctx.lineTo(x * l, y);
        }
        ctx.stroke();
      }
    }

    // Granelli: puntini chiari e scuri.
    for (const g of this.granelli) {
      const y = yBordo(g.x) + g.profondita * (a - yBordo(g.x));
      ctx.fillStyle = g.chiaro ? 'rgba(245, 230, 190, 0.35)' : 'rgba(40, 45, 40, 0.3)';
      ctx.fillRect(g.x * l, y, 1.2, 1.2);
    }

    // Sassolini: piccoli ovali con un lato illuminato.
    for (const s of this.sassolini) {
      const x = s.x * l;
      const y = yBordo(s.x) + 4 + s.profondita * (a - yBordo(s.x) - 6);
      const m = s.misura * (0.7 + s.profondita * 0.6); // più vicini = più grandi
      ctx.fillStyle = `hsl(${30 + s.tinta}, 12%, ${28 + s.tinta * 0.3}%)`;
      ctx.beginPath();
      ctx.ellipse(x, y, m, m * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 245, 215, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x - m * 0.25, y - m * 0.25, m * 0.45, m * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // --- Rocce ---
    for (const r of this.rocce) this.dipingiRoccia(ctx, r, l, a);
  }

  dipingiRoccia(ctx, roccia, l, a) {
    const raggio = roccia.misura * Math.min(l, a * 1.4);
    const cx = roccia.x * l;
    const base = this.lineaSabbia(roccia.x) * a + raggio * 0.35; // un po' affondata
    const cy = base - raggio * roccia.schiacciata * 0.6;

    // Ombra morbida sulla sabbia.
    const ombra = ctx.createRadialGradient(cx, base, 0, cx, base, raggio * 1.5);
    ombra.addColorStop(0, 'rgba(10, 20, 25, 0.45)');
    ombra.addColorStop(1, 'rgba(10, 20, 25, 0)');
    ctx.fillStyle = ombra;
    ctx.beginPath();
    ctx.ellipse(cx, base, raggio * 1.5, raggio * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Forma: punti attorno al centro, con la base appiattita.
    const punti = roccia.forma.map((f, i) => {
      const angolo = (i / roccia.forma.length) * Math.PI * 2;
      const x = cx + Math.cos(angolo) * raggio * f;
      let y = cy + Math.sin(angolo) * raggio * f * roccia.schiacciata;
      y = Math.min(y, base);
      return { x, y };
    });

    ctx.save();
    tracciaMorbida(ctx, punti);

    // Colore di base: grigio-blu, chiaro in alto a sinistra e scuro in basso a destra.
    const h = 200 + roccia.tinta;
    const corpo = ctx.createLinearGradient(cx - raggio * 0.6, cy - raggio, cx + raggio * 0.6, base);
    corpo.addColorStop(0, `hsl(${h}, 14%, 52%)`);
    corpo.addColorStop(0.5, `hsl(${h}, 18%, 34%)`);
    corpo.addColorStop(1, `hsl(${h}, 25%, 16%)`);
    ctx.fillStyle = corpo;
    ctx.fill();
    ctx.clip();

    // Luce dall'alto: una macchia chiara sulla sommità.
    const luce = ctx.createRadialGradient(
      cx - raggio * 0.3, cy - raggio * 0.7, 0,
      cx - raggio * 0.3, cy - raggio * 0.7, raggio * 1.1,
    );
    luce.addColorStop(0, 'rgba(225, 250, 230, 0.45)');
    luce.addColorStop(1, 'rgba(225, 250, 230, 0)');
    ctx.fillStyle = luce;
    ctx.fillRect(cx - raggio * 2, cy - raggio * 2, raggio * 4, raggio * 4);

    // Un velo di muschio verde sulla parte alta.
    const muschio = ctx.createLinearGradient(0, cy - raggio, 0, cy);
    muschio.addColorStop(0, 'rgba(110, 160, 80, 0.35)');
    muschio.addColorStop(1, 'rgba(110, 160, 80, 0)');
    ctx.fillStyle = muschio;
    ctx.fillRect(cx - raggio * 2, cy - raggio * 2, raggio * 4, raggio * 2);
    ctx.restore();

    // Bordo luminoso in cima, come la luce che sfiora la roccia.
    ctx.save();
    tracciaMorbida(ctx, punti);
    ctx.clip();
    ctx.lineWidth = Math.max(1.5, raggio * 0.05);
    ctx.strokeStyle = 'rgba(220, 255, 235, 0.35)';
    ctx.translate(raggio * 0.04, raggio * 0.06);
    tracciaMorbida(ctx, punti);
    ctx.stroke();
    ctx.restore();
  }

  controllaMisure(larghezza, altezza) {
    if (larghezza !== this.larghezza || altezza !== this.altezza) this.prepara(larghezza, altezza);
  }

  disegnaLontano(ctx, larghezza, altezza) {
    this.controllaMisure(larghezza, altezza);
    ctx.drawImage(this.lontano.foglio, 0, 0, larghezza, altezza);
  }

  disegnaVicino(ctx, larghezza, altezza) {
    this.controllaMisure(larghezza, altezza);
    ctx.drawImage(this.vicino.foglio, 0, 0, larghezza, altezza);
  }
}
