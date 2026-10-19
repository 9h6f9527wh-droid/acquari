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
//  - non attraversa coralli, rocce e conchiglie: quando ne incontra uno ci
//    passa DAVANTI (più vicino al vetro), cambiando piano la sua profondità;
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
const Z_MIN = 0.9;
const Z_MAX = 0.99;

export class Paguro {
  constructor(fondale) {
    this.fondale = fondale;
    this.x = null;
    this.z = 0.92;
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

  // Profondità a cui deve stare per non attraversare niente: se davanti a lui
  // (o sotto di lui) c'è un oggetto, si mette un po' più vicino al vetro.
  zSicura(x, L) {
    let z = Z_MIN;
    const da = Math.min(x - L * 0.8, x + this.verso * L * 1.6);
    const a = Math.max(x + L * 0.8, x + this.verso * L * 1.6);
    for (const o of this.fondale.ingombri || []) {
      if (o.x1 > da && o.x0 < a && o.z > 0.6) z = Math.max(z, o.z + 0.05);
    }
    // Anche la conchiglia vuota è un ostacolo (tranne quando ci va apposta).
    if (!this.stato.startsWith('verso') && this.stato !== 'esce' && this.stato !== 'entra') {
      const xv = this.vuota.x * (this.larghezza || 1);
      if (Math.abs(xv - x) < L * 1.3) z = Math.max(z, this.z0Vuota + 0.05);
    }
    return Math.min(Z_MAX, z);
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
    if (this.x === null) this.x = larghezza * 0.3;
    let velocita = 0;

    if (this.stato === 'cammina') {
      if (this.meta === null) this.meta = casuale(0.08, 0.92) * larghezza;
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
      if (this.prossimoTrasloco <= 0) this.stato = 'versoConchiglia';
    } else if (this.stato === 'sosta') {
      this.attesa -= dt;
      if (this.attesa <= 0) this.stato = 'cammina';
    } else if (this.stato === 'fruga') {
      // Fermo: le chele scendono a cercare nella sabbia, a turno.
      this.fruga += dt * 3;
      this.attesa -= dt;
      if (this.attesa <= 0) this.stato = 'cammina';
    } else if (this.stato === 'versoConchiglia') {
      // Va accanto alla conchiglia vuota (alla sua stessa profondità).
      const meta = this.vuota.x * larghezza - L * 0.55;
      const dx = meta - this.x;
      if (Math.abs(dx) < L * 0.08 && Math.abs(this.z - this.z0Vuota) < 0.01) {
        this.verso = 1; // guarda la conchiglia
        this.stato = 'esce';
      } else if (Math.abs(dx) >= L * 0.08) {
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
        this.x += L * 0.55;
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

    // Cammina: un po' più svelto a metà del passo, come a piccole spinte.
    if (velocita > 0) {
      const spinta = this.zampe.inMovimento() ? 1 : 0.5;
      this.x += this.verso * L * velocita * spinta * dt;
    }
    this.x = Math.min(larghezza * 0.95, Math.max(larghezza * 0.05, this.x));

    // Profondità: davanti agli ostacoli, oppure alla profondità della conchiglia
    // vuota quando va a prenderla.
    const verso = this.stato === 'versoConchiglia' || this.stato === 'esce' || this.stato === 'entra';
    const zVoluta = verso ? this.z0Vuota : this.zSicura(this.x, L);
    this.z += Math.sign(zVoluta - this.z) * Math.min(Math.abs(zVoluta - this.z), dt * 0.08);
    this.y = this.suolo(this.x, larghezza, altezza);

    this.zampe.aggiorna(dt, this.riposoZampe(L), (x) => this.suolo(x, larghezza, altezza), L);
    // La conchiglia dondola quando le zampe si muovono.
    this.dondolo += ((this.zampe.inMovimento() ? 1 : 0) - this.dondolo) * Math.min(1, dt * 5);
  }
}
