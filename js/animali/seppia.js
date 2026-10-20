// La seppia fiammeggiante: piccola, scura, con onde di colore che le corrono
// sulla pelle e una pinna sottile che ondeggia tutta intorno al corpo.
//
// Cosa fa:
//  - fluttua: sospesa poco sopra la sabbia, va piano verso un punto; se il
//             punto è vicino e alle sue spalle ci va all'indietro (le seppie
//             sanno nuotare in tutte e due le direzioni, muovendo la pinna);
//  - sosta:   resta ferma a mezz'acqua, la pinna ondeggia, i colori pulsano;
//  - cammina: ogni tanto si posa sulla sabbia e "cammina" con due braccia e
//             due lembi sotto il corpo, come fanno le seppie fiammeggianti
//             vere (i piedi restano appoggiati, vedi zampe.js);
//  - spavento: se la tocchi lampeggia di giallo e di bianco e scappa
//             all'indietro con un getto.
//
// Non passa attraverso coralli e rocce alla sua profondità, e quando cammina
// sulla sabbia non va addosso agli altri animali.

import { Zampe } from './zampe.js';
import { Z_SCOGLIO } from '../disegno/fondale.js';

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

const Z_MIN = Z_SCOGLIO + 0.14;
const Z_MAX = 0.86;
const SPESSORE = 0.07;
// Le "zampe" per camminare: due braccia davanti e due lembi del mantello dietro.
export const APPOGGI = [
  { avanti: 0.34, profondita: 0.02 },
  { avanti: 0.26, profondita: -0.03 },
  { avanti: -0.12, profondita: 0.02 },
  { avanti: -0.22, profondita: -0.03 },
];

export class Seppia {
  constructor(fondale) {
    this.fondale = fondale;
    this.x = null;
    this.y = 0;
    this.z = 0.65;
    this.alto = 1.2; // quanto sta sopra la sabbia, in L
    this.verso = 1;
    this.giro = 1; // da 1 a -1 quando si gira (il corpo si "schiaccia" di lato)
    this.vx = 0;
    this.stato = 'sosta';
    this.attesa = casuale(2, 4);
    this.tempo = 0;
    this.lampo = 0; // 1 = appena spaventata
    this.aTerra = 0; // 0 = in acqua, 1 = posata sulla sabbia
    this.prossimaCamminata = casuale(25, 45);
    this.zampe = new Zampe(APPOGGI.length, { passo: 0.09, durata: 0.35, alzata: 0.05 });
  }

