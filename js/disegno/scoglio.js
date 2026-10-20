// Il grande scoglio al centro della vasca: la "casa" dei pesci.
//
// Ha due aperture:
//  - la GROTTA, che si apre sulla sabbia: un rifugio buio in cui i pesci
//    potranno entrare a riposare o a nascondersi;
//  - il PASSAGGIO, un tunnel più in alto che attraversa lo scoglio: dentro è
//    buio, e in fondo si intravede appena la luce dall'altra parte.
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

// Ingrandisce o rimpicciolisce una forma attorno a un centro.
function scalaForma(punti, centro, scala) {
  return punti.map((p) => ({ x: centro.x + (p.x - centro.x) * scala, y: centro.y + (p.y - centro.y) * scala }));
}

export class Scoglio {
  constructor(fondale, z) {
    this.fondale = fondale;
    this.z = z;
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
    // Irregolarità dei bordi delle aperture: onde sovrapposte, come roccia
    // scavata dall'acqua (niente ovali perfetti).
    const rumore = () => [
      { frequenza: 3, ampiezza: caso.tra(0.05, 0.09), fase: caso.tra(0, 6.3) },
      { frequenza: 5, ampiezza: caso.tra(0.03, 0.06), fase: caso.tra(0, 6.3) },
      { frequenza: 11, ampiezza: caso.tra(0.015, 0.03), fase: caso.tra(0, 6.3) },
    ];
    this.rumoreGrotta = rumore();
    this.rumorePassaggio = rumore();
    // Alghe che pendono dal bordo della grotta.
    this.alghe = Array.from({ length: 9 }, () => ({
      dove: caso.tra(0.12, 0.88), // posizione lungo l'arco
      lunghezza: caso.tra(0.18, 0.45),
      curva: caso.tra(-0.5, 0.5),
      tinta: caso.tra(85, 135),
    }));
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
    // Lo scoglio poggia sulla sabbia alla sua profondità (vedi fondale.js).
    const base = this.fondale.profondita(0.5, this.z) * a + 6;
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
    this.formaGrotta = this.creaFormaGrotta(this.grotta);
    this.formaPassaggio = this.creaFormaPassaggio(this.passaggio);
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

  // Vero se il punto (x, y) sta sopra la sagoma dello scoglio (con un margine).
  // Serve ai pesci: mentre sono "sopra" la roccia non cambiano lato (davanti/dietro).
  copre(x, y, margine = 0) {
    if (!this.cima) return false;
    const u = (x - this.cx) / (this.rx + margine);
    return Math.abs(u) < 1 && y > this.cima(Math.max(-1, Math.min(1, u))) - margine;
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

  static ondula(rumore, angolo) {
    let r = 1;
    for (const o of rumore) r += o.ampiezza * Math.sin(angolo * o.frequenza + o.fase);
    return r;
  }

  // Grotta: un arco irregolare e un po' inclinato, con la base nella sabbia.
  creaFormaGrotta(g) {
    const punti = [];
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const angolo = Math.PI + (i / N) * Math.PI; // da sinistra, sopra, a destra
      const r = Scoglio.ondula(this.rumoreGrotta, angolo);
      const y = g.y + Math.sin(angolo) * g.ry * r;
      // L'arco "pende" un po' a destra man mano che sale.
      const x = g.x + Math.cos(angolo) * g.rx * r + (g.y - y) * 0.18;
      punti.push({ x, y });
    }
    // Base sotto la sabbia.
    punti.push({ x: g.x + g.rx * 0.8, y: g.y + 10 }, { x: g.x - g.rx * 0.85, y: g.y + 10 });
    return punti;
  }

  // Passaggio: una forma tondeggiante irregolare, allungata in diagonale.
  creaFormaPassaggio(p) {
    const N = 16;
    return Array.from({ length: N }, (_, i) => {
      const angolo = (i / N) * Math.PI * 2;
      const r = Scoglio.ondula(this.rumorePassaggio, angolo);
      const x = Math.cos(angolo) * p.rx * r;
      const y = Math.sin(angolo) * p.ry * r;
      const inclinazione = -0.3;
      return {
        x: p.x + x * Math.cos(inclinazione) - y * Math.sin(inclinazione),
        y: p.y + x * Math.sin(inclinazione) + y * Math.cos(inclinazione),
      };
    });
  }

  tracciaGrotta(ctx, scala = 1) {
    const centro = { x: this.grotta.x, y: this.grotta.y - this.grotta.ry * 0.4 };
    tracciaMorbida(ctx, scala === 1 ? this.formaGrotta : scalaForma(this.formaGrotta, centro, scala));
  }

  tracciaPassaggio(ctx, scala = 1) {
    tracciaMorbida(ctx, scala === 1 ? this.formaPassaggio : scalaForma(this.formaPassaggio, this.passaggio, scala));
  }

  dipingiRetro(ctx) {
    const g = this.grotta;
    // Interno della grotta: vicino al bordo ha il colore della roccia in ombra
    // (così non si vede lo "stacco"), poi sfuma nel buio più profondo.
    const fondoX = g.x + g.rx * 0.15;
    const fondoY = g.y - g.ry * 0.35;
    const buio = ctx.createRadialGradient(fondoX, fondoY, 0, fondoX, fondoY, g.rx * 1.25);
    buio.addColorStop(0, 'rgb(2, 8, 14)');
    buio.addColorStop(0.45, 'rgb(7, 19, 28)');
    buio.addColorStop(0.8, 'hsl(202, 18%, 17%)');
    buio.addColorStop(1, 'hsl(200, 17%, 24%)');
    ctx.fillStyle = buio;
    this.tracciaGrotta(ctx, 1.15);
    ctx.fill();

    // La sabbia continua dentro la grotta e si perde nel buio.
    ctx.save();
    this.tracciaGrotta(ctx, 1.15);
    ctx.clip();
    const pavimento = ctx.createLinearGradient(0, g.y + 8, 0, g.y - g.ry * 0.3);
    pavimento.addColorStop(0, 'rgba(120, 118, 95, 0.95)');
    pavimento.addColorStop(0.45, 'rgba(60, 64, 58, 0.6)');
    pavimento.addColorStop(1, 'rgba(10, 20, 25, 0)');
    ctx.fillStyle = pavimento;
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 8, g.rx * 1.3, g.ry * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(g.x + g.rx * 1.3, g.y + 20);
    ctx.lineTo(g.x - g.rx * 1.3, g.y + 20);
    ctx.fill();
    ctx.restore();

    // Dettagli dell'interno (pareti a strati, luce sul pavimento, sassi...).
    this.dipingiInterno(ctx);

    // Qualche lucina nel buio, come piccole creature luminose.
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.lucine) {
      const x = fondoX + p.u * g.rx * 0.6;
      const y = fondoY - p.v * g.ry * 0.35 + g.ry * 0.15;
      ctx.fillStyle = 'rgba(120, 255, 230, 0.12)';
      ctx.beginPath();
      ctx.arc(x, y, p.r * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(190, 255, 240, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, p.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Passaggio: un tunnel buio. In fondo si intravede appena la luce che
    // entra dall'altra parte: un chiarore verde-azzurro spento, non l'acqua
    // limpida (attraverso un tunnel di roccia la luce arriva poca e smorzata).
    const p = this.passaggio;
    const parete = ctx.createLinearGradient(0, p.y - p.ry * 1.2, 0, p.y + p.ry * 1.2);
    parete.addColorStop(0, 'hsl(203, 22%, 12%)');
    parete.addColorStop(0.65, 'hsl(200, 18%, 20%)');
    parete.addColorStop(1, 'hsl(196, 15%, 32%)'); // labbro inferiore preso dalla luce
    ctx.fillStyle = parete;
    this.tracciaPassaggio(ctx, 1.15);
    ctx.fill();
    const ox = p.x + p.rx * 0.22;
    const oy = p.y - p.ry * 0.08;
    const fondo = ctx.createRadialGradient(ox, oy, 0, ox, oy, p.rx * 0.9);
    fondo.addColorStop(0, 'rgba(70, 125, 130, 0.75)');
    fondo.addColorStop(0.35, 'rgba(30, 70, 80, 0.6)');
    fondo.addColorStop(0.75, 'rgba(6, 18, 26, 0.6)');
    fondo.addColorStop(1, 'rgba(6, 18, 26, 0)');
    ctx.fillStyle = fondo;
    this.tracciaPassaggio(ctx, 1.15);
    ctx.fill();
  }

  // L'interno della grotta: una tana accogliente, non solo un buco nero.
  //  - pareti a strati vicino all'ingresso, che si perdono nel buio;
  //  - un ripiano di roccia sulla parete destra;
  //  - una pozza di luce sulla sabbia, dove entra la luce da fuori;
  //  - sassolini, una conchiglietta e qualche polipo luminoso sul soffitto.
  dipingiInterno(ctx) {
    const g = this.grotta;
    const caso = creaCasuale(777);
    const centro = { x: g.x, y: g.y - g.ry * 0.4 };
    ctx.save();
    this.tracciaGrotta(ctx, 1.15);
    ctx.clip();

    // Strati della roccia: anelli che seguono la forma dell'arco, sempre più
    // piccoli e scuri verso il fondo. Ognuno ha il bordo di sopra un po' chiaro.
    ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const scala = 1.08 - k * 0.11;
      const punti = scalaForma(this.formaGrotta.slice(0, 19), centro, scala);
      const forza = 0.16 - k * 0.035;
      // Solo pezzi di strato, qua e là: la roccia non è fatta ad anelli.
      let i = caso.intero(0, 3);
      while (i < punti.length - 2) {
        const lungo = caso.intero(2, 5);
        const fine = Math.min(punti.length - 1, i + lungo);
        const larghezza = caso.tra(1.5, 3.5);
        for (const [colore, w, dy] of [
          [`rgba(150, 175, 175, ${forza})`, larghezza * 0.7, 0],
          [`rgba(3, 10, 16, ${forza * 2})`, larghezza, larghezza],
        ]) {
          ctx.beginPath();
          for (let j = i; j <= fine; j++) {
            const y = punti[j].y + dy + Math.sin(j * 1.7 + k * 2) * 2;
            if (j === i) ctx.moveTo(punti[j].x, y);
            else ctx.lineTo(punti[j].x, y);
          }
          ctx.strokeStyle = colore;
          ctx.lineWidth = w;
          ctx.stroke();
        }
        i = fine + caso.intero(2, 4);
      }
    }

    // Un ripiano di roccia sulla parete destra, inclinato verso il basso.
    const rx0 = g.x + g.rx * 0.35;
    const ry0 = g.y - g.ry * 0.42;
    ctx.fillStyle = 'hsl(203, 20%, 14%)';
    ctx.beginPath();
    ctx.moveTo(rx0, ry0);
    ctx.quadraticCurveTo(rx0 + g.rx * 0.45, ry0 - g.ry * 0.06, rx0 + g.rx * 0.95, ry0 - g.ry * 0.02);
    ctx.lineTo(rx0 + g.rx * 0.95, ry0 + g.ry * 0.14);
    ctx.quadraticCurveTo(rx0 + g.rx * 0.4, ry0 + g.ry * 0.12, rx0 + g.rx * 0.05, ry0 + g.ry * 0.06);
    ctx.closePath();
    ctx.fill();
    // Il bordo del ripiano preso da un filo di luce.
    ctx.beginPath();
    ctx.moveTo(rx0, ry0);
    ctx.quadraticCurveTo(rx0 + g.rx * 0.45, ry0 - g.ry * 0.06, rx0 + g.rx * 0.95, ry0 - g.ry * 0.02);
    ctx.strokeStyle = 'rgba(140, 175, 170, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Sopra il ripiano, due sassolini.
    for (const [u, r] of [[0.3, 0.07], [0.55, 0.05]]) {
      const sx = rx0 + g.rx * u;
      const sy = ry0 - g.ry * 0.035 - r * g.rx * 0.5;
      ctx.fillStyle = 'hsl(200, 12%, 22%)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, r * g.rx, r * g.rx * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // La luce che entra dall'ingresso fa una pozza chiara sulla sabbia.
    const pozza = ctx.createRadialGradient(g.x - g.rx * 0.1, g.y + 2, 0, g.x - g.rx * 0.1, g.y + 2, g.rx * 0.9);
    pozza.addColorStop(0, 'rgba(190, 200, 160, 0.35)');
    pozza.addColorStop(0.6, 'rgba(150, 170, 140, 0.12)');
    pozza.addColorStop(1, 'rgba(150, 170, 140, 0)');
    ctx.fillStyle = pozza;
    ctx.save();
    ctx.translate(g.x - g.rx * 0.1, g.y + 2);
    ctx.scale(1, 0.3);
    ctx.beginPath();
    ctx.arc(0, 0, g.rx * 0.9, 0, Math.PI * 2);
    ctx.translate(-(g.x - g.rx * 0.1), -(g.y + 2));
    ctx.restore();
    ctx.fill();

    // Sassolini e pezzetti di corallo sul pavimento: più chiari e grandi vicino
    // all'ingresso, più piccoli e scuri verso il fondo.
    for (let i = 0; i < 16; i++) {
      const fondo = caso.prossimo(); // 0 = ingresso, 1 = fondo
      const sx = g.x + caso.tra(-0.9, 0.9) * g.rx * (1 - fondo * 0.4);
      const sy = g.y + 4 - fondo * g.ry * 0.28;
      const r = g.rx * caso.tra(0.025, 0.06) * (1 - fondo * 0.5);
      const luce = 34 - fondo * 24;
      ctx.fillStyle = `hsl(${caso.tra(25, 210)}, ${caso.tra(6, 18)}%, ${luce}%)`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.6, caso.tra(-0.4, 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(230, 240, 220, ${0.12 * (1 - fondo)})`;
      ctx.beginPath();
      ctx.ellipse(sx - r * 0.2, sy - r * 0.25, r * 0.5, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Una conchiglietta rosata vicino all'ingresso, a sinistra.
    const cx0 = g.x - g.rx * 0.62;
    const cy0 = g.y + 3;
    const rc = g.rx * 0.09;
    ctx.fillStyle = 'hsl(15, 35%, 58%)';
    ctx.beginPath();
    ctx.moveTo(cx0 - rc, cy0);
    ctx.quadraticCurveTo(cx0, cy0 - rc * 1.5, cx0 + rc, cy0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'hsla(15, 30%, 38%, 0.8)';
    ctx.lineWidth = 0.8;
    for (let s = -2; s <= 2; s++) {
      ctx.beginPath();
      ctx.moveTo(cx0, cy0 + rc * 0.1);
      ctx.lineTo(cx0 + s * rc * 0.4, cy0 - rc * (0.75 - Math.abs(s) * 0.12));
      ctx.stroke();
    }

    // Piccoli polipi sul soffitto, con le punte che brillano appena.
    const soffitto = scalaForma(this.formaGrotta.slice(4, 15), centro, 0.82);
    ctx.globalCompositeOperation = 'lighter';
    soffitto.forEach((q, i) => {
      if (i % 2) return;
      for (let n = 0; n < 3; n++) {
        const px = q.x + caso.tra(-4, 4);
        const py = q.y + caso.tra(0, 5);
        const r = caso.tra(1, 1.8);
        ctx.fillStyle = 'rgba(255, 160, 200, 0.08)';
        ctx.beginPath();
        ctx.arc(px, py, r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 190, 215, 0.45)';
        ctx.beginPath();
        ctx.arc(px, py, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
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

    // --- Le aperture ---
    const g = this.grotta;
    const p = this.passaggio;

    // 1. Rientranza: la roccia si scurisce piano piano avvicinandosi
    //    all'apertura, come quando una superficie piega verso l'interno.
    ctx.save();
    this.tracciaSagoma(ctx);
    ctx.clip();
    const rientranza = (x, y, rx2, ry2, forza) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry2 / rx2);
      const ombra2 = ctx.createRadialGradient(0, 0, rx2 * 0.7, 0, 0, rx2 * 1.75);
      ombra2.addColorStop(0, `rgba(5, 14, 22, ${forza})`);
      ombra2.addColorStop(1, 'rgba(5, 14, 22, 0)');
      ctx.fillStyle = ombra2;
      ctx.fillRect(-rx2 * 2, -rx2 * 2, rx2 * 4, rx2 * 4);
      ctx.restore();
    };
    rientranza(g.x + g.rx * 0.08, g.y - g.ry * 0.45, g.rx, g.ry * 0.8, 0.6);
    rientranza(p.x, p.y, p.rx, p.ry, 0.55);
    ctx.restore();

    // 2. I buchi veri e propri, dalla forma irregolare.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000'; // colore pieno: il buco deve essere completo
    this.tracciaGrotta(ctx);
    ctx.fill();
    this.tracciaPassaggio(ctx);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // 2b. Il bordo dell'ingresso: un labbro di roccia un po' in rilievo, con
    //     la luce sopra e l'ombra appena dentro. Poi le incrostazioni colorate.
    this.dipingiBordoGrotta(ctx, M);

    // 3. Ciuffi di alghe che pendono dal bordo superiore della grotta:
    //    nascondono in parte il contorno e lo rendono più naturale.
    const caso = creaCasuale(99);
    const arco = this.formaGrotta.slice(0, 19);
    ctx.lineCap = 'round';
    for (const a of this.alghe) {
      const k = a.dove * (arco.length - 1);
      const p0 = arco[Math.floor(k)];
      const p1 = arco[Math.min(arco.length - 1, Math.floor(k) + 1)];
      const f = k - Math.floor(k);
      const x0 = p0.x + (p1.x - p0.x) * f;
      const y0 = p0.y + (p1.y - p0.y) * f - 3;
      // Ogni ciuffo ha 2-3 fili ondulati, più spessi in alto e sottili in punta.
      const fili = caso.intero(2, 3);
      for (let n = 0; n < fili; n++) {
        const l = g.ry * a.lunghezza * caso.tra(0.6, 1);
        const sx = x0 + caso.tra(-3, 3);
        const ondaFase = caso.tra(0, 6.3);
        const pezzi = 6;
        let px = sx;
        let py = y0;
        for (let s = 1; s <= pezzi; s++) {
          const q = s / pezzi;
          const nx = sx + Math.sin(q * 5 + ondaFase) * 2.2 + a.curva * l * q * 0.4;
          const ny = y0 + l * q;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(nx, ny);
          ctx.lineWidth = 2.6 * (1 - q * 0.7);
          ctx.strokeStyle = `hsla(${a.tinta + n * 8}, 45%, ${30 + q * 14}%, ${0.9 - q * 0.35})`;
          ctx.stroke();
          px = nx;
          py = ny;
        }
      }
    }

    // 4. Un po' di muschio morbido lungo il bordo superiore dell'arco.
    for (let i = 2; i < arco.length - 2; i += 2) {
      const r = g.rx * caso.tra(0.06, 0.1);
      ctx.fillStyle = `hsla(${caso.tra(90, 130)}, 35%, ${caso.tra(28, 38)}%, 0.55)`;
      ctx.beginPath();
      ctx.ellipse(arco[i].x, arco[i].y - r * 0.4, r * 1.6, r * 0.6, caso.tra(-0.3, 0.3), 0, Math.PI * 2);
      ctx.fill();
    }

    // Sabbia ammucchiata ai piedi dello scoglio (copre anche l'ingresso della grotta).
    this.fondale.sabbiaAlPiede(ctx, cx, base - 6, rx * 1.8, this.z);

    // Qualche sasso e pezzo di roccia caduto ai lati dell'ingresso.
    for (const [u, r0] of [[-1.05, 0.13], [-0.85, 0.08], [0.95, 0.11], [1.15, 0.07], [0.78, 0.05]]) {
      const sx = g.x + u * g.rx;
      const r = r0 * g.rx;
      const sy = g.y + 4 - r * 0.3;
      const sasso = ctx.createLinearGradient(0, sy - r, 0, sy + r * 0.6);
      sasso.addColorStop(0, 'hsl(195, 12%, 46%)');
      sasso.addColorStop(1, 'hsl(205, 20%, 22%)');
      ctx.fillStyle = sasso;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.62, caso.tra(-0.2, 0.2), Math.PI, Math.PI * 2);
      ctx.quadraticCurveTo(sx + r * 0.9, sy + r * 0.35, sx, sy + r * 0.35);
      ctx.quadraticCurveTo(sx - r * 0.9, sy + r * 0.35, sx - r, sy);
      ctx.fill();
    }

    // Decorazioni sullo scoglio: piccoli coralli appoggiati sulla roccia.
    const decora = (tipo, u, misura, colore, affonda = 4) => {
      const x = cx + u * rx;
      dipingiCorallo(ctx, caso, tipo, x, this.cima(u) + affonda, misura * M, colore);
    };
    decora('ramificato', -0.42, 0.09, { h: 12, s: 70, l: 62 });
    decora('cervello', 0.62, 0.035, { h: 62, s: 40, l: 52 });
    decora('tubi', 0.82, 0.07, { h: 278, s: 40, l: 55 }, 10);
    // Una stella marina appoggiata sul fianco dello scoglio.
    dipingiCorallo(ctx, caso, 'stella', cx + rx * 0.58, base - H * 0.28, M * 0.06, { h: 14, s: 75, l: 55 });
    // Coralli alla base, davanti allo scoglio.
    dipingiCorallo(ctx, caso, 'cervello', cx + rx * 0.4, base - 2, M * 0.05, { h: 150, s: 30, l: 46 });
    dipingiCorallo(ctx, caso, 'tubi', cx - rx * 0.86, base - 1, M * 0.08, { h: 28, s: 75, l: 55 });
  }

  // Il contorno della grotta visto da fuori: un labbro in rilievo e tante
  // piccole vite attaccate alla roccia (alghe rosa incrostanti, spugne,
  // polipi), come nelle vere rocce di barriera.
  dipingiBordoGrotta(ctx, M) {
    const g = this.grotta;
    const caso = creaCasuale(555);
    const arco = this.formaGrotta.slice(0, 19);
    const centro = { x: g.x, y: g.y - g.ry * 0.4 };
    const fuori = scalaForma(arco, centro, 1.1);

    ctx.save();
    this.tracciaSagoma(ctx);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Labbro: una fascia chiara appena fuori dal bordo e una scura sul bordo.
    for (const [punti, colore, larghezza] of [
      [fuori, 'rgba(190, 215, 205, 0.18)', g.rx * 0.16],
      [scalaForma(arco, centro, 1.04), 'rgba(4, 12, 18, 0.5)', g.rx * 0.08],
    ]) {
      ctx.beginPath();
      punti.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.strokeStyle = colore;
      ctx.lineWidth = larghezza;
      ctx.stroke();
    }

    // Alghe rosa incrostanti (corallina): macchie irregolari intorno all'arco.
    for (let i = 1; i < fuori.length - 1; i++) {
      if (caso.prossimo() < 0.5) continue;
      const q = fuori[i];
      const r = g.rx * caso.tra(0.07, 0.15);
      const tinta = caso.tra(330, 355);
      for (let n = 0; n < 4; n++) {
        ctx.fillStyle = `hsla(${tinta}, ${caso.tra(18, 30)}%, ${caso.tra(50, 60)}%, 0.38)`;
        ctx.beginPath();
        ctx.ellipse(q.x + caso.tra(-r, r) * 0.6, q.y + caso.tra(-r, r) * 0.6, r * caso.tra(0.4, 0.8), r * caso.tra(0.25, 0.5), caso.tra(0, 3), 0, Math.PI * 2);
        ctx.fill();
      }
      // Puntini chiari: la superficie ruvida della corallina.
      ctx.fillStyle = 'rgba(255, 225, 235, 0.22)';
      for (let n = 0; n < 4; n++) {
        ctx.beginPath();
        ctx.arc(q.x + caso.tra(-r, r) * 0.6, q.y + caso.tra(-r, r) * 0.4, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spugne arancioni a sinistra dell'ingresso: piccoli cuscinetti tondi con
    // il buchino scuro in cima.
    const spugne = [[-1.02, -0.12, 0.14], [-1.12, -0.26, 0.11], [-0.98, -0.36, 0.08], [-1.2, -0.08, 0.09]];
    for (const [u, v, r0] of spugne) {
      const sx = g.x + u * g.rx;
      const sy = g.y + v * g.ry;
      const r = r0 * g.rx;
      const corpo = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.4, 0, sx, sy, r * 1.1);
      corpo.addColorStop(0, 'hsl(36, 85%, 62%)');
      corpo.addColorStop(1, 'hsl(22, 70%, 38%)');
      ctx.fillStyle = corpo;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'hsl(18, 60%, 18%)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - r * 0.25, r * 0.28, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polipi verdi (zoantidi) a destra dell'ingresso: dischetti con il centro
    // chiaro e una coroncina di tentacoli.
    for (let i = 0; i < 9; i++) {
      const sx = g.x + g.rx * caso.tra(1.0, 1.45) + (g.y - g.ry * 0.1) * 0;
      const sy = g.y - g.ry * caso.tra(0.05, 0.55);
      const r = g.rx * caso.tra(0.04, 0.06);
      ctx.fillStyle = 'hsla(160, 45%, 40%, 0.9)';
      ctx.beginPath();
      for (let t = 0; t < 10; t++) {
        const a = (t / 10) * Math.PI * 2;
        const rr = t % 2 ? r : r * 1.35;
        ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.7);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'hsl(75, 70%, 62%)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Le incrostazioni non devono coprire l'apertura: ripuliamo il buco.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    this.tracciaGrotta(ctx);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  disegnaRetro(ctx) {
    ctx.drawImage(this.retro, this.x0, this.y0, this.lf, this.af);
  }

  disegnaFronte(ctx) {
    ctx.drawImage(this.fronte, this.x0, this.y0, this.lf, this.af);
  }
}
