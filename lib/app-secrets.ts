import "server-only";

const encoder = new TextEncoder();
const SALT = encoder.encode("brickline-app-secrets-v1");

function masterSecret() {
  const value = process.env.BRICKLINE_APP_SECRET?.trim() || "";
  if (value.length < 32) {
    throw new Error("BRICKLINE_APP_SECRET must be a random value of at least 32 characters.");
  }
  return value;
}

export async function deriveAppSecret(purpose: "grant-signing" | "data-encryption" | "data-fingerprint") {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret()),
    "HKDF",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: SALT,
      info: encoder.encode(`brickline:${purpose}`),
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}
