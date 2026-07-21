import crypto from "node:crypto";
import { getSetting, setSetting } from "@/lib/repositories/settingsRepo";

const SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const SCRYPT_KEY_LENGTH = 64;

export const SESSION_COOKIE_NAME = "session";

function getOrCreateSessionSecret(): string {
  const existing = getSetting("session_secret");
  if (existing) return existing;
  const secret = crypto.randomBytes(32).toString("hex");
  setSetting("session_secret", secret);
  return secret;
}

export function hasPinConfigured(): boolean {
  return Boolean(getSetting("auth_pin_hash"));
}

export function setPin(pin: string): void {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, SCRYPT_KEY_LENGTH).toString("hex");
  setSetting("auth_pin_salt", salt);
  setSetting("auth_pin_hash", hash);
  getOrCreateSessionSecret();
}

export function clearPin(): void {
  setSetting("auth_pin_hash", "");
  setSetting("auth_pin_salt", "");
}

export function verifyPin(pin: string): boolean {
  const salt = getSetting("auth_pin_salt");
  const hash = getSetting("auth_pin_hash");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pin, salt, SCRYPT_KEY_LENGTH).toString("hex");
  const candidateBuf = Buffer.from(candidate, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  if (candidateBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, hashBuf);
}

export function issueSessionToken(): string {
  const secret = getOrCreateSessionSecret();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const signature = crypto.createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAtStr, signature] = token.split(".");
  if (!expiresAtStr || !signature) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const secret = getSetting("session_secret");
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(expiresAtStr).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
