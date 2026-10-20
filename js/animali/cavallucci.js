// I cavallucci marini: una coppia (lei corallo, lui giallo, con la tasca sul
// ventre in cui i maschi tengono le uova).
//
// Cosa fanno:
//  - riposo:   ognuno si aggrappa con la coda a una foglia dello stesso ciuffo
//              d'erba, vicini tra loro, e dondola insieme alla foglia;
//  - trasloco: ogni tanto la coppia cambia ciuffo. Parte uno dei due e
//              l'altro lo segue poco dopo, restandogli accanto; nuotano
//              dritti in piedi, piano, spinti dalla piccola pinna sul dorso;
//  - saluto:   ogni tanto si staccano, si mettono uno di fronte all'altra e
//              salgono e scendono insieme, con i colori più accesi (come fanno
//              le coppie vere ogni mattina), poi tornano ad aggrapparsi.
//
// Ogni cavalluccio ha un "punto coda" T (dove il tronco diventa coda): da lì
// la coda scende fino alla foglia e ci si arrotola intorno.

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Dove sta la foglia rispetto al punto coda, quando è aggrappato (in L).
const CODA_X = -0.06;
const CODA_Y = 0.26;

class Cavalluccio {
  constructor(colore, maschio) {
    this.colore = colore;
    this.maschio = maschio;
    this.x = null;
    this.y = 0;
    this.z = 0.8;
    this.verso = 1;
    this.inclinazione = 0;
    this.coda = 1; // 1 = arrotolata alla foglia, 0 = libera (a spirale)
    this.presa = null; // { pianta, foglia, s }
    this.ancora = null; // punto della foglia (in punti) in questo istante
    this.meta = null;
    this.acceso = 0; // colori più vivi durante il saluto
    this.tempo = Math.random() * 10;
  }
}

export class Cavallucci {
  constructor(fondale, piante) {
    this.fondale = fondale;
    this.piante = piante;
    this.coppia = [
      new Cavalluccio({ h: 16, s: 72, l: 58 }, false),
      new Cavalluccio({ h: 44, s: 80, l: 56 }, true),
    ];
    this.stato = 'inizio';
    this.attesa = 0;
    this.tempo = 0;
  }

  lunghezza(c, larghezza, altezza) {
    return 0.055 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(c.z);
  }

  // Due foglie dello stesso ciuffo, una per lato (così stanno vicini ma non
  // uno sopra l'altro), scegliendo le più dritte: sono le più comode.
  presePer(pianta) {
    if (pianta.gorgonia) {
      // Sulla gorgonia: due rami a metà altezza, uno per lato.
      const [a, b] = pianta.prese();
      return [
        { pianta, foglia: a, s: 0, lato: -0.5 },
        { pianta, foglia: b, s: 0, lato: 0.5 },
      ];
    }
    const n = pianta.foglie.length;
    const dritta = (i) => Math.abs(pianta.foglie[i].angolo + pianta.foglie[i].curvatura * 0.5);
    const migliore = (da, a) => {
      let m = da;
      for (let i = da; i < a; i++) if (dritta(i) < dritta(m)) m = i;
      return m;
    };
    // Lato sinistro: tra la prima e la metà; destro: dalla metà in poi
    // (lasciando fuori le foglie più esterne, troppo piegate).
    const sinistra = migliore(Math.floor(n * 0.15), Math.floor(n / 2));
    const destra = migliore(Math.ceil(n / 2), Math.ceil(n * 0.85));
    return [
      { pianta, foglia: sinistra, s: casuale(0.38, 0.46), lato: -1 },
      { pianta, foglia: destra, s: casuale(0.52, 0.6), lato: 1 },
    ];
  }

  // Dove deve stare il punto coda per arrivare con la coda alla foglia.
  posto(c, presa, L, larghezza, altezza) {
    const a = this.piante.puntoFoglia(presa.pianta, presa.foglia, presa.s, larghezza, altezza);
    // Ognuno sta dal suo lato del ciuffo: la coda scende un po' di sbieco.
    return { x: a.x - c.verso * CODA_X * L + presa.lato * L * 0.14, y: a.y - CODA_Y * L, ancora: a };
  }

