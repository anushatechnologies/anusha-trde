import { AuthTokens } from '../types';

const DEFAULT_TOKEN_TTL_MS = 55 * 60 * 1000;

const makeSegment = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .padEnd(12, 'x');

const decodeBase64 = (value: string) => {
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(value);
  }

  const globalWithBuffer = globalThis as typeof globalThis & {
    Buffer?: {
      from: (input: string, encoding: string) => { toString: (encoding: string) => string };
    };
  };

  if (globalWithBuffer.Buffer) {
    return globalWithBuffer.Buffer.from(value, 'base64').toString('utf-8');
  }

  throw new Error('Base64 decoding is unavailable in this runtime.');
};

export const createMockTokens = (subject: string): AuthTokens => {
  const expiresAt = Date.now() + 1000 * 60 * 60;

  return {
    accessToken: `${makeSegment('header')}.${makeSegment(subject)}.${makeSegment(`sig-${Date.now()}`)}`,
    refreshToken: `${makeSegment('refresh')}.${makeSegment(subject)}.${makeSegment(`sig-${Date.now() + 1}`)}`,
    expiresAt,
  };
};

export const resolveTokenExpiry = (accessToken: string, fallbackMs = DEFAULT_TOKEN_TTL_MS) => {
  const fallbackExpiry = Date.now() + fallbackMs;
  const payloadSegment = accessToken.split('.')[1];

  if (!payloadSegment) {
    return fallbackExpiry;
  }

  try {
    const paddedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');
    const payload = JSON.parse(decodeBase64(paddedPayload)) as { exp?: number };

    if (typeof payload.exp === 'number' && payload.exp > 0) {
      return payload.exp * 1000;
    }
  } catch {
    return fallbackExpiry;
  }

  return fallbackExpiry;
};
