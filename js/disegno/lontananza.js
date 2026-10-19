// La lontananza: ogni tanto, laggiù nel blu, passa qualcuno. Sono solo
// sagome scure velate dalla foschia ("vedo e non vedo"), come il relitto.
//
// Ogni volta il gioco sceglie a caso CHI passa, con probabilità diverse:
// il banco di pesciolini è il più comune, la balena e la piovra gigante le
// più rare. Così la scena resta naturale: non succede sempre, e non è mai
// uguale.
//
// Gli animali sono disegnati con il muso verso destra (x positivo) e misure
// in "lunghezze dell'animale"; poi vengono girati se nuotano verso sinistra.

function casuale(min, max) {
  return min + Math.random() * (max - min);
}

// Chi può passare: quanto spesso, quanto è grande (in frazioni della vasca),
// quanto è veloce, a che altezza nuota e quanto è velato.
const PASSANTI = {
  banco: { peso: 0.3, lunghezza: 0.11, velocita: 0.075, alto: [0.25, 0.5], velo: 0.5 },
  squalo: { peso: 0.2, lunghezza: 0.34, velocita: 0.06, alto: [0.22, 0.48], velo: 0.42 },
  orche: { peso: 0.14, lunghezza: 0.4, velocita: 0.065, alto: [0.2, 0.42], velo: 0.4 },
  manta: { peso: 0.14, lunghezza: 0.3, velocita: 0.045, alto: [0.2, 0.45], velo: 0.42 },
  balena: { peso: 0.11, lunghezza: 0.95, velocita: 0.028, alto: [0.14, 0.26], velo: 0.28 },
  piovra: { peso: 0.11, lunghezza: 0.3, velocita: 0.05, alto: [0.25, 0.5], velo: 0.42 },
};

function scegliPassante() {
  const totale = Object.values(PASSANTI).reduce((s, p) => s + p.peso, 0);
  let r = Math.random() * totale;
  for (const [tipo, p] of Object.entries(PASSANTI)) {
    r -= p.peso;
    if (r <= 0) return tipo;
  }
  return 'banco';
}

export class Lontananza {
  constructor(fondale) {
    this.fondale = fondale;
    this.attivo = null;
    this.attesa = casuale(4, 8); // la prima volta arriva presto
  }

  parti(larghezza, altezza) {
    const tipo = scegliPassante();
    const dati = PASSANTI[tipo];
    const M = this.fondale.misuraBase(larghezza, altezza);
    const verso = Math.random() < 0.5 ? 1 : -1;
    const L = M * dati.lunghezza * casuale(0.9, 1.1);
    const margine = L * (tipo === 'banco' ? 2 : 1);
    this.attivo = {
      tipo,
      verso,
      L,
      x: verso > 0 ? -margine : larghezza + margine,
      y: altezza * casuale(...dati.alto),
      velocita: M * dati.velocita * casuale(0.85, 1.15),
      velo: dati.velo,
      margine,
      tempo: 0,
      fase: Math.random() * 6.3,
    };
    if (tipo === 'banco') this.attivo.pesci = creaPesciolini(M);
  }

  aggiorna(dt, larghezza, altezza) {
    if (!this.attivo) {
      this.attesa -= dt;
      if (this.attesa <= 0) this.parti(larghezza, altezza);
      return;
    }
    const a = this.attivo;
    a.tempo += dt;
    let v = a.velocita;
    // La piovra nuota "a getto": spinta forte, poi plana rallentando.
    if (a.tipo === 'piovra') v *= 0.35 + 1.4 * Math.max(0, Math.sin(a.tempo * 1.6)) ** 2;
    a.x += a.verso * v * dt;
    // Sale e scende piano, come un nastro che ondeggia.
    a.y += Math.sin(a.tempo * 0.3 + a.fase) * altezza * 0.01 * dt;
    // Uscito dall'altro lato: qualcun altro passerà fra un po'.
    const fuori = a.verso > 0 ? a.x > larghezza + a.margine : a.x < -a.margine;
    if (fuori) {
      this.attivo = null;
      this.attesa = casuale(10, 26);
    }
  }

