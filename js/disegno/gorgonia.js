// La gorgonia (ventaglio di mare): un corallo morbido fatto a ventaglio, con
// rami che si dividono e si dividono ancora, tutti sullo stesso piano, e tanti
// piccoli polipi chiari sui rami più sottili. Ondeggia piano con la corrente:
// la base sta ferma e la parte alta si sposta di più.
//
// I cavallucci ci si aggrappano con la coda (vedi animali/cavallucci.js):
// "punto(i)" dice dove si trova in ogni istante il nodo i dei rami.
//
// Misure in frazioni dell'altezza della gorgonia: y va verso l'alto (negativo).

import { creaCasuale } from '../util/casuale.js';
import { velaColore, hsl } from '../util/colore.js';

export class Gorgonia {
  // Nasce sulla sabbia nel punto x, oppure in cima a una roccia ("roccia").
  constructor({ x, z, roccia, altezza, colore, seme }) {
    this.x = x;
    this.z = z;
    this.roccia = roccia;
    this.altezza = altezza;
    this.gorgonia = true;
    this.colore = velaColore(colore, z);
    this.polipiColore = velaColore({ h: 45, s: 70, l: 86 }, z);
    const caso = creaCasuale(seme);
    this.fase = caso.tra(0, 6.3);
    // I nodi dei rami: ognuno sa chi è il suo "genitore" (da dove parte).
    this.nodi = [{ x: 0, y: 0, genitore: -1, spessore: 0.05, livello: 0 }];
    const cresci = (i, angolo, lungo, spessore, livello) => {
      const n = this.nodi[i];
      const x = n.x + Math.sin(angolo) * lungo;
      const y = n.y - Math.cos(angolo) * lungo;
      this.nodi.push({ x, y, genitore: i, spessore, livello });
      const j = this.nodi.length - 1;
      if (livello >= 7) return;
      // Si divide in due rami che si aprono a ventaglio (in basso di più,
      // in alto quasi paralleli: così il ventaglio si riempie).
      for (let k = 0; k < 2; k++) {
        const apertura = (k - 0.5) * caso.tra(0.35, 0.55) * (livello < 3 ? 1.5 : 1);
        // Ogni ramo torna un po' verso l'alto: il ventaglio cresce in altezza.
        const nuovo = angolo * 0.6 + apertura;
        cresci(j, nuovo, lungo * caso.tra(0.84, 0.92), spessore * 0.72, livello + 1);
      }
    };
    cresci(0, caso.tra(-0.05, 0.05), 0.16, 0.045, 1);
    // Riportiamo le misure in modo che il ventaglio sia alto 1.
    const alto = Math.max(...this.nodi.map((n) => -n.y));
    for (const n of this.nodi) {
      n.x /= alto;
      n.y /= alto;
    }
    // Quanto è largo il ventaglio (serve per non farci passare attraverso).
    this.mezzaLarghezza = Math.max(...this.nodi.map((n) => Math.abs(n.x)));
    // La rete: nelle gorgonie vere i rami sottili si saldano tra loro. Ogni
    // ramo sottile si unisce al nodo più vicino dello stesso livello (non al
    // fratello, che ha lo stesso genitore).
    this.ponti = [];
    this.nodi.forEach((n, i) => {
      if (n.livello < 4) return;
      let migliore = -1;
      let distanza = Infinity;
      this.nodi.forEach((m, j) => {
        if (j <= i || m.livello !== n.livello || m.genitore === n.genitore) return;
        const d = Math.hypot(m.x - n.x, m.y - n.y);
        if (d < distanza) {
          distanza = d;
          migliore = j;
        }
      });
      if (migliore >= 0 && distanza < 0.09) this.ponti.push([i, migliore]);
    });
    // Polipi: puntini sui rami più sottili (sempre gli stessi).
    this.polipi = [];
    this.nodi.forEach((n, i) => {
      if (n.livello < 4) return;
      for (let k = 0; k < 2; k++) this.polipi.push({ nodo: i, q: caso.tra(0.1, 0.95), lato: caso.tra(-1, 1) });
    });
  }

