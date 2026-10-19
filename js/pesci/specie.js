// Le schede delle specie: aspetto, modo di nuotare e abitudini.
// Ogni specie nuova si aggiunge qui con le sue caratteristiche: il disegno
// (disegno/pesce.js) e il "cervello" (pesci/pesce.js) le leggono da qui.
//
// Misure:
//  - "lunghezza" è una frazione della misura della vasca (vedi fondale.misuraBase):
//    così il pesce resta proporzionato su ogni schermo;
//  - "altezza" è quanto è alto il corpo rispetto alla lunghezza;
//  - le velocità sono in "lunghezze del pesce al secondo".
//
// Posizioni sul corpo: "s" va dal muso (0) all'attacco della coda (1);
// "v" va dal dorso (-1) al ventre (1), passando per il centro (0).
//
// Pinne:
//  - dorsali e anali: da dove a dove stanno (s), quanto sono alte (rispetto
//    all'altezza del corpo), la forma ("doppia", "lunga", "spina", "vela")
//    e quanto sono piegate all'indietro;
//  - coda: "ventaglio" (tonda), "tronca" (dritta con le punte), "forcuta" (a V).
//
// Disegni sulla pelle ("decori"):
//  - "bande": strisce verticali (con o senza bordo);
//  - "forma": una macchia di colore disegnata con dei punti (s, v), con
//    eventuali "buchi" dentro;
//  - "puntini": tanti puntini in una zona del corpo.

import { creaCasuale } from '../util/casuale.js';

// Puntini sparsi ma sempre uguali (seme fisso), in una zona del corpo.
function puntini(seme, quanti, s0, s1, v0, v1, misura) {
  const caso = creaCasuale(seme);
  return Array.from({ length: quanti }, () => ({ s: caso.tra(s0, s1), v: caso.tra(v0, v1), r: misura * caso.tra(0.7, 1.3) }));
}

