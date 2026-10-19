// Punto di partenza del gioco: prepara il canvas e avvia il "ciclo"
// che ridisegna l'acquario a ogni fotogramma (circa 60 volte al secondo).

import { Acqua } from './disegno/acqua.js';
import { RaggiDiLuce } from './disegno/luce.js';
import { Bolle } from './disegno/bolle.js';
import { Particelle } from './disegno/particelle.js';
import { Fondale } from './disegno/fondale.js';
import { Piante } from './disegno/piante.js';
import { Caustiche } from './disegno/caustiche.js';
import { Pesci } from './pesci/pesci.js';
import { BancoLontano } from './disegno/bancoLontano.js';

const canvas = document.getElementById('vasca');
const ctx = canvas.getContext('2d');

// Misure della vasca in "punti" dello schermo (non in pixel fisici).
let larghezza = 0;
let altezza = 0;

// Gli schermi Retina dell'iPad hanno 2 o 3 pixel fisici per punto.
// Disegniamo al massimo a 2× : nitido, ma senza appesantire l'iPad.
const MAX_DENSITA = 2;

const acqua = new Acqua();
const luce = new RaggiDiLuce();
const particelle = new Particelle();
const bolle = new Bolle();
const fondale = new Fondale();
const piante = new Piante(fondale);
const caustiche = new Caustiche(fondale);
const pesci = new Pesci(fondale);
const bancoLontano = new BancoLontano(fondale);

function adattaAlloSchermo() {
  const densita = Math.min(window.devicePixelRatio || 1, MAX_DENSITA);
  larghezza = window.innerWidth;
  altezza = window.innerHeight;

  canvas.width = Math.round(larghezza * densita);
  canvas.height = Math.round(altezza * densita);

  // Da qui in poi possiamo ragionare in punti: il canvas scala da solo.
  ctx.setTransform(densita, 0, 0, densita, 0, 0);
}

// dt = secondi passati dal fotogramma precedente.
function aggiorna(dt) {
  luce.aggiorna(dt);
  particelle.aggiorna(dt);
  piante.aggiorna(dt);
  caustiche.aggiorna(dt);
  bolle.aggiorna(dt, larghezza, altezza, fondale);
  pesci.aggiorna(dt, larghezza, altezza);
  bancoLontano.aggiorna(dt, larghezza, altezza);
}

// L'ordine conta: ciò che è disegnato dopo appare davanti.
// Dal più lontano al più vicino, come i fogli di un teatrino.
function disegna() {
  acqua.disegna(ctx, larghezza, altezza);
  fondale.disegnaLontano(ctx, larghezza, altezza);
  // Il banco lontano passa nella foschia, dietro le alghe lontane.
  bancoLontano.disegna(ctx);
  piante.disegnaLontane(ctx, larghezza, altezza);
  // Sabbia e oggetti dietro lo scoglio, poi le piante che stanno lì.
  fondale.disegnaVicino(ctx, larghezza, altezza);
  // La rete di luce sulla sabbia (gli oggetti davanti la coprono, come le ombre).
  caustiche.disegna(ctx, larghezza, altezza);
  piante.disegnaDietro(ctx, larghezza, altezza);
  pesci.disegna(ctx, 'dietro', larghezza, altezza);
  // Scoglio centrale in due fogli: i pesci dentro la tana sono disegnati
  // in mezzo, così la roccia davanti li copre.
  fondale.scoglio.disegnaRetro(ctx);
  pesci.disegna(ctx, 'tana', larghezza, altezza);
  fondale.scoglio.disegnaFronte(ctx);
  piante.disegnaSulloScoglio(ctx, larghezza, altezza);
  // Oggetti e piante davanti allo scoglio, verso di noi.
  fondale.disegnaPrimoPiano(ctx, larghezza, altezza);
  piante.disegnaDavanti(ctx, larghezza, altezza);
  pesci.disegna(ctx, 'davanti', larghezza, altezza);
  luce.disegna(ctx, larghezza, altezza);
  particelle.disegna(ctx, larghezza, altezza);
  bolle.disegna(ctx);
}

let istantePrecedente = null;

function ciclo(istante) {
  // Se la pagina è stata in secondo piano, non facciamo "saltare" tutto in avanti.
  const dt = istantePrecedente === null ? 0 : Math.min((istante - istantePrecedente) / 1000, 0.1);
  istantePrecedente = istante;

  aggiorna(dt);
  disegna();
  requestAnimationFrame(ciclo);
}

// Quando l'iPad viene ruotato o la finestra cambia misura, ricalcoliamo tutto.
window.addEventListener('resize', adattaAlloSchermo);
window.addEventListener('orientationchange', adattaAlloSchermo);

adattaAlloSchermo();
requestAnimationFrame(ciclo);
