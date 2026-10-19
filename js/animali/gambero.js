// Il gambero pulitore: vive sulla piccola roccia davanti (la sua "stazione di
// pulizia") e pulisce i pesci che vanno da lui.
//
// Cosa fa:
//  - attesa:   sta sulla roccia, si dondola e muove le antenne per farsi notare;
//  - passeggia: fa qualche passo avanti e indietro sulla cima della roccia;
//  - pulisce:  quando un pesce si ferma sopra la stazione, si alza verso di lui
//              e passa con le zampette lungo il suo fianco, avanti e indietro.
//
// I pesci trovano la stazione in fondale.stazionePulizia (vedi pesce.js).

const ROCCIA = 3; // la piccola roccia davanti a sinistra

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export class Gambero {
  constructor(fondale) {
    this.fondale = fondale;
    this.z = 0.88;
    this.x = 0;
    this.y = 0;
    this.verso = 1;
    this.stato = 'attesa';
    this.attesa = casuale(2, 5);
    this.tempo = 0;
    this.passo = 0; // ritmo delle zampe
    this.alzata = 0; // quanto si alza verso il pesce (0 = sulla roccia)
    this.cliente = null;
    this.lungoIlPesce = 0; // dove sta pulendo, lungo il corpo del pesce
    this.pronto = false;
  }

  // Lunghezza del gambero in punti, alla sua profondità.
  lunghezza(larghezza, altezza) {
    return 0.065 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  // Un pesce chiede di essere pulito: accetta se è libero.
  chiedi(pesce) {
    if (this.cliente || this.stato === 'pulisce') return false;
    this.cliente = pesce;
    this.stato = 'pulisce';
    this.verso = pesce.x > this.x ? 1 : -1;
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
    const casa = { x: cima.x, y: cima.y + L * 0.05 };
    if (!this.pronto) {
      this.x = casa.x;
      this.y = casa.y;
      this.pronto = true;
    }
    // La stazione: il punto dove i pesci devono fermarsi, un po' sopra la roccia.
    this.fondale.stazionePulizia = { x: casa.x, y: casa.y - L * 1.1, z: this.z, gambero: this };

    let meta = casa.x;
    if (this.stato === 'attesa' || this.stato === 'passeggia') {
      this.alzata = Math.max(0, this.alzata - dt * 2);
      this.attesa -= dt;
      if (this.attesa <= 0) {
        // Alterna l'attesa e qualche passo sulla cima della roccia.
        if (this.stato === 'attesa') {
          this.stato = 'passeggia';
          this.metaPasseggio = casa.x + casuale(-0.6, 0.6) * L;
          this.attesa = casuale(2, 4);
        } else {
          this.stato = 'attesa';
          this.attesa = casuale(3, 7);
        }
      }
      if (this.stato === 'passeggia') meta = this.metaPasseggio;
    } else if (this.stato === 'pulisce' && this.cliente) {
      // Si alza verso il pesce e va avanti e indietro lungo il suo fianco.
      this.alzata = Math.min(1, this.alzata + dt * 1.5);
      this.lungoIlPesce = 0.25 + 0.25 * Math.sin(this.tempo * 0.9);
      meta = this.cliente.x - this.cliente.verso * (this.lungoIlPesce - 0.4) * this.cliente.lunghezza(larghezza, altezza);
    }

    // Cammina verso la meta (piano, a passettini).
    const dx = meta - this.x;
    const v = Math.min(Math.abs(dx), L * 0.6 * dt);
    if (Math.abs(dx) > 1) {
      this.x += Math.sign(dx) * v;
      if (this.stato !== 'pulisce') this.verso = Math.sign(dx);
      this.passo += dt * 9;
    } else {
      this.passo += dt * 1.5; // zampe quasi ferme
    }
    // Quando pulisce si allunga verso il ventre del pesce.
    const ventre = this.cliente ? this.cliente.y + this.cliente.lunghezza(larghezza, altezza) * 0.2 : casa.y;
    this.y = casa.y + (Math.min(casa.y, ventre + L * 0.25) - casa.y) * this.alzata * 0.6;
  }
}
