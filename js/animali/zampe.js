// Zampe che camminano davvero: ogni piede resta PIANTATO a terra finché il
// corpo non lo ha superato di un passo; allora si alza, va avanti e si
// riappoggia. I piedi si muovono a turno (mai due vicini insieme), come negli
// animali veri. Così le zampe non "scivolano" sul terreno.
//
// I piedi sono in coordinate dello schermo e poggiano su "suolo(x, i)", che
// dice a che altezza è il terreno (sabbia o roccia) per il piede i nel punto x
// (ogni piede può appoggiarsi a una profondità diversa, come i tentacoli).

export class Zampe {
  constructor(quante, { passo, durata, alzata }) {
    this.passo = passo; // quanto può restare indietro (o avanti) un piede prima di spostarsi
    this.durata = durata; // quanto dura un passo, in secondi
    this.alzata = alzata; // quanto si alza il piede durante il passo
    this.piedi = Array.from({ length: quante }, () => null);
  }

  // "riposo[i]" è il punto (x) dove il piede i starebbe se il corpo fosse fermo.
  aggiorna(dt, riposo, suolo, scala = 1) {
    const passo = this.passo * scala;
    const inAria = this.piedi.filter((p) => p && p.volo !== null).length;
    this.piedi.forEach((p, i) => {
      const meta = riposo[i];
      if (!p) {
        this.piedi[i] = { x: meta, y: suolo(meta, i), volo: null };
        return;
      }
      if (p.volo !== null) {
        // In volo: va verso il nuovo appoggio con un piccolo arco.
        p.volo = Math.min(1, p.volo + dt / this.durata);
        const t = p.volo * p.volo * (3 - 2 * p.volo);
        p.x = p.da + (p.a - p.da) * t;
        p.y = suolo(p.x, i) - Math.sin(Math.PI * p.volo) * this.alzata * scala;
        if (p.volo >= 1) p.volo = null;
        return;
      }
      // Piede appoggiato: resta dov'è (anche in altezza) finché non fa un passo.
      const lontano = Math.abs(p.x - meta) > passo;
      const vicini = [this.piedi[i - 1], this.piedi[i + 1]].some((q) => q && q.volo !== null);
      if (lontano && !vicini && inAria < Math.ceil(this.piedi.length / 2)) {
        // Si stacca e si riappoggia un po' oltre il punto di riposo, nella
        // direzione in cui va il corpo.
        p.volo = 0;
        p.da = p.x;
        p.a = meta + Math.sign(meta - p.x) * passo * 0.5;
      }
    });
  }

  // Dimentica dove erano i piedi (per esempio quando l'animale smette di nuotare).
  stacca() {
    this.piedi = this.piedi.map(() => null);
  }

  // Vero se qualche piede si sta muovendo (serve per far ondeggiare il corpo).
  inMovimento() {
    return this.piedi.some((p) => p && p.volo !== null);
  }
}

// Converte un punto dello schermo nelle coordinate "del corpo" (che è
// spostato in (x, y), girato secondo "verso" e inclinato di "angolo").
export function inCoordinateCorpo(px, py, x, y, verso, angolo) {
  const dx = (px - x) * verso;
  const dy = py - y;
  const c = Math.cos(angolo);
  const s = Math.sin(angolo);
  return { x: dx * c + dy * s, y: -dx * s + dy * c };
}
