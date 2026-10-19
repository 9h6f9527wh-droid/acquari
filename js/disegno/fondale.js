// Il fondale della vasca, in tre strati:
//  - LONTANO: colline di roccia sfumate nell'azzurro, come viste attraverso
//    tanta acqua (meno contrasto, colori più chiari).
//  - VICINO: la sabbia con le sue increspature e gli oggetti "dietro"
//    (quelli tra il fondo della sabbia e lo scoglio centrale).
//  - PRIMO PIANO: gli oggetti "davanti" allo scoglio, verso di noi.
//
// PROFONDITÀ: ogni roccia, corallo o pianta ha un valore "z":
//   z = 0 → in fondo, sul bordo lontano della sabbia: più in alto sullo
//           schermo, più piccolo e più velato d'azzurro;
//   z = 1 → davanti, vicino al vetro: più in basso, più grande e più nitido.
// Gli oggetti vengono dipinti dal più lontano al più vicino (come un pittore
// che dipinge prima lo sfondo), così ognuno copre quelli che ha dietro.
//
// Il fondale non si muove: lo dipingiamo una volta sola (e di nuovo solo
// se cambia la misura dello schermo), poi lo incolliamo a ogni fotogramma.

import { creaCasuale } from '../util/casuale.js';
import { dipingiCorallo } from './coralli.js';
import { Scoglio } from './scoglio.js';

