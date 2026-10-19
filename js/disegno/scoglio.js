// Il grande scoglio al centro della vasca: la "casa" dei pesci.
//
// Ha due aperture:
//  - la GROTTA, che si apre sulla sabbia: un rifugio buio in cui i pesci
//    potranno entrare a riposare o a nascondersi;
//  - il PASSAGGIO, un buco più in alto che attraversa lo scoglio da parte
//    a parte: i pesci potranno passarci dentro.
//
// Il trucco per far "entrare" i pesci: lo scoglio è dipinto su DUE fogli.
//  1. RETRO:  l'interno buio della grotta e le pareti del passaggio.
//  2. FRONTE: la roccia vera e propria, con i buchi delle aperture.
// Un pesce dentro la tana viene disegnato in mezzo ai due fogli: si vede
// attraverso l'apertura, ma la roccia davanti lo copre ai bordi.
//
// Entrambi i fogli sono dipinti una volta sola (lo scoglio non si muove).

import { creaCasuale } from '../util/casuale.js';
import { dipingiCorallo } from './coralli.js';

const PUNTI_PROFILO = 48;

export class Scoglio {
  constructor(fondale) {
    this.fondale = fondale;
    const caso = creaCasuale(4242);
    // Forma del profilo: qualche gobba e un "dente" in cima a sinistra.
    this.gobbe = [
      { ampiezza: 0.12, frequenza: 3, fase: caso.tra(0, 6.3) },
      { ampiezza: 0.06, frequenza: 7, fase: caso.tra(0, 6.3) },
    ];
    // Sfaccettature e crepe della roccia, in coordinate relative (-1..1).
    this.facce = Array.from({ length: 30 }, () => ({
      u: caso.tra(-0.9, 0.9),
      v: caso.tra(0.05, 0.95),
      misura: caso.tra(0.08, 0.2),
      angolo: caso.tra(0, Math.PI),
      chiara: caso.prossimo() < 0.5,
    }));
    this.crepe = Array.from({ length: 7 }, () => {
      let u = caso.tra(-0.8, 0.8);
      let v = caso.tra(0.2, 0.9);
      return Array.from({ length: 5 }, () => {
        const p = { u, v };
        u += caso.tra(-0.1, 0.1);
        v -= caso.tra(0.04, 0.12);
        return p;
      });
    });
    this.lucine = Array.from({ length: 7 }, () => ({ u: caso.tra(-0.7, 0.7), v: caso.tra(0.2, 0.8), r: caso.tra(0.8, 1.8) }));
    this.retro = document.createElement('canvas');
    this.fronte = document.createElement('canvas');
  }

  // Quanto è alto lo scoglio nel punto u (da -1 = bordo sinistro a 1 = destro).
  profilo(u) {
    let p = Math.pow(Math.max(0, 1 - u * u), 0.6);
    for (const g of this.gobbe) p *= 1 + g.ampiezza * Math.sin(u * g.frequenza + g.fase);
    p += 0.1 * Math.exp(-(((u + 0.38) / 0.25) ** 2)); // il "dente" in cima
    return p;
  }

  prepara(l, a, densita) {
    const M = this.fondale.misuraBase(l, a);
    const cx = l * 0.5;
    const base = this.fondale.lineaSabbia(0.5) * a + 8;
    // Mezza larghezza e altezza: con l'iPad in verticale lo stringiamo,
    // così non va addosso alle rocce ai lati.
    const rx = Math.min(M * 0.22, l * 0.16);
    const H = Math.min(M * 0.3, rx * 1.5);
    const massimo = Math.max(...Array.from({ length: 41 }, (_, i) => this.profilo(i / 20 - 1)));
    const cima = (u) => base - (H * this.profilo(u)) / massimo;
    Object.assign(this, { cx, base, rx, H, cima });

    // Aperture (in punti). Le teniamo da parte: serviranno ai pesci.
    this.grotta = { x: cx - rx * 0.22, y: base - 6, rx: rx * 0.32, ry: H * 0.38 };
    this.passaggio = { x: cx + rx * 0.4, y: base - H * 0.58, rx: rx * 0.16, ry: H * 0.13 };
    this.tana = {
      // Punto in fondo alla grotta dove un pesce può riposare.
      interno: { x: this.grotta.x, y: this.grotta.y - this.grotta.ry * 0.45 },
      ingresso: this.grotta,
      passaggio: this.passaggio,
    };
    // Dove si può appoggiare qualcosa sopra lo scoglio (es. un anemone).
    this.appoggio = { x: cx + rx * 0.05, y: cima(0.05) + 5 };

    // Rettangolo che contiene lo scoglio e le sue decorazioni.
    this.x0 = Math.floor(cx - rx * 1.5);
    this.y0 = Math.floor(base - H * 1.5);
    this.lf = Math.ceil(rx * 3);
    this.af = Math.ceil(H * 1.75);
    for (const foglio of [this.retro, this.fronte]) {
      foglio.width = Math.round(this.lf * densita);
      foglio.height = Math.round(this.af * densita);
    }
    const prepara = (foglio) => {
      const ctx = foglio.getContext('2d');
      ctx.setTransform(densita, 0, 0, densita, -this.x0 * densita, -this.y0 * densita);
      ctx.clearRect(this.x0, this.y0, this.lf, this.af);
      return ctx;
    };
    this.dipingiRetro(prepara(this.retro));
    this.dipingiFronte(prepara(this.fronte), M);
  }

