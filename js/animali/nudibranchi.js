// I nudibranchi: minuscole lumache di mare senza conchiglia, coloratissime.
// Ce ne sono due, di specie diverse, ognuno sulla sua roccia.
//
// Cosa fanno:
//  - striscia: avanza pianissimo sulla roccia; il corpo segue la forma della
//              pietra (si piega sulle gobbe) e si allunga e si accorcia appena,
//              come fanno le lumache;
//  - sosta:    si ferma ad assaggiare la roccia (si nutrono di spugne), con le
//              antenne (i "rinofori") che oscillano;
//  - si gira:  arrivato in fondo al suo tratto di roccia, torna indietro;
//  - se lo tocchi: ritira antenne e branchie e resta fermo qualche secondo,
//              poi le riapre piano.
//
// Ognuno ha un tratto di roccia tutto suo, sulla parte quasi piana in cima,
// da un lato dell'anemone o della gorgonia (così non ci passa attraverso).

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

export const SPECIE_NUDIBRANCHI = {
  // Blu-viola con il bordo bianco e giallo e le branchie arancioni.
  blu: { corpo: { h: 236, s: 62, l: 52 }, bordo: { h: 52, s: 95, l: 62 }, riga: { h: 0, s: 0, l: 96 }, branchie: { h: 26, s: 90, l: 58 } },
  // Rosa con il bordo giallo e le branchie bianche.
  rosa: { corpo: { h: 318, s: 58, l: 64 }, bordo: { h: 48, s: 92, l: 60 }, riga: { h: 330, s: 70, l: 86 }, branchie: { h: 40, s: 40, l: 92 } },
};

class Nudibranco {
  constructor(fondale, { roccia, da, a, specie }) {
    this.fondale = fondale;
    this.roccia = roccia;
    this.da = da; // tratto di roccia (in frazioni della larghezza della roccia, dal centro)
    this.a = a;
    this.specie = SPECIE_NUDIBRANCHI[specie];
    this.u = (da + a) / 2;
    this.verso = 1;
    this.giro = 1;
    this.stato = 'sosta';
    this.attesa = casuale(2, 5);
    this.tempo = Math.random() * 10;
    this.ritirato = 0; // 1 = antenne e branchie ritirate
    this.spavento = 0;
    this.x = null;
    this.y = 0;
  }

  lunghezza(larghezza, altezza) {
    return 0.045 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  get z() {
    return this.fondale.rocce[this.roccia].z + 0.01;
  }

  // Altezza della roccia nel punto x: non sul bordo di dietro, ma un po' più
  // avanti, sulla faccia di sopra che vediamo.
  suolo(x) {
    const cima = this.fondale.cimeRocce[this.roccia];
    const y = this.fondale.superficieRoccia(this.roccia, x);
    return (y === null ? cima.y : y) + cima.larghezza * 0.04;
  }

  tocco(x, y, larghezza, altezza) {
    if (this.x === null) return false;
    const L = this.lunghezza(larghezza, altezza);
    if (Math.hypot(x - this.x, y - (this.y - L * 0.1)) > Math.max(L, 22)) return false;
    this.spavento = casuale(4, 6);
    return true;
  }

  aggiorna(dt, larghezza, altezza) {
    const cima = this.fondale.cimeRocce[this.roccia];
    if (!cima) return;
    this.tempo += dt;
    const L = this.lunghezza(larghezza, altezza);

    if (this.spavento > 0) {
      // Spaventato: tutto ritirato, fermo.
      this.spavento -= dt;
      this.ritirato = Math.min(1, this.ritirato + dt * 4);
    } else {
      this.ritirato = Math.max(0, this.ritirato - dt * 0.5);
      if (this.stato === 'sosta') {
        this.attesa -= dt;
        if (this.attesa <= 0) {
          // Riparte: a volte nella stessa direzione, a volte si gira.
          if (Math.random() < 0.35) this.verso = -this.verso;
          this.meta = casuale(this.da, this.a);
          if (Math.sign(this.meta - this.u) !== this.verso) this.meta = this.verso > 0 ? this.a : this.da;
          this.stato = 'striscia';
        }
      } else if (this.stato === 'striscia') {
        // Pianissimo, a piccole spinte (si allunga e poi si richiama dietro).
        const spinta = 0.5 + 0.5 * Math.sin(this.tempo * 2.2);
        const passo = (0.14 * L * spinta * dt) / cima.larghezza;
        this.u += this.verso * passo;
        const arrivato = this.verso > 0 ? this.u >= this.meta : this.u <= this.meta;
        if (arrivato) {
          this.u = this.meta;
          this.stato = 'sosta';
          this.attesa = casuale(4, 10);
          // In fondo al suo tratto si gira.
          if (this.u >= this.a - 0.01) this.verso = -1;
          if (this.u <= this.da + 0.01) this.verso = 1;
        }
      }
    }
    this.u = Math.min(this.a, Math.max(this.da, this.u));
    this.x = cima.x + this.u * cima.larghezza;
    this.y = this.suolo(this.x);
    // Si gira piano (a metà lo vediamo di fronte, più corto).
    this.giro += (this.verso - this.giro) * Math.min(1, dt * 1.5);
    this.allunga = this.stato === 'striscia' && this.spavento <= 0 ? Math.sin(this.tempo * 2.2) * 0.06 : 0;
  }
}

export class Nudibranchi {
  constructor(fondale) {
    this.lista = [
      new Nudibranco(fondale, { roccia: 0, da: 0.07, a: 0.21, specie: 'blu' }),
      new Nudibranco(fondale, { roccia: 1, da: -0.32, a: -0.1, specie: 'rosa' }),
    ];
  }

  aggiorna(dt, larghezza, altezza) {
    for (const n of this.lista) n.aggiorna(dt, larghezza, altezza);
  }

  tocco(x, y, larghezza, altezza) {
    return this.lista.some((n) => n.tocco(x, y, larghezza, altezza));
  }
}
