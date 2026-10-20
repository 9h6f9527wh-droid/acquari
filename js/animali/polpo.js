// Il polpo: vive nella grotta dello scoglio.
//
// Cosa fa:
//  - tana:      sta nella grotta, al buio; si intravedono occhi e tentacoli;
//  - esce:      striscia fuori dalla grotta, verso di noi;
//  - striscia:  cammina sulla sabbia allungando i tentacoli sul fondo;
//  - nuota:     per gli spostamenti lunghi nuota "a getto", la testa davanti
//               e i tentacoli dietro, a spinte;
//  - riposa:    si ferma e cambia colore per mimetizzarsi con la sabbia;
//  - torna:     rientra nella grotta.
//  - spavento:  se lo tocchi diventa scuro, spruzza una nuvola d'inchiostro e
//               scappa a getto nella grotta.
//
// Come il paguro, cammina su più profondità senza attraversare gli oggetti
// (e se passa dietro a un corallo, il corallo lo copre).

import { Z_SCOGLIO } from '../disegno/fondale.js';
import { Zampe } from './zampe.js';

// I tentacoli camminano come zampe: le punte restano appoggiate sulla sabbia
// finché il corpo non le supera, poi si staccano, si allungano in avanti ad
// arco e si riappoggiano. Per ogni tentacolo: dove appoggia la punta rispetto
// al corpo (dietro/davanti, in lunghezze del polpo) e a che profondità
// (positivo = verso di noi, più in basso sullo schermo; negativo = verso il fondo).
export const BRACCIA = [
  { avanti: -0.6, profondita: -0.06 },
  { avanti: -0.48, profondita: 0.12 },
  { avanti: -0.3, profondita: -0.09 },
  { avanti: -0.14, profondita: 0.17 },
  { avanti: 0.1, profondita: 0.15 },
  { avanti: 0.28, profondita: -0.08 },
  { avanti: 0.46, profondita: 0.1 },
  { avanti: 0.6, profondita: -0.05 },
];

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

const Z_FUORI = Z_SCOGLIO + 0.09; // appena fuori dalla grotta
const Z_MAX = 0.75;
const SPESSORE = 0.07;

// ---------- La nuvola d'inchiostro ----------

export class Inchiostro {
  constructor() {
    this.sbuffi = [];
  }

