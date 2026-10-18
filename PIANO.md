# 🐠 Acquari — Piano di sviluppo

Gioco web per iPad che unisce un **acquario-ecosistema** e un **gestionale**.
Lo costruiamo a piccole fasi: ognuna aggiunge una o due novità, che puoi provare subito sull'iPad.

**Legenda stato:** ⬜ da fare · 🟡 in corso · ✅ completata

---

## Le scelte tecniche (spiegate semplici)

| Scelta | Cosa vuol dire | Perché |
|---|---|---|
| **HTML + JavaScript** | Il gioco è una pagina web, scritta nei linguaggi che ogni browser capisce già. | Niente da installare né sull'iPad né sul computer: basta Safari. |
| **Canvas 2D** | Un "foglio da disegno" nella pagina, su cui il codice ridisegna l'acquario 60 volte al secondo. | È il modo più veloce per animare tanti pesci, bolle e piante senza scatti. |
| **Grafica disegnata dal codice** | Pesci, piante e rocce sono forme e sfumature calcolate, non immagini scaricate. | Le pinne e la coda si possono piegare in modo fluido, i colori variano da pesce a pesce, e il gioco resta leggero. |
| **Nessun "framework"** | Non usiamo librerie complicate: solo file JavaScript ordinati in cartelle. | Più facile da capire per un principiante, e meno cose che si possono rompere. |
| **GitHub Pages** | GitHub mette online gratis la cartella del progetto come sito. | Apri un link sull'iPad e giochi. Puoi anche "Aggiungere alla schermata Home" per usarlo come un'app a schermo intero. |
| **Salvataggio nel browser** (`localStorage`) | Safari tiene in memoria i dati del gioco sul tuo iPad. | Chiudi e riapri: ritrovi il tuo acquario, senza bisogno di account o server. |