  disegna(ctx) {
    const a = this.attivo;
    if (!a) return;
    if (a.tipo === 'banco') {
      ctx.fillStyle = `rgba(14, 52, 74, ${a.velo})`;
      return disegnaBanco(ctx, a);
    }
    // La sagoma viene dipinta piena su un foglio a parte e poi appoggiata
    // velata tutta insieme: così dove due parti si sovrappongono (una pinna
    // sul corpo, i tentacoli) non diventa più scura.
    // Risoluzione normale (non doppia): sono sagome lontane e un po' sfocate,
    // e il foglio resta leggero anche per la balena. Il foglio è grande solo
    // quanto serve a contenere l'animale.
    const d = 1;
    const lato = Math.ceil(a.L * ({ orche: 2.3, balena: 1.3 }[a.tipo] || 1.5));
    if (!this.foglio) this.foglio = document.createElement('canvas');
    const f = this.foglio;
    if (f.width !== lato * d) {
      f.width = lato * d;
      f.height = lato * d;
    }
    const c = f.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, f.width, f.height);
    c.setTransform(d, 0, 0, d, (lato / 2) * d, (lato / 2) * d);
    c.fillStyle = 'rgb(14, 52, 74)';
    c.strokeStyle = 'rgb(14, 52, 74)';
    if (a.tipo === 'orche') {
      // Una mamma e il suo piccolo, un po' dietro e più in basso.
      disegnaOrca(c, 0, 0, a.L, a.verso, a.tempo * 2.2);
      disegnaOrca(c, -a.verso * a.L * 0.75, a.L * 0.22, a.L * 0.55, a.verso, a.tempo * 2.6 + 1);
    } else {
      const disegni = { squalo: disegnaSqualo, manta: disegnaManta, balena: disegnaBalena, piovra: disegnaPiovra };
      disegni[a.tipo](c, 0, 0, a.L, a.verso, a.tempo);
    }
    ctx.save();
    ctx.globalAlpha = a.velo;
    ctx.drawImage(f, a.x - lato / 2, a.y - lato / 2, lato, lato);
    ctx.restore();
  }
}

// ---------- Il banco di pesciolini ----------

function creaPesciolini(M) {
  return Array.from({ length: 60 }, () => {
    // Posizione nella nuvola (più fitta al centro), misura e ritmo.
    const angolo = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    return {
      u: Math.cos(angolo) * r,
      v: Math.sin(angolo) * r,
      misura: M * casuale(0.015, 0.021),
      fase: Math.random() * Math.PI * 2,
      ritmo: casuale(0.6, 1.1),
    };
  });
}

