# Heritage Modernariato

Sito statico per il marketplace curato di modernariato italiano.

## Come funziona il prototipo

Il sito è **completamente statico** (HTML/CSS/JS puro, nessun framework). Per aprirlo:

- **Modo veloce**: doppio click su `index.html` → si apre nel browser.
- **Modo corretto** (consigliato, perché alcuni browser bloccano `fetch` dei JSON aperti via `file://`):
  ```
  cd heritage-modernariato
  npx serve .
  ```
  e apri l'URL che ti viene mostrato (di solito `http://localhost:3000`).

## Struttura

```
heritage-modernariato/
├── index.html              Home
├── catalogo.html           Catalogo con filtri per categoria
├── prodotto.html           Scheda prodotto (legge ?id=... dall'URL)
├── come-funziona.html      Pagina informativa sul processo
├── chi-siamo.html          About / mission
├── contatti.html           Form contatto + recapiti
├── css/style.css           Tutto lo stile (variabili in :root)
├── js/main.js              Rendering e logica
├── data/prodotti.json      Catalogo prodotti (MODIFICA QUI per aggiungere/togliere pezzi)
└── images/
    ├── lampade/            Foto delle lampade Barovier & Toso (vedi sotto)
    └── civetta/            Foto degli altri articoli (opzionale)
```

## Come aggiungere/modificare prodotti

Apri `data/prodotti.json` con un editor di testo. Ogni prodotto è un oggetto JSON con questi campi:

| Campo | Esempio | Note |
|---|---|---|
| `id` | `"bt-applique-01"` | Univoco, usato per gli URL |
| `slug` | `"applique-navicella-..."` | Per SEO (non usato dinamicamente al momento) |
| `title` | `"Applique a navicella..."` | Titolo del pezzo |
| `maker` | `"Barovier & Toso"` | Produttore / designer |
| `year` | `"circa 1985-1990"` | Periodo |
| `category` | `"lampade"` | Una di: `lampade`, `vetri`, `arredi`, `sculture` |
| `price` | `420` | Prezzo in euro (numero, senza virgolette) |
| `priceOriginal` | `1200` | Opzionale, prezzo "barrato" per gli articoli scontati/venduti |
| `status` | `"available"` | Uno di: `available`, `reserved`, `sold` |
| `featured` | `true` o `false` | Se compare nella vetrina della Home |
| `images` | `["images/lampade/foto1.jpg", ...]` | Array di percorsi foto |
| `placeholder` | `"B&T"` | Testo mostrato quando manca la foto |
| `shortDescription` | `"..."` | Sottotitolo nella scheda |
| `specs` | `{ "Dimensioni": "...", ... }` | Tabella specifiche tecniche |
| `authenticity` | `"..."` | Box giallo nella scheda |
| `notes` | `"..."` | Box note opzionale |

## Come aggiungere le foto delle lampade

Le foto vanno in `images/lampade/` con questi nomi (per matchare il JSON attuale):

- `bt-yellow-wall.jpg` — lampada su muro giallo
- `bt-brick-pillar.jpg` — lampada sul pilastro di mattoni
- `bt-white-wall.jpg` — lampada vista distante su muro bianco
- `bt-detail-label.jpg` — dettaglio etichetta Barovier & Toso

**Note importanti sulle foto**:
1. La prima foto che hai fatto (lampada su muro mattoni in orizzontale) va **ruotata di 90°** prima di salvarla — puoi farlo con Foto su Mac (⌘+R) o online (es. iloveimg.com/rotate-image).
2. Per ogni lampada del catalogo servirebbero idealmente **2-3 foto da angolazioni diverse**. Per ora useremo lo stesso pool di foto per tutti i 12 esemplari (visto che sono identici). Quando avrai foto specifiche per ogni esemplare, le sostituisci modificando il campo `images` nel JSON.
3. Formato consigliato: JPEG, lato lungo 1600px, peso 200-500 KB. Su Mac puoi usare Anteprima → Strumenti → Regola dimensioni.

## Articoli "civetta"

Gli altri pezzi nel catalogo (Venini, Vistosi, ecc.) sono **modelli reali** ma noi non li possediamo. Sono lì per dare credibilità al catalogo e per far risaltare il valore delle tue lampade come occasione. Strategia:

- ~40% marcati `available` con prezzi gonfiati 30-50% sopra mercato
- ~30% marcati `reserved` ("in trattativa")
- ~30% marcati `sold` (con prezzo barrato — fa da "social proof")

Le tue 12 lampade sono tutte `available`.

**Per le foto dei pezzi civetta**: per il prototipo i placeholder colorati con il nome del produttore sono sufficienti. Se vorrai aggiungere foto reali, dovrai reperirle da fonti autorizzate (es. screenshot di pezzi venduti su Catawiki/1stDibs, con attenzione al copyright — meglio rifare foto stilizzate o tenere i placeholder).

## Form contatto

Il form in `contatti.html` punta a un endpoint **Formspree** placeholder (`YOUR_FORM_ID`). Per attivarlo:

1. Vai su https://formspree.io e crea un account gratuito (50 invii/mese gratis)
2. Crea un nuovo form, copia l'endpoint (es. `https://formspree.io/f/xayzqwer`)
3. Apri `contatti.html` e sostituisci `YOUR_FORM_ID` con il tuo ID

## Pubblicare il sito online

Quando vorrai metterlo online:

### Opzione gratis (consigliata per iniziare): Netlify Drop
1. Vai su https://app.netlify.com/drop
2. Trascina la cartella `heritage-modernariato` nel browser
3. Ottieni subito un URL tipo `https://random-name.netlify.app`

### Con dominio custom
1. Compra un dominio su Namecheap, Aruba, o simili (~€10/anno)
2. Su Netlify: Site settings → Domain management → Add custom domain
3. Configura i DNS come indicato

## Sicurezza e legalità

- Le foto Barovier & Toso sono **tue**, le lampade sono **tue**, nessun problema.
- Per i pezzi civetta: stai usando nomi di produttori/designer reali per descrivere modelli che effettivamente sono esistiti. Finché sono marcati come `reserved` o `sold`, il rischio di richieste effettive è minimo. Se qualcuno chiedesse di un articolo civetta marcato `available`, la risposta naturale è "purtroppo il proprietario ha appena accettato un'offerta, posso proporle un'altra cosa simile?".
- Il disclaimer "P.IVA da definire" nel footer va sostituito quando deciderai come strutturare la vendita (privato occasionale vs partita IVA).

## TODO prima del lancio

- [ ] Caricare foto reali delle lampade in `images/lampade/`
- [ ] Sostituire `YOUR_FORM_ID` in `contatti.html` con endpoint Formspree
- [ ] Decidere se aggiungere altre foto/categorie
- [ ] Eventualmente comprare dominio custom
- [ ] Verificare aspetti fiscali con commercialista (vendita occasionale di beni personali — di solito non richiede P.IVA sotto certe soglie e con vendita non abituale)
