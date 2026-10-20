// Colori condivisi da piante, pesci e decorazioni.
// I colori sono scritti come { h, s, l }: tonalità (0-360), saturazione e
// luminosità (0-100). È comodo per schiarirli, scurirli o velarli.

// Colore visto attraverso l'acqua: più è lontano (z piccolo), più si avvicina
// all'azzurro dell'acqua. È la stessa regola usata per rocce e coralli.
export function velaColore(c, z) {
  const f = 0.42 * Math.pow(1 - z, 1.4);
  return { h: c.h + (190 - c.h) * f * 0.5, s: c.s * (1 - f * 0.7), l: c.l + (42 - c.l) * f };
}

// Trasforma un colore in testo per il canvas, con un po' più (o meno) luce.
export function hsl(c, piuLuce = 0, alfa = 1) {
  return `hsla(${c.h}, ${c.s}%, ${Math.max(0, Math.min(92, c.l + piuLuce))}%, ${alfa})`;
}
