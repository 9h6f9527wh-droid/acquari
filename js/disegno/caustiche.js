// Caustiche: la rete di luce che ondeggia sul fondo, come in piscina o al mare
// con il sole. Nasce dalle onde della superficie, che fanno da tante piccole
// lenti e concentrano la luce in linee luminose.
//
// Come la facciamo, senza pesare sull'iPad:
//  1. una volta sola prepariamo delle "tessere" con una rete di linee luminose
//     curve (i bordi di tante celle irregolari, piegati da onde);
//  2. a ogni fotogramma le stendiamo sulla sabbia in DUE strati che scorrono
//     piano in direzioni diverse: sovrapponendosi, la rete sembra muoversi
//     e cambiare forma, proprio come le caustiche vere.
// Le tessere sono già schiacciate in altezza (la sabbia è un piano visto di
// sbieco) e già alla risoluzione dello schermo: stenderle costa pochissimo.

import { creaCasuale } from '../util/casuale.js';

const LATO = 256; // misura "logica" della tessera
const CELLE = 20; // quante celle nella tessera
const SCHIACCIATA = 0.38; // quanto è schiacciata in altezza

// Due strati: misura, velocità di scorrimento e intensità diverse.
const STRATI = [
  { scala: 0.9, vx: 9, vy: 3, alfa: 0.14 },
  { scala: 1.3, vx: -7, vy: 4, alfa: 0.1 },
];

// Rete di luce in un punto (u, v) della tessera logica (0..LATO).
function creaFunzioneLuce() {
  const caso = creaCasuale(31);
  const punti = Array.from({ length: CELLE }, () => ({ x: caso.prossimo() * LATO, y: caso.prossimo() * LATO }));
  const k = (2 * Math.PI) / LATO; // onde che "chiudono" giuste ai bordi della tessera
  return (u, v) => {
    // Pieghiamo lo spazio con delle onde: le linee diventano curve e morbide.
    const x = u + Math.sin(v * k * 3) * 9 + Math.sin(v * k * 7 + 1) * 4;
    const y = v + Math.sin(u * k * 2 + 2) * 9 + Math.sin(u * k * 5) * 4;
    let d1 = Infinity;
    let d2 = Infinity;
    for (const p of punti) {
      // Le distanze "girano" ai bordi, così la tessera si ripete senza cuciture.
      let dx = Math.abs(x - p.x) % LATO;
      let dy = Math.abs(y - p.y) % LATO;
      if (dx > LATO / 2) dx = LATO - dx;
      if (dy > LATO / 2) dy = LATO - dy;
      const d = dx * dx + dy * dy;
      if (d < d1) {
        d2 = d1;
        d1 = d;
      } else if (d < d2) {
        d2 = d;
      }
    }
    // Vicino al confine tra due celle le distanze si somigliano: lì c'è la linea di luce.
    const bordo = Math.sqrt(d2) - Math.sqrt(d1);
    // Linee più o meno luminose qua e là, come nelle caustiche vere.
    const intensita = 0.65 + 0.35 * Math.sin(u * k * 2) * Math.sin(v * k * 3 + 1);
    const luce = Math.max(0, 1 - bordo / 6) * intensita;
    return luce * luce;
  };
}

function creaTessera(luce, scala, densita) {
  const w = Math.round(LATO * scala * densita);
  const h = Math.round(LATO * scala * SCHIACCIATA * densita);
  const foglio = document.createElement('canvas');
  foglio.width = w;
  foglio.height = h;
  const ctx = foglio.getContext('2d');
  const immagine = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      immagine.data[i] = 225;
      immagine.data[i + 1] = 255;
      immagine.data[i + 2] = 230;
      immagine.data[i + 3] = Math.round(255 * luce((x / w) * LATO, (y / h) * LATO));
    }
  }
  ctx.putImageData(immagine, 0, 0);
  return { foglio, w: w / densita, h: h / densita };
}

export class Caustiche {
  constructor(fondale) {
    this.fondale = fondale;
    this.tempo = 0;
    this.densita = 0; // le tessere si preparano al primo disegno
  }

  aggiorna(dt) {
    this.tempo += dt;
  }

  prepara(ctx) {
    this.densita = Math.min(window.devicePixelRatio || 1, 2);
    const luce = creaFunzioneLuce();
    this.tessere = STRATI.map((s) => {
      const tessera = creaTessera(luce, s.scala, this.densita);
      const motivo = ctx.createPattern(tessera.foglio, 'repeat');
      // La tessera è già in pixel dello schermo: diciamo al motivo di non ingrandirla.
      motivo.setTransform(new DOMMatrix().scale(1 / this.densita));
      return { ...tessera, motivo };
    });
  }

  disegna(ctx, larghezza, altezza) {
    if (this.densita !== Math.min(window.devicePixelRatio || 1, 2)) this.prepara(ctx);
    const t = this.tempo;
    const f = this.fondale;
    const d = this.densita;

    // Solo sulla sabbia: ritagliamo la zona sotto il bordo della sabbia.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, altezza);
    for (let i = 0; i <= 40; i++) ctx.lineTo((i / 40) * larghezza, f.lineaSabbia(i / 40) * altezza);
    ctx.lineTo(larghezza, altezza);
    ctx.closePath();
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';

    const cima = Math.floor(f.lineaSabbia(0.5) * altezza - altezza * 0.06);
    STRATI.forEach((s, n) => {
      const tessera = this.tessere[n];
      ctx.globalAlpha = s.alfa * (0.85 + 0.15 * Math.sin(t * 0.7 + n * 2));
      // Scorrimento lento con un leggero dondolio avanti e indietro.
      // Spostamenti arrotondati ai pixel dello schermo: niente ricalcoli.
      const ox = Math.round(((t * s.vx + Math.sin(t * 0.4 + n) * 12) % tessera.w) * d) / d;
      const oy = Math.round(((t * s.vy + Math.cos(t * 0.3 + n) * 6) % tessera.h) * d) / d;
      ctx.save();
      ctx.translate(ox, cima + oy);
      ctx.fillStyle = tessera.motivo;
      ctx.fillRect(-ox - tessera.w, -oy - tessera.h, larghezza + tessera.w * 2, altezza - cima + tessera.h * 2);
      ctx.restore();
    });
    ctx.restore();
  }
}
