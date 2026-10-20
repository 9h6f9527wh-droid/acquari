// Tutti i pesci della vasca: li crea, li fa muovere e li disegna nello
// strato giusto (dietro lo scoglio, dentro la tana o davanti).

import { Pesce } from './pesce.js';
import { SPECIE } from './specie.js';
import { Banco } from './banco.js';
import { disegnaPesce, disegnaOmbra } from '../disegno/pesce.js';

export class Pesci {
  constructor(fondale) {
    this.fondale = fondale;
    this.lista = [];
    this.banchi = [];
  }

  aggiorna(dt, larghezza, altezza) {
    // Lo scoglio e le rocce devono essere pronti: i pesci li usano per orientarsi.
    this.fondale.controllaMisure(larghezza, altezza);
    if (this.lista.length === 0) this.popola(larghezza, altezza);
    for (const b of this.banchi) b.aggiorna(dt, larghezza, altezza);
    for (const p of this.lista) p.aggiorna(dt, larghezza, altezza);
  }

  // Gli abitanti di partenza (più avanti li comprerai nel negozio).
  popola(larghezza, altezza) {
    const nuovo = (specie) => {
      const p = new Pesce(specie, this.fondale, larghezza, altezza);
      this.lista.push(p);
      return p;
    };
    // Una coppia di pesci pagliaccio (in natura vivono in coppia) e il loro
    // amico chirurgo blu.
    nuovo(SPECIE.pagliaccio);
    nuovo(SPECIE.pagliaccio);
    nuovo(SPECIE.chirurgo);
    // Un piccolo gruppo di cardinali di Banggai.
    const banco = new Banco(this.fondale);
    for (let i = 0; i < 5; i++) banco.aggiungi(nuovo(SPECIE.banggai));
    this.banchi.push(banco);
  }

  // Disegna i pesci di uno strato, dal più lontano al più vicino.
  disegna(ctx, strato, larghezza, altezza) {
    const pesci = this.lista.filter((p) => p.strato() === strato).sort((a, b) => a.z - b.z);
    for (const p of pesci) disegnaOmbra(ctx, p, larghezza, altezza);
    for (const p of pesci) disegnaPesce(ctx, p, larghezza, altezza);
  }
}