const SEME = 2026;
// Gli oggetti con z più piccolo di questo stanno dietro lo scoglio centrale.
export const Z_SCOGLIO = 0.36;

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
    this.aeratore = { x: 0.8, z: 0.6 };

    // Rocce: posizione, profondità, misura (in frazioni) e forma a caso.
    this.rocce = [
      { x: 0.73, z: 0.5, misura: 0.115, schiacciata: 0.8 },
      { x: 0.865, z: 0.8, misura: 0.07, schiacciata: 0.75 },
      { x: 0.2, z: 0.55, misura: 0.085, schiacciata: 0.7 },
      { x: 0.275, z: 0.88, misura: 0.042, schiacciata: 0.8 },
    ].map((r) => ({
      ...r,
      // Raggi irregolari attorno al centro: ogni roccia ha una forma sua.
      forma: Array.from({ length: 10 }, () => caso.tra(0.78, 1.12)),
      tinta: caso.tra(-12, 12),
    }));

    // Coralli: tipo, posizione, profondità, misura (frazione della vasca) e colore.
    this.coralli = [
      { tipo: 'ventaglio', x: 0.3, z: 0.05, misura: 0.3, colore: { h: 285, s: 45, l: 52 } },
      { tipo: 'ramificato', x: 0.655, z: 0.12, misura: 0.16, colore: { h: 268, s: 45, l: 66 } },
      { tipo: 'ventaglio', x: 0.885, z: 0.06, misura: 0.24, colore: { h: 355, s: 60, l: 50 } },
      { tipo: 'ramificato', x: 0.11, z: 0.62, misura: 0.19, colore: { h: 345, s: 60, l: 60 } },
      { tipo: 'cervello', x: 0.385, z: 0.9, misura: 0.042, colore: { h: 150, s: 30, l: 48 } },
      { tipo: 'tubi', x: 0.64, z: 0.93, misura: 0.08, colore: { h: 46, s: 70, l: 55 } },
      { tipo: 'ramificato', x: 0.93, z: 0.92, misura: 0.12, colore: { h: 18, s: 70, l: 60 } },
    ];
    // Sagome sbiadite di coralli lontani, sulle colline sullo sfondo.
    this.coralliLontani = [
      { tipo: 'ventaglio', x: 0.16, misura: 0.3 },
      { tipo: 'ramificato', x: 0.47, misura: 0.24 },
      { tipo: 'tubi', x: 0.62, misura: 0.15 },
      { tipo: 'ventaglio', x: 0.76, misura: 0.22 },
    ];

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

    // Il grande scoglio-casa al centro (ha i suoi fogli: vedi scoglio.js).
    this.scoglio = new Scoglio(this, Z_SCOGLIO);

    this.lontano = creaFoglio();
    this.vicino = creaFoglio();
    this.primoPiano = creaFoglio();
    this.appoggio = creaFoglio(); // foglio di lavoro per velare un oggetto alla volta
    this.larghezza = 0;
    this.altezza = 0;
  }

  // Altezza del bordo della sabbia (in frazioni) nel punto x (in frazioni).
  lineaSabbia(x) {
    let y = 0.81;
    for (const o of this.ondeSabbia) y += o.ampiezza * Math.sin(x * o.frequenza + o.fase);
    return y;
  }

  // Altezza delle colline lontane.
  lineaLontana(x) {
    let y = 0.72;
    for (const o of this.ondeLontane) y += o.ampiezza * Math.sin(x * o.frequenza + o.fase);
    return y;
  }

  // Dove poggia sulla sabbia un oggetto in x con profondità z (in frazioni).
  profondita(x, z) {
    const bordo = this.lineaSabbia(x);
    return bordo + z * (1 - bordo) * 0.78;
  }

  // Quanto è grande un oggetto alla profondità z (davanti = più grande).
  scalaZ(z) {
    return 0.72 + 0.48 * z;
  }

  prepara(larghezza, altezza) {
    // Stessa risoluzione dello schermo: così incollarli costa pochissimo.
    const densita = Math.min(window.devicePixelRatio || 1, 2);
    this.misure = { l: larghezza, a: altezza, densita };
    this.dipingiLontano(larghezza, altezza, densita);
    this.dipingiVicino(larghezza, altezza, densita);
    this.dipingiPrimoPiano(larghezza, altezza, densita);
    this.scoglio.prepara(larghezza, altezza, densita);
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

    const caso = creaCasuale(SEME + 1);
    for (const c of this.coralliLontani) {
      const y = this.lineaLontana(c.x) * a + 6;
      dipingiCorallo(ctx, caso, c.tipo, c.x * l, y, c.misura * this.misuraBase(l, a), null, true);
    }
  }

  // Misura di riferimento per rocce e coralli: così restano proporzionati
  // sia con l'iPad in orizzontale che in verticale.
  misuraBase(l, a) {
    return Math.min(a, l * 1.1);
  }

  preparaFoglio({ foglio, ctx }, l, a, densita) {
    foglio.width = Math.round(l * densita);
    foglio.height = Math.round(a * densita);
    ctx.setTransform(densita, 0, 0, densita, 0, 0);
    ctx.clearRect(0, 0, l, a);
    return ctx;
  }

  dipingiVicino(l, a, densita) {
    const ctx = this.preparaFoglio(this.vicino, l, a, densita);

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
    this.coloreSabbia = sabbia; // lo riusiamo per la sabbia ai piedi degli oggetti

    // Velo azzurro: la sabbia è vista attraverso l'acqua.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(30, 95, 115, 0.28)';
    ctx.fillRect(0, cima, l, a - cima);

    // Foschia sul bordo lontano: la sabbia "svanisce" nell'acqua invece
    // di finire con uno spigolo netto.
    const foschia = ctx.createLinearGradient(0, cima, 0, cima + (a - cima) * 0.35);
    foschia.addColorStop(0, 'rgba(35, 100, 125, 0.55)');
    foschia.addColorStop(1, 'rgba(35, 100, 125, 0)');
    ctx.fillStyle = foschia;
    ctx.fillRect(0, cima - 30, l, (a - cima) * 0.35 + 30);
    this.foschiaSabbia = foschia;

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

    // Oggetti dietro lo scoglio.
    this.cimeRocce = [];
    this.dipingiOggetti(ctx, l, a, densita, (z) => z < Z_SCOGLIO);
  }

  dipingiPrimoPiano(l, a, densita) {
    const ctx = this.preparaFoglio(this.primoPiano, l, a, densita);
    this.dipingiOggetti(ctx, l, a, densita, (z) => z >= Z_SCOGLIO);
  }

  // Dipinge rocce e coralli che passano il filtro, dal più lontano al più vicino.
  dipingiOggetti(ctx, l, a, densita, filtro) {
    const oggetti = [
      ...this.rocce.map((r, indice) => ({ ...r, roccia: true, indice })),
      ...this.coralli.map((c, indice) => ({ ...c, indice })),
    ]
      .filter((o) => filtro(o.z))
      .sort((p, q) => p.z - q.z);

    const M = this.misuraBase(l, a);
    for (const o of oggetti) {
      // Il seme dipende dall'oggetto: la sua forma è sempre la stessa.
      const caso = creaCasuale(SEME + 10 + o.indice * 7 + (o.roccia ? 100 : 0));
      const scala = this.scalaZ(o.z);
      const x = o.x * l;
      const y = this.profondita(o.x, o.z) * a;
      let larghezzaBase;
      this.conVelo(ctx, l, a, densita, o.z, (c) => {
        if (o.roccia) {
          const r = this.dipingiRoccia(c, o, l, a, scala);
          this.cimeRocce[o.indice] = { x: r.x, y: r.y, z: o.z };
          larghezzaBase = r.larghezza;
        } else {
          const misura = o.misura * M * scala;
          dipingiCorallo(c, caso, o.tipo, x, y + 2, misura, o.colore);
          larghezzaBase = misura * (o.tipo === 'cervello' ? 2 : 0.55);
        }
      });
      this.sabbiaAlPiede(ctx, x, y, larghezzaBase, o.z);
    }
  }

  // Dipinge un oggetto su un foglio a parte, poi lo vela d'azzurro tanto più
  // quanto è lontano, e infine lo incolla sullo strato.
  conVelo(ctx, l, a, densita, z, dipingi) {
    const lavoro = this.preparaFoglio(this.appoggio, l, a, densita);
    dipingi(lavoro);
    const velo = 0.42 * Math.pow(1 - z, 1.4);
    if (velo > 0.01) {
      lavoro.globalCompositeOperation = 'source-atop'; // solo dove c'è l'oggetto
      lavoro.fillStyle = `rgba(40, 112, 135, ${velo})`;
      lavoro.fillRect(0, 0, l, a);
      lavoro.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(this.appoggio.foglio, 0, 0, l, a);
  }

  // Un po' di sabbia ammucchiata alla base: l'oggetto sembra "piantato" nel
  // fondo invece che appoggiato sopra. Usa lo stesso colore della sabbia.
  sabbiaAlPiede(ctx, x, y, larghezza, z) {
    if (!larghezza) return;
    const { l, a, densita } = this.misure;
    const rx = larghezza * 0.6;
    const ry = Math.max(2.5, larghezza * 0.07) * (0.7 + z * 0.6);
    // Preparo il mucchietto su un foglio a parte: tre ovali sovrapposti
    // sempre più piccoli, così sfuma ai bordi...
    const lavoro = this.preparaFoglio(this.appoggio, l, a, densita);
    lavoro.fillStyle = this.coloreSabbia;
    for (const [scala, alfa] of [[1, 0.25], [0.75, 0.35], [0.5, 0.45]]) {
      lavoro.globalAlpha = alfa;
      lavoro.beginPath();
      lavoro.ellipse(x, y + ry * 0.5, rx * scala, ry * scala, 0, 0, Math.PI * 2);
      lavoro.fill();
    }
    // ...poi gli do gli stessi strati della sabbia vera (velo e foschia),
    // così si confonde con il fondo invece di sembrare un disco.
    lavoro.globalAlpha = 1;
    lavoro.globalCompositeOperation = 'source-atop';
    lavoro.fillStyle = 'rgba(30, 95, 115, 0.28)';
    lavoro.fillRect(0, 0, l, a);
    lavoro.fillStyle = this.foschiaSabbia;
    lavoro.fillRect(0, 0, l, a);
    lavoro.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.appoggio.foglio, 0, 0, l, a);
  }

  dipingiRoccia(ctx, roccia, l, a, scala) {
    const raggio = roccia.misura * Math.min(l, a * 1.4) * scala;
    const cx = roccia.x * l;
    const base = this.profondita(roccia.x, roccia.z) * a + raggio * 0.15; // un po' affondata
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

    // Restituisce il punto più alto: lì sopra possono stare gli anemoni.
    const cima = Math.min(...punti.map((p) => p.y));
    return { x: cx, y: cima + raggio * 0.12, larghezza: raggio * 2 };
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

  disegnaPrimoPiano(ctx, larghezza, altezza) {
    this.controllaMisure(larghezza, altezza);
    ctx.drawImage(this.primoPiano.foglio, 0, 0, larghezza, altezza);
  }
}