  aggrappa(prese) {
    this.coppia.forEach((c, i) => {
      c.presa = prese[i];
      c.z = prese[i].pianta.z + 0.01; // un filo davanti alla sua pianta
      c.meta = null;
    });
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    const appigli = this.piante.appigli();
    if (!appigli.length) return;
    const [lei, lui] = this.coppia;

    if (this.stato === 'inizio') {
      // Partono aggrappati al ciuffo più vicino al vetro.
      const pianta = appigli.reduce((a, b) => (b.z > a.z ? b : a));
      this.pianta = pianta;
      lei.verso = 1;
      lui.verso = -1; // si guardano
      this.aggrappa(this.presePer(pianta));
      for (const c of this.coppia) {
        const L = this.lunghezza(c, larghezza, altezza);
        const p = this.posto(c, c.presa, L, larghezza, altezza);
        c.x = p.x;
        c.y = p.y;
      }
      this.stato = 'riposo';
      this.attesa = casuale(20, 35);
    } else if (this.stato === 'riposo') {
      this.attesa -= dt;
      // Ogni tanto uno dei due gira la testa dall'altra parte, poi torna a guardarla.
      for (const c of this.coppia) {
        c.girato = (c.girato || 0) - dt;
        if (c.girato <= 0 && Math.random() < dt * 0.05) c.girato = casuale(3, 6);
      }
      if (this.attesa <= 0) {
        if (Math.random() < 0.35) {
          this.stato = 'saluto';
          this.attesa = casuale(9, 13);
          this.centro = { x: (lei.x + lui.x) / 2, y: (lei.y + lui.y) / 2 - this.lunghezza(lei, larghezza, altezza) * 0.35 };
          for (const c of this.coppia) c.presa = null;
        } else {
          // Si cambia ciuffo: un altro a caso.
          const altri = appigli.filter((p) => p !== this.pianta);
          const pianta = altri[Math.floor(Math.random() * altri.length)] || this.pianta;
          this.pianta = pianta;
          this.prese = this.presePer(pianta);
          this.stato = 'trasloco';
          // Parte uno dei due, l'altro lo segue dopo un attimo.
          this.capo = Math.random() < 0.5 ? 0 : 1;
          this.ritardo = casuale(1.5, 3);
          this.coppia[this.capo].presa = null;
        }
      }
    } else if (this.stato === 'trasloco') {
      this.ritardo -= dt;
      const altro = this.coppia[1 - this.capo];
      if (this.ritardo <= 0 && altro.presa && altro.presa.pianta !== this.pianta) altro.presa = null;
      // Quando sono arrivati tutti e due e si sono aggrappati, riposano.
      if (this.coppia.every((c) => c.presa && c.presa.pianta === this.pianta && c.coda > 0.99)) {
        this.stato = 'riposo';
        this.attesa = casuale(25, 45);
        // Arrivati, si girano a guardarsi.
        this.coppia[0].verso = 1;
        this.coppia[1].verso = -1;
      }
    } else if (this.stato === 'saluto') {
      this.attesa -= dt;
      if (this.attesa <= 0) {
        // Tornano alle loro foglie.
        this.prese = this.presePer(this.pianta);
        this.stato = 'trasloco';
        this.capo = 0;
        this.ritardo = 0;
      }
    }

    this.coppia.forEach((c, i) => this.muovi(c, i, dt, larghezza, altezza));
  }

