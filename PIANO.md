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

## Stile grafico

**Illustrato / dipinto**, ispirato ai giochi indie come *Ori* e *Hollow Knight* (scelto il 2026-10-18):
- **Forme morbide e contorni puliti**: niente spigoli duri né effetti fotografici.
- **Profondità a strati**: ciò che è lontano è più sbiadito, azzurrino e sfocato; ciò che è vicino è nitido e più contrastato.
- **Regola della profondità (z)**: ogni oggetto sul fondo ha una profondità da 0 (in fondo) a 1 (vicino al vetro). Più è vicino, più sta in basso sulla sabbia, più è grande e meno è velato. Si dipinge sempre dal più lontano al più vicino, e ogni oggetto ha un po' di sabbia ammucchiata alla base.
- **Luce d'atmosfera**: raggi e riflessi che "brillano" e piccole particelle sospese nell'acqua.
- **Palette armoniosa**: dal turchese della superficie al blu-indaco del fondo; i pesci e le piante sono le uniche macchie di colore vivace.

**Separiamo "simulazione" e "disegno":** una parte del codice calcola cosa succede (fame, soldi, qualità dell'acqua), un'altra parte lo disegna. Così, quando acceleri il tempo, i calcoli vanno più veloci ma la grafica resta fluida.

---

## Blocco A — L'acquario prende vita (solo grafica)

### ✅ Fase 0 — Il progetto online
- Struttura delle cartelle e una pagina che si apre a schermo intero sull'iPad, con uno sfondo d'acqua blu sfumato.
- Pubblicazione su GitHub Pages: ricevi il link da aprire su Safari.
- 🎯 *Cosa provi:* apri il link sull'iPad, la vasca riempie lo schermo e si adatta se giri l'iPad.

### ✅ Fase 1 — L'acqua
- Sfumatura di profondità (più chiara in alto, più scura in basso) e raggi di luce che ondeggiano dall'alto.
- Bolle che salgono, oscillando, da un punto del fondale.
- 🎯 *Cosa provi:* l'acqua "si muove" anche se ancora vuota.

### ✅ Fase 2 — Il fondale
- Sabbia con leggere ondulazioni e qualche roccia.
- Piante che ondeggiano dolcemente come mosse dalla corrente.
- *Aggiunto su richiesta:* fondale da barriera corallina con coralli, anemoni e alghe marine.
- *Aggiunto su richiesta:* grande scoglio-casa al centro, con una grotta e un passaggio in cui i pesci potranno entrare (il comportamento arriverà con i pesci).

### ✅ Fase 2b — Rifiniture dell'ambiente *(aggiunta su richiesta)*
- **Caustiche**: i riflessi di luce a rete che ondeggiano sulla sabbia.
- **Grande relitto** sullo sfondo: solo una sagoma scura nella foschia, "vedo e non vedo".
- Pochi dettagli sul fondo, senza esagerare: una stella marina e qualche conchiglia.

### ✅ Fase 3 — Il primo pesce
- *Da preparare qui:* il pesce sa dov'è la tana nello scoglio (`scoglio.tana`) e ogni tanto ci entra o ci passa attraverso.
- Un pesce semi-realistico: corpo sfumato, coda e pinne che si muovono a ritmo del nuoto.
- Movimento naturale: sceglie dove andare, accelera, rallenta, gira con una curva morbida, evita i bordi.
- *Scelto:* una **coppia di pesci pagliaccio** (vivono in coppia e abitano gli anemoni: la loro casa è l'anemone arancione).

### 🟡 Fase 4 — Più specie e i banchi
- **Pesce chirurgo blu**: insieme alla coppia di pagliacci (più avanti mangerà le alghe).
- Un piccolo gruppo di **pesci cardinale di Banggai**: argentati, con strisce nere e puntini bianchi; stanno quasi fermi vicino a un corallo e si muovono **in banco**, insieme e piano piano.
- *Scartate:* le castagnole (troppo banali, occuperebbero solo spazio).
- 🎯 *Cosa provi:* controlliamo che resti fluido con 30-40 pesci.

### ⬜ Fase 4b — Il banco lontano *(aggiunta su richiesta)*
- Ogni tanto un banco di pesci passa in lontananza, come sagome velate nella foschia.

> **Il cast della vasca** *(scelto insieme il 2026-10-19)*: non solo pesci, ma animali diversi, ognuno con un suo modo di muoversi e un suo ruolo.
> Scartati per non affollare: granchio (lo sostituisce il paguro), aragosta, pesce mandarino, murena.
> Idea per più avanti: gambero pistolero e ghiozzo, che vivono in coppia in una tana nella sabbia.

### ⬜ Fase 4c — Gli abitanti del fondo *(aggiunta su richiesta)*
- 🦐 **Gambero pulitore**: rosso e bianco, antenne lunghe; i pesci si fermano da lui per farsi "pulire".
- 🐚 **Paguro**: cammina sulla sabbia con la sua conchiglia e ogni tanto la cambia con una più grande.

### ⬜ Fase 4d — Il polpo 🐙 *(aggiunta su richiesta)*
- Vive nella **grotta** dello scoglio; esce strisciando sui tentacoli o nuotando a getto.
- **Cambia colore** per mimetizzarsi; se si spaventa (tocco sullo schermo) lancia una **nuvola d'inchiostro** e scappa.

### ⬜ Fase 4e — Seppia e cavalluccio *(aggiunta su richiesta)*
- 🦑 **Seppia fiammeggiante**: sospesa nell'acqua, con la pinna che ondeggia tutta intorno al corpo e onde di colore sulla pelle.
- 🐴 **Cavalluccio marino**: nuota in verticale e si aggrappa alle piante con la coda.

### ⬜ Fase 4f — Anguille giardino e nudibranco *(aggiunta su richiesta)*
- 🪱 **Anguille giardino**: una colonia che spunta dalla sabbia e ondeggia; se tocchi vicino, rientrano tutte nella sabbia.
- 🐌 **Nudibranco**: minuscola lumaca di mare coloratissima che striscia sulle rocce.

### ⬜ Fase 4g — Il pesce palla 🐡 *(aggiunta su richiesta)*
- Nuota goffo e, se lo tocchi o si spaventa, **si gonfia** come un pallone e poi si sgonfia piano.

---

## Blocco B — L'ecosistema

> **Non solo pesci:** tra gli abitanti della vasca ci saranno anche altri animali (per esempio paguri, gamberetti, lumache, stelle marine). Quali e quando, lo decidiamo insieme man mano.

### ⬜ Fase 5 — Il tempo
- Un orologio del gioco (giorni che passano) e i pulsanti **pausa / 1× / 2× / 5×**.
- Da qui in poi tutto quello che "invecchia" o "consuma" segue questo orologio.
- **Menu a tendina**: i comandi (e più avanti soldi, negozio, statistiche) stanno in un menu che si apre e si chiude, così puoi nasconderlo e ammirare la vasca per intero.

### ⬜ Fase 5b — Giorno e notte *(aggiunta su richiesta)*
- La luce segue l'orologio del gioco: alba, giorno, tramonto e notte.
- Di notte l'acqua diventa blu scuro e brillano di più le lucine della grotta e le punte degli anemoni.

### ⬜ Fase 5c — La medusa 🪼 *(aggiunta su richiesta)*
- Il corpo pulsa e i tentacoli fluttuano dietro; si lascia portare dalla corrente.
- **Di notte si illumina di blu fluo.**

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
- 🦁 **Pesce scorpione**: il predatore elegante, con le pinne a piuma. Attenzione a chi metti insieme a lui!
- I ruoli nell'ecosistema: **spazzini** (gambero, paguro) mangiano il cibo avanzato e puliscono l'acqua; **erbivori** (chirurgo) mangiano le alghe; **predatori** (pesce scorpione, polpo) mangiano gli animali più piccoli.

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
- Premi per le vasche grandi: 🐢 **tartaruga marina** e 🫓 **razza** (plana sul fondo e si seppellisce nella sabbia).

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
| 1 | 2026-10-18 | Aggiunti `js/disegno/luce.js` (7 raggi di luce inclinati che ondeggiano e "respirano", disegnati in piccolo e ingranditi per avere bordi morbidi senza pesare) e `js/disegno/bolle.js` (aeratore sul fondo a destra con bolle a grappolo che salgono oscillando, più qualche bollicina solitaria; massimo 80 bolle). Il ciclo ora misura il tempo tra un fotogramma e l'altro. In attesa di prova sull'iPad. |
| 1 | 2026-10-18 | Passaggio allo **stile illustrato/dipinto**: acqua dal turchese al blu-indaco con alone di luce e bordi scuri (dipinta una volta sola e riusata, per leggerezza), raggi caldi che "brillano", bolle con bordo morbido e riflesso, nuove **particelle sospese** (`js/disegno/particelle.js`) a diverse profondità che scintillano. |
| 2 | 2026-10-18 | Aggiunti `js/disegno/fondale.js` (colline lontane sfumate su due file, sabbia con increspature, granelli e sassolini, 5 rocce morbide con luce dall'alto, muschio e ombra) e `js/disegno/piante.js` (tre tipi: "nastro", "spada" e "rossa"; piante lontane velate e vicine con sfumatura dalla base alla punta; ogni foglia si piega con un'onda che sale verso la punta). Le bolle ora partono dalla sabbia, tra le rocce di destra. `js/util/casuale.js`: rocce e piante sono sempre uguali a ogni avvio. Fluidità: gli strati fermi sono dipinti una volta sola a piena risoluzione e ogni raggio di luce ha il suo foglietto già pronto. In attesa di prova sull'iPad. |
| 2 | 2026-10-18 | Fondale da **barriera corallina**: nuovo `js/disegno/coralli.js` con coralli fermi (ramificati, gorgonie a ventaglio, coralli cervello, spugne a tubo) dipinti una volta sola insieme al fondale, più sagome di coralli lontani. In `piante.js` nuovi tipi animati: **anemoni** (corona di 26 tentacoli con punte luminose; due stanno sopra le rocce), **kelp** (alga gigante con foglie alternate e galleggianti dorati), **alga a piuma**; restano nastro e spada. In attesa di prova sull'iPad. |
| 2 | 2026-10-19 | Nuovo `js/disegno/scoglio.js`: **scoglio-casa al centro** con una **grotta** buia (con lucine) e un **passaggio** che lo attraversa. È dipinto su due fogli (interno dietro, roccia davanti con i buchi), così i pesci potranno stare "dentro": verranno disegnati in mezzo ai due fogli. Sopra ha coralli e un anemone; posizioni di grotta e passaggio salvate in `scoglio.tana` per i pesci. Si adatta all'iPad in verticale. |
| 2 | 2026-10-19 | Entrate dello scoglio **più naturali**: forme irregolari invece di ovali perfetti, niente contorno scuro netto (la roccia si scurisce piano verso l'apertura), sabbia che continua dentro la grotta sfumando nel buio, parete interna del passaggio che sfuma nell'acqua dietro, ciuffi di alghe e muschio che pendono dal bordo della grotta. |
| 2 | 2026-10-19 | **Profondità e livelli**: ogni roccia, corallo e pianta ha una profondità `z` (sabbia più ampia, oggetti lontani più in alto, piccoli e velati; vicini più in basso, grandi e nitidi), dipinti dal più lontano al più vicino su tre strati (dietro lo scoglio, scoglio, davanti). Sabbia ammucchiata alla base di ogni oggetto e foschia sul bordo lontano della sabbia, così tutto poggia davvero sul fondo. Il passaggio dello scoglio ora è un tunnel buio con un filo di luce in fondo, invece di mostrare l'acqua azzurra. |
| 2b | 2026-10-19 | Nuovo `js/disegno/caustiche.js`: **rete di luce ondulata** sulla sabbia, due strati che scorrono in direzioni diverse (tessere preparate una volta sola, già schiacciate in prospettiva). **Relitto** di nave sullo sfondo tra le colline: sagoma scura velata dalla foschia, con contorni sfumati, alberi spezzati, sartie e oblò. Pochi dettagli: una **stella marina** sul fianco dello scoglio e tre **conchiglie** sulla sabbia. In attesa di prova sull'iPad. |
| 3 | 2026-10-19 | Nuova cartella `js/pesci/`: `specie.js` (scheda del pesce pagliaccio: forma, colori, bande, modo di nuotare), `pesce.js` (il "cervello": vaga, va all'anemone, entra nella grotta a riposare, attraversa il tunnel; scatti e planate, girate su se stesso, inclinazione limitata, profondità z, non attraversa la roccia ma ci gira intorno), `pesci.js` (crea la coppia e la disegna nello strato giusto: dietro, nella tana o davanti). `js/disegno/pesce.js`: corpo che ondeggia, bande bianche bordate di nero, pinne trasparenti con raggi, coda a ventaglio, occhio con riflesso, ombra sulla sabbia; nella grotta si scurisce. `js/util/colore.js`: velo d'acqua condiviso con le piante. Provato con una simulazione di 60 secondi: entrano ed escono da grotta e tunnel senza bloccarsi. In attesa di prova sull'iPad. |
| — | 2026-10-19 | Scelto insieme il **cast della vasca**: nuove fasi 4c (gambero pulitore, paguro), 4d (polpo), 4e (seppia fiammeggiante, cavalluccio), 4f (anguille giardino, nudibranco), 4g (pesce palla), 5c (medusa che di notte diventa blu fluo); pesce scorpione con i predatori (Fase 12); tartaruga e razza come premi (Fase 20). |
| 4 | 2026-10-19 | Le schede in `pesci/specie.js` ora descrivono tutto (forma, pinne dorsali/anali, tipo di coda, disegni sulla pelle, abitudini) e `disegno/pesce.js` disegna qualsiasi specie leggendole. Nuove specie: **chirurgo blu** (tavolozza nera, coda gialla, "bisturi"; gira per la vasca e perlustra il fondo) e **5 cardinali di Banggai** (barre nere, puntini bianchi, pinne a vela, coda forcuta). Nuovo `pesci/banco.js`: punto di ritrovo vicino a un corallo, ognuno al suo posto, il gruppo si sposta insieme ogni tanto e si gira "a onda". Simulazione di 90 secondi: nessun errore, nessun pesce fuori vasca, banco unito. In attesa di prova sull'iPad. |
