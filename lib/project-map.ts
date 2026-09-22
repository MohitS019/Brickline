import type { Project } from "./brickline-data";

export function googleMapEmbed(query: string, zoom = 3) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed`;
}

/** Only a supplied street/site address is treated as an exact location. */
export function projectMapLocation(project: Project) {
  const exact = Boolean(project.siteAddress?.trim());
  const place = [project.area, project.country].filter(Boolean).join(", ");
  const query = exact ? `${project.siteAddress}, ${place}` : place;
  return {
    exact,
    label: exact ? project.siteAddress!.trim() : place,
    embedUrl: googleMapEmbed(query, exact ? 16 : 12),
  };
}