  // Coordinate relative → punti: u da -1 a 1 in larghezza, v da 0 (base) a 1 (cima).
  punto(u, v) {
    return { x: this.cx + u * this.rx, y: this.base - (this.base - this.cima(u)) * v };
  }

  tracciaSagoma(ctx) {
    ctx.beginPath();
    for (let i = 0; i <= PUNTI_PROFILO; i++) {
      const u = (i / PUNTI_PROFILO) * 2 - 1;
      const x = this.cx + u * this.rx;
      if (i === 0) ctx.moveTo(x, this.base);
      ctx.lineTo(x, this.cima(u));
    }
    ctx.lineTo(this.cx + this.rx, this.base);
    ctx.closePath();
  }

  // La grotta è un arco: tondo in alto e piatto sulla sabbia.
  tracciaGrotta(ctx, g, scala = 1) {
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, g.rx * scala, g.ry * scala, 0, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(g.x, g.y + g.ry * 0.12, g.x - g.rx * scala, g.y);
    ctx.closePath();
  }

  tracciaPassaggio(ctx, p, dx = 0, dy = 0, scala = 1) {
    ctx.beginPath();
    ctx.ellipse(p.x + dx, p.y + dy, p.rx * scala, p.ry * scala, -0.25, 0, Math.PI * 2);
  }

