// Disegna l'acqua della vasca: una sfumatura più chiara in alto
// (vicino alla luce) e più scura in basso (in profondità).

export function disegnaAcqua(ctx, larghezza, altezza) {
  const sfumatura = ctx.createLinearGradient(0, 0, 0, altezza);
  sfumatura.addColorStop(0.0, '#2f8fb0'); // superficie, illuminata
  sfumatura.addColorStop(0.35, '#13698c');
  sfumatura.addColorStop(0.75, '#0a4563');
  sfumatura.addColorStop(1.0, '#04263a'); // fondo, in ombra

  ctx.fillStyle = sfumatura;
  ctx.fillRect(0, 0, larghezza, altezza);
}
