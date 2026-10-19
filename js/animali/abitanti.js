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
    // La conchiglia vuota e il paguro, dal più lontano al più vicino.
    const zVuota = p.z0Vuota || 0.92;
    const xVuota = p.vuota.x * larghezza;
    const yVuota = this.fondale.profondita(p.vuota.x, zVuota) * altezza;
    const Lv = 0.06 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(zVuota);
    const vuota = () => disegnaConchiglia(ctx, xVuota, yVuota, Lv, -1, CONCHIGLIE[p.vuota.conchiglia], zVuota, true);
    const paguro = () => {
      if (p.x === null) return;
      disegnaPaguro(ctx, p, L, CONCHIGLIE[p.conchiglia]);
      // Se è passato dietro un corallo o una roccia, l'oggetto lo copre.
      this.fondale.ridisegnaDavanti(ctx, p.z, p.x - L * 0.9, p.y - L * 1.1, p.x + L * 0.9, p.y + L * 0.2);
    };
    if (p.z < zVuota) {
      paguro();
      vuota();
    } else {
      vuota();
      paguro();
    }
    const g = this.gambero;
    if (g.pronto) disegnaGambero(ctx, g, g.lunghezza(larghezza, altezza));
  }
}
