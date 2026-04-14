import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import {
  AUTH_COOKIE_NAME,
  findUserByUsername,
  getCookieOptions,
  requireAuth,
  signSession,
  validatePassword,
  verifySessionToken,
} from './auth.js';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const app = express();
const port = Number(process.env.PORT || 3001);

function setNoStore(_request, response, next) {
  response.setHeader('Cache-Control', 'no-store');
  next();
}

function normalizeGym(row) {
  return {
    id: row.id,
    name: row.name,
    clients: [],
  };
}

function normalizeClient(row) {
  return {
    id: row.id,
    gymId: row.gym_id,
    firstName: row.first_name,
    lastName: row.last_name,
    price: Number(row.price),
    frequency: row.frequency,
  };
}

function validateGymName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nome palestra non valido');
  }

  return name.trim().slice(0, 120);
}

function validateClientPayload(body) {
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const frequency = typeof body.frequency === 'string' ? body.frequency.trim() : '';
  const price = Number(body.price);

  if (!firstName || !lastName) {
    throw new Error('Nome e cognome sono obbligatori');
  }

  if (!['mensile', 'trimestrale', 'semestrale', 'annuale'].includes(frequency)) {
    throw new Error('Frequenza non valida');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Prezzo non valido');
  }

  return {
    firstName: firstName.slice(0, 80),
    lastName: lastName.slice(0, 80),
    frequency,
    price: Math.round(price * 100) / 100,
  };
}

async function fetchGymsForUser(userId) {
  const db = await getDb();
  const gymRows = await db.all('SELECT id, name FROM gyms WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  const clientRows = await db.all(
    `
      SELECT clients.id, clients.gym_id, clients.first_name, clients.last_name, clients.price, clients.frequency
      FROM clients
      JOIN gyms ON gyms.id = clients.gym_id
      WHERE gyms.user_id = ?
      ORDER BY clients.created_at DESC
    `,
    [userId],
  );

  const gyms = gymRows.map(normalizeGym);
  const gymMap = new Map(gyms.map((gym) => [gym.id, gym]));

  for (const clientRow of clientRows) {
    const gym = gymMap.get(clientRow.gym_id);
    if (gym) {
      gym.clients.push(normalizeClient(clientRow));
    }
  }

  return gyms;
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppi tentativi di login. Riprova piu tardi.' },
});

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', setNoStore, async (_request, response) => {
  await getDb();
  response.json({ ok: true });
});

app.get('/api/session', setNoStore, async (request, response) => {
  const token = request.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    response.json({ authenticated: false });
    return;
  }

  try {
    const session = verifySessionToken(token);
    response.json({
      authenticated: true,
      user: {
        id: Number(session.sub),
        username: session.username,
      },
    });
  } catch {
    response.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
    response.json({ authenticated: false });
  }
});

app.post('/api/login', setNoStore, authLimiter, async (request, response) => {
  const username = typeof request.body.username === 'string' ? request.body.username.trim() : '';
  const password = typeof request.body.password === 'string' ? request.body.password : '';

  if (!username || !password) {
    response.status(400).json({ error: 'Username e password sono obbligatori' });
    return;
  }

  const user = await findUserByUsername(username);

  if (!user || !(await validatePassword(user, password))) {
    response.status(401).json({ error: 'Credenziali non valide' });
    return;
  }

  const token = signSession(user);
  response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
  response.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

app.post('/api/logout', setNoStore, (_request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
  response.json({ ok: true });
});

app.get('/api/gyms', setNoStore, requireAuth, async (request, response) => {
  const gyms = await fetchGymsForUser(request.auth.userId);
  response.json({ gyms });
});

app.post('/api/gyms', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const name = validateGymName(request.body.name);
  const id = crypto.randomUUID();

  await db.run('INSERT INTO gyms (id, user_id, name) VALUES (?, ?, ?)', [id, request.auth.userId, name]);
  response.status(201).json({ id, name, clients: [] });
});

app.patch('/api/gyms/:gymId', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const name = validateGymName(request.body.name);
  const result = await db.run('UPDATE gyms SET name = ? WHERE id = ? AND user_id = ?', [
    name,
    request.params.gymId,
    request.auth.userId,
  ]);

  if (!result.changes) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  response.json({ ok: true });
});

app.delete('/api/gyms/:gymId', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const result = await db.run('DELETE FROM gyms WHERE id = ? AND user_id = ?', [
    request.params.gymId,
    request.auth.userId,
  ]);

  if (!result.changes) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  response.json({ ok: true });
});

app.post('/api/gyms/:gymId/clients', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const gym = await db.get('SELECT id FROM gyms WHERE id = ? AND user_id = ?', [
    request.params.gymId,
    request.auth.userId,
  ]);

  if (!gym) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  const payload = validateClientPayload(request.body);
  const id = crypto.randomUUID();

  await db.run(
    `
      INSERT INTO clients (id, gym_id, first_name, last_name, price, frequency)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, request.params.gymId, payload.firstName, payload.lastName, payload.price, payload.frequency],
  );

  response.status(201).json({ ok: true, id });
});

app.patch('/api/clients/:clientId', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const payload = validateClientPayload(request.body);
  const result = await db.run(
    `
      UPDATE clients
      SET first_name = ?, last_name = ?, price = ?, frequency = ?
      WHERE id = ?
        AND gym_id IN (SELECT id FROM gyms WHERE user_id = ?)
    `,
    [payload.firstName, payload.lastName, payload.price, payload.frequency, request.params.clientId, request.auth.userId],
  );

  if (!result.changes) {
    response.status(404).json({ error: 'Cliente non trovato' });
    return;
  }

  response.json({ ok: true });
});

app.delete('/api/clients/:clientId', setNoStore, requireAuth, async (request, response) => {
  const db = await getDb();
  const result = await db.run(
    'DELETE FROM clients WHERE id = ? AND gym_id IN (SELECT id FROM gyms WHERE user_id = ?)',
    [request.params.clientId, request.auth.userId],
  );

  if (!result.changes) {
    response.status(404).json({ error: 'Cliente non trovato' });
    return;
  }

  response.json({ ok: true });
});

app.use('/api', setNoStore, (_request, response) => {
  response.status(404).json({ error: 'Endpoint non trovato' });
});

app.use(express.static(distDir, { index: false }));

app.get('/{*splat}', (_request, response) => {
  response.sendFile(path.join(distDir, 'index.html'));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Errore interno del server' });
});

getDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
