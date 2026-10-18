// Raggi di luce che entrano dalla superficie e scendono in diagonale,
// sfumando verso il fondo. Ondeggiano e cambiano intensità piano piano,
// come la luce che passa attraverso l'acqua mossa.
//
// Bordi morbidi: ogni raggio è fatto di tre strati sovrapposti, dal più largo
// e tenue al più stretto. Sommandosi, il centro è luminoso e i bordi sfumano.
//
// Trucco per la fluidità: la forma dei raggi non cambia, quindi ognuno viene
// dipinto UNA volta sola su un suo foglietto. A ogni fotogramma cambiamo solo
// quanto è luminoso e lo spostiamo di poco: costa molto meno all'iPad.

const NUMERO_RAGGI = 7;
const STRATI = [1.0, 0.7, 0.4];

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
        intensita: casuale(0.09, 0.15),
        fase: casuale(0, Math.PI * 2),
        velocita: casuale(0.15, 0.4),
        foglio: document.createElement('canvas'),
      });
    }
    this.tempo = 0;
    this.larghezza = 0;
    this.altezza = 0;
  }

  aggiorna(dt) {
    this.tempo += dt;
  }

  // Dipinge ogni raggio sul suo foglietto, alla massima intensità.
  prepara(larghezza, altezza) {
    const densita = Math.min(window.devicePixelRatio || 1, 2);
    for (const r of this.raggi) {
      const yBasso = r.lunghezza * altezza;
      const metaAlto = (r.larghezzaAlto * larghezza) / 2;
      const metaBasso = (r.larghezzaBasso * larghezza) / 2;
      const spostamento = r.inclinazione * yBasso;

      // Misure del foglietto: quanto basta a contenere il raggio.
      r.sinistra = r.x * larghezza - metaBasso;
      r.larghezzaFoglio = Math.ceil(metaBasso * 2 + spostamento);
      r.altezzaFoglio = Math.ceil(yBasso);
      r.foglio.width = Math.round(r.larghezzaFoglio * densita);
      r.foglio.height = Math.round(r.altezzaFoglio * densita);

      const ctx = r.foglio.getContext('2d');
      ctx.setTransform(densita, 0, 0, densita, 0, 0);
      ctx.clearRect(0, 0, r.larghezzaFoglio, r.altezzaFoglio);

      // La luce è più forte in superficie e svanisce scendendo.
      // Tinta calda e verdina, come la luce del sole filtrata dall'acqua.
      const sfumatura = ctx.createLinearGradient(0, 0, 0, yBasso);
      sfumatura.addColorStop(0, 'rgba(235, 255, 215, 1)');
      sfumatura.addColorStop(0.6, 'rgba(180, 240, 215, 0.4)');
      sfumatura.addColorStop(1, 'rgba(160, 230, 215, 0)');
      ctx.fillStyle = sfumatura;
      ctx.globalAlpha = 1 / STRATI.length;

      const xAlto = metaBasso; // centro del raggio in cima, nel foglietto
      const xBasso = xAlto + spostamento;
      for (const scala of STRATI) {
        ctx.beginPath();
        ctx.moveTo(xAlto - metaAlto * scala, 0);
        ctx.lineTo(xAlto + metaAlto * scala, 0);
        ctx.lineTo(xBasso + metaBasso * scala, yBasso);
        ctx.lineTo(xBasso - metaBasso * scala, yBasso);
        ctx.closePath();
        ctx.fill();
      }
    }
    this.larghezza = larghezza;
    this.altezza = altezza;
  }

  disegna(ctx, larghezza, altezza) {
    if (larghezza !== this.larghezza || altezza !== this.altezza) this.prepara(larghezza, altezza);
    const t = this.tempo;

    // "lighter" somma la luce all'acqua sotto: i raggi sembrano brillare.
    ctx.globalCompositeOperation = 'lighter';
    for (const r of this.raggi) {
      // Intensità che "respira" e un piccolo dondolio a destra e sinistra.
      const respiro = 0.65 + 0.35 * Math.sin(t * r.velocita + r.fase);
      const dondolio = Math.sin(t * r.velocita * 0.7 + r.fase * 2) * larghezza * 0.01;
      ctx.globalAlpha = r.intensita * respiro;
      ctx.drawImage(r.foglio, Math.round(r.sinistra + dondolio), 0, r.larghezzaFoglio, r.altezzaFoglio);
    }
    ctx.globalAlpha = 1;

    // Un leggero bagliore appena sotto la superficie.
    const bagliore = ctx.createLinearGradient(0, 0, 0, altezza * 0.12);
    bagliore.addColorStop(0, 'rgba(220, 250, 255, 0.18)');
    bagliore.addColorStop(1, 'rgba(220, 250, 255, 0)');
    ctx.fillStyle = bagliore;
    ctx.fillRect(0, 0, larghezza, altezza * 0.12);
    ctx.globalCompositeOperation = 'source-over';
  }
}
