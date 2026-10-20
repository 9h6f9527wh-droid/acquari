// Il paguro: cammina sulla sabbia davanti, vicino al vetro, con la sua
// conchiglia sulle spalle.
//
// Cosa fa:
//  - cammina:  va piano verso un punto della sabbia, fermandosi ogni tanto;
//  - fruga:    si ferma e cerca cibo nella sabbia con le chele;
//  - trasloco: ogni tanto va a provare la conchiglia vuota che sta sulla
//              sabbia: esce dalla sua, si infila nell'altra e lascia lì la
//              vecchia (che diventa la nuova conchiglia vuota).
//
// Come si muove nell'ambiente:
//  - le zampe poggiano davvero sulla sabbia (vedi zampe.js);
//  - cammina su più "livelli": ogni meta ha anche una profondità (più avanti,
//    verso il vetro, o più indietro), e la profondità cambia SOLO mentre
//    cammina, piano, in diagonale. Più è indietro, più è piccolo e velato;
//  - non attraversa coralli, rocce e conchiglie: sceglie mete che non lo
//    portano dentro a un oggetto alla sua stessa profondità. Può passare
//    davanti a un oggetto, oppure dietro (e allora l'oggetto lo copre);
//  - la conchiglia si appoggia sulla sabbia e dondola a ogni passo.

import { Zampe } from './zampe.js';

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Due conchiglie diverse: una la porta lui, l'altra sta vuota sulla sabbia.
export const CONCHIGLIE = [
  { colore: { h: 30, s: 45, l: 64 }, strisce: { h: 18, s: 50, l: 40 }, misura: 1 },
  { colore: { h: 345, s: 30, l: 70 }, strisce: { h: 330, s: 35, l: 46 }, misura: 1.12 },
];

const N_ZAMPE = 4;
// Fascia di sabbia in cui cammina: davanti allo scoglio, fino al vetro.
const Z_MIN = 0.5;
const Z_MAX = 0.99;
// Due cose alla stessa profondità (± questo valore) si scontrano.
const SPESSORE = 0.07;

export class Paguro {
  constructor(fondale) {
    this.fondale = fondale;
    this.x = null;
    this.z = 0.97;
    this.verso = 1;
    this.stato = 'cammina';
    this.meta = null;
    this.tempo = 0;
    this.fruga = 0; // movimento delle chele
    this.conchiglia = 0; // quale conchiglia porta
    this.vuota = { x: 0.74, conchiglia: 1 }; // la conchiglia vuota sulla sabbia (x in frazioni)
    this.fuori = 0; // 0 = dentro la conchiglia, 1 = tutto fuori (durante il trasloco)
    this.prossimoTrasloco = casuale(60, 120);
    this.prossimaSosta = casuale(2, 5);
    this.zampe = new Zampe(N_ZAMPE, { passo: 0.11, durata: 0.22, alzata: 0.06 });
    this.dondolo = 0;
  }

