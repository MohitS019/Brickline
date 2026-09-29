/**
 * Build-time compatibility layer for the Vercel/Next.js target.
 *
 * The full Brickline application uses Cloudflare D1 and dispatch-owned
 * authentication on Sites. Vercel serves the public experience and forwards
 * protected entry points to that application, so a D1 binding is deliberately
 * unavailable here while ordinary environment variables remain readable.
 */
export const env = {
  ...process.env,
  DB: undefined,
};