  muovi(c, i, dt, larghezza, altezza) {
    c.tempo += dt;
    const L = this.lunghezza(c, larghezza, altezza);
    let nuota = false;

    if (c.presa) {
      // Aggrappato: segue la foglia che ondeggia e si piega un po' con lei.
      const p = this.posto(c, c.presa, L, larghezza, altezza);
      c.ancora = p.ancora;
      if (c.coda < 1) {
        // Si sta ancora avvicinando alla foglia: ci va piano e arrotola la coda.
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const d = Math.hypot(dx, dy);
        const v = Math.min(d, L * 0.5 * dt);
        if (d > 0.5) {
          c.x += (dx / d) * v;
          c.y += (dy / d) * v;
        }
        if (d < L * 0.1) c.coda = Math.min(1, c.coda + dt * 1.2);
        nuota = d > L * 0.1;
      } else {
        c.x = p.x;
        c.y = p.y;
      }
      const voluto = p.ancora.angolo * 0.35 + Math.sin(c.tempo * 0.8) * 0.05;
      c.inclinazione += (voluto - c.inclinazione) * Math.min(1, dt * 3);
      c.acceso = Math.max(0, c.acceso - dt * 0.3);
      if (c.girato > 0 && c.coda >= 1) c.guarda = -1;
      else c.guarda = 1;
    } else {
      // Libero: la coda si arrotola a spirale.
      c.coda = Math.max(0, c.coda - dt * 1.5);
      c.ancora = null;
      c.guarda = 1;
      nuota = true;
      let meta;
      if (this.stato === 'saluto') {
        // Uno di fronte all'altra, salgono e scendono insieme.
        const lato = i === 0 ? -1 : 1;
        const su = Math.sin(this.tempo * 1.2) * L * 0.25;
        meta = { x: this.centro.x + lato * L * 0.45, y: this.centro.y + su };
        c.verso = -lato;
        c.acceso = Math.min(1, c.acceso + dt * 0.5);
      } else {
        // Trasloco: verso la sua foglia. Chi segue resta accanto al capo
        // finché non sono vicini al nuovo ciuffo.
        const presa = this.prese[i];
        const posto = this.posto(c, presa, L, larghezza, altezza);
        meta = posto;
        const capo = this.coppia[this.capo];
        if (c !== capo && capo.presa === null) {
          const lontano = Math.hypot(posto.x - capo.x, posto.y - capo.y) > L * 2;
          if (lontano) meta = { x: capo.x - Math.sign(posto.x - capo.x || 1) * L * 0.7, y: capo.y + L * 0.15 };
        }
        // Lungo la strada passano un po' sopra il fondo, non rasoterra.
        const fondo = this.fondale.profondita(Math.min(1, Math.max(0, c.x / larghezza)), c.z) * altezza;
        if (Math.abs(meta.x - c.x) > L * 1.5) meta = { x: meta.x, y: Math.min(meta.y, fondo - L * 1.6) };
        // La profondità cambia piano piano verso quella del ciuffo.
        c.z += (presa.pianta.z + 0.01 - c.z) * Math.min(1, dt * 0.3);
        if (Math.hypot(posto.x - c.x, posto.y - c.y) < L * 0.15 && meta === posto) {
          c.presa = presa;
          c.z = presa.pianta.z + 0.01;
        }
        if (Math.abs(meta.x - c.x) > L * 0.2) c.verso = Math.sign(meta.x - c.x);
      }
      const dx = meta.x - c.x;
      const dy = meta.y - c.y;
      const d = Math.hypot(dx, dy);
      // Nuotano piano, con piccole spinte della pinna dorsale.
      const v = L * (this.stato === 'saluto' ? 0.6 : 0.45) * (0.7 + 0.3 * Math.sin(c.tempo * 3)) * dt;
      if (d > 0.5) {
        c.x += (dx / d) * Math.min(d, v);
        c.y += (dy / d) * Math.min(d, v);
      }
      // Dritti in piedi, appena inclinati in avanti quando vanno di lato.
      const voluto = Math.max(-0.3, Math.min(0.3, (dx / (L * 3)) * 0.3)) + Math.sin(c.tempo * 1.3) * 0.04;
      c.inclinazione += (voluto - c.inclinazione) * Math.min(1, dt * 2);
    }
    c.pinna = nuota ? 1 : 0.35; // quanto batte la pinna dorsale
  }
}
