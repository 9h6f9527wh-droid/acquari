// Numeri casuali "con seme": partendo dallo stesso numero (il seme) escono
// sempre gli stessi valori. Così la vasca ha sempre le stesse rocce e piante
// ogni volta che apri il gioco, invece di cambiare a ogni ricarica.

export function creaCasuale(seme) {
  let s = seme >>> 0;
  // Algoritmo "mulberry32": piccolo, veloce e abbastanza vario per un gioco.
  function prossimo() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    prossimo,
    tra: (min, max) => min + prossimo() * (max - min),
    intero: (min, max) => Math.floor(min + prossimo() * (max - min + 1)),
  };
}
