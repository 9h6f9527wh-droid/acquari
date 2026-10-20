// Coralli: sono rigidi, quindi non si muovono e vengono dipinti una volta
// sola insieme al fondale (non costano nulla a ogni fotogramma).
//
// Tipi:
//  - "ramificato": rami che si dividono in rami più piccoli, punte chiare
//  - "ventaglio":  gorgonia, una rete fitta di rametti sottili aperta a ventaglio
//  - "cervello":   cupola rotonda solcata da pieghe sinuose
//  - "tubi":       spugne a tubo, cilindri con l'apertura in cima
//
// Nello stesso file ci sono anche altri piccoli dettagli fermi del fondo:
//  - "stella":     stella marina (di solito appoggiata su una roccia)
//  - "ventaglietto": conchiglia a ventaglio (capasanta)
//  - "chiocciola": conchiglia a spirale
//
// Con "velo" attivo il corallo è disegnato come una sagoma sbiadita,
// per lo strato lontano.

const VELO = 'rgba(70, 140, 160, 0.24)';

function colore(c, piuLuce = 0, alfa = 1) {
  return `hsla(${c.h}, ${c.s}%, ${Math.min(92, c.l + piuLuce)}%, ${alfa})`;
}

// Un ramo e, a cascata, tutti i suoi rametti.
function ramo(ctx, caso, x, y, angolo, lunghezza, spessore, livello, opz, punte) {
  // Il ramo è un po' curvo: punto di controllo spostato di lato.
  const curva = caso.tra(-0.25, 0.25);
  const x2 = x + Math.sin(angolo) * lunghezza;
  const y2 = y - Math.cos(angolo) * lunghezza;
  const cx = x + Math.sin(angolo + curva) * lunghezza * 0.5;
  const cy = y - Math.cos(angolo + curva) * lunghezza * 0.5;

  ctx.lineWidth = spessore;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  if (opz.velo) {
    ctx.strokeStyle = VELO;
    ctx.stroke();
  } else {
    // Corpo, più chiaro man mano che si sale verso le punte.
    ctx.strokeStyle = colore(opz.colore, livello * 5 - 6);
    ctx.stroke();
    // Filo di luce sul lato in alto a sinistra.
    if (spessore > 1.6) {
      ctx.save();
      ctx.translate(-spessore * 0.22, -spessore * 0.15);
      ctx.lineWidth = spessore * 0.3;
      ctx.strokeStyle = colore(opz.colore, livello * 5 + 18, 0.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (livello >= opz.livelli) {
    punte.push({ x: x2, y: y2, r: spessore * 0.75 });
    return;
  }
  const figli = opz.figli === 2 || caso.prossimo() < 0.6 ? 2 : 3;
  for (let i = 0; i < figli; i++) {
    const apertura = figli === 1 ? 0 : (i / (figli - 1)) * 2 - 1;
    ramo(
      ctx, caso, x2, y2,
      angolo + apertura * opz.apertura + caso.tra(-0.15, 0.15),
      lunghezza * caso.tra(opz.riduzione - 0.06, opz.riduzione + 0.06),
      Math.max(0.6, spessore * opz.assottiglia),
      livello + 1, opz, punte,
    );
  }
}

function dipingiRamificato(ctx, caso, x, y, misura, c, velo) {
  const opz = { colore: c, velo, livelli: 4, apertura: 0.45, riduzione: 0.74, assottiglia: 0.72 };
  const punte = [];
  ctx.lineCap = 'round';
  // Tre tronchi che partono dalla base, aperti a ventaglio.
  for (const angolo of [-0.45, 0.05, 0.5]) {
    ramo(ctx, caso, x + angolo * misura * 0.12, y, angolo + caso.tra(-0.1, 0.1), misura * 0.3, misura * 0.075, 0, opz, punte);
  }
  if (velo) return;
  // Punte chiare e luminose (i polipi del corallo).
  for (const p of punte) {
    ctx.fillStyle = colore(c, 30, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.2, p.r), 0, Math.PI * 2);
    ctx.fill();
  }
}

function dipingiVentaglio(ctx, caso, x, y, misura, c, velo) {
  const opz = { colore: c, velo, livelli: 6, apertura: 0.42, riduzione: 0.8, assottiglia: 0.68, figli: 2 };
  const punte = [];
  ctx.lineCap = 'round';

  ramo(ctx, caso, x, y, caso.tra(-0.08, 0.08), misura * 0.2, misura * 0.05, 0, opz, punte);
  // Un secondo tronco più piccolo per renderlo meno regolare.
  ramo(ctx, caso, x + misura * 0.03, y, 0.35, misura * 0.13, misura * 0.035, 1, opz, punte);
  if (velo) return;
  for (const p of punte) {
    ctx.fillStyle = colore(c, 25, 0.8);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dipingiCervello(ctx, caso, x, y, misura, c, velo) {
  const rx = misura;
  const ry = misura * 0.72;
  const cy = y + ry * 0.15; // un po' affondato nella sabbia

  ctx.beginPath();
  ctx.ellipse(x, cy, rx, ry, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  if (velo) {
    ctx.fillStyle = VELO;
    ctx.fill();
    return;
  }
  const corpo = ctx.createRadialGradient(x - rx * 0.35, cy - ry * 0.8, 0, x, cy - ry * 0.3, rx * 1.2);
  corpo.addColorStop(0, colore(c, 22));
  corpo.addColorStop(0.6, colore(c, 0));
  corpo.addColorStop(1, colore(c, -18));
  ctx.fillStyle = corpo;
  ctx.fill();

  // Pieghe sinuose: archi concentrici che ondeggiano.
  ctx.save();
  ctx.clip();
  ctx.lineCap = 'round';
  for (let k = 1; k <= 6; k++) {
    const scala = k / 6.6;
    const fase = caso.tra(0, 6.3);
    const giri = caso.intero(9, 14);
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) {
      const ang = Math.PI + (i / 50) * Math.PI;
      const onda = Math.sin(ang * giri + fase) * misura * 0.045;
      const px = x + Math.cos(ang) * (rx * scala + onda);
      const py = cy + Math.sin(ang) * (ry * scala + onda);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineWidth = misura * 0.05;
    ctx.strokeStyle = colore(c, -22, 0.45);
    ctx.stroke();
    ctx.save();
    ctx.translate(-misura * 0.02, -misura * 0.025);
    ctx.lineWidth = misura * 0.02;
    ctx.strokeStyle = colore(c, 25, 0.35);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function dipingiTubi(ctx, caso, x, y, misura, c, velo) {
  const quanti = 5;
  // Dal più alto (dietro) al più basso (davanti).
  const tubi = Array.from({ length: quanti }, (_, i) => ({
    dx: (i - (quanti - 1) / 2) * misura * 0.2 + caso.tra(-3, 3),
    altezza: misura * caso.tra(0.45, 1),
    larghezza: misura * caso.tra(0.15, 0.21),
    inclinazione: (i - 2) * 0.06 + caso.tra(-0.05, 0.05),
    luce: caso.tra(-6, 8),
  })).sort((a, b) => b.altezza - a.altezza);

  for (const t of tubi) {
    ctx.save();
    ctx.translate(x + t.dx, y + 3);
    ctx.rotate(t.inclinazione);
    const l = t.larghezza;
    const h = t.altezza;
    // Corpo del tubo, leggermente più largo in cima.
    ctx.beginPath();
    ctx.moveTo(-l * 0.4, 0);
    ctx.lineTo(-l * 0.5, -h);
    ctx.lineTo(l * 0.5, -h);
    ctx.lineTo(l * 0.4, 0);
    ctx.closePath();
    if (velo) {
      ctx.fillStyle = VELO;
      ctx.fill();
      ctx.restore();
      continue;
    }
    // Sfumatura da sinistra a destra: dà l'effetto di un cilindro.
    const cilindro = ctx.createLinearGradient(-l / 2, 0, l / 2, 0);
    cilindro.addColorStop(0, colore(c, t.luce - 14));
    cilindro.addColorStop(0.35, colore(c, t.luce + 14));
    cilindro.addColorStop(1, colore(c, t.luce - 22));
    ctx.fillStyle = cilindro;
    ctx.fill();
    // Apertura in cima: bordo chiaro e interno scuro.
    ctx.beginPath();
    ctx.ellipse(0, -h, l * 0.5, l * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = colore(c, t.luce + 22);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -h + l * 0.02, l * 0.36, l * 0.11, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${c.h}, ${c.s}%, ${c.l * 0.3}%)`;
    ctx.fill();
    ctx.restore();
  }
}

function dipingiStella(ctx, caso, x, y, misura, c) {
  const R = misura * 0.5;
  const r = R * 0.42;
  const rotazione = caso.tra(0, Math.PI * 2);
  const traccia = (dx = 0, dy = 0) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = rotazione + (i / 5) * Math.PI * 2;
      const a2 = a1 + Math.PI / 5;
      const a3 = a1 + (Math.PI * 2) / 5;
      const punta = { x: x + dx + Math.cos(a1) * R * caso.tra(0.9, 1.05), y: y + dy + Math.sin(a1) * R };
      if (i === 0) ctx.moveTo(punta.x, punta.y);
      // Braccia morbide: curve tra la punta e l'incavo.
      ctx.quadraticCurveTo(
        x + dx + Math.cos(a2) * r * 1.25, y + dy + Math.sin(a2) * r * 1.25,
        x + dx + Math.cos(a3) * R, y + dy + Math.sin(a3) * R,
      );
    }
    ctx.closePath();
  };
  // Ombra sotto, poi il corpo con una sfumatura dal centro chiaro.
  traccia(1.5, 2);
  ctx.fillStyle = 'rgba(5, 15, 20, 0.35)';
  ctx.fill();
  traccia();
  const corpo = ctx.createRadialGradient(x - R * 0.2, y - R * 0.2, 0, x, y, R);
  corpo.addColorStop(0, colore(c, 15));
  corpo.addColorStop(1, colore(c, -15));
  ctx.fillStyle = corpo;
  ctx.fill();
  // Puntini in rilievo lungo le braccia.
  ctx.fillStyle = colore(c, 30, 0.7);
  for (let i = 0; i < 5; i++) {
    const a = rotazione + (i / 5) * Math.PI * 2;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * R * k * 0.24, y + Math.sin(a) * R * k * 0.24, Math.max(0.7, R * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function dipingiVentaglietto(ctx, caso, x, y, misura, c) {
  const R = misura * 0.5;
  const giro = caso.tra(-0.4, 0.4);
  ctx.save();
  ctx.translate(x, y - R * 0.25);
  ctx.rotate(giro);
  ctx.scale(1, 0.75); // appoggiata sulla sabbia, un po' di sbieco
  // Ventaglio: mezzo cerchio con il bordo ondulato.
  ctx.beginPath();
  ctx.moveTo(-R * 0.2, R * 0.35);
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (i / 24) * Math.PI;
    const onda = 1 + 0.06 * Math.sin(i * Math.PI);
    ctx.lineTo(Math.cos(a) * R * onda, Math.sin(a) * R * onda + R * 0.1);
  }
  ctx.lineTo(R * 0.2, R * 0.35);
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -R, 0, R * 0.35);
  corpo.addColorStop(0, colore(c, 18));
  corpo.addColorStop(1, colore(c, -14));
  ctx.fillStyle = corpo;
  ctx.fill();
  // Coste che partono dal cardine.
  ctx.strokeStyle = colore(c, -22, 0.5);
  ctx.lineWidth = Math.max(0.6, R * 0.05);
  for (let i = 1; i < 9; i++) {
    const a = Math.PI + (i / 9) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, R * 0.3);
    ctx.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95 + R * 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

function dipingiChiocciola(ctx, caso, x, y, misura, c) {
  const L = misura;
  ctx.save();
  ctx.translate(x, y - L * 0.15);
  ctx.rotate(caso.tra(-0.5, -0.2));
  // Guscio a cono, largo alla bocca e appuntito in cima.
  ctx.beginPath();
  ctx.moveTo(-L * 0.5, 0);
  ctx.quadraticCurveTo(-L * 0.45, -L * 0.32, 0, -L * 0.28);
  ctx.lineTo(L * 0.5, -L * 0.06);
  ctx.quadraticCurveTo(L * 0.1, L * 0.12, -L * 0.5, 0);
  ctx.closePath();
  const corpo = ctx.createLinearGradient(0, -L * 0.3, 0, L * 0.1);
  corpo.addColorStop(0, colore(c, 18));
  corpo.addColorStop(1, colore(c, -18));
  ctx.fillStyle = corpo;
  ctx.fill();
  // Giri della spirale.
  ctx.strokeStyle = colore(c, -25, 0.55);
  ctx.lineWidth = Math.max(0.6, L * 0.035);
  for (const k of [0.15, 0.32, 0.48]) {
    ctx.beginPath();
    ctx.moveTo(L * (k - 0.25), -L * 0.27 + k * L * 0.2);
    ctx.quadraticCurveTo(L * (k - 0.2), L * 0.02, L * (k - 0.05), L * 0.02 - k * L * 0.08);
    ctx.stroke();
  }
  // Bocca scura.
  ctx.fillStyle = colore(c, -35, 0.8);
  ctx.beginPath();
  ctx.ellipse(-L * 0.4, -L * 0.04, L * 0.1, L * 0.07, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const PITTORI = {
  ramificato: dipingiRamificato,
  ventaglio: dipingiVentaglio,
  cervello: dipingiCervello,
  tubi: dipingiTubi,
  stella: dipingiStella,
  ventaglietto: dipingiVentaglietto,
  chiocciola: dipingiChiocciola,
};

// Dipinge un corallo con la base nel punto (x, y). "misura" è in punti.
export function dipingiCorallo(ctx, caso, tipo, x, y, misura, c, velo = false) {
  // Ombra morbida alla base (non per la stella, che sta sul fianco di una roccia).
  if (!velo && tipo !== 'stella') {
    const ombra = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, misura * 0.6);
    ombra.addColorStop(0, 'rgba(10, 20, 25, 0.4)');
    ombra.addColorStop(1, 'rgba(10, 20, 25, 0)');
    ctx.fillStyle = ombra;
    ctx.beginPath();
    ctx.ellipse(x, y + 2, misura * 0.6, misura * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  PITTORI[tipo](ctx, caso, x, y, misura, c, velo);
}
