// Il "cervello" di un pesce: decide dove andare e come muoversi.
// Il disegno sta in disegno/pesce.js: qui ci sono solo posizioni e decisioni.
//
// Posizione: x, y in punti dello schermo, più la profondità z (come gli oggetti
// del fondale: 0 = lontano, 1 = vicino al vetro).
//
// Come nuota:
//  - guarda a destra o a sinistra ("direzione") e può inclinarsi un po' in su
//    o in giù ("inclinazione"), ma non nuota mai in verticale;
//  - per cambiare lato si gira: rallenta e ruota su se stesso ("verso" passa
//    piano da 1 a -1, e a metà giro lo vediamo di taglio, più stretto);
//  - alterna scatti e planate: accelera di colpo, poi scivola rallentando.
//
// Cosa fa (i "comportamenti", con frequenze diverse per ogni specie):
//  - vaga:      sceglie un punto qualsiasi della vasca e ci va;
//  - perlustra: nuota piano vicino al fondo, tra rocce e coralli;
//  - banco:     resta con il suo gruppo (vedi banco.js);
//  - anemone:   va a giocare tra i tentacoli dell'anemone, la sua casa;
//  - grotta:    entra nella grotta dello scoglio, riposa un po' al buio ed esce;
//  - passaggio: attraversa il tunnel dello scoglio e sbuca dall'altra parte.

import { Z_SCOGLIO } from '../disegno/fondale.js';

const Z_MIN = 0.12;
const Z_MAX = 0.95;

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

function avvicina(valore, obiettivo, passo) {
  if (Math.abs(obiettivo - valore) <= passo) return obiettivo;
  return valore + Math.sign(obiettivo - valore) * passo;
}

export class Pesce {
  constructor(specie, fondale, larghezza, altezza) {
    this.specie = specie;
    this.fondale = fondale;
    this.x = casuale(0.15, 0.85) * larghezza;
    this.y = casuale(0.25, 0.6) * altezza;
    this.z = casuale(0.45, 0.85);
    this.direzione = Math.random() < 0.5 ? 1 : -1; // 1 = guarda a destra
    this.verso = this.direzione; // per il disegno: da -1 a 1 durante le girate
    this.inclinazione = 0;
    this.velocita = 0; // in lunghezze al secondo
    this.velocitaVoluta = specie.nuoto.crociera;
    this.prossimoScatto = casuale(0.5, 2);
    this.fase = Math.random() * Math.PI * 2; // ritmo della coda
    this.ampiezza = 1; // quanto si piega la coda
    this.buio = 0; // 0 = alla luce, 1 = nel buio della grotta
    this.dentroTana = false; // se vero, va disegnato in mezzo ai fogli dello scoglio
    this.obiettivo = null;
    this.comportamento = null;
    this.tempoBattito = 0;
  }

  // Lunghezza del pesce in punti, alla sua profondità attuale.
  lunghezza(larghezza, altezza) {
    return this.specie.lunghezza * this.fondale.misuraBase(larghezza, altezza) * this.fondale.scalaZ(this.z);
  }

  // ---------- Scelta di cosa fare ----------

  // Sceglie il prossimo comportamento a caso, ma secondo le abitudini della
  // sua specie (per esempio il pagliaccio va spesso all'anemone).
  scegli(larghezza, altezza) {
    const scelte = Object.entries(this.specie.comportamenti);
    const totale = scelte.reduce((somma, [, peso]) => somma + peso, 0);
    let r = Math.random() * totale;
    for (const [tipo, peso] of scelte) {
      r -= peso;
      if (r <= 0) {
        if (tipo === 'vaga') this.vaga(larghezza, altezza);
        else if (tipo === 'perlustra') this.perlustra(larghezza, altezza);
        else this.inizia(tipo);
        return;
      }
    }
    this.vaga(larghezza, altezza);
  }

