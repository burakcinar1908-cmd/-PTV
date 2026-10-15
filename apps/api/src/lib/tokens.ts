import crypto from "node:crypto";

export function rastgeleToken(bayt = 32): string {
  return crypto.randomBytes(bayt).toString("hex");
}

export function tokenOzeti(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
