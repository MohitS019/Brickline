import type { Project } from "./brickline-data";

/** Only a user-supplied site address is treated as an exact location. */
export function projectMapLocation(project: Project) {
  const exact = Boolean(project.siteAddress?.trim());
  const query = exact ? `${project.siteAddress}, ${project.area}, India` : `${project.area}, India`;
  return {
    exact,
    label: exact ? project.siteAddress!.trim() : project.area,
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${exact ? 16 : 13}&output=embed`,
  };
}