  lunghezza(larghezza, altezza) {
    return 0.095 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  suolo(x, z, larghezza, altezza) {
    return this.fondale.profondita(Math.min(1, Math.max(0, x / larghezza)), z) * altezza;
  }

  // Un oggetto (o un animale, se è a terra) nel punto (x, z)? null se libero.
  scontro(x, z, L, aTerra) {
    L *= this.fondale.scalaZ(z) / this.fondale.scalaZ(this.z);
    for (const o of this.fondale.ingombri || []) {
      if (o.x1 > x - L * 0.55 && o.x0 < x + L * 0.55 && Math.abs(o.z - z) < SPESSORE) return (o.x0 + o.x1) / 2;
    }
    if (aTerra && this.fondale.animaleVicino) {
      const a = this.fondale.animaleVicino(this, x, z, L * 0.45);
      if (a) return a.x;
    }
    return null;
  }

  stradaLibera(x, z, L, aTerra) {
    for (let k = 1; k <= 40; k++) {
      const q = k / 40;
      if (this.scontro(this.x + (x - this.x) * q, this.z + (z - this.z) * q, L, aTerra) !== null) return false;
    }
    return true;
  }

  // Una meta raggiungibile senza attraversare niente; null se non la trova.
  scegliMeta(larghezza, L, vicina, aTerra) {
    for (let tentativo = 0; tentativo < 30; tentativo++) {
      const x = vicina
        ? this.x + this.verso * casuale(1, 2.5) * L
        : casuale(0.1, 0.9) * larghezza;
      if (x < larghezza * 0.06 || x > larghezza * 0.94) continue;
      const z = aTerra ? this.z : Math.min(Z_MAX, Math.max(Z_MIN, this.z + casuale(-0.2, 0.2)));
      if (this.stradaLibera(x, z, L, aTerra)) return { x, z };
    }
    return null;
  }

  vaiA(meta) {
    this.meta = meta;
    this.partenza = { x: this.x, z: this.z };
    // Se la meta è vicina e alle sue spalle, ci va all'indietro.
    const dietro = Math.sign(meta.x - this.x) !== this.verso;
    this.indietro = dietro && Math.abs(meta.x - this.x) < this.L * 2.5;
    if (dietro && !this.indietro) this.verso = -this.verso;
  }

  // Tocco: se tocca la seppia, lampeggia e scappa.
  tocco(x, y, larghezza, altezza) {
    if (this.x === null || this.stato === 'spavento') return false;
    const L = this.lunghezza(larghezza, altezza);
    if (Math.hypot(x - this.x, y - this.y) > L * 0.7) return false;
    this.lampo = 1;
    this.stato = 'spavento';
    this.aTerra = Math.min(this.aTerra, 0.99);
    this.zampe.stacca();
    // Scappa all'indietro, verso un punto libero (se c'è), e un po' più in alto.
    let meta = null;
    for (let k = 0; k < 20 && !meta; k++) {
      const x2 = this.x - this.verso * casuale(2.5, 4) * L;
      if (x2 > larghezza * 0.06 && x2 < larghezza * 0.94 && this.stradaLibera(x2, this.z, L, false)) meta = { x: x2, z: this.z };
    }
    this.vaiA(meta || { x: this.x, z: this.z });
    this.indietro = true;
    this.altoMeta = 2;
    return true;
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    const L = this.lunghezza(larghezza, altezza);
    this.L = L;
    if (this.x === null) {
      this.x = larghezza * 0.3;
      for (let i = 0; i < 20 && this.scontro(this.x, this.z, L, false) !== null; i++) this.x = casuale(0.1, 0.9) * larghezza;
      this.altoMeta = this.alto;
    }
    let velocita = 0;

    if (this.stato === 'sosta') {
      this.attesa -= dt;
      this.prossimaCamminata -= dt;
      if (this.attesa <= 0) {
        if (this.prossimaCamminata <= 0) {
          // Scende a posarsi sulla sabbia (se sotto è libero).
          if (this.scontro(this.x, this.z, L, true) === null) {
            this.stato = 'scende';
            this.altoMeta = 0;
          }
          this.prossimaCamminata = casuale(40, 70);
        } else {
          const meta = this.scegliMeta(larghezza, L, Math.random() < 0.4, false);
          if (meta) {
            this.vaiA(meta);
            this.stato = 'fluttua';
            this.altoMeta = casuale(0.6, 1.8);
          } else this.attesa = casuale(1, 2);
        }
      }
    } else if (this.stato === 'fluttua' || this.stato === 'spavento' || this.stato === 'cammina') {
      const dx = this.meta.x - this.x;
      velocita = this.stato === 'spavento' ? 2.2 : this.stato === 'cammina' ? 0.16 : this.indietro ? 0.3 : 0.45;
      // Camminando non va addosso agli altri animali: se ne ha uno davanti si ferma.
      if (this.stato === 'cammina') {
        const davanti = this.scontro(this.x + Math.sign(dx) * L * 0.2, this.z, L, true);
        if (davanti !== null && Math.sign(davanti - this.x) === Math.sign(dx)) this.meta = { x: this.x, z: this.z };
      }
      if (Math.abs(dx) < L * 0.05) {
        this.x = this.meta.x;
        this.z = this.meta.z;
        this.indietro = false;
        if (this.stato === 'cammina') {
          this.passi = (this.passi || 0) + 1;
          // Ancora un tratto, oppure si rialza e torna a fluttuare.
          const meta = this.passi < 3 && Math.random() < 0.7 ? this.scegliMeta(larghezza, L, true, true) : null;
          if (meta) this.vaiA(meta);
          else {
            this.passi = 0;
            this.stato = 'sosta';
            this.attesa = casuale(2, 4);
            this.altoMeta = casuale(0.8, 1.5);
          }
        } else {
          this.stato = 'sosta';
          this.attesa = casuale(3, 7);
        }
      }
    } else if (this.stato === 'scende') {
      // Si abbassa piano fino a posarsi. Se intanto sotto è arrivato qualcuno,
      // ci rinuncia e torna su.
      if (this.alto < 0.6 && this.scontro(this.x, this.z, L, true) !== null) {
        this.stato = 'sosta';
        this.attesa = casuale(2, 4);
        this.altoMeta = casuale(0.8, 1.5);
      } else if (this.alto < 0.05) {
        this.aTerra = 1;
        this.stato = 'cammina';
        this.passi = 0;
        const meta = this.scegliMeta(larghezza, L, true, true);
        if (meta) this.vaiA(meta);
        else {
          this.vaiA({ x: this.x, z: this.z });
        }
      }
    }

    // Spostamento: accelera e frena dolcemente (è sospesa nell'acqua).
    if (this.meta && (this.stato === 'fluttua' || this.stato === 'spavento' || this.stato === 'cammina')) {
      const dx = this.meta.x - this.x;
      const voluta = Math.sign(dx) * Math.min(L * velocita, Math.abs(dx) * 1.2);
      // Vicino alla meta frena più deciso, così non la supera.
      const prontezza = this.stato === 'spavento' ? 6 : Math.abs(dx) < L ? 4 : 1.5;
      this.vx += (voluta - this.vx) * Math.min(1, dt * prontezza);
      this.x += this.vx * dt;
      const tratto = this.meta.x - this.partenza.x;
      const fatto = Math.abs(tratto) > 1 ? Math.min(1, Math.max(0, (this.x - this.partenza.x) / tratto)) : 1;
      this.z = this.partenza.z + (this.meta.z - this.partenza.z) * fatto;
    } else {
      // Ferma: frena dolcemente, ma senza scivolare dentro a un oggetto.
      this.vx *= Math.max(0, 1 - dt * 4);
      const dopo = this.x + this.vx * dt;
      if (this.scontro(dopo, this.z, L, this.aTerra > 0.5) === null) this.x = dopo;
      else this.vx = 0;
    }

    // Altezza sopra la sabbia: si avvicina piano a quella voluta.
    if (this.stato === 'cammina') this.alto = 0;
    else {
      this.alto += (this.altoMeta - this.alto) * Math.min(1, dt * (this.stato === 'scende' ? 0.8 : 0.6));
      if (this.stato === 'scende') this.alto = Math.max(0, this.alto - dt * 0.05);
    }
    if (this.stato !== 'cammina') this.aTerra = Math.max(0, this.aTerra - dt * 2);
    const terra = this.suolo(this.x, this.z, larghezza, altezza);
    // Il corpo sta un po' sopra i piedi; in acqua ondeggia appena su e giù.
    const ondeggia = Math.sin(this.tempo * 1.4) * L * 0.04 * (1 - this.aTerra);
    this.y = terra - L * (0.2 + this.alto) + ondeggia;

    // Si gira piano (il corpo si stringe e si riapre dall'altra parte).
    this.giro += (this.verso - this.giro) * Math.min(1, dt * 3);
    // Lampo dello spavento: svanisce in qualche secondo.
    this.lampo = Math.max(0, this.lampo - dt * 0.35);

    // Camminando, braccia e lembi poggiano sulla sabbia a turno.
    if (this.aTerra > 0.5) {
      const riposo = APPOGGI.map((a) => this.x + this.verso * a.avanti * L);
      this.zampe.aggiorna(dt, riposo, (x, i) => this.suolo(x, this.z, larghezza, altezza) + APPOGGI[i].profondita * L, L);
    } else this.zampe.stacca();
  }
}
