// Piante e animali "morbidi" che ondeggiano con la corrente.
//
// Tutti sono costruiti con lo stesso mattoncino: una "spina dorsale" di
// segmenti che parte da un punto fermo. La base non si muove, la punta si
// piega di più, e un'onda sale lungo la spina, come mossa dall'acqua.
//
// Tipi:
//  - "nastro":  ciuffo di foglie lunghe e sottili (erba marina)
//  - "spada":   foglie larghe a lancia, aperte a ventaglio
//  - "kelp":    alga gigante: stelo lungo con foglie alternate e galleggianti
//  - "piuma":   alga a piuma: steli con tante foglioline ai lati
//  - "anemone": colonna con una corona di tentacoli dalle punte luminose
//
// Strati:
//  - LONTANE: sagome velate sulle colline in fondo;
//  - VICINE: sulla sabbia, ognuna con la sua profondità "z" (vedi fondale.js).
//    Quelle con z piccolo stanno dietro lo scoglio, sono più piccole e velate;
//    quelle con z grande stanno davanti, più grandi e dai colori pieni.

import { creaCasuale } from '../util/casuale.js';
import { Z_SCOGLIO } from './fondale.js';

const VELO = 'hsla(188, 32%, 38%, 0.42)';

// Colore visto attraverso l'acqua: più è lontano (z piccolo), più si avvicina
// all'azzurro dell'acqua. Stessa regola usata per rocce e coralli.
function velaColore(c, z) {
  const f = 0.42 * Math.pow(1 - z, 1.4);
  return { h: c.h + (190 - c.h) * f * 0.5, s: c.s * (1 - f * 0.7), l: c.l + (42 - c.l) * f };
}

function hsl(c, piuLuce = 0, alfa = 1) {
  return `hsla(${c.h}, ${c.s}%, ${Math.min(92, c.l + piuLuce)}%, ${alfa})`;
}

// Calcola i punti della spina dorsale. Ogni punto ha posizione e angolo.
function spina(x, y, f, tempo, segmenti) {
  const punti = [];
  const passo = f.lunghezza / segmenti;
  for (let i = 0; i <= segmenti; i++) {
    const s = i / segmenti; // 0 alla base, 1 in punta
    // Onda che sale lungo la spina, più forte verso la punta.
    const onda = Math.sin(tempo * f.ritmo * 2 + f.fase - s * 2.2) * f.forza * s * s;
    // Corrente leggera che spinge tutto un po' a destra.
    const corrente = f.corrente * s * (0.6 + 0.4 * Math.sin(tempo * 0.3));
    const angolo = f.angolo + f.curvatura * s + onda + corrente;
    punti.push({ x, y, angolo, s });
    x += Math.sin(angolo) * passo;
    y -= Math.cos(angolo) * passo;
  }
  return punti;
}

