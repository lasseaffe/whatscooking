// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALG = 'aes-256-gcm';

function getKey() {
  const raw = process.env.SPOTIFY_ENCRYPTION_KEY;
  if (!raw) throw new Error('SPOTIFY_ENCRYPTION_KEY env var is not set');
  return Buffer.from(raw, 'hex');
}

export function encrypt(text: string): string {
  const KEY = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(payload: string): string {
  const KEY = getKey();
  const [ivHex, tagHex, encHex] = payload.split(':');
  const decipher = createDecipheriv(ALG, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
}