  // Dove nasce e quanto è grande, in punti.
  base(fondale, larghezza, altezza) {
    const scala = altezza * fondale.scalaZ(this.z) * this.altezza;
    if (this.roccia !== undefined && fondale.cimeRocce[this.roccia]) {
      // Sulla faccia di sopra della roccia, non sul bordo di dietro.
      const cima = fondale.cimeRocce[this.roccia];
      return { x: cima.x, y: cima.y + cima.larghezza * 0.06, scala };
    }
    return { x: this.x * larghezza, y: fondale.profondita(this.x, this.z) * altezza + 3, scala };
  }

  // Posizione del nodo i in questo istante (con l'ondeggiare della corrente).
  punto(i, fondale, larghezza, altezza, tempo) {
    const { x, y, scala } = this.base(fondale, larghezza, altezza);
    const n = this.nodi[i];
    const h = -n.y; // quanto è in alto (0 alla base)
    const onda = Math.sin(tempo * 0.55 + this.fase - h * 1.5) * 0.045 * h * h + 0.02 * h * h;
    const p = { x: x + (n.x + onda) * scala, y: y + n.y * scala };
    // Inclinazione del ramo (dal genitore al nodo), misurata dalla verticale.
    if (n.genitore >= 0) {
      const g = this.nodi[n.genitore];
      p.angolo = Math.atan2(n.x - g.x, g.y - n.y);
    } else p.angolo = 0;
    return p;
  }

  // Due posti per i cavallucci: due rami a metà altezza, uno per lato.
  prese() {
    const candidati = this.nodi
      .map((n, i) => ({ i, h: -n.y, x: n.x }))
      .filter((n) => n.h > 0.35 && n.h < 0.55);
    const sinistra = candidati.filter((n) => n.x < -0.03).sort((a, b) => b.x - a.x)[0];
    const destra = candidati.filter((n) => n.x > 0.03).sort((a, b) => a.x - b.x)[0];
    return [sinistra || candidati[0], destra || candidati[candidati.length - 1]].map((n) => n.i);
  }

  disegna(ctx, fondale, larghezza, altezza, tempo) {
    const { scala } = this.base(fondale, larghezza, altezza);
    const punti = this.nodi.map((_, i) => this.punto(i, fondale, larghezza, altezza, tempo));
    const c = this.colore;
    ctx.lineCap = 'round';
    // Un piede scuro sulla sabbia.
    const b = punti[0];
    ctx.fillStyle = hsl(c, -c.l * 0.5, 0.8);
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, scala * 0.05, scala * 0.015, 0, 0, Math.PI * 2);
    ctx.fill();
    // I rami, dal più grosso al più sottile: scuri in basso, più chiari in alto.
    for (let livello = 1; livello <= 7; livello++) {
      ctx.strokeStyle = hsl(c, -16 + livello * 3);
      for (let i = 1; i < this.nodi.length; i++) {
        const n = this.nodi[i];
        if (n.livello !== livello) continue;
        const g = punti[n.genitore];
        const p = punti[i];
        ctx.lineWidth = Math.max(0.8, n.spessore * scala * 0.6);
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
    // I ponti della rete, sottili.
    ctx.strokeStyle = hsl(c, 2, 0.85);
    ctx.lineWidth = Math.max(0.6, scala * 0.006);
    ctx.beginPath();
    for (const [i, j] of this.ponti) {
      ctx.moveTo(punti[i].x, punti[i].y);
      ctx.lineTo(punti[j].x, punti[j].y);
    }
    ctx.stroke();
    // I polipi: puntini chiari, come piccoli fiori aperti.
    ctx.fillStyle = hsl(this.polipiColore, 0, 0.6);
    const r = Math.max(0.6, scala * 0.0045);
    for (const q of this.polipi) {
      const n = this.nodi[q.nodo];
      const p = punti[q.nodo];
      const g = punti[n.genitore];
      const x = g.x + (p.x - g.x) * q.q;
      const y = g.y + (p.y - g.y) * q.q;
      ctx.beginPath();
      ctx.arc(x + q.lato * r, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
