// Un banco: un piccolo gruppo di pesci della stessa specie che stanno vicini
// e si muovono insieme (per ora i cardinali di Banggai).
//
// Come funziona:
//  - il banco ha un "punto di ritrovo" vicino a un corallo o a una roccia;
//  - ogni pesce ha il suo posto attorno al punto (un po' sopra, un po' di
//    lato, un po' più avanti o indietro), così non si sovrappongono;
//  - ogni tanto il gruppo si sposta tutto insieme verso un altro punto;
//  - quando il gruppo si gira, i pesci si girano uno dopo l'altro, come
//    un'onda, e non tutti nello stesso istante.

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Posti attorno al punto di ritrovo, in lunghezze del pesce (x, y) e profondità.
const POSTI = [
  [0, 0, 0], [1.4, -0.6, 0.04], [-1.3, 0.5, -0.03], [0.5, 1.1, 0.06], [-0.7, -1.2, -0.05], [1.9, 0.7, -0.02],
];

export class Banco {
  constructor(fondale) {
    this.fondale = fondale;
    this.membri = [];
    this.tempo = 0;
    this.centro = null;
    this.verso = 1;
    this.ultimaGirata = 0;
    this.prossimaGirata = casuale(6, 12);
    this.prossimoSpostamento = casuale(25, 45);
  }

  aggiungi(pesce) {
    pesce.banco = this;
    pesce.posto = POSTI[this.membri.length % POSTI.length];
    pesce.ritardo = this.membri.length * casuale(0.15, 0.3); // per la girata "a onda"
    pesce.faseBanco = Math.random() * Math.PI * 2;
    pesce.z = 0.55 + pesce.posto[2];
    pesce.inizia('banco');
    this.membri.push(pesce);
  }

  // Punti di ritrovo: sopra l'anemone rosa, sopra il corallo rosa a sinistra,
  // accanto allo scoglio. Calcolati ogni volta perché dipendono dallo schermo.
  puntiDiRitrovo(larghezza, altezza) {
    const f = this.fondale;
    const M = f.misuraBase(larghezza, altezza);
    const punti = [];
    const rosa = f.cimeRocce[2];
    if (rosa) punti.push({ x: rosa.x + M * 0.05, y: rosa.y - M * 0.16, z: rosa.z + 0.04 });
    punti.push({ x: larghezza * 0.12, y: f.profondita(0.12, 0.62) * altezza - M * 0.3, z: 0.62 });
    const s = f.scoglio;
    if (s.cx) punti.push({ x: s.cx - s.rx * 1.25, y: s.base - s.H * 0.7, z: 0.5 });
    return punti;
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    const punti = this.puntiDiRitrovo(larghezza, altezza);
    if (!this.centro) {
      // Al primo istante il gruppo parte già unito, attorno al punto di ritrovo.
      this.indice = 0;
      this.centro = { ...punti[0] };
      for (const p of this.membri) {
        const posto = this.posto(p, larghezza, altezza);
        p.x = posto.x;
        p.y = posto.y;
        p.z = posto.z;
      }
    }
    // Ogni tanto il gruppo cambia posto.
    this.prossimoSpostamento -= dt;
    if (this.prossimoSpostamento <= 0) {
      this.indice = (this.indice + 1 + Math.floor(Math.random() * (punti.length - 1))) % punti.length;
      this.prossimoSpostamento = casuale(30, 50);
    }
    // Il punto di ritrovo scivola piano verso la meta (e si porta dietro i pesci).
    const meta = punti[this.indice % punti.length];
    const M = this.fondale.misuraBase(larghezza, altezza);
    const passo = M * 0.03 * dt;
    const dx = meta.x - this.centro.x;
    const dy = meta.y - this.centro.y;
    const d = Math.hypot(dx, dy);
    if (d > passo) {
      this.centro.x += (dx / d) * passo;
      this.centro.y += (dy / d) * passo;
      this.cambiaVerso(Math.sign(dx));
    }
    this.centro.z += (meta.z - this.centro.z) * Math.min(1, dt * 0.2);

    // Quando sono fermi, ogni tanto si girano tutti dall'altra parte.
    this.prossimaGirata -= dt;
    if (d <= passo && this.prossimaGirata <= 0) {
      this.cambiaVerso(-this.verso);
      this.prossimaGirata = casuale(7, 14);
    }
  }

  cambiaVerso(verso) {
    if (verso && verso !== this.verso) {
      this.verso = verso;
      this.ultimaGirata = this.tempo;
    }
  }

  // Dove deve stare un pesce del banco in questo momento.
  posto(pesce, larghezza, altezza) {
    const L = pesce.lunghezza(larghezza, altezza);
    const [px, py, pz] = pesce.posto;
    const t = this.tempo + pesce.faseBanco;
    // Si girano uno dopo l'altro: ognuno aspetta il suo turno.
    const direzione = this.tempo - this.ultimaGirata > pesce.ritardo ? this.verso : -this.verso;
    return {
      // Il posto è "a specchio" a seconda di dove guarda il gruppo, più un
      // piccolo ondeggiare: restano vivi anche quando sono fermi.
      x: this.centro.x + px * L * this.verso + Math.sin(t * 0.6) * L * 0.25,
      y: this.centro.y + py * L + Math.sin(t * 0.45 + 1) * L * 0.2,
      z: Math.min(0.95, Math.max(0.15, this.centro.z + pz)),
      lento: true,
      direzione,
    };
  }
}
