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

  disegnaRetro(ctx) {
    ctx.drawImage(this.retro, this.x0, this.y0, this.lf, this.af);
  }

  disegnaFronte(ctx) {
    ctx.drawImage(this.fronte, this.x0, this.y0, this.lf, this.af);
  }
}
