import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { env } from "@/lib/env";

function key() {
  const source = env.ENCRYPTION_KEY || (env.NODE_ENV === "production" ? "" : env.AUTH_SECRET);
  if (!source || (env.NODE_ENV === "production" && source.length < 32)) throw new Error("ENCRYPTION_KEY must contain at least 32 characters.");
  return createHash("sha256").update(source).digest();
}

export function encryptCredential(value: Record<string, string>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptCredential(value: string): Record<string, string> {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Credential payload is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, string>;
}
