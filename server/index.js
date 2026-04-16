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
import {
  createClient,
  createExpense,
  createGym,
  deleteClient,
  deleteExpense,
  deleteGym,
  ensureStoreReady,
  gymExistsForUser,
  listGymsForUser,
  updateClient,
  updateExpense,
  updateGym,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const app = express();
const port = Number(process.env.PORT || 3001);

function setNoStore(_request, response, next) {
  response.setHeader('Cache-Control', 'no-store');
  next();
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

function validateExpensePayload(body) {
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const amount = Number(body.amount);

  if (!label) {
    throw new Error('Nome costo non valido');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Importo costo non valido');
  }

  return {
    label: label.slice(0, 120),
    category: category.slice(0, 80) || 'Generale',
    amount: Math.round(amount * 100) / 100,
  };
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
  await ensureStoreReady();
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
  const gyms = await listGymsForUser(request.auth.userId);
  response.json({ gyms });
});

app.post('/api/gyms', setNoStore, requireAuth, async (request, response) => {
  const name = validateGymName(request.body.name);
  const gym = await createGym(request.auth.userId, {
    id: crypto.randomUUID(),
    name,
  });

  response.status(201).json(gym);
});

app.patch('/api/gyms/:gymId', setNoStore, requireAuth, async (request, response) => {
  const updated = await updateGym(request.auth.userId, request.params.gymId, validateGymName(request.body.name));

  if (!updated) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  response.json({ ok: true });
});

app.delete('/api/gyms/:gymId', setNoStore, requireAuth, async (request, response) => {
  const deleted = await deleteGym(request.auth.userId, request.params.gymId);

  if (!deleted) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  response.json({ ok: true });
});

app.post('/api/gyms/:gymId/clients', setNoStore, requireAuth, async (request, response) => {
  const gymExists = await gymExistsForUser(request.auth.userId, request.params.gymId);

  if (!gymExists) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  const payload = validateClientPayload(request.body);
  const id = crypto.randomUUID();

  await createClient(request.params.gymId, {
    id,
    ...payload,
  });

  response.status(201).json({ ok: true, id });
});

app.post('/api/gyms/:gymId/expenses', setNoStore, requireAuth, async (request, response) => {
  const gymExists = await gymExistsForUser(request.auth.userId, request.params.gymId);

  if (!gymExists) {
    response.status(404).json({ error: 'Palestra non trovata' });
    return;
  }

  const payload = validateExpensePayload(request.body);
  const id = crypto.randomUUID();

  await createExpense(request.params.gymId, {
    id,
    ...payload,
  });

  response.status(201).json({ ok: true, id });
});

app.patch('/api/clients/:clientId', setNoStore, requireAuth, async (request, response) => {
  const updated = await updateClient(request.auth.userId, request.params.clientId, validateClientPayload(request.body));

  if (!updated) {
    response.status(404).json({ error: 'Cliente non trovato' });
    return;
  }

  response.json({ ok: true });
});

app.delete('/api/clients/:clientId', setNoStore, requireAuth, async (request, response) => {
  const deleted = await deleteClient(request.auth.userId, request.params.clientId);

  if (!deleted) {
    response.status(404).json({ error: 'Cliente non trovato' });
    return;
  }

  response.json({ ok: true });
});

app.patch('/api/expenses/:expenseId', setNoStore, requireAuth, async (request, response) => {
  const updated = await updateExpense(request.auth.userId, request.params.expenseId, validateExpensePayload(request.body));

  if (!updated) {
    response.status(404).json({ error: 'Costo non trovato' });
    return;
  }

  response.json({ ok: true });
});

app.delete('/api/expenses/:expenseId', setNoStore, requireAuth, async (request, response) => {
  const deleted = await deleteExpense(request.auth.userId, request.params.expenseId);

  if (!deleted) {
    response.status(404).json({ error: 'Costo non trovato' });
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

ensureStoreReady()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
