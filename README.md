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

## Deploy su Render

Nel repo c'e `render.yaml`.

Serve configurare:

- `APP_USERNAME`
- `APP_PASSWORD` oppure `APP_PASSWORD_HASH`
- `JWT_SECRET` viene generato automaticamente dal blueprint
- `DB_PATH=/tmp/apphermann.json`

Se crei il servizio manualmente:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Env var `DB_PATH=/tmp/apphermann.json`
