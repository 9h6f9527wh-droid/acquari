// Gli abitanti della vasca che non sono pesci (gambero pulitore, paguro e
// polpo): li crea, li fa muovere e li disegna.
//
// Stanno davanti allo scoglio: vengono disegnati dopo i pesci "davanti".
// Il polpo quando è nella grotta viene disegnato in mezzo ai due fogli dello
// scoglio (disegnaTana), come i pesci.

import { Gambero } from './gambero.js';
import { Paguro, CONCHIGLIE } from './paguro.js';
import { Polpo } from './polpo.js';
import { Cavallucci } from './cavallucci.js';
import { Seppia } from './seppia.js';
import { disegnaGambero, disegnaPaguro, disegnaConchiglia } from '../disegno/invertebrati.js';
import { disegnaPolpo } from '../disegno/polpo.js';
import { disegnaCavalluccio } from '../disegno/cavalluccio.js';
import { disegnaSeppia } from '../disegno/seppia.js';

// Due animali a meno di questa differenza di profondità si scontrano.
const SPESSORE_ANIMALI = 0.1;

export class Abitanti {
  constructor(fondale, piante) {
    this.fondale = fondale;
    this.cavallucci = new Cavallucci(fondale, piante);
    this.seppia = new Seppia(fondale);
    this.gambero = new Gambero(fondale);
    this.paguro = new Paguro(fondale);
    this.polpo = new Polpo(fondale);
  }

  // Un tocco sullo schermo: il polpo e la seppia si spaventano.
  tocco(x, y, larghezza, altezza) {
    return this.polpo.tocco(x, y, larghezza, altezza) || this.seppia.tocco(x, y, larghezza, altezza);
  }

  // Il polpo dentro la grotta (va disegnato tra i due fogli dello scoglio).
  disegnaTana(ctx, larghezza, altezza) {
    if (this.polpo.dentroTana && this.polpo.x !== null) disegnaPolpo(ctx, this.polpo, this.polpo.lunghezza(larghezza, altezza));
  }

  // Chi sta camminando sulla sabbia in questo momento, e quanto spazio occupa
  // (mezza larghezza in punti, profondità). Serve perché non si passino
  // attraverso: ognuno, prima di fare un passo, controlla di non finire
  // addosso a un altro alla sua stessa profondità.
  aTerra(larghezza, altezza) {
    const elenco = [];
    const p = this.paguro;
    if (p.x !== null) {
      elenco.push({ chi: p, x: p.x, z: p.z, mezzo: p.lunghezza(larghezza, altezza) * 0.55 });
      const zv = p.z0Vuota || 0.92;
      const Lv = 0.06 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(zv);
      elenco.push({ chi: 'conchiglia', x: p.vuota.x * larghezza, z: zv, mezzo: Lv * 0.55 });
    }
    const o = this.polpo;
    // Il polpo conta solo quando è fuori dalla grotta e a terra (se nuota passa sopra).
    if (o.x !== null && !o.dentroTana && o.posa === 'terra') {
      elenco.push({ chi: o, x: o.x, z: o.z, mezzo: o.lunghezza(larghezza, altezza) * 0.7 });
    }
    const s = this.seppia;
    if (s.x !== null && s.aTerra > 0.5) elenco.push({ chi: s, x: s.x, z: s.z, mezzo: s.lunghezza(larghezza, altezza) * 0.45 });
    const g = this.gambero;
    if (g.pronto && !g.inCima()) elenco.push({ chi: g, x: g.x, z: g.z, mezzo: g.lunghezza(larghezza, altezza) * 0.45 });
    return elenco;
  }

