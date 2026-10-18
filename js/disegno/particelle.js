// Particelle sospese: minuscoli puntini di luce che galleggiano nell'acqua
// (come plancton o polvere illuminata). Sono il tocco "d'atmosfera"
// tipico dei giochi dipinti.
//
// Ogni particella ha una profondità: quelle lontane sono piccole, fioche
// e lente; quelle vicine più grandi, luminose e veloci.

const NUMERO_PARTICELLE = 70;

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export class Particelle {
  constructor() {
    this.particelle = [];
    for (let i = 0; i < NUMERO_PARTICELLE; i++) {
      const vicinanza = Math.random(); // 0 = lontana, 1 = vicina
      this.particelle.push({
        // Posizione in frazioni della vasca: funziona con ogni schermo.
        x: Math.random(),
        y: Math.random(),
        vicinanza,
        raggio: 0.6 + vicinanza * 1.6,
        luce: 0.25 + vicinanza * 0.5,
        // Deriva lenta, con una corrente generale verso destra.
        vx: casuale(0.002, 0.008) * (0.4 + vicinanza),
        vy: casuale(-0.004, 0.002) * (0.4 + vicinanza),
        fase: casuale(0, Math.PI * 2),
        ritmo: casuale(0.5, 1.5),
      });
    }
    this.tempo = 0;
  }

  aggiorna(dt) {
    this.tempo += dt;
    for (const p of this.particelle) {
      // Piccolo dondolio, come se l'acqua le spingesse avanti e indietro.
      p.x += (p.vx + Math.sin(this.tempo * 0.4 + p.fase) * 0.004) * dt;
      p.y += p.vy * dt;
      // Se escono da un lato, rientrano da quello opposto.
      if (p.x > 1.02) p.x = -0.02;
      if (p.x < -0.02) p.x = 1.02;
      if (p.y > 1.02) p.y = -0.02;
      if (p.y < -0.02) p.y = 1.02;
    }
  }

  disegna(ctx, larghezza, altezza) {
    // "lighter" somma la luce al colore sotto: i puntini sembrano brillare.
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particelle) {
      // Scintillio: la luminosità va su e giù piano piano.
      const scintillio = 0.6 + 0.4 * Math.sin(this.tempo * p.ritmo + p.fase);
      // Più in profondità, meno luce arriva.
      const alfa = p.luce * scintillio * (1 - p.y * 0.6);
      const x = p.x * larghezza;
      const y = p.y * altezza;

      // Alone morbido + nucleo luminoso.
      ctx.fillStyle = `rgba(170, 235, 220, ${alfa * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, p.raggio * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 255, 240, ${alfa})`;
      ctx.beginPath();
      ctx.arc(x, y, p.raggio, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
