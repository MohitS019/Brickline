import { env } from "cloudflare:workers";

const encoder = new TextEncoder(); const decoder = new TextDecoder();
const secret = () => (env as { BRICKLINE_DATA_SECRET?: string }).BRICKLINE_DATA_SECRET || "";
async function key() { return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", encoder.encode(secret())), "AES-GCM", false, ["encrypt", "decrypt"]); }
const pack = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unpack = (value: string) => Uint8Array.from(atob(value), character => character.charCodeAt(0));

export async function encryptSensitive(value: string) {
  if (!secret()) throw new Error("Sensitive-data encryption unavailable");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), encoder.encode(value)));
  return `${pack(iv)}.${pack(encrypted)}`;
}
export async function decryptSensitive(value: string) {
  const [iv, encrypted] = value.split(".");
  return decoder.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unpack(iv) }, await key(), unpack(encrypted)));
}