**Separiamo "simulazione" e "disegno":** una parte del codice calcola cosa succede (fame, soldi, qualità dell'acqua), un'altra parte lo disegna. Così, quando acceleri il tempo, i calcoli vanno più veloci ma la grafica resta fluida.

---

## Blocco A — L'acquario prende vita (solo grafica)

### ✅ Fase 0 — Il progetto online
- Struttura delle cartelle e una pagina che si apre a schermo intero sull'iPad, con uno sfondo d'acqua blu sfumato.
- Pubblicazione su GitHub Pages: ricevi il link da aprire su Safari.
- 🎯 *Cosa provi:* apri il link sull'iPad, la vasca riempie lo schermo e si adatta se giri l'iPad.

### ⬜ Fase 1 — L'acqua
- Sfumatura di profondità (più chiara in alto, più scura in basso) e raggi di luce che ondeggiano dall'alto.
- Bolle che salgono, oscillando, da un punto del fondale.
- 🎯 *Cosa provi:* l'acqua "si muove" anche se ancora vuota.

### ⬜ Fase 2 — Il fondale
- Sabbia con leggere ondulazioni e qualche roccia.
- Piante che ondeggiano dolcemente come mosse dalla corrente.

### ⬜ Fase 3 — Il primo pesce
- Un pesce semi-realistico: corpo sfumato, coda e pinne che si muovono a ritmo del nuoto.
- Movimento naturale: sceglie dove andare, accelera, rallenta, gira con una curva morbida, evita i bordi.

### ⬜ Fase 4 — Più specie e i banchi
- 3 specie diverse (es. neon, guppy, scalare) con forme, colori e velocità proprie.
- Alcune specie nuotano **in banco**: restano vicine e si muovono insieme.
- 🎯 *Cosa provi:* controlliamo che resti fluido con 30-40 pesci.

---

## Blocco B — L'ecosistema

### ⬜ Fase 5 — Il tempo
- Un orologio del gioco (giorni che passano) e i pulsanti **pausa / 1× / 2× / 5×**.
- Da qui in poi tutto quello che "invecchia" o "consuma" segue questo orologio.

### ⬜ Fase 6 — Fame e cibo
- Tocchi la vasca e cadono scaglie di cibo; i pesci le vedono e le inseguono.
- Ogni pesce ha una **fame** che sale col tempo e scende quando mangia.

### ⬜ Fase 7 — Salute, età e morte
- Ogni pesce ha **salute** ed **età**; la fame prolungata fa calare la salute; i pesci vecchi o malati muoiono.
- Toccando un pesce si apre una **scheda** con nome della specie, fame, salute ed età.

### ⬜ Fase 8 — Qualità dell'acqua
- L'acqua si sporca col cibo avanzato sul fondo e con troppi pesci; se è sporca diventa leggermente torbida e i pesci si ammalano.
- Pulsante "cambio d'acqua" per rimediare.

### ⬜ Fase 9 — Temperatura ed esigenze delle specie
- La vasca ha una temperatura; ogni specie ha una sua temperatura ideale e uno spazio minimo.
- Se le condizioni non vanno bene, i pesci stanno peggio (e la scheda ti dice perché).

### ⬜ Fase 10 — Riproduzione
- Pesci adulti, sani e sazi della stessa specie possono riprodursi: compaiono **avannotti** piccoli che crescono col tempo.

### ⬜ Fase 11 — Alghe ed erbivori
- Le **alghe** crescono sui vetri e sulle rocce (più luce = più alghe).
- I pesci **erbivori** le mangiano: primo anello della catena alimentare.

### ⬜ Fase 12 — Predatori e carattere
- Specie **aggressive** che inseguono gli altri, e **predatori** che mangiano i pesci più piccoli.
- Ogni specie ha un carattere: pacifica, territoriale, predatrice.

---

## Blocco C — Il gestionale

### ⬜ Fase 13 — Soldi e negozio
- Parti con un **budget** e una vasca piccola.
- Un **negozio** dove compri pesci e cibo (il cibo ora si consuma e va ricomprato).

### ⬜ Fase 14 — Salvataggio
- Il gioco si **salva da solo** ogni tanto e quando chiudi la pagina; riaprendo riprendi da dove eri.
- Pulsante "nuova partita".
- *(Lo mettiamo qui perché da adesso hai qualcosa che vale la pena conservare: soldi e acquisti.)*

### ⬜ Fase 15 — Attrezzatura e costi fissi
- Compri **filtro** (acqua più pulita), **riscaldatore** (temperatura giusta), **luci** (bellezza, ma più alghe).
- **Costi fissi** giornalieri: elettricità per ogni apparecchio e manutenzione.

### ⬜ Fase 16 — Piante, decorazioni e bellezza
- Dal negozio compri piante e decorazioni e le posizioni nella vasca toccando dove metterle.
- Un punteggio di **bellezza** della vasca.

### ⬜ Fase 17 — I visitatori
- Arrivano **visitatori** che pagano il biglietto.
- La loro **soddisfazione** dipende da varietà di specie, salute dei pesci e bellezza; più sono contenti, più ne arrivano.

### ⬜ Fase 18 — Vendere gli avannotti
- Puoi vendere i pesci nati in vasca; il prezzo dipende da specie e salute.

### ⬜ Fase 19 — Statistiche e grafici
- Una schermata con l'andamento nel tempo di **soldi**, **popolazione** per specie e **qualità dell'acqua**.

### ⬜ Fase 20 — Sblocchi e progressione
- Vasche più grandi da comprare (più spazio, più pesci, più visitatori).
- **Specie rare** che si sbloccano raggiungendo traguardi (es. soldi, soddisfazione, numero di specie).

---

## Blocco D — Rifinitura

### ⬜ Fase 21 — Prestazioni e comodità su iPad
- Controllo che resti fluido anche con vasche grandi e affollate.
- Icona e schermata di avvio per "Aggiungi a Home", gioco usabile anche senza internet.

### ⬜ Fase 22 — Tocchi finali (facoltativa)
- Piccolo tutorial iniziale, suoni d'acqua opzionali, notifiche ("un pesce è malato!").

---

## Registro dei progressi

| Fase | Data | Cosa è stato fatto |
|---|---|---|
| — | 2026-10-18 | Piano creato e approvato. |
| 0 | 2026-10-18 | Creati `index.html`, `css/style.css`, `js/main.js`, `js/disegno/acqua.js`: vasca a schermo intero con acqua sfumata, nitida sugli schermi Retina, si adatta alla rotazione. Pubblicato su GitHub Pages: https://9h6f9527wh-droid.github.io/acquari/ — provato sull'iPad. |