export const SPECIE = {
  pagliaccio: {
    nome: 'Pesce pagliaccio',
    lunghezza: 0.07,
    altezza: 0.5,
    // Forma del corpo dal muso (0) all'attacco della coda (1): metà altezza in ogni punto.
    profilo: [
      [0, 0.0], [0.04, 0.5], [0.12, 0.78], [0.3, 0.97], [0.5, 1.0],
      [0.7, 0.8], [0.86, 0.45], [1, 0.32],
    ],
    colori: {
      corpo: { h: 22, s: 95, l: 50 },
      ventre: { h: 32, s: 95, l: 62 },
      bande: { h: 40, s: 30, l: 96 },
      bordi: { h: 20, s: 30, l: 8 },
      pinne: { h: 24, s: 95, l: 52 },
      coda: { h: 24, s: 95, l: 52 },
      occhio: { h: 20, s: 60, l: 18 },
    },
    pinne: {
      dorsali: [{ da: 0.3, a: 0.82, altezza: 0.2, forma: 'doppia', piega: 0.35 }],
      anali: [{ da: 0.58, a: 0.82, altezza: 0.18, forma: 'lunga', piega: 0.3 }],
      coda: { forma: 'ventaglio', lunghezza: 0.26 },
      ventrale: { misura: 1 },
    },
    decori: [
      {
        tipo: 'bande', colore: 'bande', bordo: 'bordi',
        elenco: [
          { dove: 0.2, larghezza: 0.05, curva: 0.035 },
          { dove: 0.52, larghezza: 0.055, curva: 0.05 },
          { dove: 0.88, larghezza: 0.03, curva: 0.01 },
        ],
      },
    ],
    occhio: { dove: 0.1, misura: 0.11 },
    nuoto: {
      crociera: 1.1, // velocità normale
      scatto: 2.6, // velocità degli scatti
      virata: 1.4, // quanto in fretta cambia inclinazione (radianti al secondo)
      battito: 3.2, // colpi di coda al secondo a riposo
      dimenio: 0.9, // quanto si dimena: il pagliaccio nuota "a scatti" e ondeggiando
    },
    // Quanto spesso sceglie ogni comportamento (vedi pesce.js).
    comportamenti: { vaga: 0.55, anemone: 0.17, grotta: 0.16, passaggio: 0.12 },
    // Il pagliaccio vive tra i tentacoli dell'anemone (quello arancione, sulla roccia 0).
    anemone: 0,
  },

  chirurgo: {
    nome: 'Pesce chirurgo blu',
    lunghezza: 0.1,
    altezza: 0.56,
    // Corpo ovale e alto, muso piccolo e appuntito.
    profilo: [
      [0, 0.0], [0.05, 0.35], [0.15, 0.7], [0.32, 0.95], [0.5, 1.0],
      [0.7, 0.85], [0.88, 0.45], [1, 0.22],
    ],
    colori: {
      corpo: { h: 222, s: 85, l: 46 },
      ventre: { h: 205, s: 80, l: 60 },
      bordi: { h: 225, s: 60, l: 8 },
      tavolozza: { h: 225, s: 70, l: 9 },
      pinne: { h: 222, s: 80, l: 44 },
      coda: { h: 50, s: 95, l: 55 },
      pettorale: { h: 48, s: 90, l: 58 },
      occhio: { h: 225, s: 40, l: 12 },
    },
    pinne: {
      // Pinne dorsale e anale lunghe e basse, che corrono lungo il corpo.
      dorsali: [{ da: 0.14, a: 0.9, altezza: 0.16, forma: 'lunga', piega: 0.25, bordoNero: true }],
      anali: [{ da: 0.42, a: 0.9, altezza: 0.15, forma: 'lunga', piega: 0.25, bordoNero: true }],
      coda: { forma: 'tronca', lunghezza: 0.24, bordi: true },
      ventrale: { misura: 0.8 },
      pettorale: 'pettorale',
    },
    decori: [
      {
        // La famosa "tavolozza" nera: una fascia che parte dall'occhio, corre
        // lungo il dorso fino alla coda e racchiude una macchia blu.
        tipo: 'forma', colore: 'tavolozza',
        punti: [
          [0.1, -0.3], [0.3, -0.8], [0.55, -0.9], [0.78, -0.7], [0.94, -0.35], [1.05, -0.1],
          [1.05, 0.3], [0.88, 0.22], [0.72, 0.38], [0.55, 0.5], [0.38, 0.38], [0.22, 0.15], [0.12, 0.05],
        ],
        buchi: [[[0.33, -0.3], [0.45, -0.58], [0.63, -0.6], [0.74, -0.38], [0.62, -0.12], [0.43, -0.08]]],
      },
    ],
    // Il "bisturi" giallo vicino alla coda, da cui prende il nome.
    bisturi: true,
    occhio: { dove: 0.12, misura: 0.1 },
    nuoto: {
      crociera: 1.0,
      scatto: 2.2,
      virata: 1.2,
      battito: 2.2, // nuota soprattutto con le pinne pettorali: coda più calma
      dimenio: 0.55,
    },
    // È troppo grande per la grotta e il tunnel: gira per la vasca e
    // perlustra il fondo (più avanti brucherà le alghe sulle rocce).
    comportamenti: { vaga: 0.6, perlustra: 0.4 },
  },

  banggai: {
    nome: 'Pesce cardinale di Banggai',
    lunghezza: 0.06,
    altezza: 0.52,
    profilo: [
      [0, 0.0], [0.05, 0.55], [0.15, 0.85], [0.3, 1.0], [0.5, 0.95],
      [0.7, 0.72], [0.88, 0.4], [1, 0.3],
    ],
    colori: {
      corpo: { h: 200, s: 12, l: 70 },
      ventre: { h: 45, s: 15, l: 84 },
      barre: { h: 220, s: 20, l: 10 },
      bordi: { h: 220, s: 20, l: 10 },
      pinne: { h: 210, s: 10, l: 64 },
      coda: { h: 210, s: 10, l: 64 },
      puntini: { h: 0, s: 0, l: 97 },
      occhio: { h: 45, s: 30, l: 40 },
    },
    pinne: {
      // Prima dorsale alta e appuntita, seconda dorsale e anale a "vela" allungata.
      dorsali: [
        { da: 0.22, a: 0.36, altezza: 0.45, forma: 'spina', piega: 0.3, scura: true },
        { da: 0.44, a: 0.66, altezza: 0.42, forma: 'vela', piega: 0.75, scura: true, puntini: true },
      ],
      anali: [{ da: 0.46, a: 0.68, altezza: 0.38, forma: 'vela', piega: 0.75, scura: true, puntini: true }],
      coda: { forma: 'forcuta', lunghezza: 0.32, bordi: true },
      ventrale: { misura: 1.6, scura: true },
    },
    decori: [
      {
        tipo: 'bande', colore: 'barre',
        elenco: [
          { dove: 0.1, larghezza: 0.045, curva: 0 },
          { dove: 0.32, larghezza: 0.06, curva: 0.01 },
          { dove: 0.57, larghezza: 0.05, curva: 0.01 },
        ],
      },
      { tipo: 'puntini', colore: 'puntini', elenco: puntini(7, 18, 0.62, 1.0, -0.7, 0.7, 0.011) },
    ],
    occhio: { dove: 0.1, misura: 0.16 },
    nuoto: {
      crociera: 0.8, // è un pesce calmo, che in sosta resta quasi fermo, sospeso
      scatto: 1.8,
      virata: 1.1,
      battito: 1.8,
      dimenio: 0.45,
    },
    // Vive in un piccolo gruppo (vedi banco.js): stanno vicini e si muovono insieme.
    comportamenti: { banco: 1 },
  },
};
