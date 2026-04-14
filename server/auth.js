import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db.js';

export const AUTH_COOKIE_NAME = 'hm_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }

  return secret;
}

export async function findUserByUsername(username) {
  const db = await getDb();
  return db.get('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
}

export async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

export function signSession(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
    },
    getJwtSecret(),
    {
      expiresIn: '7d',
      issuer: 'apphermann',
    },
  );
}

export function verifySessionToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: 'apphermann',
  });
}

export function getCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

export async function requireAuth(request, response, next) {
  const token = request.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    response.status(401).json({ error: 'Sessione non valida' });
    return;
  }

  try {
    const payload = verifySessionToken(token);
    request.auth = {
      userId: Number(payload.sub),
      username: payload.username,
    };
    next();
  } catch {
    response.clearCookie(AUTH_COOKIE_NAME, getCookieOptions());
    response.status(401).json({ error: 'Sessione scaduta' });
  }
}
