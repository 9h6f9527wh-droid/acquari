// Il gambero pulitore: vive sulla piccola roccia davanti (la sua "stazione di
// pulizia") e pulisce i pesci che vanno da lui.
//
// Cosa fa:
//  - attesa:    sta sulla roccia, si dondola e muove le antenne per farsi notare;
//  - passeggia: fa qualche passo sulla cima della roccia;
//  - pulisce:   quando un pesce si ferma sopra di lui, resta con le zampe sulla
//               roccia, alza la parte davanti del corpo e lo pulisce con le
//               chele, spostandosi un po' lungo il suo fianco.
//
// Cammina SULLA roccia: segue la sua superficie curva e si inclina con la
// pendenza. Le zampe poggiano davvero sulla roccia (vedi zampe.js).
//
// I pesci trovano la stazione in fondale.stazionePulizia (vedi pesce.js).

import { Zampe } from './zampe.js';

const ROCCIA = 3; // la piccola roccia davanti a sinistra
const N_ZAMPE = 5;

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export class Gambero {
  constructor(fondale) {
    this.fondale = fondale;
    this.z = 0.88;
    this.x = 0;
    this.y = 0;
    this.angolo = 0; // inclinazione del corpo (segue la roccia)
    this.alzata = 0; // 0 = sdraiato sulla roccia, 1 = parte davanti alzata verso il pesce
    this.verso = 1;
    this.stato = 'attesa';
    this.attesa = casuale(2, 5);
    this.tempo = 0;
    this.cliente = null;
    this.pronto = false;
    this.zampe = new Zampe(N_ZAMPE, { passo: 0.1, durata: 0.16, alzata: 0.05 });
  }

  // Lunghezza del gambero in punti, alla sua profondità.
  lunghezza(larghezza, altezza) {
    return 0.065 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  // Altezza della superficie della roccia nel punto x. Non sul bordo più alto
  // della sagoma (sembrerebbe sospeso dietro la roccia), ma un po' più avanti,
  // sulla faccia di sopra che vediamo dall'alto.
  suolo(x) {
    const y = this.fondale.superficieRoccia(ROCCIA, x);
    return (y === null ? this.fondale.cimeRocce[ROCCIA].y : y) + (this.L || 0) * 0.12;
  }

  // Dove i piedi starebbero se fosse fermo: sotto il corpo, uno dietro l'altro.
  riposoZampe(L) {
    return Array.from({ length: N_ZAMPE }, (_, i) => {
      const avanti = L * (0.3 - i * 0.07);
      return this.x + this.verso * avanti * Math.cos(this.angolo);
    });
  }

  // Un pesce chiede di essere pulito: accetta se è libero.
  chiedi(pesce) {
    if (this.cliente || this.stato === 'pulisce') return false;
    this.cliente = pesce;
    this.stato = 'pulisce';
    return true;
  }

  // Il pesce se ne va.
  congeda(pesce) {
    if (this.cliente === pesce) {
      this.cliente = null;
      this.stato = 'attesa';
      this.attesa = casuale(3, 6);
    }
  }

  aggiorna(dt, larghezza, altezza) {
    const cima = this.fondale.cimeRocce[ROCCIA];
    if (!cima) return;
    this.tempo += dt;
    const L = this.lunghezza(larghezza, altezza);
    this.L = L;
    // Può camminare solo sulla parte alta della roccia, dove è quasi piana.
    const limite = cima.larghezza * 0.14;
    if (!this.pronto) {
      this.x = cima.x;
      this.pronto = true;
    }

    let meta = this.x;
    if (this.stato === 'attesa' || this.stato === 'passeggia') {
      this.attesa -= dt;
      if (this.attesa <= 0) {
        // Alterna l'attesa e qualche passo sulla cima della roccia.
        if (this.stato === 'attesa') {
          this.stato = 'passeggia';
          this.metaPasseggio = cima.x + casuale(-1, 1) * limite;
          this.attesa = casuale(2.5, 4);
        } else {
          this.stato = 'attesa';
          this.attesa = casuale(3, 7);
        }
      }
      if (this.stato === 'passeggia') meta = this.metaPasseggio;
    } else if (this.stato === 'pulisce' && this.cliente) {
      // Guarda il pesce e si sposta piano lungo il suo fianco (dal muso verso la coda).
      const Lp = this.cliente.lunghezza(larghezza, altezza);
      const lungo = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(this.tempo * 0.7));
      meta = this.cliente.x - this.cliente.verso * (lungo - 0.2) * Lp;
    }
    meta = Math.min(cima.x + limite, Math.max(cima.x - limite, meta));

    // Cammina verso la meta, piano.
    const dx = meta - this.x;
    if (Math.abs(dx) > 1) {
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), L * 0.35 * dt);
      if (this.stato !== 'pulisce') this.verso = Math.sign(dx);
    }
    if (this.stato === 'pulisce' && this.cliente) {
      const verso = this.cliente.x > this.x ? 1 : -1;
      if (Math.abs(this.cliente.x - this.x) > L * 0.2) this.verso = verso;
    }

    // Poggia sulla roccia e si inclina come lei.
    this.y = this.suolo(this.x);
    const davanti = this.suolo(this.x + L * 0.25);
    const dietro = this.suolo(this.x - L * 0.25);
    // (mai troppo inclinato: è sulla cima della roccia, non sul fianco)
    const pendenza = Math.max(-0.3, Math.min(0.3, Math.atan2(davanti - dietro, L * 0.5) * this.verso));
    this.angolo += (pendenza - this.angolo) * Math.min(1, dt * 6);
    // Quando pulisce alza la parte davanti verso il pesce.
    const alzata = this.stato === 'pulisce' ? 1 : 0;
    this.alzata += (alzata - this.alzata) * Math.min(1, dt * 2.5);

    this.zampe.aggiorna(dt, this.riposoZampe(L), (x) => this.suolo(x), L);

    // La stazione: dove i pesci devono fermarsi, appena sopra il gambero.
    this.fondale.stazionePulizia = { x: cima.x, y: this.suolo(cima.x) - L * 0.55, z: this.z, gambero: this };
  }
}