  aggiorna(dt, larghezza, altezza) {
    this.fondale.controllaMisure(larghezza, altezza);
    // Restituisce l'animale che starebbe addosso a "chi" se fosse nel punto
    // (x, z) con mezza larghezza "mezzo"; null se lì è libero.
    // (La lista di chi sta a terra si fa una volta per fotogramma: i controlli
    // sono tanti e rifarla ogni volta rallenterebbe.)
    let elenco = this.aTerra(larghezza, altezza);
    this.fondale.animaleVicino = (chi, x, z, mezzo) => {
      for (const a of elenco) {
        if (a.chi === chi) continue;
        if (Math.abs(a.x - x) < a.mezzo + mezzo && Math.abs(a.z - z) < SPESSORE_ANIMALI) return a;
      }
      return null;
    };
    this.gambero.aggiorna(dt, larghezza, altezza);
    elenco = this.aTerra(larghezza, altezza);
    this.paguro.aggiorna(dt, larghezza, altezza);
    elenco = this.aTerra(larghezza, altezza);
    this.polpo.aggiorna(dt, larghezza, altezza);
    elenco = this.aTerra(larghezza, altezza);
    this.seppia.aggiorna(dt, larghezza, altezza);
    this.cavallucci.aggiorna(dt, larghezza, altezza);
  }

  disegna(ctx, larghezza, altezza) {
    // Ognuno viene disegnato con gli oggetti che ha davanti sopra di lui; e
    // tutti insieme dal più lontano al più vicino, così chi sta più avanti
    // copre chi sta dietro.
    const disegni = [];
    const p = this.paguro;
    const zVuota = p.z0Vuota || 0.92;
    disegni.push({
      z: zVuota,
      fai: () => {
        const xVuota = p.vuota.x * larghezza;
        const yVuota = this.fondale.profondita(p.vuota.x, zVuota) * altezza;
        const Lv = 0.06 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(zVuota);
        disegnaConchiglia(ctx, xVuota, yVuota, Lv, -1, CONCHIGLIE[p.vuota.conchiglia], zVuota, true);
      },
    });
    if (p.x !== null) {
      disegni.push({
        z: p.z,
        fai: () => {
          const L = p.lunghezza(larghezza, altezza);
          disegnaPaguro(ctx, p, L, CONCHIGLIE[p.conchiglia]);
          // Se è passato dietro un corallo o una roccia, l'oggetto lo copre.
          this.fondale.ridisegnaDavanti(ctx, p.z, p.x - L * 0.9, p.y - L * 1.1, p.x + L * 0.9, p.y + L * 0.2);
        },
      });
    }
    // Il polpo fuori dalla grotta.
    const o = this.polpo;
    if (!o.dentroTana && o.x !== null) {
      disegni.push({
        z: o.z,
        fai: () => {
          const Lo = o.lunghezza(larghezza, altezza);
          disegnaPolpo(ctx, o, Lo);
          this.fondale.ridisegnaDavanti(ctx, o.z, o.x - Lo, o.y - Lo, o.x + Lo, o.y + Lo * 0.3);
        },
      });
    }
    const g = this.gambero;
    if (g.pronto) {
      disegni.push({
        z: g.z,
        fai: () => {
          const Lg = g.lunghezza(larghezza, altezza);
          disegnaGambero(ctx, g, Lg);
          // Quando è sceso sulla sabbia, gli oggetti davanti a lui lo coprono.
          if (!g.inCima()) this.fondale.ridisegnaDavanti(ctx, g.z, g.x - Lg, g.y - Lg, g.x + Lg, g.y + Lg * 0.2);
        },
      });
    }
    // I cavallucci (in acqua, ma coperti dagli oggetti che hanno davanti).
    for (const c of this.cavallucci.coppia) {
      if (c.x === null) continue;
      disegni.push({
        z: c.z,
        fai: () => {
          const Lc = this.cavallucci.lunghezza(c, larghezza, altezza);
          disegnaCavalluccio(ctx, c, Lc);
          this.fondale.ridisegnaDavanti(ctx, c.z, c.x - Lc * 0.5, c.y - Lc, c.x + Lc * 0.5, c.y + Lc * 0.4);
        },
      });
    }
    const s = this.seppia;
    if (s.x !== null) {
      disegni.push({
        z: s.z,
        fai: () => {
          const Ls = s.lunghezza(larghezza, altezza);
          disegnaSeppia(ctx, s, Ls);
          this.fondale.ridisegnaDavanti(ctx, s.z, s.x - Ls * 0.7, s.y - Ls * 0.5, s.x + Ls * 0.7, s.y + Ls * (0.3 + s.alto));
        },
      });
    }
    disegni.sort((a, b) => a.z - b.z);
    for (const d of disegni) d.fai();
    // La nuvola d'inchiostro sta davanti a tutto.
    o.inchiostro.disegna(ctx);
  }
}
