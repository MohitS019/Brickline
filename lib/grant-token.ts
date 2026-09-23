import { env } from "cloudflare:workers";

export type GrantClaims = { jti: string; sub: string; aid: string; bid: string; exp: number };
const encoder = new TextEncoder();
const encode = (value: string) => btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (value: string) => atob(value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
const secret = () => (env as { BRICKLINE_GRANT_SECRET?: string }).BRICKLINE_GRANT_SECRET || "";

async function signature(input: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(input)))));
}

export async function createGrantToken(claims: GrantClaims) {
  if (!secret()) throw new Error("Grant signing is unavailable");
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(JSON.stringify(claims));
  const input = `${header}.${payload}`;
  return `${input}.${await signature(input)}`;
}

export async function verifyGrantToken(token: string): Promise<GrantClaims | null> {
  if (!secret() || token.length > 3000) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const input = `${parts[0]}.${parts[1]}`;
  if ((await signature(input)) !== parts[2]) return null;
  try {
    const claims = JSON.parse(decode(parts[1])) as GrantClaims;
    return claims.jti && claims.sub && claims.aid && claims.bid && Number.isFinite(claims.exp) ? claims : null;
  } catch { return null; }
}
