type GeocodeResult = { latitude: number; longitude: number };

const endpoint = process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";

export async function geocodeIndiaProject(query: string): Promise<GeocodeResult | null> {
  const value = query.trim().slice(0, 300);
  if (!value) return null;
  const url = new URL("/search", endpoint);
  url.searchParams.set("q", `${value}, India`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Brickline/1.0 (mohitsonje4@gmail.com)", "Accept-Language": "en-IN,en" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const results = await response.json() as { lat?: string; lon?: string }[];
    const latitude = Number(results[0]?.lat); const longitude = Number(results[0]?.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}
