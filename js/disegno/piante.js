// Piante che ondeggiano. Ogni pianta è un ciuffo di foglie che partono
// da un punto del fondo. Ogni foglia è una "spina dorsale" di segmenti:
// la base resta ferma, la punta si piega di più, come mossa dalla corrente.
//
// Tipi di pianta:
//  - "nastro": foglie lunghe e sottili (come la Vallisneria)
//  - "spada":  foglie larghe a lancia, aperte a ventaglio (come l'Echinodorus)
//  - "rossa":  stelo sottile con foglie rossastre, per un tocco di colore
//
// Due strati: piante LONTANE (sbiadite, dietro) e VICINE (colori pieni, davanti).

import { creaCasuale } from '../util/casuale.js';

const SEGMENTI = 9; // più segmenti = foglie più morbide, ma più calcoli

// Colori (tonalità, saturazione, luminosità) per ogni tipo.
const COLORI = {
  nastro: { h: 105, s: 45, l: 38 },
  spada: { h: 120, s: 40, l: 32 },
  rossa: { h: 8, s: 55, l: 40 },
};

function creaFoglie(caso, tipo, altezzaPianta) {
  const foglie = [];
  const quante = tipo === 'nastro' ? caso.intero(6, 10) : tipo === 'spada' ? caso.intero(5, 8) : caso.intero(3, 5);
  for (let i = 0; i < quante; i++) {
    // Le foglie si aprono a ventaglio: le esterne sono più inclinate e più corte.
    const apertura = quante === 1 ? 0 : (i / (quante - 1)) * 2 - 1; // da -1 a 1
    const ventaglio = tipo === 'spada' ? 0.75 : tipo === 'nastro' ? 0.35 : 0.25;
    foglie.push({
      angolo: apertura * ventaglio + caso.tra(-0.08, 0.08),
      curvatura: apertura * caso.tra(0.2, 0.6) + caso.tra(-0.15, 0.15),
      lunghezza:
        altezzaPianta *
        (tipo === 'spada' ? 1 - Math.abs(apertura) * 0.35 : 1 - Math.abs(apertura) * 0.25) *
        caso.tra(0.8, 1.1),
      larghezza: tipo === 'spada' ? caso.tra(0.11, 0.15) : tipo === 'nastro' ? caso.tra(0.025, 0.035) : caso.tra(0.04, 0.05),
      luce: caso.tra(-7, 7),
      fase: caso.tra(0, Math.PI * 2),
    });
  }
  return foglie;
}

export class Piante {
  constructor(fondale) {
    this.fondale = fondale;
    this.tempo = 0;
    const caso = creaCasuale(77);

    // Disposizione: [posizione x, tipo, altezza (frazione della vasca)].
    const vicine = [
      [0.04, 'nastro', 0.42],
      [0.09, 'spada', 0.22],
      [0.14, 'nastro', 0.34],
      [0.31, 'rossa', 0.28],
      [0.36, 'nastro', 0.24],
      [0.44, 'spada', 0.16],
      [0.62, 'nastro', 0.3],
      [0.66, 'rossa', 0.22],
      [0.93, 'spada', 0.25],
      [0.97, 'nastro', 0.45],
    ];
    const lontane = [
      [0.07, 'nastro', 0.3],
      [0.18, 'nastro', 0.36],
      [0.27, 'spada', 0.16],
      [0.4, 'nastro', 0.28],
      [0.55, 'nastro', 0.34],
      [0.58, 'spada', 0.14],
      [0.7, 'nastro', 0.26],
      [0.82, 'nastro', 0.32],
      [0.9, 'spada', 0.15],
    ];

    const crea = ([x, tipo, altezza], lontana) => ({
      x: x + caso.tra(-0.01, 0.01),
      tipo,
      lontana,
      altezza,
      foglie: creaFoglie(caso, tipo, altezza),
      // Ogni pianta ondeggia con un suo ritmo.
      ritmo: caso.tra(0.5, 0.8),
      forza: tipo === 'nastro' ? caso.tra(0.18, 0.26) : caso.tra(0.08, 0.12),
    });

    this.vicine = vicine.map((p) => crea(p, false));
    this.lontane = lontane.map((p) => crea(p, true));
  }

  aggiorna(dt) {
    this.tempo += dt;
  }