function disegnaBanco(ctx, b) {
  const t = b.tempo;
  // La nuvola cambia forma: si stira in lunghezza e si schiaccia, piano piano.
  const stira = 1.5 + 0.35 * Math.sin(t * 0.4);
  const schiaccia = 0.55 + 0.2 * Math.sin(t * 0.33 + 1);
  for (const p of b.pesci) {
    // Ogni pesciolino ondeggia per conto suo dentro la nuvola, e la nuvola
    // si "piega" come un'onda.
    const onda = Math.sin(t * 0.8 + p.u * 2.2) * b.L * 0.22;
    const x = b.x + (p.u * stira + Math.sin(t * p.ritmo + p.fase) * 0.08) * b.L;
    const y = b.y + (p.v * schiaccia + Math.cos(t * p.ritmo * 0.8 + p.fase) * 0.08) * b.L + onda;
    const m = p.misura;
    const coda = Math.sin(t * 9 * p.ritmo + p.fase) * m * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(b.verso, 1);
    // Corpo affusolato e coda a V.
    ctx.beginPath();
    ctx.moveTo(m * 0.55, 0);
    ctx.quadraticCurveTo(m * 0.1, -m * 0.28, -m * 0.35, -m * 0.06);
    ctx.lineTo(-m * 0.6, -m * 0.26 + coda);
    ctx.lineTo(-m * 0.5, coda * 0.5);
    ctx.lineTo(-m * 0.6, m * 0.26 + coda);
    ctx.lineTo(-m * 0.35, m * 0.06);
    ctx.quadraticCurveTo(m * 0.1, m * 0.28, m * 0.55, 0);
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Sagome ----------

// Traccia una sagoma da una lista di comandi in "lunghezze dell'animale".
// "piega(x)" sposta in su o in giù ogni punto: è così che il corpo ondeggia
// (la testa resta ferma, la coda si muove).
function sagoma(ctx, comandi, L, piega) {
  const P = (x, y) => [x * L, (y + piega(x)) * L];
  ctx.beginPath();
  for (const [tipo, ...n] of comandi) {
    if (tipo === 'M') ctx.moveTo(...P(n[0], n[1]));
    else if (tipo === 'L') ctx.lineTo(...P(n[0], n[1]));
    else ctx.quadraticCurveTo(...P(n[0], n[1]), ...P(n[2], n[3]));
  }
  ctx.closePath();
  ctx.fill();
}

// Onda della coda: zero davanti, sempre più ampia verso la coda.
function codaCheBatte(fase, forza) {
  return (x) => (x < 0.1 ? Math.sin(fase - x * 4) * forza * (0.1 - x) ** 2 * 0.3 : 0);
}

function inPosizione(ctx, x, y, verso, disegno) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(verso, 1);
  disegno();
  ctx.restore();
}

function disegnaSqualo(ctx, x, y, L, verso, t) {
  inPosizione(ctx, x, y, verso, () => {
    sagoma(ctx, [
      ['M', 0.5, 0.02],
      ['Q', 0.42, -0.08, 0.25, -0.1],
      ['Q', 0.12, -0.11, 0.05, -0.11],
      ['L', -0.03, -0.31], // pinna dorsale alta
      ['Q', -0.06, -0.17, -0.12, -0.1],
      ['Q', -0.28, -0.06, -0.4, -0.035],
      ['L', -0.6, -0.27], // coda: lobo di sopra più lungo
      ['Q', -0.55, -0.08, -0.53, 0.0],
      ['L', -0.57, 0.12], // lobo di sotto
      ['L', -0.4, 0.03],
      ['Q', -0.25, 0.06, -0.12, 0.075],
      ['L', -0.16, 0.12], // pinna anale
      ['L', -0.05, 0.085],
      ['L', 0.1, 0.09],
      ['L', -0.02, 0.24], // pinna pettorale
      ['L', 0.2, 0.09],
      ['Q', 0.38, 0.08, 0.5, 0.02],
    ], L, codaCheBatte(t * 3.2, 0.5));
  });
}

function disegnaOrca(ctx, x, y, L, verso, fase) {
  inPosizione(ctx, x, y, verso, () => {
    sagoma(ctx, [
      ['M', 0.5, 0.01],
      ['Q', 0.5, -0.09, 0.36, -0.12],
      ['Q', 0.2, -0.14, 0.04, -0.13],
      ['L', -0.04, -0.42], // pinna dorsale altissima
      ['Q', -0.06, -0.2, -0.13, -0.12],
      ['Q', -0.28, -0.08, -0.4, -0.03],
      ['L', -0.56, -0.07], // pinna caudale (vista di lato)
      ['L', -0.52, 0.0],
      ['L', -0.56, 0.06],
      ['L', -0.4, 0.03],
      ['Q', -0.15, 0.14, 0.12, 0.12],
      ['L', 0.04, 0.27], // pinna pettorale tonda
      ['Q', 0.12, 0.25, 0.22, 0.12],
      ['Q', 0.42, 0.1, 0.5, 0.01],
    ], L, codaCheBatte(fase, 0.6));
  });
}

function disegnaBalena(ctx, x, y, L, verso, t) {
  inPosizione(ctx, x, y, verso, () => {
    // Megattera: corpo lungo, piccola gobba, pinne pettorali lunghissime.
    sagoma(ctx, [
      ['M', 0.5, 0.0],
      ['Q', 0.48, -0.06, 0.3, -0.09],
      ['Q', 0.05, -0.11, -0.12, -0.1],
      ['L', -0.17, -0.13], // piccola pinna dorsale
      ['L', -0.21, -0.09],
      ['Q', -0.34, -0.06, -0.42, -0.03],
      ['Q', -0.5, -0.07, -0.55, -0.13], // pinna caudale
      ['Q', -0.5, -0.02, -0.5, 0.0],
      ['Q', -0.5, 0.04, -0.55, 0.11],
      ['Q', -0.48, 0.05, -0.42, 0.03],
      ['Q', -0.1, 0.15, 0.2, 0.11],
      ['Q', 0.05, 0.25, -0.08, 0.4], // pinna pettorale lunghissima
      ['Q', 0.1, 0.24, 0.26, 0.11],
      ['Q', 0.44, 0.08, 0.5, 0.0],
    ], L, codaCheBatte(t * 1.1, 0.35));
  });
}

function disegnaManta(ctx, x, y, L, verso, t) {
  inPosizione(ctx, x, y, verso, () => {
    // Vista dall'alto mentre plana: le ali battono piano, su e giù.
    const battito = Math.sin(t * 1.6);
    const ala = L * 0.5 * (0.8 + 0.2 * Math.cos(t * 1.6));
    const avanti = battito * L * 0.06;
    ctx.beginPath();
    ctx.moveTo(L * 0.26, -L * 0.05);
    ctx.lineTo(L * 0.31, -L * 0.07); // pinne cefaliche (le "corna")
    ctx.quadraticCurveTo(L * 0.22, -L * 0.2, L * 0.04 + avanti, -ala);
    ctx.quadraticCurveTo(-L * 0.02 + avanti, -ala * 0.6, -L * 0.15, -L * 0.06);
    ctx.lineTo(-L * 0.18, 0);
    ctx.lineTo(-L * 0.15, L * 0.06);
    ctx.quadraticCurveTo(-L * 0.02 + avanti, ala * 0.6, L * 0.04 + avanti, ala);
    ctx.quadraticCurveTo(L * 0.22, L * 0.2, L * 0.31, L * 0.07);
    ctx.lineTo(L * 0.26, L * 0.05);
    ctx.closePath();
    ctx.fill();
    // Coda sottile e lunga.
    ctx.lineWidth = Math.max(1, L * 0.012);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-L * 0.17, 0);
    ctx.quadraticCurveTo(-L * 0.4, Math.sin(t * 1.3) * L * 0.04, -L * 0.62, Math.sin(t * 1.3 - 1) * L * 0.06);
    ctx.stroke();
  });
}

