import "server-only";
import { deriveAppSecret } from "@/lib/app-secrets";
export type GrantClaims = {
  jti: string;
  sub: string;
  aid: string;
  bid: string;
  pid: string;
  exp: number;
};
const encoder = new TextEncoder();
const encode = (value: string) =>
  btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (value: string) =>
  atob(
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "="),
  );
async function signature(input: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    await deriveAppSecret("grant-signing"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return encode(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.sign("HMAC", key, encoder.encode(input)),
      ),
    ),
  );
}

async function validSignature(input: string, value: string) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      await deriveAppSecret("grant-signing"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const binary = atob(
      value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(value.length / 4) * 4, "="),
    );
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return crypto.subtle.verify("HMAC", key, bytes, encoder.encode(input));
  } catch {
    return false;
  }
}

export async function createGrantToken(claims: GrantClaims) {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(JSON.stringify(claims));
  const input = `${header}.${payload}`;
  return `${input}.${await signature(input)}`;
}

export async function verifyGrantToken(
  token: string,
): Promise<GrantClaims | null> {
  if (token.length > 3000) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const input = `${parts[0]}.${parts[1]}`;
  if (!(await validSignature(input, parts[2]))) return null;
  try {
    const claims = JSON.parse(decode(parts[1])) as GrantClaims;
    return claims.jti &&
      claims.sub &&
      claims.aid &&
      claims.bid &&
      claims.pid &&
      Number.isFinite(claims.exp)
      ? claims
      : null;
  } catch {
    return null;
  }
}
