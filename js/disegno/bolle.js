// Bolle d'aria: escono da un punto del fondale (come da un aeratore),
// salgono oscillando a destra e sinistra e scompaiono in superficie.
// Ogni tanto ne sale anche qualcuna "solitaria" da un punto a caso.

const MAX_BOLLE = 80; // limite di sicurezza per non appesantire l'iPad

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export class Bolle {
  constructor() {
    this.bolle = [];
    this.attesaProssima = 0; // secondi alla prossima bolla dell'aeratore
    this.attesaSolitaria = casuale(1, 3);
  }

  creaBolla(x, y, piccola) {
    if (this.bolle.length >= MAX_BOLLE) return;
    const raggio = piccola ? casuale(1.2, 2.5) : casuale(1.5, 5.5);
    this.bolle.push({
      x,
      y,
      xPartenza: x,
      raggio,
      // Le bolle grandi salgono più in fretta.
      velocita: 35 + raggio * 12 + casuale(-8, 8),
      ampiezza: casuale(2, 7), // quanto oscilla di lato
      frequenza: casuale(1.5, 3.5),
      fase: casuale(0, Math.PI * 2),
      eta: 0,
    });
  }

  // "fondale" ci dice dov'è la sabbia e dove sta l'aeratore.
  aggiorna(dt, larghezza, altezza, fondale) {
    // Aeratore: bolle a intervalli irregolari, a volte a "grappolo".
    this.attesaProssima -= dt;
    if (this.attesaProssima <= 0) {
      const quante = Math.random() < 0.25 ? 3 : 1;
      for (let i = 0; i < quante; i++) {
        const { x, z } = fondale.aeratore;
        this.creaBolla(
          x * larghezza + casuale(-4, 4),
          fondale.profondita(x, z) * altezza + i * 8,
          false,
        );
      }
      this.attesaProssima = casuale(0.12, 0.5);
    }

    // Bolle solitarie dal fondale.
    this.attesaSolitaria -= dt;
    if (this.attesaSolitaria <= 0) {
      const x = casuale(0.05, 0.95);
      this.creaBolla(x * larghezza, fondale.profondita(x, Math.random()) * altezza, true);
      this.attesaSolitaria = casuale(1.5, 4);
    }

    // Movimento: su in verticale, ondeggiando di lato.
    for (const b of this.bolle) {
      b.eta += dt;
      b.y -= b.velocita * dt;
      b.x = b.xPartenza + Math.sin(b.eta * b.frequenza + b.fase) * b.ampiezza;
    }

    // Togliamo quelle arrivate in superficie (o uscite se l'iPad è stato ruotato).
    this.bolle = this.bolle.filter((b) => b.y > -b.raggio && b.x < larghezza + 10);
  }

  // Stile "dipinto": bordo morbido color acqua, una lunetta di luce
  // in alto e un riflesso brillante, invece di un contorno bianco netto.
  disegna(ctx) {
    for (const b of this.bolle) {
      const r = b.raggio;

      // Corpo: velo trasparente con bordo tenue.
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(170, 235, 225, 0.12)';
      ctx.fill();
      ctx.lineWidth = Math.max(0.8, r * 0.18);
      ctx.strokeStyle = 'rgba(190, 245, 235, 0.35)';
      ctx.stroke();

      // Lunetta di luce sul lato in alto.
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 0.72, Math.PI * 1.1, Math.PI * 1.7);
      ctx.lineWidth = Math.max(0.6, r * 0.22);
      ctx.strokeStyle = 'rgba(235, 255, 245, 0.55)';
      ctx.stroke();

      // Riflesso brillante.
      ctx.beginPath();
      ctx.arc(b.x - r * 0.38, b.y - r * 0.38, Math.max(0.6, r * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 250, 0.85)';
      ctx.fill();
    }
  }
}
