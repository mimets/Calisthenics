import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from './db.js';

export const AUTH_COOKIE_NAME = 'hm_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT_SECRET');
  }

  return secret;
}

export { findUserByUsername };

export async function validatePassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
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
  const crossOriginAuth = process.env.APP_CROSS_ORIGIN_AUTH === 'true';
  const secure = process.env.NODE_ENV === 'production' || crossOriginAuth;

  return {
    httpOnly: true,
    sameSite: crossOriginAuth ? 'none' : 'strict',
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
