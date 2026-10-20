// Il gambero pulitore: vive sulla piccola roccia davanti (la sua "stazione di
// pulizia") e pulisce i pesci che vanno da lui.
//
// Cosa fa:
//  - attesa:    sta sulla roccia, si dondola e muove le antenne per farsi notare;
//  - passeggia: fa qualche passo sulla cima della roccia;
//  - pulisce:   quando un pesce si ferma sopra di lui, resta con le zampe sulla
//               roccia, alza la parte davanti del corpo e lo pulisce con le
//               chele, spostandosi un po' lungo il suo fianco;
//  - scende / giro / fruga / risale: ogni tanto, quando non ha clienti, scende
//               dal fianco della roccia, gironzola sulla sabbia lì intorno
//               (senza allontanarsi) e poi risale in cima alla sua stazione.
//
// Cammina SULLA roccia e sulla sabbia: segue la forma della roccia (anche giù
// per il fianco) e si inclina con la pendenza. Le zampe poggiano davvero sul
// terreno (vedi zampe.js).
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

  // Altezza del terreno nel punto x: la roccia dove c'è, altrimenti la sabbia.
  // Sulla roccia non poggia sul bordo più alto della sagoma (sembrerebbe
  // sospeso dietro la roccia), ma un po' più avanti, sulla faccia di sopra.
  suolo(x) {
    const f = this.fondale;
    const m = f.misure;
    const sabbia = m ? f.profondita(Math.min(1, Math.max(0, x / m.l)), this.z) * m.a : Infinity;
    const roccia = f.superficieRoccia(ROCCIA, x);
    if (roccia === null) return sabbia;
    return Math.min(roccia + (this.L || 0) * 0.12, sabbia);
  }

  // Vero se è in cima alla roccia (solo lì può pulire i pesci).
  inCima() {
    return this.stato === 'attesa' || this.stato === 'passeggia' || this.stato === 'pulisce';
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
    if (this.cliente || this.stato !== 'attesa' && this.stato !== 'passeggia') return false;
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
    let velocita = 0.35;
    // Quanto lontano dalla roccia può andare quando scende (in punti).
    const raggio = cima.larghezza / 2;
    if (this.prossimaDiscesa === undefined) this.prossimaDiscesa = casuale(20, 35);
    if (this.stato === 'attesa' || this.stato === 'passeggia') {
      this.attesa -= dt;
      this.prossimaDiscesa -= dt;
      if (this.prossimaDiscesa <= 0) {
        // Scende da uno dei due fianchi della roccia.
        this.stato = 'scende';
        this.lato = Math.random() < 0.5 ? -1 : 1;
        this.metaGiro = cima.x + this.lato * raggio * casuale(1.15, 1.45);
      } else if (this.attesa <= 0) {
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
    } else if (this.stato === 'scende' || this.stato === 'giro') {
      // Giù per il fianco e poi sulla sabbia, lì vicino.
      meta = this.metaGiro;
      velocita = this.stato === 'scende' ? 0.25 : 0.33;
      if (Math.abs(meta - this.x) < L * 0.05) {
        this.stato = 'fruga';
        this.attesa = casuale(2, 5);
      }
    } else if (this.stato === 'fruga') {
      // Fermo sulla sabbia, cerca qualcosa da mangiare con le chele.
      this.attesa -= dt;
      if (this.attesa <= 0) {
        this.giri = (this.giri || 0) + 1;
        if (this.giri < 3 && Math.random() < 0.7) {
          // Un altro piccolo giro, sempre dallo stesso lato della roccia.
          this.stato = 'giro';
          this.metaGiro = cima.x + this.lato * raggio * casuale(1.1, 1.7);
        } else {
          this.stato = 'risale';
          this.giri = 0;
        }
      }
    } else if (this.stato === 'risale') {
      meta = cima.x;
      velocita = 0.25;
      if (Math.abs(meta - this.x) < L * 0.05) {
        this.stato = 'attesa';
        this.attesa = casuale(3, 6);
        this.prossimaDiscesa = casuale(30, 60);
      }
    } else if (this.stato === 'pulisce' && this.cliente) {
      // Guarda il pesce e si sposta piano lungo il suo fianco (dal muso verso la coda).
      const Lp = this.cliente.lunghezza(larghezza, altezza);
      const lungo = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(this.tempo * 0.7));
      meta = this.cliente.x - this.cliente.verso * (lungo - 0.2) * Lp;
    }
    if (this.inCima()) meta = Math.min(cima.x + limite, Math.max(cima.x - limite, meta));

    // Cammina verso la meta, piano.
    const dx = meta - this.x;
    if (Math.abs(dx) > 1) {
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), L * velocita * dt);
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
    // In cima è quasi piano; quando scende o risale si inclina di più (si
    // arrampica sul fianco), ma mai in verticale.
    const massimo = this.inCima() ? 0.3 : 0.9;
    const pendenza = Math.max(-massimo, Math.min(massimo, Math.atan2(davanti - dietro, L * 0.5) * this.verso));
    this.angolo += (pendenza - this.angolo) * Math.min(1, dt * 6);
    // Quando pulisce alza la parte davanti verso il pesce.
    const alzata = this.stato === 'pulisce' ? 1 : 0;
    this.alzata += (alzata - this.alzata) * Math.min(1, dt * 2.5);

    this.zampe.aggiorna(dt, this.riposoZampe(L), (x) => this.suolo(x), L);

    // La stazione: dove i pesci devono fermarsi, appena sopra il gambero.
    // Quando il gambero è sceso dalla roccia, la stazione è chiusa.
    this.fondale.stazionePulizia = this.inCima() ? { x: cima.x, y: this.suolo(cima.x) - L * 0.55, z: this.z, gambero: this } : null;
  }
}
