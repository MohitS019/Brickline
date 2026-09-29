export function getExternalAppUrl() {
  const isVercelTarget =
    process.env.VERCEL === "1" || process.env.BRICKLINE_VERCEL_BUILD === "1";
  if (!isVercelTarget) return undefined;
  return process.env.NEXT_PUBLIC_BRICKLINE_APP_URL?.replace(/\/$/, "");
}
