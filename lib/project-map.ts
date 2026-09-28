import type { Project } from "./brickline-data";

/** Only a supplied street/site address is treated as an exact location. */
export function projectMapLocation(project: Project) {
  const exact = Boolean(project.siteAddress?.trim());
  const place = [project.area, project.country].filter(Boolean).join(", ");
  return {
    exact,
    label: exact ? project.siteAddress!.trim() : place,
    coordinates:
      Number.isFinite(project.coordinates.latitude) &&
      Number.isFinite(project.coordinates.longitude)
        ? {
            latitude: project.coordinates.latitude!,
            longitude: project.coordinates.longitude!,
          }
        : null,
  };
}
