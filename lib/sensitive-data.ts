import "server-only";
import { deriveAppSecret } from "@/lib/app-secrets";
const encoder = new TextEncoder(); const decoder = new TextDecoder();
async function key() { return crypto.subtle.importKey("raw", await deriveAppSecret("data-encryption"), "AES-GCM", false, ["encrypt", "decrypt"]); }
const pack = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unpack = (value: string) => Uint8Array.from(atob(value), character => character.charCodeAt(0));

export async function encryptSensitive(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), encoder.encode(value)));
  return `${pack(iv)}.${pack(encrypted)}`;
}
export async function decryptSensitive(value: string) {
  const [iv, encrypted] = value.split(".");
  return decoder.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unpack(iv) }, await key(), unpack(encrypted)));
}

export async function fingerprintSensitive(value: string) {
  const signingKey = await crypto.subtle.importKey("raw", await deriveAppSecret("data-fingerprint"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", signingKey, encoder.encode(value.trim().toUpperCase().replace(/\s+/g, ""))));
  return Array.from(signature, byte => byte.toString(16).padStart(2, "0")).join("");
}