  spruzza(x, y, verso, L) {
    for (let i = 0; i < 22; i++) {
      const a = casuale(-1.2, 1.2) + (verso > 0 ? Math.PI : 0);
      const v = casuale(0.3, 1.4) * L;
      this.sbuffi.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - L * 0.1,
        r: L * casuale(0.08, 0.18),
        cresce: L * casuale(0.15, 0.35),
        vita: 0,
        durata: casuale(4, 6.5),
      });
    }
  }

  aggiorna(dt) {
    for (const s of this.sbuffi) {
      s.vita += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 1 - dt * 1.4; // l'acqua frena la nuvola
      s.vy *= 1 - dt * 1.4;
      s.r += s.cresce * dt;
    }
    this.sbuffi = this.sbuffi.filter((s) => s.vita < s.durata);
  }

  disegna(ctx) {
    for (const s of this.sbuffi) {
      const alfa = 0.55 * (1 - s.vita / s.durata) ** 1.5;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(12, 8, 18, ${alfa})`);
      g.addColorStop(1, 'rgba(12, 8, 18, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- Il polpo ----------

export class Polpo {
  constructor(fondale) {
    this.fondale = fondale;
    this.stato = 'tana';
    this.attesa = casuale(5, 9); // la prima uscita arriva presto
    this.tempo = 0;
    this.x = null;
    this.y = 0;
    this.z = Z_SCOGLIO - 0.01;
    this.verso = 1;
    this.dentroTana = true;
    this.buio = 0.6;
    this.mimetismo = 0; // 0 = colore suo (rosso-arancio), 1 = color sabbia
    this.spaventato = 0; // diventa scuro di colpo quando si spaventa
    this.posa = 'terra'; // "terra" (striscia o riposa) oppure "nuoto"
    this.angolo = 0; // direzione del nuoto
    this.movimento = 0; // quanto si stanno muovendo i tentacoli
    this.inchiostro = new Inchiostro();
    this.braccia = new Zampe(BRACCIA.length, { passo: 0.32, durata: 0.45, alzata: 0.14 });
  }

  lunghezza(larghezza, altezza) {
    return 0.1 * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  suolo(x, z, larghezza, altezza) {
    return this.fondale.profondita(Math.min(1, Math.max(0, x / larghezza)), z) * altezza;
  }

  // Se nel punto (x, z) finirebbe dentro un oggetto, il centro dell'oggetto; se no null.
  // Contano anche gli altri animali sulla sabbia (paguro, conchiglia, gambero).
  scontro(x, z, L) {
    for (const o of this.fondale.ingombri || []) {
      if (o.x1 > x - L * 0.6 && o.x0 < x + L * 0.6 && Math.abs(o.z - z) < SPESSORE) return (o.x0 + o.x1) / 2;
    }
    const a = this.animaleVicino(x, z, L);
    return a ? a.x : null;
  }

  // Un altro animale che starebbe addosso al polpo nel punto (x, z), o null.
  animaleVicino(x, z, L) {
    return this.fondale.animaleVicino ? this.fondale.animaleVicino(this, x, z, L * 0.7) : null;
  }

  // Una meta sulla sabbia (x e profondità) raggiungibile senza attraversare niente.
  scegliMeta(larghezza, L) {
    for (let tentativo = 0; tentativo < 30; tentativo++) {
      const x = casuale(0.08, 0.92) * larghezza;
      const z = casuale(Z_FUORI, Z_MAX);
      let libero = true;
      for (let k = 1; k <= 24 && libero; k++) {
        const q = k / 24;
        if (this.scontro(this.x + (x - this.x) * q, this.z + (z - this.z) * q, L) !== null) libero = false;
      }
      if (libero && this.scontro(x, z, L) === null) return { x, z };
    }
    return null;
  }

  // Parte verso una meta: strisciando se è vicina, nuotando se è lontana.
  // Con "nuotando" va a nuoto anche se è vicina (per passare sopra a qualcuno).
  vaiA(meta, larghezza, prossimo, nuotando = false) {
    this.meta = meta;
    this.angolo = meta.x >= this.x ? 0 : Math.PI;
    this.partenza = { x: this.x, z: this.z, y: this.y };
    this.prossimo = prossimo;
    this.stato = nuotando || Math.abs(meta.x - this.x) > larghezza * 0.3 ? 'nuota' : 'striscia';
    this.verso = Math.sign(meta.x - this.x) || this.verso;
  }

  // Tocco sullo schermo: se tocca il polpo (fuori dalla tana), si spaventa.
  tocco(x, y, larghezza, altezza) {
    if (this.dentroTana || this.stato === 'spavento' || this.x === null) return false;
    const L = this.lunghezza(larghezza, altezza);
    const cy = this.posa === 'nuoto' ? this.y : this.y - L * 0.3;
    if (Math.hypot(x - this.x, y - cy) > L * 0.8) return false;
    this.inchiostro.spruzza(this.x, cy, this.verso, L);
    this.spaventato = 1;
    this.mimetismo = 0;
    const g = this.fondale.scoglio.grotta;
    this.verso = Math.sign(g.x - this.x) || 1;
    this.vaiA({ x: g.x, z: Z_FUORI }, 0, 'entra');
    this.stato = 'spavento';
    return true;
  }

  aggiorna(dt, larghezza, altezza) {
    this.tempo += dt;
    this.inchiostro.aggiorna(dt);
    const s = this.fondale.scoglio;
    if (!s.grotta) return;
    const g = s.grotta;
    const L = this.lunghezza(larghezza, altezza);
    if (this.x === null) {
      this.x = g.x;
      this.y = g.y;
    }
    let muove = 0;

    if (this.stato === 'tana') {
      // Nella grotta: si muove appena, al buio.
      this.posa = 'terra';
      this.dentroTana = true;
      this.x = g.x + Math.sin(this.tempo * 0.25) * g.rx * 0.15;
      this.y = g.y;
      this.z = Z_SCOGLIO - 0.01;
      this.attesa -= dt;
      // Esce solo se davanti alla grotta non c'è nessuno.
      if (this.attesa <= 0 && !this.animaleVicino(g.x, Z_FUORI, L)) this.stato = 'esce';
    } else if (this.stato === 'esce') {
      // Striscia fuori, verso di noi (la profondità aumenta).
      this.z = Math.min(Z_FUORI, this.z + dt * 0.05);
      this.y = this.suolo(this.x, this.z, larghezza, altezza);
      if (this.z > Z_SCOGLIO + 0.04) this.dentroTana = false;
      muove = 0.6;
      if (this.z >= Z_FUORI) {
        const meta = this.scegliMeta(larghezza, L);
        if (meta) this.vaiA(meta, larghezza, 'riposa');
        else this.stato = 'torna';
      }
    } else if (this.stato === 'striscia' || this.stato === 'nuota' || this.stato === 'spavento') {
      const veloce = this.stato === 'spavento';
      const nuoto = this.stato !== 'striscia';
      this.posa = nuoto ? 'nuoto' : 'terra';
      // Il nuoto è a spinte: veloce durante la spinta, poi plana.
      const spinta = nuoto ? 0.35 + 1.5 * Math.max(0, Math.sin(this.tempo * (veloce ? 5 : 3))) ** 2 : 1;
      const v = L * (nuoto ? (veloce ? 2.4 : 1.1) : 0.32) * spinta;
      let dx = this.meta.x - this.x;
      if (!nuoto) {
        // Strisciando non passa sopra agli altri animali: se il prossimo passo
        // lo porterebbe addosso a qualcuno, fa un piccolo balzo a nuoto e lo
        // scavalca (come fanno i polpi veri).
        const passo = this.x + Math.sign(dx) * L * 0.15;
        const davanti = this.animaleVicino(passo, this.z, L);
        if (davanti && Math.sign(davanti.x - this.x) === Math.sign(dx)) {
          this.vaiA(this.meta, larghezza, this.prossimo, true);
          return this.aggiorna(0, larghezza, altezza);
        }
      } else if (this.posa === 'nuoto' && this.stato !== 'spavento') {
        // Prima di posarsi controlla che il punto d'arrivo sia ancora libero:
        // se nel frattempo è arrivato qualcuno, sceglie un altro posto.
        const tratto0 = this.meta.x - this.partenza.x;
        const fatto0 = Math.abs(tratto0) > 1 ? (this.x - this.partenza.x) / tratto0 : 1;
        if (fatto0 > 0.6 && this.prossimo !== 'entra' && this.animaleVicino(this.meta.x, this.meta.z, L)) {
          const nuova = this.scegliMeta(larghezza, L);
          if (nuova) {
            this.vaiA(nuova, larghezza, this.prossimo, true);
            dx = this.meta.x - this.x;
          }
        }
      }
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
      const tratto = this.meta.x - this.partenza.x;
      const fatto = Math.abs(tratto) > 1 ? Math.min(1, Math.max(0, (this.x - this.partenza.x) / tratto)) : 1;
      this.z = this.partenza.z + (this.meta.z - this.partenza.z) * fatto;
      const terra = this.suolo(this.x, this.z, larghezza, altezza);
      // Nuotando fa un arco sopra il fondo; strisciando resta a terra.
      const primaX = this.x - Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
      const primaY = this.y;
      this.y = nuoto ? terra - Math.sin(Math.PI * fatto) * altezza * 0.12 : terra;
      if (nuoto) {
        // La testa punta dove sta andando (cambia direzione gradualmente).
        const voluto = Math.atan2(this.y - primaY, this.x - primaX || Math.sign(dx) * 0.001);
        let diff = voluto - this.angolo;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angolo += diff * Math.min(1, dt * 4);
      }
      muove = nuoto ? spinta : 1;
      if (Math.abs(dx) < 1) {
        this.posa = 'terra';
        this.y = terra;
        if (this.prossimo === 'entra') this.stato = 'entra';
        else {
          this.stato = 'riposa';
          this.attesa = casuale(8, 15);
        }
      }
    } else if (this.stato === 'riposa') {
      // Fermo: cambia colore piano piano, fino a confondersi con la sabbia.
      this.mimetismo = Math.min(1, this.mimetismo + dt * 0.4);
      this.attesa -= dt;
      if (this.attesa <= 0) {
        const meta = Math.random() < 0.6 ? this.scegliMeta(larghezza, L) : null;
        if (meta) this.vaiA(meta, larghezza, 'riposa');
        else this.stato = 'torna';
      }
    } else if (this.stato === 'torna') {
      this.vaiA({ x: g.x, z: Z_FUORI }, larghezza, 'entra');
    } else if (this.stato === 'entra') {
      // Rientra nella grotta (la profondità diminuisce).
      this.posa = 'terra';
      this.dentroTana = this.z < Z_SCOGLIO + 0.06;
      this.z = Math.max(Z_SCOGLIO - 0.01, this.z - dt * 0.06);
      this.x += (g.x - this.x) * Math.min(1, dt * 2);
      this.y = this.z <= Z_SCOGLIO ? g.y : this.suolo(this.x, this.z, larghezza, altezza);
      this.dentroTana = true;
      muove = 0.6;
      if (this.z <= Z_SCOGLIO - 0.01) {
        this.stato = 'tana';
        this.attesa = casuale(20, 45);
      }
    }

    // Tentacoli: a terra camminano come zampe; nel nuoto stanno dietro, sciolti.
    if (this.posa === 'terra') {
      const stretto = this.dentroTana ? 0.55 : 1; // nella grotta sta raccolto
      const fondo = this.dentroTana ? () => g.y : (x) => this.suolo(x, this.z, larghezza, altezza);
      const riposo = BRACCIA.map((b) => this.x + this.verso * b.avanti * L * stretto);
      this.braccia.aggiorna(dt, riposo, (x, i) => fondo(x) + BRACCIA[i].profondita * L * stretto, L);
    } else {
      this.braccia.stacca();
    }

    // Quando si muove torna al suo colore; lo spavento svanisce piano.
    if (this.stato !== 'riposa') this.mimetismo = Math.max(0, this.mimetismo - dt * 0.6);
    this.spaventato = Math.max(0, this.spaventato - dt * 0.25);
    this.movimento += (muove - this.movimento) * Math.min(1, dt * 4);
    this.buio += ((this.dentroTana ? 0.6 : 0) - this.buio) * Math.min(1, dt * 1.5);
  }
}