  dipingiRetro(ctx) {
    // Interno della grotta: roccia scura ai bordi, quasi nero in fondo.
    const g = this.grotta;
    const buio = ctx.createRadialGradient(g.x, g.y - g.ry * 0.4, 0, g.x, g.y - g.ry * 0.4, g.rx * 1.2);
    buio.addColorStop(0, 'rgb(3, 10, 18)');
    buio.addColorStop(0.55, 'rgb(10, 24, 34)');
    buio.addColorStop(1, 'hsl(200, 20%, 24%)');
    ctx.fillStyle = buio;
    this.tracciaGrotta(ctx, g, 1.12);
    ctx.fill();

    // Qualche lucina nel buio, come piccole creature luminose.
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.lucine) {
      const x = g.x + p.u * g.rx * 0.8;
      const y = g.y - p.v * g.ry * 0.8;
      ctx.fillStyle = 'rgba(120, 255, 230, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(190, 255, 240, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, p.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Passaggio: si vede la parete interna del tunnel solo da un lato,
    // e dall'altro si vede l'acqua dietro lo scoglio.
    const p = this.passaggio;
    ctx.fillStyle = 'hsl(200, 18%, 26%)';
    this.tracciaPassaggio(ctx, p, 0, 0, 1.1);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    this.tracciaPassaggio(ctx, p, p.rx * 0.22, -p.ry * 0.12, 0.86);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  dipingiFronte(ctx, M) {
    const { cx, base, rx, H } = this;
    const top = base - H;

    // Ombra morbida sulla sabbia.
    const ombra = ctx.createRadialGradient(cx, base, 0, cx, base, rx * 1.4);
    ombra.addColorStop(0, 'rgba(10, 20, 25, 0.5)');
    ombra.addColorStop(1, 'rgba(10, 20, 25, 0)');
    ctx.fillStyle = ombra;
    ctx.beginPath();
    ctx.ellipse(cx, base, rx * 1.4, H * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo: chiaro in alto (luce dal sole), scuro verso la sabbia.
    ctx.save();
    this.tracciaSagoma(ctx);
    const corpo = ctx.createLinearGradient(cx - rx * 0.2, top, cx + rx * 0.1, base);
    corpo.addColorStop(0, 'hsl(195, 14%, 54%)');
    corpo.addColorStop(0.45, 'hsl(200, 18%, 36%)');
    corpo.addColorStop(1, 'hsl(205, 24%, 23%)');
    ctx.fillStyle = corpo;
    ctx.fill();
    ctx.clip();

    // Sfaccettature: macchie a forma di scaglia, un po' più chiare o più scure.
    for (const f of this.facce) {
      const p = this.punto(f.u, f.v);
      const m = f.misura * rx;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(f.angolo);
      ctx.fillStyle = f.chiara ? 'rgba(220, 245, 240, 0.08)' : 'rgba(5, 15, 25, 0.12)';
      ctx.beginPath();
      ctx.moveTo(-m, 0);
      ctx.lineTo(-m * 0.2, -m * 0.6);
      ctx.lineTo(m, -m * 0.1);
      ctx.lineTo(m * 0.3, m * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Crepe: linee scure con un filo di luce sotto.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const crepa of this.crepe) {
      for (const [colore, larghezza, dy] of [['rgba(5, 15, 25, 0.45)', 1.8, 0], ['rgba(210, 240, 235, 0.15)', 1, 1.4]]) {
        ctx.beginPath();
        crepa.forEach((c, i) => {
          const p = this.punto(c.u, c.v);
          if (i === 0) ctx.moveTo(p.x, p.y + dy);
          else ctx.lineTo(p.x, p.y + dy);
        });
        ctx.strokeStyle = colore;
        ctx.lineWidth = larghezza;
        ctx.stroke();
      }
    }

    // Luce dall'alto sulla sommità.
    const luce = ctx.createRadialGradient(cx - rx * 0.3, top, 0, cx - rx * 0.3, top, H * 0.9);
    luce.addColorStop(0, 'rgba(225, 250, 230, 0.4)');
    luce.addColorStop(1, 'rgba(225, 250, 230, 0)');
    ctx.fillStyle = luce;
    ctx.fillRect(cx - rx * 1.5, top - H * 0.6, rx * 3, H * 1.6);

    // Muschio verde sulla parte alta e buio vicino alla sabbia.
    const muschio = ctx.createLinearGradient(0, top, 0, top + H * 0.45);
    muschio.addColorStop(0, 'rgba(110, 165, 85, 0.45)');
    muschio.addColorStop(1, 'rgba(110, 165, 85, 0)');
    ctx.fillStyle = muschio;
    ctx.fillRect(cx - rx * 1.5, top - H * 0.6, rx * 3, H * 1.1);
    const piede = ctx.createLinearGradient(0, base - H * 0.25, 0, base);
    piede.addColorStop(0, 'rgba(5, 15, 20, 0)');
    piede.addColorStop(1, 'rgba(5, 15, 20, 0.45)');
    ctx.fillStyle = piede;
    ctx.fillRect(cx - rx * 1.5, base - H * 0.25, rx * 3, H * 0.3);

    // Bordo luminoso lungo la cima.
    ctx.translate(rx * 0.015, H * 0.025);
    this.tracciaSagoma(ctx);
    ctx.lineWidth = Math.max(2, rx * 0.025);
    ctx.strokeStyle = 'rgba(220, 255, 235, 0.3)';
    ctx.stroke();
    ctx.restore();

    // --- Le aperture: "bucano" la roccia e lasciano vedere il retro ---
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000'; // colore pieno: il buco deve essere completo
    this.tracciaGrotta(ctx, this.grotta);
    ctx.fill();
    this.tracciaPassaggio(ctx, this.passaggio);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Bordi delle aperture: un anello scuro dà spessore alla roccia,
    // e il labbro inferiore preso dalla luce la fa sembrare scavata.
    for (const traccia of [() => this.tracciaGrotta(ctx, this.grotta), () => this.tracciaPassaggio(ctx, this.passaggio)]) {
      traccia();
      ctx.lineWidth = Math.max(3, rx * 0.04);
      ctx.strokeStyle = 'rgba(5, 15, 25, 0.55)';
      ctx.stroke();
      ctx.save();
      ctx.translate(0, -2);
      traccia();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(200, 235, 230, 0.25)';
      ctx.stroke();
      ctx.restore();
    }

    // Decorazioni sullo scoglio: piccoli coralli appoggiati sulla roccia.
    const caso = creaCasuale(99);
    const decora = (tipo, u, misura, colore, affonda = 4) => {
      const x = cx + u * rx;
      dipingiCorallo(ctx, caso, tipo, x, this.cima(u) + affonda, misura * M, colore);
    };
    decora('ramificato', -0.42, 0.09, { h: 12, s: 70, l: 62 });
    decora('cervello', 0.62, 0.035, { h: 62, s: 40, l: 52 });
    decora('tubi', 0.82, 0.07, { h: 278, s: 40, l: 55 }, 10);
    // Coralli alla base, davanti allo scoglio.
    dipingiCorallo(ctx, caso, 'cervello', cx + rx * 0.4, base - 2, M * 0.05, { h: 150, s: 30, l: 46 });
    dipingiCorallo(ctx, caso, 'tubi', cx - rx * 0.86, base - 1, M * 0.08, { h: 28, s: 75, l: 55 });
  }

  disegnaRetro(ctx) {
    ctx.drawImage(this.retro, this.x0, this.y0, this.lf, this.af);
  }

  disegnaFronte(ctx) {
    ctx.drawImage(this.fronte, this.x0, this.y0, this.lf, this.af);
  }
}
