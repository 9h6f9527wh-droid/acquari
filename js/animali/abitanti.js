// Gli abitanti della vasca che non sono pesci (gambero pulitore, paguro e
// polpo): li crea, li fa muovere e li disegna.
//
// Stanno davanti allo scoglio: vengono disegnati dopo i pesci "davanti".
// Il polpo quando è nella grotta viene disegnato in mezzo ai due fogli dello
// scoglio (disegnaTana), come i pesci.

import { Gambero } from './gambero.js';
import { Paguro, CONCHIGLIE } from './paguro.js';
import { Polpo } from './polpo.js';
import { disegnaGambero, disegnaPaguro, disegnaConchiglia } from '../disegno/invertebrati.js';
import { disegnaPolpo } from '../disegno/polpo.js';

export class Abitanti {
  constructor(fondale) {
    this.fondale = fondale;
    this.gambero = new Gambero(fondale);
    this.paguro = new Paguro(fondale);
    this.polpo = new Polpo(fondale);
  }

  // Un tocco sullo schermo: per ora solo il polpo reagisce (si spaventa).
  tocco(x, y, larghezza, altezza) {
    return this.polpo.tocco(x, y, larghezza, altezza);
  }

  // Il polpo dentro la grotta (va disegnato tra i due fogli dello scoglio).
  disegnaTana(ctx, larghezza, altezza) {
    if (this.polpo.dentroTana && this.polpo.x !== null) disegnaPolpo(ctx, this.polpo, this.polpo.lunghezza(larghezza, altezza));
  }

  aggiorna(dt, larghezza, altezza) {
    this.fondale.controllaMisure(larghezza, altezza);
    this.gambero.aggiorna(dt, larghezza, altezza);
    this.paguro.aggiorna(dt, larghezza, altezza);
    this.polpo.aggiorna(dt, larghezza, altezza);
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
    // Il polpo fuori dalla grotta (coperto dagli oggetti che ha davanti).
    const o = this.polpo;
    if (!o.dentroTana && o.x !== null) {
      const Lo = o.lunghezza(larghezza, altezza);
      disegnaPolpo(ctx, o, Lo);
      this.fondale.ridisegnaDavanti(ctx, o.z, o.x - Lo, o.y - Lo, o.x + Lo, o.y + Lo * 0.3);
    }
    const g = this.gambero;
    if (g.pronto) {
      const Lg = g.lunghezza(larghezza, altezza);
      disegnaGambero(ctx, g, Lg);
      // Quando è sceso sulla sabbia, gli oggetti davanti a lui lo coprono.
      if (!g.inCima()) this.fondale.ridisegnaDavanti(ctx, g.z, g.x - Lg, g.y - Lg, g.x + Lg, g.y + Lg * 0.2);
    }
    // La nuvola d'inchiostro sta davanti a tutto.
    o.inchiostro.disegna(ctx);
  }
}
