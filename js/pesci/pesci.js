// Tutti i pesci della vasca: li crea, li fa muovere e li disegna nello
// strato giusto (dietro lo scoglio, dentro la tana o davanti).

import { Pesce } from './pesce.js';
import { SPECIE } from './specie.js';
import { disegnaPesce, disegnaOmbra } from '../disegno/pesce.js';

export class Pesci {
  constructor(fondale) {
    this.fondale = fondale;
    this.lista = [];
  }

  aggiorna(dt, larghezza, altezza) {
    // Lo scoglio e le rocce devono essere pronti: i pesci li usano per orientarsi.
    this.fondale.controllaMisure(larghezza, altezza);
    if (this.lista.length === 0) {
      // Fase 3: una coppia di pesci pagliaccio (in natura vivono in coppia).
      for (let i = 0; i < 2; i++) this.lista.push(new Pesce(SPECIE.pagliaccio, this.fondale, larghezza, altezza));
    }
    for (const p of this.lista) p.aggiorna(dt, larghezza, altezza);
  }

  // Disegna i pesci di uno strato, dal più lontano al più vicino.
  disegna(ctx, strato, larghezza, altezza) {
    const pesci = this.lista.filter((p) => p.strato() === strato).sort((a, b) => a.z - b.z);
    for (const p of pesci) disegnaOmbra(ctx, p, larghezza, altezza);
    for (const p of pesci) disegnaPesce(ctx, p, larghezza, altezza);
  }
}