function disegnaPiovra(ctx, x, y, L, verso, t) {
  inPosizione(ctx, x, y, verso, () => {
    // Il "getto": quando spinge, i tentacoli si stringono dietro di lei;
    // quando plana, si aprono un po' a ombrello.
    const spinta = Math.max(0, Math.sin(t * 1.6)) ** 2;
    const apertura = 1 - spinta * 0.7;
    // Tentacoli: otto strisce che si assottigliano, mosse da un'onda.
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const lato = (i / 7) * 2 - 1;
      const passi = 10;
      let px = L * 0.08;
      let py = lato * L * 0.03;
      for (let k = 1; k <= passi; k++) {
        const q = k / passi;
        const nx = L * (0.08 - q * 0.62);
        const ny = L * (lato * (0.03 + q * 0.16 * apertura) + Math.sin(t * 3 - q * 5 + i) * 0.025 * q);
        ctx.lineWidth = Math.max(0.8, L * 0.035 * (1 - q * 0.85));
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        px = nx;
        py = ny;
      }
    }
    // Mantello (la "testa"): una goccia allungata in avanti, che si gonfia e sgonfia.
    const gonfio = 1 + 0.1 * Math.sin(t * 1.6 + 1.5);
    ctx.beginPath();
    ctx.ellipse(L * 0.24, -L * 0.01, L * 0.2, L * 0.1 * gonfio, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(L * 0.07, 0, L * 0.07, L * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}
