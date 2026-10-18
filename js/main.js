// Punto di partenza del gioco: prepara il canvas e avvia il "ciclo"
// che ridisegna l'acquario a ogni fotogramma (circa 60 volte al secondo).

import { disegnaAcqua } from './disegno/acqua.js';
import { RaggiDiLuce } from './disegno/luce.js';
import { Bolle } from './disegno/bolle.js';

const canvas = document.getElementById('vasca');
const ctx = canvas.getContext('2d');

// Misure della vasca in "punti" dello schermo (non in pixel fisici).
let larghezza = 0;
let altezza = 0;

// Gli schermi Retina dell'iPad hanno 2 o 3 pixel fisici per punto.
// Disegniamo al massimo a 2× : nitido, ma senza appesantire l'iPad.
const MAX_DENSITA = 2;

const luce = new RaggiDiLuce();
const bolle = new Bolle();

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
  bolle.aggiorna(dt, larghezza, altezza);
}

// L'ordine conta: ciò che è disegnato dopo appare davanti.
function disegna() {
  disegnaAcqua(ctx, larghezza, altezza);
  luce.disegna(ctx, larghezza, altezza);
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
