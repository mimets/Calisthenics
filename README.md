# AppHERMANN

Gestionale React + Node con autenticazione lato server e database SQLite persistente su file.

## Sicurezza applicata

- credenziali rimosse dal frontend
- login gestito dal server
- password salvata come hash bcrypt
- sessione in cookie `httpOnly`, `sameSite=strict`, `secure` in produzione
- rate limit sui tentativi di login
- `helmet` con CSP attiva
- service worker escluso dalle API per evitare cache di dati sensibili

## Database

Il database e un file SQLite.

- locale: `data/apphermann.sqlite`
- Render: `/var/data/apphermann.sqlite` tramite persistent disk

Per un solo utente questa scelta e pragmatica: meno infrastruttura, persistenza reale e nessun database esterno da gestire. Su Render funziona solo con persistent disk; senza disk il file verrebbe perso al redeploy.

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

## Deploy su Render

Nel repo c'e `render.yaml`.

Serve configurare:

- `APP_USERNAME`
- `APP_PASSWORD` oppure `APP_PASSWORD_HASH`
- `JWT_SECRET` viene generato automaticamente dal blueprint
- disk persistente montato in `/var/data`

Se crei il servizio manualmente invece del blueprint:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Persistent Disk: mount path `/var/data`
- Env var `DB_PATH=/var/data/apphermann.sqlite`
