// Le schede delle specie: aspetto e modo di nuotare.
// Ogni specie nuova (dalla Fase 4) si aggiunge qui con le sue caratteristiche.
//
// Misure:
//  - "lunghezza" è una frazione della misura della vasca (vedi fondale.misuraBase):
//    così il pesce resta proporzionato su ogni schermo;
//  - "altezza" è quanto è alto il corpo rispetto alla lunghezza;
//  - le velocità sono in "lunghezze del pesce al secondo".

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
      occhio: { h: 20, s: 60, l: 18 },
    },
    // Bande bianche: posizione lungo il corpo e mezza larghezza.
    bande: [
      { dove: 0.2, larghezza: 0.05, curva: 0.035 },
      { dove: 0.52, larghezza: 0.055, curva: 0.05 },
      { dove: 0.88, larghezza: 0.03, curva: 0.01 },
    ],
    nuoto: {
      crociera: 1.1, // velocità normale
      scatto: 2.6, // velocità degli scatti
      virata: 1.4, // quanto in fretta cambia inclinazione (radianti al secondo)
      battito: 3.2, // colpi di coda al secondo a riposo
      dimenio: 0.9, // quanto si dimena: il pagliaccio nuota "a scatti" e ondeggiando
    },
    // Dove si sente a casa (vedi pesce.js): il pagliaccio vive tra i tentacoli
    // dell'anemone (la roccia con l'anemone arancione è la numero 0).
    anemone: 0,
  },
};
