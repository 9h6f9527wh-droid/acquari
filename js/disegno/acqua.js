// Disegna l'acqua della vasca in stile "dipinto": una sfumatura dal turchese
// della superficie al blu-indaco del fondo, un alone di luce in alto
// e i bordi un po' più scuri (vignettatura), che danno profondità.
//
// Lo sfondo non si muove, quindi lo dipingiamo una volta sola su un foglio
// a parte e poi lo "incolliamo" a ogni fotogramma: molto più leggero.

export class Acqua {
  constructor() {
    this.foglio = document.createElement('canvas');
    this.ctxFoglio = this.foglio.getContext('2d');
    this.larghezza = 0;
    this.altezza = 0;
  }

  dipingi(larghezza, altezza) {
    // Stessa risoluzione dello schermo: così "incollarlo" costa pochissimo
    // (ingrandire un foglio più piccolo a ogni fotogramma è più lento).
    const densita = Math.min(window.devicePixelRatio || 1, 2);
    this.foglio.width = Math.round(larghezza * densita);
    this.foglio.height = Math.round(altezza * densita);
    const ctx = this.ctxFoglio;
    ctx.setTransform(densita, 0, 0, densita, 0, 0);
    const l = larghezza;
    const a = altezza;

    // 1. Sfumatura di profondità.
    const profondita = ctx.createLinearGradient(0, 0, 0, a);
    profondita.addColorStop(0.0, '#5cc1c4'); // superficie turchese
    profondita.addColorStop(0.25, '#2a8aa0');
    profondita.addColorStop(0.6, '#155a7c');
    profondita.addColorStop(0.85, '#0d3a5e');
    profondita.addColorStop(1.0, '#0a2645'); // fondo blu-indaco
    ctx.fillStyle = profondita;
    ctx.fillRect(0, 0, l, a);

    // 2. Alone di luce in alto, leggermente spostato a sinistra.
    const alone = ctx.createRadialGradient(l * 0.38, -a * 0.1, 0, l * 0.38, -a * 0.1, a * 0.9);
    alone.addColorStop(0, 'rgba(230, 255, 230, 0.22)');
    alone.addColorStop(0.5, 'rgba(160, 230, 220, 0.10)');
    alone.addColorStop(1, 'rgba(160, 230, 220, 0)');
    ctx.fillStyle = alone;
    ctx.fillRect(0, 0, l, a);

    // 3. Vignettatura: bordi e angoli più scuri.
    const raggio = Math.hypot(l, a) * 0.65;
    const vignetta = ctx.createRadialGradient(l / 2, a * 0.42, raggio * 0.35, l / 2, a * 0.42, raggio);
    vignetta.addColorStop(0, 'rgba(5, 20, 40, 0)');
    vignetta.addColorStop(1, 'rgba(5, 20, 40, 0.55)');
    ctx.fillStyle = vignetta;
    ctx.fillRect(0, 0, l, a);

    this.larghezza = larghezza;
    this.altezza = altezza;
  }

  disegna(ctx, larghezza, altezza) {
    if (larghezza !== this.larghezza || altezza !== this.altezza) {
      this.dipingi(larghezza, altezza);
    }
    ctx.drawImage(this.foglio, 0, 0, larghezza, altezza);
  }
}