  // Disegna una foglia come una striscia che si assottiglia verso la punta.
  disegnaFoglia(ctx, pianta, foglia, baseX, baseY, scala) {
    const t = this.tempo;
    const lunghezza = foglia.lunghezza * scala;
    const passo = lunghezza / SEGMENTI;
    const larghezzaMax = foglia.larghezza * lunghezza;

    // Calcolo i punti della spina dorsale, dal basso verso la punta.
    const sinistra = [];
    const destra = [];
    const centro = [];
    let x = baseX;
    let y = baseY;
    for (let i = 0; i <= SEGMENTI; i++) {
      const s = i / SEGMENTI; // 0 alla base, 1 in punta
      // Oscillazione: un'onda che sale lungo la foglia, più forte verso la punta.
      const onda = Math.sin(t * pianta.ritmo * 2 + foglia.fase - s * 2.2) * pianta.forza * s * s;
      // Una corrente leggera che spinge tutte le foglie un po' a destra.
      const corrente = 0.12 * s * (0.6 + 0.4 * Math.sin(t * 0.3));
      const angolo = foglia.angolo + foglia.curvatura * s + onda + corrente;

      // Larghezza: le "spada" sono a lancia, le altre quasi uguali fino alla punta.
      let larghezza;
      if (pianta.tipo === 'spada') larghezza = larghezzaMax * Math.sin(Math.PI * Math.pow(s, 0.75));
      else larghezza = larghezzaMax * (s < 0.8 ? 1 - s * 0.3 : (1 - s) * 3.8);
      larghezza = Math.max(larghezza, 0.4);

      // Direzione perpendicolare alla foglia, per i due bordi.
      const nx = Math.cos(angolo);
      const ny = Math.sin(angolo);
      centro.push({ x, y });
      sinistra.push({ x: x - nx * larghezza / 2, y: y - ny * larghezza / 2 });
      destra.push({ x: x + nx * larghezza / 2, y: y + ny * larghezza / 2 });

      // Passo successivo: verso l'alto, inclinato di "angolo".
      x += Math.sin(angolo) * passo;
      y -= Math.cos(angolo) * passo;
    }

    // Contorno: su per un bordo, giù per l'altro.
    ctx.beginPath();
    ctx.moveTo(sinistra[0].x, sinistra[0].y);
    for (let i = 1; i < sinistra.length; i++) ctx.lineTo(sinistra[i].x, sinistra[i].y);
    for (let i = destra.length - 1; i >= 0; i--) ctx.lineTo(destra[i].x, destra[i].y);
    ctx.closePath();

    const c = COLORI[pianta.tipo];
    if (pianta.lontana) {
      // Lontane: velate, quasi del colore dell'acqua.
      ctx.fillStyle = `hsla(${185 + foglia.luce}, 32%, ${36 + foglia.luce * 0.5}%, 0.42)`;
      ctx.fill();
      return;
    }
    // Vicine: scure alla base e chiare in punta (sfumatura preparata per la pianta),
    // più un velo che rende ogni foglia un po' diversa dalle altre.
    ctx.fillStyle = pianta.sfumatura;
    ctx.fill();
    if (foglia.luce !== 0) {
      ctx.fillStyle = foglia.luce > 0 ? `rgba(230, 255, 200, ${foglia.luce * 0.012})` : `rgba(0, 20, 10, ${-foglia.luce * 0.02})`;
      ctx.fill();
    }

    // Nervatura centrale chiara: dà volume alla foglia.
    ctx.beginPath();
    ctx.moveTo(centro[0].x, centro[0].y);
    for (let i = 1; i < centro.length - 1; i++) ctx.lineTo(centro[i].x, centro[i].y);
    ctx.lineWidth = Math.max(0.8, larghezzaMax * 0.12);
    ctx.strokeStyle = `hsla(${c.h - 15}, ${c.s + 15}%, ${c.l + 28}%, 0.45)`;
    ctx.stroke();
  }

  disegnaStrato(ctx, piante, larghezza, altezza, lineaFondo) {
    for (const pianta of piante) {
      const baseX = pianta.x * larghezza;
      const baseY = lineaFondo(pianta.x) * altezza + (pianta.lontana ? 4 : 6);
      if (!pianta.lontana) {
        const c = COLORI[pianta.tipo];
        const cima = baseY - pianta.altezza * altezza;
        pianta.sfumatura = ctx.createLinearGradient(0, baseY, 0, cima);
        pianta.sfumatura.addColorStop(0, `hsl(${c.h + 10}, ${c.s}%, ${c.l * 0.55}%)`);
        pianta.sfumatura.addColorStop(0.5, `hsl(${c.h}, ${c.s}%, ${c.l}%)`);
        pianta.sfumatura.addColorStop(1, `hsl(${c.h - 12}, ${c.s + 10}%, ${c.l + 14}%)`);
      }
      for (const foglia of pianta.foglie) {
        this.disegnaFoglia(ctx, pianta, foglia, baseX, baseY, altezza);
      }
    }
  }

  disegnaLontane(ctx, larghezza, altezza) {
    this.disegnaStrato(ctx, this.lontane, larghezza, altezza, (x) => this.fondale.lineaLontana(x));
  }

  disegnaVicine(ctx, larghezza, altezza) {
    ctx.lineCap = 'round';
    this.disegnaStrato(ctx, this.vicine, larghezza, altezza, (x) => this.fondale.lineaSabbia(x));
  }
}
