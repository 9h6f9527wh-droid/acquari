// Raggi di luce che entrano dalla superficie e scendono in diagonale,
// sfumando verso il fondo. Ondeggiano e cambiano intensità piano piano,
// come la luce che passa attraverso l'acqua mossa.
//
// Trucco per la fluidità: i raggi vengono disegnati su un "foglio" piccolo
// (un quarto della vasca) e poi ingranditi. L'ingrandimento ammorbidisce
// i bordi da solo, e disegnare in piccolo costa molto meno all'iPad.

const NUMERO_RAGGI = 7;
const RIDUZIONE = 4;

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export class RaggiDiLuce {
  constructor() {
    // Ogni raggio ha le sue misure e il suo "ritmo", scelti a caso una volta sola.
    // Le posizioni sono in frazioni della vasca (0 = sinistra, 1 = destra),
    // così funzionano qualunque sia la misura dello schermo.
    this.raggi = [];
    for (let i = 0; i < NUMERO_RAGGI; i++) {
      this.raggi.push({
        x: (i + casuale(0.1, 0.9)) / NUMERO_RAGGI,
        larghezzaAlto: casuale(0.02, 0.06),
        larghezzaBasso: casuale(0.08, 0.16),
        lunghezza: casuale(0.6, 0.95), // fin dove arriva, in frazioni dell'altezza
        inclinazione: casuale(0.12, 0.22), // quanto si sposta verso destra scendendo
        intensita: casuale(0.06, 0.13),
        fase: casuale(0, Math.PI * 2),
        velocita: casuale(0.15, 0.4),
      });
    }
    this.tempo = 0;
    this.foglio = document.createElement('canvas');
    this.ctxFoglio = this.foglio.getContext('2d');
  }

  aggiorna(dt) {
    this.tempo += dt;
  }

  disegnaRaggi(ctx, larghezza, altezza) {
    const t = this.tempo;
    ctx.clearRect(0, 0, larghezza, altezza);

    for (const r of this.raggi) {
      // Intensità che "respira" e piccolo dondolio dell'inclinazione.
      const respiro = 0.55 + 0.45 * Math.sin(t * r.velocita + r.fase);
      const alfa = r.intensita * respiro;
      const inclinazione = r.inclinazione + 0.04 * Math.sin(t * r.velocita * 0.7 + r.fase * 2);

      const xAlto = r.x * larghezza;
      const yBasso = r.lunghezza * altezza;
      const xBasso = xAlto + inclinazione * yBasso;
      const metaAlto = (r.larghezzaAlto * larghezza) / 2;
      const metaBasso = (r.larghezzaBasso * larghezza) / 2;

      // La luce è più forte in superficie e svanisce scendendo.
      const sfumatura = ctx.createLinearGradient(0, 0, 0, yBasso);
      // Tinta calda e verdina, come la luce del sole filtrata dall'acqua.
      sfumatura.addColorStop(0, `rgba(235, 255, 215, ${alfa})`);
      sfumatura.addColorStop(0.6, `rgba(180, 240, 215, ${alfa * 0.4})`);
      sfumatura.addColorStop(1, 'rgba(160, 230, 215, 0)');

      ctx.fillStyle = sfumatura;
      ctx.beginPath();
      ctx.moveTo(xAlto - metaAlto, 0);
      ctx.lineTo(xAlto + metaAlto, 0);
      ctx.lineTo(xBasso + metaBasso, yBasso);
      ctx.lineTo(xBasso - metaBasso, yBasso);
      ctx.closePath();
      ctx.fill();
    }

    // Un leggero bagliore appena sotto la superficie.
    const bagliore = ctx.createLinearGradient(0, 0, 0, altezza * 0.12);
    bagliore.addColorStop(0, 'rgba(220, 250, 255, 0.18)');
    bagliore.addColorStop(1, 'rgba(220, 250, 255, 0)');
    ctx.fillStyle = bagliore;
    ctx.fillRect(0, 0, larghezza, altezza * 0.12);
  }

  disegna(ctx, larghezza, altezza) {
    const l = Math.max(1, Math.round(larghezza / RIDUZIONE));
    const a = Math.max(1, Math.round(altezza / RIDUZIONE));
    if (this.foglio.width !== l || this.foglio.height !== a) {
      this.foglio.width = l;
      this.foglio.height = a;
    }

    this.disegnaRaggi(this.ctxFoglio, l, a);

    // "lighter" somma la luce all'acqua sotto: i raggi sembrano brillare.
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.foglio, 0, 0, larghezza, altezza);
    ctx.globalCompositeOperation = 'source-over';
  }
}
