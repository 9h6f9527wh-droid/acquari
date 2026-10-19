// Il paguro: cammina sulla sabbia davanti, vicino al vetro, con la sua
// conchiglia sulle spalle.
//
// Cosa fa:
//  - cammina:  va piano verso un punto della sabbia, a passi alternati;
//  - fruga:    si ferma e cerca cibo nella sabbia con le chele;
//  - trasloco: ogni tanto va a provare la conchiglia vuota che sta sulla
//              sabbia: esce dalla sua, si infila nell'altra e lascia lì la
//              vecchia (che diventa la nuova conchiglia vuota).

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Due conchiglie diverse: una la porta lui, l'altra sta vuota sulla sabbia.
export const CONCHIGLIE = [
  { colore: { h: 30, s: 45, l: 64 }, strisce: { h: 18, s: 50, l: 40 }, misura: 1 },
  { colore: { h: 345, s: 30, l: 70 }, strisce: { h: 330, s: 35, l: 46 }, misura: 1.12 },
];

export class Paguro {
  constructor(fondale) {
    this.fondale = fondale;
    this.x = null;
    this.z = 0.95;
    this.verso = 1;
    this.stato = 'cammina';
    this.meta = null;
    this.tempo = 0;
    this.passo = 0; // ritmo delle zampe
    this.fruga = 0; // movimento delle chele
    this.conchiglia = 0; // quale conchiglia porta
    this.vuota = { x: 0.74, conchiglia: 1 }; // la conchiglia vuota sulla sabbia (x in frazioni)
    this.fuori = 0; // 0 = dentro la conchiglia, 1 = tutto fuori (durante il trasloco)
    this.prossimoTrasloco = casuale(60, 120);
  }

  lunghezza(larghezza, altezza) {
    return 0.06 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  // Dove poggia sulla sabbia nel punto x.
  suolo(x, larghezza, altezza) {
    return this.fondale.profondita(Math.min(1, Math.max(0, x / larghezza)), this.z) * altezza;
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    const L = this.lunghezza(larghezza, altezza);
    if (this.x === null) this.x = larghezza * 0.3;

    if (this.stato === 'cammina') {
      if (this.meta === null) this.meta = casuale(0.08, 0.92) * larghezza;
      const dx = this.meta - this.x;
      if (Math.abs(dx) < L * 0.1) {
        this.meta = null;
        this.stato = 'fruga';
        this.attesa = casuale(3, 8);
      } else {
        this.verso = Math.sign(dx);
        // Cammina a scatti leggeri: un po' più veloce a metà del passo.
        const ritmo = 0.6 + 0.4 * Math.abs(Math.sin(this.passo));
        this.x += this.verso * L * 0.28 * ritmo * dt;
        this.passo += dt * 4.5;
      }
      this.prossimoTrasloco -= dt;
      if (this.prossimoTrasloco <= 0) {
        this.stato = 'versoConchiglia';
      }
    } else if (this.stato === 'fruga') {
      // Fermo: le chele scendono a cercare nella sabbia, a turno.
      this.fruga += dt * 3;
      this.passo += dt * 0.5;
      this.attesa -= dt;
      if (this.attesa <= 0) this.stato = 'cammina';
    } else if (this.stato === 'versoConchiglia') {
      // Va accanto alla conchiglia vuota.
      const meta = this.vuota.x * larghezza - L * 0.55;
      const dx = meta - this.x;
      if (Math.abs(dx) < L * 0.08) {
        this.verso = 1; // guarda la conchiglia
        this.stato = 'esce';
      } else {
        this.verso = Math.sign(dx);
        this.x += this.verso * L * 0.28 * dt;
        this.passo += dt * 4.5;
      }
    } else if (this.stato === 'esce') {
      // Esce piano dalla sua conchiglia...
      this.fuori = Math.min(1, this.fuori + dt * 0.6);
      if (this.fuori >= 1) {
        // ...e si infila in quella nuova: la vecchia resta lì, vuota.
        const vecchia = this.conchiglia;
        this.conchiglia = this.vuota.conchiglia;
        this.vuota = { x: this.x / larghezza, conchiglia: vecchia };
        this.x += L * 0.55;
        this.stato = 'entra';
      }
    } else if (this.stato === 'entra') {
      this.fuori = Math.max(0, this.fuori - dt * 0.8);
      if (this.fuori <= 0) {
        this.stato = 'fruga';
        this.attesa = casuale(2, 4);
        this.prossimoTrasloco = casuale(120, 240);
      }
    }
    this.x = Math.min(larghezza * 0.95, Math.max(larghezza * 0.05, this.x));
    this.y = this.suolo(this.x, larghezza, altezza);
  }
}