  lunghezza(larghezza, altezza) {
    return 0.06 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  // Dove poggia sulla sabbia nel punto x (alla sua profondità).
  suolo(x, larghezza, altezza) {
    return this.fondale.profondita(Math.min(1, Math.max(0, x / larghezza)), this.z) * altezza;
  }

  // Se nel punto (x, z) il paguro finirebbe dentro un oggetto, restituisce il
  // centro di quell'oggetto; altrimenti null.
  scontro(x, z, L) {
    for (const o of this.fondale.ingombri || []) {
      if (o.x1 > x - L * 0.5 && o.x0 < x + L * 0.5 && Math.abs(o.z - z) < SPESSORE) return (o.x0 + o.x1) / 2;
    }
    // Anche la conchiglia vuota è un ostacolo (tranne quando ci va apposta).
    const xv = this.vuota.x * (this.larghezza || 1);
    if (Math.abs(xv - x) < L * 0.6 && Math.abs(this.z0Vuota - z) < SPESSORE) return xv;
    // E gli altri animali sulla sabbia (il polpo, il gambero quando scende).
    const a = this.animaleVicino(x, z, L);
    return a ? a.x : null;
  }

  // Un altro animale (non la conchiglia vuota, che conta già sopra) che
  // starebbe addosso al paguro nel punto (x, z), o null.
  animaleVicino(x, z, L) {
    if (!this.fondale.animaleVicino) return null;
    const a = this.fondale.animaleVicino(this, x, z, L * 0.55);
    return a && a.chi !== 'conchiglia' ? a : null;
  }

  // Sceglie una nuova meta (x e profondità) controllando che il percorso in
  // linea retta non attraversi niente. Prova parecchie mete a caso e tiene
  // la prima libera; se nessuna lo è, la meno "affollata". Se anche quella
  // urta qualcosa, resta dov'è (e intanto fruga nella sabbia).
  scegliMeta(larghezza, L) {
    let migliore = null;
    // Se parte attaccato a un oggetto, deve allontanarsene (non attraversarlo).
    const attaccato = this.scontro(this.x, this.z, L);
    for (let tentativo = 0; tentativo < 30; tentativo++) {
      const x = casuale(0.08, 0.92) * larghezza;
      if (attaccato !== null && Math.sign(x - this.x) !== Math.sign(this.x - attaccato)) continue;
      // Non cambia troppo profondità in una volta sola.
      const z = Math.min(Z_MAX, Math.max(Z_MIN, this.z + casuale(-0.3, 0.3)));
      // Se parte già attaccato a un ostacolo può uscirne: contano solo gli
      // scontri dopo che si è liberato.
      let urti = 0;
      let uscito = false;
      for (let k = 1; k <= 24; k++) {
        const q = k / 24;
        const urta = this.scontro(this.x + (x - this.x) * q, this.z + (z - this.z) * q, L) !== null;
        if (!urta) uscito = true;
        else if (uscito || attaccato === null || k > 6) urti++;
      }
      if (urti === 0) return { x, z };
      if (!migliore || urti < migliore.urti) migliore = { x, z, urti };
    }
    // Se è già dentro un ostacolo, la cosa più importante è uscirne.
    if (!migliore) return { x: this.x + Math.sign(this.x - attaccato || 1) * L * 2, z: this.z };
    return migliore.urti <= 2 || attaccato !== null ? migliore : { x: this.x, z: this.z };
  }

  // Dove i piedi starebbero se fosse fermo.
  riposoZampe(L) {
    return Array.from({ length: N_ZAMPE }, (_, i) => this.x + this.verso * L * (0.36 - i * 0.07));
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    this.larghezza = larghezza;
    this.z0Vuota = 0.92;
    const L = this.lunghezza(larghezza, altezza);
    if (this.x === null) this.x = larghezza * 0.45;
    let velocita = 0;

    if (this.stato === 'cammina') {
      if (this.meta === null) {
        const meta = this.scegliMeta(larghezza, L);
        this.meta = meta.x;
        this.zMeta = meta.z;
        this.partenza = { x: this.x, z: this.z };
      }
      const dx = this.meta - this.x;
      if (Math.abs(dx) < L * 0.1) {
        this.meta = null;
        this.stato = 'fruga';
        this.attesa = casuale(3, 8);
      } else {
        this.verso = Math.sign(dx);
        velocita = 0.22;
        // Ogni tanto si ferma un attimo, come per guardarsi intorno.
        this.prossimaSosta -= dt;
        if (this.prossimaSosta <= 0) {
          this.stato = 'sosta';
          this.attesa = casuale(0.6, 1.5);
          this.prossimaSosta = casuale(2, 5);
        }
      }
      this.prossimoTrasloco -= dt;
      if (this.prossimoTrasloco <= 0) {
        this.stato = 'versoConchiglia';
        this.meta = null;
        this.zMeta = null;
      }
    } else if (this.stato === 'sosta') {
      this.attesa -= dt;
      if (this.attesa <= 0) this.stato = 'cammina';
    } else if (this.stato === 'fruga') {
      // Fermo: le chele scendono a cercare nella sabbia, a turno.
      this.fruga += dt * 3;
      this.attesa -= dt;
      if (this.attesa <= 0) this.stato = 'cammina';
    } else if (this.stato === 'versoConchiglia') {
      // Va accanto alla conchiglia vuota, alla sua stessa profondità. Se è già
      // vicino ma a un'altra profondità, prima si allontana di qualche passo
      // (la profondità cambia solo camminando).
      const accanto = this.vuota.x * larghezza - L * 0.7;
      if (this.zMeta !== this.z0Vuota || this.meta === null) {
        const lontano = Math.abs(accanto - this.x) < L * 1.5 && Math.abs(this.z - this.z0Vuota) > 0.02;
        this.meta = lontano ? accanto - L * 3 : accanto;
        this.zMeta = lontano ? this.z : this.z0Vuota;
        this.partenza = { x: this.x, z: this.z };
        if (!lontano) this.zMeta = this.z0Vuota;
      }
      const dx = this.meta - this.x;
      if (Math.abs(dx) < L * 0.08) {
        if (this.meta === accanto) {
          this.z = this.z0Vuota;
          this.verso = 1; // guarda la conchiglia
          this.stato = 'esce';
          this.meta = null;
          this.partenza = null;
        } else {
          // Si è allontanato: ora torna verso la conchiglia cambiando profondità.
          this.meta = accanto;
          this.zMeta = this.z0Vuota;
          this.partenza = { x: this.x, z: this.z };
        }
      } else {
        this.verso = Math.sign(dx);
        velocita = 0.22;
      }
    } else if (this.stato === 'esce') {
      // Esce piano dalla sua conchiglia...
      this.fuori = Math.min(1, this.fuori + dt * 0.6);
      if (this.fuori >= 1) {
        // ...e si infila in quella nuova: la vecchia resta lì, vuota.
        const vecchia = this.conchiglia;
        this.conchiglia = this.vuota.conchiglia;
        this.vuota = { x: this.x / larghezza, conchiglia: vecchia };
        this.x += L * 0.7;
        this.zampe = new Zampe(N_ZAMPE, { passo: 0.11, durata: 0.22, alzata: 0.06 });
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

    // Se il prossimo passo lo porterebbe addosso a un altro animale, si ferma
    // e poi sceglie un'altra strada.
    if (velocita > 0) {
      const davanti = this.animaleVicino(this.x + this.verso * L * 0.2, this.z, L);
      if (davanti && Math.sign(davanti.x - this.x) === this.verso) {
        velocita = 0;
        if (this.stato === 'cammina') {
          this.meta = null;
          this.stato = 'sosta';
          this.attesa = casuale(0.8, 1.6);
        } else if (this.stato === 'versoConchiglia') {
          // Aspetta che si liberi (il polpo e il gambero prima o poi se ne vanno).
          this.meta = null;
        }
      }
    }

    // Cammina: un po' più svelto a metà del passo, come a piccole spinte.
    if (velocita > 0) {
      const spinta = this.zampe.inMovimento() ? 1 : 0.5;
      this.x += this.verso * L * velocita * spinta * dt;
    }
    this.x = Math.min(larghezza * 0.95, Math.max(larghezza * 0.05, this.x));

    // Profondità: cambia insieme al cammino, in proporzione a quanta strada
    // ha fatto verso la meta (così va in diagonale e non scivola mai).
    if (velocita > 0 && this.partenza && this.meta !== null) {
      const tratto = this.meta - this.partenza.x;
      const fatto = Math.abs(tratto) > 1 ? Math.min(1, Math.max(0, (this.x - this.partenza.x) / tratto)) : 1;
      this.z = this.partenza.z + (this.zMeta - this.partenza.z) * fatto;
    }
    this.y = this.suolo(this.x, larghezza, altezza);

    this.zampe.aggiorna(dt, this.riposoZampe(L), (x) => this.suolo(x, larghezza, altezza), L);
    // La conchiglia dondola quando le zampe si muovono.
    this.dondolo += ((this.zampe.inMovimento() ? 1 : 0) - this.dondolo) * Math.min(1, dt * 5);
  }
}
