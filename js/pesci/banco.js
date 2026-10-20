// Un banco: un piccolo gruppo di pesci della stessa specie che stanno vicini
// e si muovono insieme (per ora i cardinali di Banggai).
//
// Come funziona:
//  - il banco ha un "centro" che si muove nella vasca: ogni pesce ha il suo
//    posto attorno al centro (un po' sopra, un po' di lato, un po' più avanti
//    o indietro), così non si sovrappongono;
//  - il centro alterna due momenti:
//      GIRO:  attraversa l'acqua aperta passando per qualche punto a caso,
//             con curve morbide (non in linea retta);
//      SOSTA: riposa per qualche secondo vicino a un corallo o a una roccia;
//  - mentre viaggiano il gruppo si allunga un po', quando sostano si ricompatta;
//  - quando il gruppo si gira, i pesci si girano uno dopo l'altro, come un'onda.

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Posti attorno al centro, in lunghezze del pesce (x, y) e profondità.
const POSTI = [
  [0, 0, 0], [1.4, -0.6, 0.04], [-1.3, 0.5, -0.03], [0.5, 1.1, 0.06], [-0.7, -1.2, -0.05], [1.9, 0.7, -0.02],
];

export class Banco {
  constructor(fondale) {
    this.fondale = fondale;
    this.membri = [];
    this.tempo = 0;
    this.centro = null;
    this.vx = 0; // velocità del centro
    this.vy = 0;
    this.verso = 1;
    this.ultimaGirata = 0;
    this.prossimaGirata = casuale(5, 9);
    this.stato = 'sosta';
    this.attesa = casuale(4, 8);
    this.tappe = [];
    this.allungo = 1; // 1 = gruppo compatto, più grande = gruppo allungato
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

  // Punti di sosta: sopra l'anemone rosa, sopra il corallo rosa a sinistra,
  // accanto allo scoglio, sopra le rocce di destra.
  puntiDiSosta(larghezza, altezza) {
    const f = this.fondale;
    const M = f.misuraBase(larghezza, altezza);
    const punti = [];
    const rosa = f.cimeRocce[2];
    if (rosa) punti.push({ x: rosa.x + M * 0.05, y: rosa.y - M * 0.16, z: rosa.z + 0.04 });
    punti.push({ x: larghezza * 0.12, y: f.profondita(0.12, 0.62) * altezza - M * 0.3, z: 0.62 });
    const s = f.scoglio;
    if (s.cx) punti.push({ x: s.cx - s.rx * 1.25, y: s.base - s.H * 0.7, z: 0.5 });
    const destra = f.cimeRocce[1];
    if (destra) punti.push({ x: destra.x - M * 0.04, y: destra.y - M * 0.18, z: destra.z - 0.1 });
    return punti;
  }

  // Un punto a caso nell'acqua aperta, sopra lo scoglio (così il gruppo non
  // ci passa attraverso) e sotto la superficie.
  // Con "alto" il punto sta nella parte alta della vasca, vicino alla superficie.
  puntoInAcqua(larghezza, altezza, alto = false) {
    const s = this.fondale.scoglio;
    const cimaScoglio = s.base ? s.base - s.H : altezza * 0.55;
    return {
      x: casuale(0.12, 0.88) * larghezza,
      y: alto
        ? casuale(altezza * 0.1, altezza * 0.28)
        : casuale(altezza * 0.16, Math.max(altezza * 0.2, Math.min(altezza * 0.55, cimaScoglio - altezza * 0.06))),
      z: casuale(0.3, 0.85),
    };
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    const M = this.fondale.misuraBase(larghezza, altezza);
    if (!this.centro) {
      // Al primo istante il gruppo parte già unito, attorno a un punto di sosta.
      this.centro = { ...this.puntiDiSosta(larghezza, altezza)[0] };
      for (const p of this.membri) {
        const posto = this.posto(p, larghezza, altezza);
        p.x = posto.x;
        p.y = posto.y;
        p.z = posto.z;
      }
    }

    if (this.stato === 'sosta') {
      // Fermi (o quasi): ogni tanto si girano tutti dall'altra parte.
      this.vx *= Math.max(0, 1 - dt * 1.5);
      this.vy *= Math.max(0, 1 - dt * 1.5);
      this.prossimaGirata -= dt;
      if (this.prossimaGirata <= 0) {
        this.cambiaVerso(-this.verso);
        this.prossimaGirata = casuale(5, 9);
      }
      this.attesa -= dt;
      if (this.attesa <= 0) {
        // Si parte per un giro: qualche tappa in acqua aperta, poi una sosta.
        this.stato = 'giro';
        const quante = Math.floor(casuale(2, 5));
        // Ogni tanto il giro passa in alto, vicino alla superficie.
        const alto = Math.random() < 0.35;
        this.tappe = Array.from({ length: quante }, () => this.puntoInAcqua(larghezza, altezza, alto));
        const soste = this.puntiDiSosta(larghezza, altezza);
        this.tappe.push({ ...soste[Math.floor(Math.random() * soste.length)], sosta: true });
      }
    } else {
      // In viaggio: il centro "nuota" verso la prossima tappa curvando piano.
      const tappa = this.tappe[0];
      const dx = tappa.x - this.centro.x;
      const dy = tappa.y - this.centro.y;
      const d = Math.hypot(dx, dy);
      const velocita = M * (tappa.sosta && d < M * 0.15 ? 0.03 : 0.06);
      const sterzo = Math.min(1, dt * 0.9); // più è piccolo, più le curve sono larghe
      this.vx += ((dx / (d || 1)) * velocita - this.vx) * sterzo;
      this.vy += ((dy / (d || 1)) * velocita * 0.7 - this.vy) * sterzo;
      if (Math.abs(this.vx) > M * 0.01) this.cambiaVerso(Math.sign(this.vx));
      this.centro.z += (tappa.z - this.centro.z) * Math.min(1, dt * 0.25);
      if (d < M * 0.05) {
        this.tappe.shift();
        if (tappa.sosta) {
          this.stato = 'sosta';
          this.attesa = casuale(6, 12);
        }
      }
    }
    this.centro.x += this.vx * dt;
    this.centro.y += this.vy * dt;

    // Gruppo allungato quando corre, compatto quando sosta.
    const corsa = Math.min(1, Math.hypot(this.vx, this.vy) / (M * 0.06));
    this.allungo += (1 + corsa * 0.6 - this.allungo) * Math.min(1, dt);
    this.inViaggio = this.stato === 'giro';
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
      // Il posto è "a specchio" a seconda di dove guarda il gruppo; in viaggio
      // il gruppo si allunga. Più un ondeggiare: sono vivi anche da fermi.
      x: this.centro.x + px * L * this.verso * this.allungo + Math.sin(t * 0.7) * L * 0.5,
      y: this.centro.y + py * L + Math.sin(t * 0.5 + 1) * L * 0.35,
      z: Math.min(0.95, Math.max(0.15, this.centro.z + pz)),
      // In viaggio nuotano a velocità normale (con qualche scatto), in sosta piano.
      lento: !this.inViaggio,
      direzione,
    };
  }
}
