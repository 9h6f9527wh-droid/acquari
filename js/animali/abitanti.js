// Gli abitanti della vasca che non sono pesci (per ora gambero pulitore e
// paguro): li crea, li fa muovere e li disegna.
//
// Stanno tutti davanti, vicino al vetro: vengono disegnati dopo i pesci
// "davanti", così si vedono bene sopra la sabbia e le rocce.

import { Gambero } from './gambero.js';
import { Paguro, CONCHIGLIE } from './paguro.js';
import { disegnaGambero, disegnaPaguro, disegnaConchiglia } from '../disegno/invertebrati.js';

export class Abitanti {
  constructor(fondale) {
    this.fondale = fondale;
    this.gambero = new Gambero(fondale);
    this.paguro = new Paguro(fondale);
  }

  aggiorna(dt, larghezza, altezza) {
    this.fondale.controllaMisure(larghezza, altezza);
    this.gambero.aggiorna(dt, larghezza, altezza);
    this.paguro.aggiorna(dt, larghezza, altezza);
  }

  disegna(ctx, larghezza, altezza) {
    const p = this.paguro;
    const L = p.lunghezza(larghezza, altezza);
    // La conchiglia vuota sulla sabbia, poi il paguro.
    const xVuota = p.vuota.x * larghezza;
    disegnaConchiglia(ctx, xVuota, p.suolo(xVuota, larghezza, altezza), L, -1, CONCHIGLIE[p.vuota.conchiglia], p.z, true);
    if (p.x !== null) disegnaPaguro(ctx, p, L, CONCHIGLIE[p.conchiglia]);
    const g = this.gambero;
    if (g.pronto) disegnaGambero(ctx, g, g.lunghezza(larghezza, altezza));
  }
}
