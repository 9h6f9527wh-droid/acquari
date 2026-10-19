// Il banco lontano: ogni tanto un grande banco di pesci attraversa la vasca
// in lontananza, come sagome velate nella foschia ("vedo e non vedo").
//
// Come funziona:
//  - il banco entra da un lato, attraversa lo schermo e esce dall'altro;
//  - è una nuvola di pesciolini attorno a un centro: la nuvola si stira,
//    si allarga e ondeggia mentre avanza, come fanno i banchi veri;
//  - ogni pesciolino ha il suo piccolo ondeggiare e la coda che batte;
//  - sono solo sagome (niente dettagli): sono lontani e quasi persi nell'acqua.

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

const QUANTI = 60;

export class BancoLontano {
  constructor(fondale) {
    this.fondale = fondale;
    this.attivo = null;
    this.attesa = casuale(4, 8); // la prima volta arriva presto
  }

  parti(larghezza, altezza) {
    const verso = Math.random() < 0.5 ? 1 : -1;
    const M = this.fondale.misuraBase(larghezza, altezza);
    const largo = M * casuale(0.09, 0.13); // quanto è grande la nuvola
    this.attivo = {
      verso,
      x: verso > 0 ? -largo * 1.5 : larghezza + largo * 1.5,
      y: altezza * casuale(0.25, 0.5),
      velocita: M * casuale(0.06, 0.09),
      largo,
      tempo: 0,
      pesci: Array.from({ length: QUANTI }, () => {
        // Posizione nella nuvola (più fitta al centro), misura e ritmo.
        const angolo = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        return {
          u: Math.cos(angolo) * r,
          v: Math.sin(angolo) * r,
          misura: M * casuale(0.015, 0.021),
          fase: Math.random() * Math.PI * 2,
          ritmo: casuale(0.6, 1.1),
        };
      }),
    };
  }

  aggiorna(dt, larghezza, altezza) {
    if (!this.attivo) {
      this.attesa -= dt;
      if (this.attesa <= 0) this.parti(larghezza, altezza);
      return;
    }
    const b = this.attivo;
    b.tempo += dt;
    b.x += b.verso * b.velocita * dt;
    // Sale e scende piano, come un nastro che ondeggia.
    b.y += Math.sin(b.tempo * 0.35) * altezza * 0.012 * dt;
    // Uscito dall'altro lato: tornerà fra un po'.
    const fuori = b.verso > 0 ? b.x > larghezza + b.largo * 1.6 : b.x < -b.largo * 1.6;
    if (fuori) {
      this.attivo = null;
      this.attesa = casuale(25, 60);
    }
  }

  disegna(ctx) {
    const b = this.attivo;
    if (!b) return;
    const t = b.tempo;
    // La nuvola cambia forma: si stira in lunghezza e si schiaccia, piano piano.
    const stira = 1.5 + 0.35 * Math.sin(t * 0.4);
    const schiaccia = 0.55 + 0.2 * Math.sin(t * 0.33 + 1);
    // Colore della sagoma: blu scuro, molto velato dall'acqua.
    ctx.fillStyle = 'rgba(18, 62, 86, 0.5)';
    for (const p of b.pesci) {
      // Ogni pesciolino ondeggia un po' per conto suo dentro la nuvola,
      // e la nuvola si "piega" come un'onda (chi sta davanti va un po' su o giù).
      const onda = Math.sin(t * 0.8 + p.u * 2.2) * b.largo * 0.22;
      const x = b.x + (p.u * stira + Math.sin(t * p.ritmo + p.fase) * 0.08) * b.largo;
      const y = b.y + (p.v * schiaccia + Math.cos(t * p.ritmo * 0.8 + p.fase) * 0.08) * b.largo + onda;
      const m = p.misura;
      const coda = Math.sin(t * 9 * p.ritmo + p.fase) * m * 0.18;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(b.verso, 1);
      // Corpo affusolato e coda a V.
      ctx.beginPath();
      ctx.moveTo(m * 0.55, 0);
      ctx.quadraticCurveTo(m * 0.1, -m * 0.28, -m * 0.35, -m * 0.06);
      ctx.lineTo(-m * 0.6, -m * 0.26 + coda);
      ctx.lineTo(-m * 0.5, coda * 0.5);
      ctx.lineTo(-m * 0.6, m * 0.26 + coda);
      ctx.lineTo(-m * 0.35, m * 0.06);
      ctx.quadraticCurveTo(m * 0.1, m * 0.28, m * 0.55, 0);
      ctx.fill();
      ctx.restore();
    }
  }
}