  perlustra(larghezza, altezza) {
    const z = Math.min(Z_MAX, Math.max(Z_MIN, this.z + casuale(-0.2, 0.2)));
    const x = casuale(0.08, 0.92) * larghezza;
    const fondo = this.fondale.profondita(x / larghezza, z) * altezza;
    const L = this.lunghezza(larghezza, altezza);
    this.comportamento = { tipo: 'vaga' };
    this.obiettivo = { x, y: fondo - casuale(1.2, 2.5) * L, z, lento: true };
  }

  vaga(larghezza, altezza) {
    const z = Math.min(Z_MAX, Math.max(Z_MIN, this.z + casuale(-0.35, 0.35)));
    const x = casuale(0.08, 0.92) * larghezza;
    // Sotto la superficie e sopra la sabbia (alla sua profondità).
    const fondo = this.fondale.profondita(x / larghezza, z) * altezza;
    const y = casuale(altezza * 0.15, fondo - altezza * 0.08);
    this.comportamento = { tipo: 'vaga' };
    this.obiettivo = { x, y, z };
  }

  inizia(tipo) {
    this.comportamento = { tipo, passo: 0, attesa: 0 };
    this.obiettivo = null; // lo calcola aggiornaComportamento
  }

  // Ogni comportamento è fatto di "passi": quando il pesce arriva
  // all'obiettivo di un passo, passa al successivo.
  aggiornaComportamento(dt, larghezza, altezza, arrivato) {
    const c = this.comportamento;
    const scoglio = this.fondale.scoglio;
    const L = this.lunghezza(larghezza, altezza);

    if (c.tipo === 'vaga') {
      if (arrivato) this.scegli(larghezza, altezza);
      return;
    }

    if (c.tipo === 'banco') {
      // Il posto lo decide il banco: ognuno ha il suo, vicino agli altri.
      this.obiettivo = this.banco.posto(this, larghezza, altezza);
      return;
    }

    if (c.tipo === 'anemone') {
      const cima = this.fondale.cimeRocce[this.specie.anemone];
      if (!cima) return this.vaga(larghezza, altezza);
      if (c.passo === 0) {
        c.durata = casuale(5, 10);
        c.passo = 1;
      }
      // Gironzola sopra i tentacoli, cambiando punto ogni tanto.
      c.attesa -= dt;
      if (!this.obiettivo || arrivato || c.attesa <= 0) {
        this.obiettivo = { x: cima.x + casuale(-1.2, 1.2) * L, y: cima.y - casuale(0.4, 1.4) * L, z: cima.z + 0.02, lento: true };
        c.attesa = casuale(0.8, 1.6);
      }
      c.durata -= dt;
      if (c.durata <= 0) this.scegli(larghezza, altezza);
      return;
    }

    if (c.tipo === 'grotta') {
      const g = scoglio.grotta;
      const ingresso = { x: g.x, y: g.y - g.ry * 0.4 };
      if (c.passo === 0) {
        // 1. Va davanti all'ingresso. Se ora è dietro lo scoglio, prima ci gira
        //    intorno passando di lato (non può attraversare la roccia!).
        if (this.z < Z_SCOGLIO) {
          const lato = this.x < scoglio.cx ? -1 : 1;
          const x = Math.min(larghezza - L, Math.max(L, scoglio.cx + lato * (scoglio.rx + L * 2)));
          this.obiettivo = { x, y: scoglio.base - scoglio.H * 0.55, z: Z_SCOGLIO + 0.1 };
          return;
        }
        this.obiettivo = { x: ingresso.x, y: ingresso.y, z: Z_SCOGLIO + 0.06 };
        if (arrivato) {
          this.dentroTana = true;
          c.passo = 1;
          c.riposo = casuale(4, 9);
        }
      } else if (c.passo === 1) {
        // 2. Dentro: riposa al buio, muovendosi piano qua e là.
        c.attesa -= dt;
        if (arrivato || c.attesa <= 0) {
          this.obiettivo = {
            x: g.x + casuale(-0.5, 0.5) * g.rx,
            y: g.y - casuale(0.3, 0.6) * g.ry,
            z: Z_SCOGLIO - 0.02,
            lento: true,
          };
          c.attesa = casuale(1.5, 3);
        }
        c.riposo -= dt;
        if (c.riposo <= 0) {
          c.passo = 2;
          this.obiettivo = { x: ingresso.x, y: ingresso.y, z: Z_SCOGLIO + 0.06 };
        }
      } else if (c.passo === 2 && arrivato) {
        // 3. Esce e se ne va.
        this.dentroTana = false;
        this.vaga(larghezza, altezza);
      }
      return;
    }

    if (c.tipo === 'passaggio') {
      const p = scoglio.passaggio;
      if (c.passo === 0) {
        // Entra dal davanti o da dietro, a seconda di dove si trova ora.
        c.daDavanti = this.z >= Z_SCOGLIO;
        c.passo = 1;
      }
      const zDavanti = Z_SCOGLIO + 0.12;
      const zDietro = Z_SCOGLIO - 0.14;
      if (c.passo === 1) {
        // 1. Va all'imbocco del tunnel, dal suo lato.
        this.obiettivo = { x: p.x, y: p.y, z: c.daDavanti ? zDavanti : zDietro };
        if (arrivato) {
          this.dentroTana = true;
          c.passo = 2;
        }
      } else if (c.passo === 2) {
        // 2. Attraversa: resta nel tunnel e cambia profondità fino all'altro lato.
        this.obiettivo = { x: p.x + this.direzione * L * 0.2, y: p.y, z: c.daDavanti ? zDietro : zDavanti, lento: true, attraversa: true };
        const fine = c.daDavanti ? this.z <= zDietro + 0.01 : this.z >= zDavanti - 0.01;
        if (fine) {
          this.dentroTana = false;
          c.passo = 3;
          // 3. Sbuca dall'altra parte e si allontana restando sul nuovo lato.
          const x = (p.x / larghezza + casuale(0.2, 0.35) * (Math.random() < 0.5 ? -1 : 1)) * larghezza;
          this.obiettivo = { x: Math.min(larghezza * 0.92, Math.max(larghezza * 0.08, x)), y: p.y + casuale(-0.08, 0.04) * altezza, z: this.z };
        }
      } else if (c.passo === 3 && arrivato) {
        this.vaga(larghezza, altezza);
      }
    }
  }

