# AppHERMANN

Gestionale React + Node con autenticazione lato server e storage JSON su file.

## Sicurezza applicata

- credenziali rimosse dal frontend
- login gestito dal server
- password salvata come hash bcrypt
- sessione in cookie `httpOnly`, `sameSite=strict`, `secure` in produzione
- rate limit sui tentativi di login
- `helmet` con CSP attiva
- service worker escluso dalle API per evitare cache di dati sensibili

## Storage

Lo storage e un file JSON lato server.

- locale: `data/apphermann.json`
- Render Free demo: `/tmp/apphermann.json`

Per una demo e la scelta piu semplice: niente dipendenze native, deploy facile su Render Free. Il file in `/tmp` non e persistente tra restart o redeploy.

## Setup locale

1. Copia `.env.example` in `.env`
2. Imposta almeno:

```env
JWT_SECRET=una-stringa-lunga-e-casuale
APP_USERNAME=hermann
APP_PASSWORD=una-password-forte
```

3. Installa dipendenze:

```bash
npm install
```

4. Avvia sviluppo:

```bash
npm run dev
```

- frontend: `http://localhost:5173`
- API server: `http://localhost:3001`

## Hash password opzionale

Se non vuoi tenere `APP_PASSWORD` in chiaro, genera un hash:

```bash
npm run hash-password -- mia-password
```

Poi usa `APP_PASSWORD_HASH` nel `.env` e rimuovi `APP_PASSWORD`.

## Build produzione

```bash
npm run build
npm start
```

## Android e Windows

Il progetto ora e predisposto anche per wrapper app:

- Android con Capacitor
- Windows con Electron

Prima di usarli conviene impostare un backend online raggiungibile dall'app:

```env
VITE_API_BASE_URL=https://tuo-backend.example.com
APP_CORS_ORIGINS=http://localhost,capacitor://localhost,null,https://tuo-dominio-app.com
APP_CROSS_ORIGIN_AUTH=true
```

Script utili:

```bash
npm run build:android
npm run android:open
npm run build:windows
```

Note:

- Android richiede Android Studio per compilare l'APK o l'AAB.
- Windows genera un pacchetto Electron nella cartella `release/`.
- Gli artefatti `release/` non vengono versionati nel repo.
- Prima del packaging finale imposta `VITE_API_BASE_URL` verso il backend online.

## Deploy su Render

Nel repo c'e `render.yaml`.

Serve configurare:

- `APP_USERNAME`
- `APP_PASSWORD` oppure `APP_PASSWORD_HASH`
- `JWT_SECRET` viene generato automaticamente dal blueprint
- `APP_CORS_ORIGINS` puo restare con i valori base per Android/Windows
- `APP_CROSS_ORIGIN_AUTH=true` e gia previsto
- `DB_PATH=/tmp/apphermann.json`

Se crei il servizio manualmente:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Env var `DB_PATH=/tmp/apphermann.json`

## Cosa resta da fare

La parte codice e wrapper e pronta. Restano solo questi passaggi operativi:

1. Crea il servizio su Render partendo dal repo e inserisci username/password admin.
2. Prendi l'URL del backend online e impostalo in `VITE_API_BASE_URL`.
3. Ricompila le app:

```bash
npm run build:android
npm run build:windows
```

4. Android: apri Android Studio con `npm run android:open` e genera l'APK.
5. Windows: distribuisci l'eseguibile dentro `release/win-unpacked/`.

Se in futuro vuoi una versione davvero stabile per il personale, il passo successivo consigliato e spostare i dati da file JSON a un database esterno persistente.