// Riempie una striscia attorno alla spina. "larghezza(s)" dà la larghezza in ogni punto.
function striscia(ctx, punti, larghezza) {
  ctx.beginPath();
  for (let i = 0; i < punti.length; i++) {
    const p = punti[i];
    const w = larghezza(p.s) / 2;
    const px = p.x - Math.cos(p.angolo) * w;
    const py = p.y - Math.sin(p.angolo) * w;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  for (let i = punti.length - 1; i >= 0; i--) {
    const p = punti[i];
    const w = larghezza(p.s) / 2;
    ctx.lineTo(p.x + Math.cos(p.angolo) * w, p.y + Math.sin(p.angolo) * w);
  }
  ctx.closePath();
}

function linea(ctx, punti, fino = punti.length) {
  ctx.beginPath();
  ctx.moveTo(punti[0].x, punti[0].y);
  for (let i = 1; i < fino; i++) ctx.lineTo(punti[i].x, punti[i].y);
}

// ---------- Come si costruisce ogni tipo (una volta sola) ----------

function creaCiuffo(caso, tipo, altezza) {
  const quante = tipo === 'nastro' ? caso.intero(6, 10) : caso.intero(5, 8);
  const ventaglio = tipo === 'spada' ? 0.75 : 0.35;
  return Array.from({ length: quante }, (_, i) => {
    const apertura = (i / (quante - 1)) * 2 - 1; // da -1 a 1
    return {
      angolo: apertura * ventaglio + caso.tra(-0.08, 0.08),
      curvatura: apertura * caso.tra(0.2, 0.6) + caso.tra(-0.15, 0.15),
      lunghezza: altezza * (1 - Math.abs(apertura) * (tipo === 'spada' ? 0.35 : 0.25)) * caso.tra(0.8, 1.1),
      larghezza: tipo === 'spada' ? caso.tra(0.11, 0.15) : caso.tra(0.025, 0.035),
      luce: caso.tra(-7, 7),
      fase: caso.tra(0, Math.PI * 2),
      ritmo: caso.tra(0.5, 0.8),
      forza: tipo === 'nastro' ? caso.tra(0.18, 0.26) : caso.tra(0.08, 0.12),
      corrente: 0.12,
    };
  });
}

function creaKelp(caso, altezza) {
  return {
    angolo: caso.tra(-0.1, 0.1),
    curvatura: caso.tra(-0.2, 0.2),
    lunghezza: altezza,
    fase: caso.tra(0, 6.3),
    ritmo: caso.tra(0.35, 0.5),
    forza: caso.tra(0.25, 0.35),
    corrente: 0.18,
    foglie: Array.from({ length: 12 }, (_, i) => ({
      lato: i % 2 === 0 ? 1 : -1,
      lunghezza: caso.tra(0.75, 1.15),
      fase: caso.tra(0, 6.3),
    })),
  };
}

function creaPiuma(caso, altezza) {
  const quanti = caso.intero(3, 4);
  return Array.from({ length: quanti }, (_, i) => ({
    angolo: ((i / (quanti - 1)) * 2 - 1) * 0.35 + caso.tra(-0.08, 0.08),
    curvatura: caso.tra(-0.3, 0.3),
    lunghezza: altezza * caso.tra(0.7, 1),
    fase: caso.tra(0, 6.3),
    ritmo: caso.tra(0.5, 0.7),
    forza: caso.tra(0.15, 0.22),
    corrente: 0.1,
  }));
}

function creaAnemone(caso, misura) {
  const quanti = 26;
  const tentacoli = Array.from({ length: quanti }, (_, i) => {
    const apertura = (i / (quanti - 1)) * 2 - 1;
    return {
      apertura,
      angolo: apertura * 1.15 + caso.tra(-0.1, 0.1),
      curvatura: apertura * caso.tra(0.1, 0.5),
      lunghezza: misura * caso.tra(0.65, 1) * (1 - Math.abs(apertura) * 0.25),
      // L'onda attraversa la corona: i tentacoli si muovono uno dopo l'altro.
      fase: i * 0.35 + caso.tra(-0.3, 0.3),
      ritmo: caso.tra(0.7, 0.9),
      forza: caso.tra(0.3, 0.45),
      corrente: 0.15,
      luce: caso.tra(-6, 6),
    };
  });
  // Prima quelli esterni (dietro), poi quelli centrali (davanti).
  tentacoli.sort((a, b) => Math.abs(b.apertura) - Math.abs(a.apertura));
  return tentacoli;
}

// ---------- La classe che gestisce tutte le piante ----------

export class Piante {
  constructor(fondale) {
    this.fondale = fondale;
    this.tempo = 0;
    const caso = creaCasuale(77);

    // Disposizione delle piante vicine, con la loro profondità z.
    // "roccia" = sta sopra quella roccia (indice nella lista del fondale);
    // "scoglio" = sta in cima al grande scoglio centrale.
    const vicine = [
      { tipo: 'kelp', x: 0.035, z: 0.15, altezza: 0.62, colore: { h: 42, s: 50, l: 36 } },
      { tipo: 'kelp', x: 0.965, z: 0.1, altezza: 0.7, colore: { h: 48, s: 48, l: 38 } },
      { tipo: 'piuma', x: 0.35, z: 0.2, altezza: 0.25, colore: { h: 110, s: 60, l: 42 } },
      { tipo: 'nastro', x: 0.62, z: 0.25, altezza: 0.28, colore: { h: 95, s: 45, l: 40 } },
      { tipo: 'piuma', x: 0.91, z: 0.3, altezza: 0.21, colore: { h: 135, s: 55, l: 40 } },
      { tipo: 'anemone', scoglio: true, misura: 0.07, colore: { h: 150, s: 45, l: 50 }, punte: { h: 290, s: 80, l: 72 } },
      { tipo: 'anemone', roccia: 0, misura: 0.1, colore: { h: 28, s: 70, l: 58 }, punte: { h: 45, s: 95, l: 75 } },
      { tipo: 'anemone', roccia: 2, misura: 0.085, colore: { h: 318, s: 55, l: 62 }, punte: { h: 300, s: 90, l: 80 } },
      { tipo: 'spada', x: 0.585, z: 0.7, altezza: 0.13, colore: { h: 120, s: 40, l: 32 } },
      { tipo: 'nastro', x: 0.075, z: 0.85, altezza: 0.3, colore: { h: 105, s: 45, l: 38 } },
      { tipo: 'nastro', x: 0.79, z: 0.95, altezza: 0.15, colore: { h: 100, s: 50, l: 40 } },
    ];
    const lontane = [
      { tipo: 'kelp', x: 0.08, altezza: 0.5 },
      { tipo: 'nastro', x: 0.24, altezza: 0.3 },
      { tipo: 'kelp', x: 0.36, altezza: 0.45 },
      { tipo: 'nastro', x: 0.55, altezza: 0.32 },
      { tipo: 'kelp', x: 0.69, altezza: 0.55 },
      { tipo: 'piuma', x: 0.83, altezza: 0.22 },
      { tipo: 'nastro', x: 0.93, altezza: 0.28 },
    ];

    const crea = (p, lontana) => {
      const pianta = { ...p, lontana, x: p.x !== undefined ? p.x + caso.tra(-0.01, 0.01) : undefined };
      // Profondità: quella della roccia o dello scoglio su cui sta, se ce l'ha.
      if (p.scoglio) pianta.z = Z_SCOGLIO;
      else if (p.roccia !== undefined) pianta.z = fondale.rocce[p.roccia].z;
      if (!lontana) {
        pianta.colore = velaColore(p.colore, pianta.z);
        if (p.punte) pianta.punte = velaColore(p.punte, pianta.z);
      }
      if (p.tipo === 'nastro' || p.tipo === 'spada') pianta.foglie = creaCiuffo(caso, p.tipo, p.altezza);
      if (p.tipo === 'kelp') pianta.kelp = creaKelp(caso, p.altezza);
      if (p.tipo === 'piuma') pianta.steli = creaPiuma(caso, p.altezza);
      if (p.tipo === 'anemone') pianta.tentacoli = creaAnemone(caso, p.misura);
      return pianta;
    };
    // Dal più lontano al più vicino.
    this.vicine = vicine.map((p) => crea(p, false)).sort((p, q) => p.z - q.z);
    this.lontane = lontane.map((p) => crea(p, true));
  }

  aggiorna(dt) {
    this.tempo += dt;
  }

  // ---------- Disegno di ogni tipo ----------

  // Le misure delle piante sono in frazioni dell'altezza: "scala" le converte in punti.
  conScala(f, scala) {
    return { ...f, lunghezza: f.lunghezza * scala };
  }

  disegnaCiuffo(ctx, p, x, y, scala) {
    for (const foglia of p.foglie) {
      const f = this.conScala(foglia, scala);
      const punti = spina(x, y, f, this.tempo, 9);
      const max = foglia.larghezza * f.lunghezza;
      const larghezza = p.tipo === 'spada'
        ? (s) => Math.max(0.4, max * Math.sin(Math.PI * Math.pow(s, 0.75)))
        : (s) => Math.max(0.4, max * (s < 0.8 ? 1 - s * 0.3 : (1 - s) * 3.8));
      striscia(ctx, punti, larghezza);
      if (p.lontana) {
        ctx.fillStyle = VELO;
        ctx.fill();
        continue;
      }
      ctx.fillStyle = p.sfumatura;
      ctx.fill();
      if (foglia.luce > 0) {
        ctx.fillStyle = `rgba(230, 255, 200, ${foglia.luce * 0.012})`;
        ctx.fill();
      }
      // Nervatura centrale chiara.
      linea(ctx, punti, punti.length - 1);
      ctx.lineWidth = Math.max(0.8, max * 0.12);
      ctx.strokeStyle = hsl(p.colore, 28, 0.45);
      ctx.stroke();
    }
  }

  disegnaKelp(ctx, p, x, y, scala) {
    const k = this.conScala(p.kelp, scala);
    const punti = spina(x, y, k, this.tempo, 14);
    const c = p.colore;

    // Stelo.
    linea(ctx, punti);
    ctx.lineWidth = p.lontana ? 2.5 : 3;
    ctx.strokeStyle = p.lontana ? VELO : hsl(c, -10);
    ctx.stroke();

    // Foglie alternate lungo lo stelo, ognuna con il suo galleggiante.
    const lunghezzaFoglia = k.lunghezza * 0.16;
    p.kelp.foglie.forEach((foglia, i) => {
      const nodo = punti[i + 2];
      if (!nodo) return;
      const piccola = 1 - nodo.s * 0.45; // verso la cima le foglie sono più piccole
      const f = {
        angolo: nodo.angolo + foglia.lato * (1.0 - nodo.s * 0.4),
        curvatura: -foglia.lato * 0.5,
        lunghezza: lunghezzaFoglia * foglia.lunghezza * piccola,
        fase: foglia.fase,
        ritmo: 0.8,
        forza: 0.35,
        corrente: 0.1,
      };
      const fp = spina(nodo.x, nodo.y, f, this.tempo, 5);
      const max = f.lunghezza * 0.32;
      // Foglia con il bordo un po' ondulato.
      striscia(ctx, fp, (s) => Math.max(0.5, max * Math.sin(Math.PI * Math.pow(s, 0.7)) * (1 + 0.12 * Math.sin(s * 18))));
      if (p.lontana) {
        ctx.fillStyle = VELO;
        ctx.fill();
        return;
      }
      ctx.fillStyle = hsl(c, foglia.lato * 4 + nodo.s * 10);
      ctx.fill();
      linea(ctx, fp, fp.length - 1);
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = hsl(c, 25, 0.5);
      ctx.stroke();
      // Galleggiante: una pallina dorata con un riflesso.
      const g = fp[1];
      ctx.fillStyle = hsl({ h: c.h + 8, s: c.s + 10, l: c.l }, 18);
      ctx.beginPath();
      ctx.ellipse(g.x, g.y, 2.6, 3.4, g.angolo, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 250, 220, 0.6)';
      ctx.beginPath();
      ctx.arc(g.x - 0.8, g.y - 1, 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  disegnaPiuma(ctx, p, x, y, scala) {
    ctx.lineCap = 'round';
    for (const stelo of p.steli) {
      const f = this.conScala(stelo, scala);
      const punti = spina(x, y, f, this.tempo, 12);
      const c = p.colore;
      linea(ctx, punti);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = p.lontana ? VELO : hsl(c, -8);
      ctx.stroke();

      // Foglioline su entrambi i lati, più corte verso la punta.
      ctx.lineWidth = p.lontana ? 1.6 : 2.2;
      for (let i = 1; i < punti.length; i++) {
        const n = punti[i];
        const corta = f.lunghezza * 0.11 * (1 - n.s * 0.75);
        for (const lato of [-1, 1]) {
          const ang = n.angolo + lato * 1.05 - n.s * lato * 0.3;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.quadraticCurveTo(
            n.x + Math.sin(ang) * corta * 0.6, n.y - Math.cos(ang) * corta * 0.6,
            n.x + Math.sin(ang - lato * 0.35) * corta, n.y - Math.cos(ang - lato * 0.35) * corta,
          );
          ctx.strokeStyle = p.lontana ? VELO : hsl(c, 6 + n.s * 16 + (lato > 0 ? 4 : 0));
          ctx.stroke();
        }
      }
    }
  }

  disegnaAnemone(ctx, p, x, y, scala) {
    const m = p.misura * scala;
    const c = p.colore;

    // Colonna: il "piede" dell'anemone.
    const colonna = ctx.createLinearGradient(x - m * 0.25, 0, x + m * 0.25, 0);
    colonna.addColorStop(0, hsl(c, -20));
    colonna.addColorStop(0.4, hsl(c, 5));
    colonna.addColorStop(1, hsl(c, -25));
    ctx.fillStyle = colonna;
    ctx.beginPath();
    ctx.moveTo(x - m * 0.22, y + 2);
    ctx.quadraticCurveTo(x - m * 0.12, y - m * 0.12, x - m * 0.28, y - m * 0.24);
    ctx.lineTo(x + m * 0.28, y - m * 0.24);
    ctx.quadraticCurveTo(x + m * 0.12, y - m * 0.12, x + m * 0.22, y + 2);
    ctx.closePath();
    ctx.fill();

    // Tentacoli: strisce che si assottigliano, con la punta luminosa.
    const cimaY = y - m * 0.22;
    const larghezzaBase = m * 0.07;
    const punte = [];
    for (const t of p.tentacoli) {
      const f = this.conScala(t, scala);
      const bx = x + t.apertura * m * 0.26;
      const punti = spina(bx, cimaY, f, this.tempo, 7);
      striscia(ctx, punti, (s) => Math.max(0.6, larghezzaBase * (1 - s * 0.6)));
      // Quelli esterni (dietro) sono un po' più scuri.
      ctx.fillStyle = hsl(c, t.luce - Math.abs(t.apertura) * 14);
      ctx.fill();
      punte.push(punti[punti.length - 1]);
    }
    // Punte che brillano.
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = hsl(p.punte, 0, 0.55);
    for (const q of punte) {
      ctx.beginPath();
      ctx.arc(q.x, q.y, larghezzaBase * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- Strati ----------

  disegnaStrato(ctx, piante, larghezza, altezza) {
    const fondale = this.fondale;
    for (const p of piante) {
      let x;
      let y;
      if (p.scoglio) {
        x = fondale.scoglio.appoggio.x;
        y = fondale.scoglio.appoggio.y;
      } else if (p.roccia !== undefined) {
        const cima = fondale.cimeRocce[p.roccia];
        x = cima.x;
        y = cima.y;
      } else if (p.lontana) {
        x = p.x * larghezza;
        y = fondale.lineaLontana(p.x) * altezza + 4;
      } else {
        x = p.x * larghezza;
        y = fondale.profondita(p.x, p.z) * altezza + 3;
      }
      // Le misure sono in frazioni dell'altezza; più è vicina, più è grande.
      const scalaZ = p.lontana ? 1 : fondale.scalaZ(p.z);
      const scala = altezza * scalaZ;

      if (!p.lontana && (p.tipo === 'nastro' || p.tipo === 'spada')) {
        // Ciuffi: scuri alla base e chiari in punta.
        const cima = y - p.altezza * scala;
        p.sfumatura = ctx.createLinearGradient(0, y, 0, cima);
        p.sfumatura.addColorStop(0, hsl({ ...p.colore, h: p.colore.h + 10 }, -p.colore.l * 0.45));
        p.sfumatura.addColorStop(0.5, hsl(p.colore));
        p.sfumatura.addColorStop(1, hsl({ ...p.colore, h: p.colore.h - 12, s: p.colore.s + 10 }, 14));
      }

      if (p.tipo === 'nastro' || p.tipo === 'spada') this.disegnaCiuffo(ctx, p, x, y, scala);
      else if (p.tipo === 'kelp') this.disegnaKelp(ctx, p, x, y, scala);
      else if (p.tipo === 'piuma') this.disegnaPiuma(ctx, p, x, y, scala);
      else if (p.tipo === 'anemone') this.disegnaAnemone(ctx, p, x, y, fondale.misuraBase(larghezza, altezza) * scalaZ);
    }
  }

  disegnaLontane(ctx, larghezza, altezza) {
    this.disegnaStrato(ctx, this.lontane, larghezza, altezza);
  }

  // Piante sulla sabbia dietro lo scoglio.
  disegnaDietro(ctx, larghezza, altezza) {
    this.disegnaStrato(ctx, this.vicine.filter((p) => p.z < Z_SCOGLIO), larghezza, altezza);
  }

  // Piante in cima allo scoglio.
  disegnaSulloScoglio(ctx, larghezza, altezza) {
    this.disegnaStrato(ctx, this.vicine.filter((p) => p.scoglio), larghezza, altezza);
  }

  // Piante davanti allo scoglio (anche quelle sopra le rocce in primo piano).
  disegnaDavanti(ctx, larghezza, altezza) {
    this.disegnaStrato(ctx, this.vicine.filter((p) => p.z > Z_SCOGLIO), larghezza, altezza);
  }
}