  // ---------- Movimento ----------

  aggiorna(dt, larghezza, altezza) {
    if (!this.comportamento) this.scegli(larghezza, altezza);
    const n = this.specie.nuoto;
    const L = this.lunghezza(larghezza, altezza);

    // Arrivato all'obiettivo? (Per attraversare il tunnel conta solo la profondità.)
    const o = this.obiettivo;
    let arrivato = false;
    if (o) {
      const vicino = Math.hypot(o.x - this.x, o.y - this.y) < L * (o.lento ? 0.35 : 0.6);
      // Mentre vaga basta arrivare al punto: la profondità può restare indietro
      // (per esempio se lo scoglio gli impedisce di cambiare lato).
      arrivato = vicino && (this.comportamento.tipo === 'vaga' || Math.abs(o.z - this.z) < 0.05);
    }
    this.aggiornaComportamento(dt, larghezza, altezza, arrivato);
    const ob = this.obiettivo;
    if (!ob) return;

    const dx = ob.x - this.x;
    const dy = ob.y - this.y;
    const distanza = Math.hypot(dx, dy);

    // Girarsi: se l'obiettivo sta dall'altra parte, il pesce ruota su se stesso.
    // In banco, quando è al suo posto, guarda dalla stessa parte del gruppo.
    if (Math.abs(dx) > L * 0.4 && Math.sign(dx) !== this.direzione) this.direzione = Math.sign(dx);
    else if (ob.direzione && distanza < L * 0.8) this.direzione = ob.direzione;
    this.verso = avvicina(this.verso, this.direzione, dt * 2.6);
    const staGirando = Math.abs(this.verso) < 0.95;

    // Inclinazione verso l'obiettivo, ma mai troppo ripida.
    const inclinazioneVoluta = Math.max(-0.55, Math.min(0.55, Math.atan2(dy, Math.max(Math.abs(dx), L))));
    this.inclinazione = avvicina(this.inclinazione, ob.attraversa ? 0 : inclinazioneVoluta, n.virata * dt);

    // Velocità: scatti ogni tanto, poi planata; più lento vicino all'obiettivo.
    this.prossimoScatto -= dt;
    if (this.prossimoScatto <= 0) {
      this.velocitaVoluta = ob.lento ? n.crociera * 0.9 : n.scatto;
      this.prossimoScatto = casuale(1.2, 3.5);
      this.tempoScatto = 0.35;
    }
    if (this.tempoScatto > 0) {
      this.tempoScatto -= dt;
      if (this.tempoScatto <= 0) this.velocitaVoluta = n.crociera * (ob.lento ? 0.45 : 1);
    }
    let voluta = this.velocitaVoluta * Math.min(1, Math.max(0.15, distanza / (L * 3)));
    if (staGirando) voluta *= 0.35;
    if (ob.attraversa) voluta = 0.3;
    // Accelera in fretta, rallenta piano (planata).
    const accelera = voluta > this.velocita ? 4 : 1.2;
    this.velocita = avvicina(this.velocita, voluta, accelera * dt);

    // Spostamento.
    const passo = this.velocita * L * dt;
    this.x += Math.cos(this.inclinazione) * this.direzione * passo * Math.abs(this.verso);
    this.y += Math.sin(this.inclinazione) * passo;

    // Profondità: cambia piano piano. Mentre il pesce sta "sopra" lo scoglio non
    // può passare da davanti a dietro (sembrerebbe attraversare la roccia),
    // tranne quando usa il tunnel o la grotta.
    let zVoluta = ob.z;
    const libero = !this.dentroTana && !ob.attraversa;
    if (libero && this.fondale.scoglio.copre(this.x, this.y, L)) {
      zVoluta = this.z >= Z_SCOGLIO ? Math.max(zVoluta, Z_SCOGLIO + 0.02) : Math.min(zVoluta, Z_SCOGLIO - 0.02);
    }
    this.z = avvicina(this.z, zVoluta, dt * (ob.attraversa ? 0.18 : 0.11));

    // Limiti della vasca: dentro i vetri, sotto la superficie, sopra la sabbia.
    if (!this.dentroTana) {
      const fondo = this.fondale.profondita(Math.min(1, Math.max(0, this.x / larghezza)), this.z) * altezza - L * 0.35;
      this.x = Math.min(larghezza - L * 0.6, Math.max(L * 0.6, this.x));
      this.y = Math.min(fondo, Math.max(altezza * 0.08, this.y));
    }

    // Buio: si scurisce quando è dentro la grotta o il tunnel.
    this.buio = avvicina(this.buio, this.dentroTana ? 0.65 : 0, dt * 1.2);

    // Coda: batte più in fretta e più forte quando va veloce.
    const sforzo = this.velocita / n.crociera;
    this.fase += dt * Math.PI * 2 * n.battito * (0.55 + 0.6 * sforzo);
    this.ampiezza = avvicina(this.ampiezza, Math.min(1.1, 0.3 + 0.45 * sforzo) * n.dimenio, dt * 3);
  }

  // In quale strato va disegnato: dietro lo scoglio, dentro la tana o davanti.
  strato() {
    if (this.dentroTana) return 'tana';
    return this.z < Z_SCOGLIO ? 'dietro' : 'davanti';
  }
}
