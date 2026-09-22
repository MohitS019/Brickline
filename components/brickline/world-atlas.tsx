"use client";

import { useMemo } from "react";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import topology from "world-atlas/countries-110m.json";
import type { FeatureCollection, Geometry } from "geojson";

const countries = feature(topology as never, topology.objects.countries as never) as unknown as FeatureCollection<Geometry, { name: string }>;
const projection = geoNaturalEarth1().fitSize([1000, 520], countries);
const path = geoPath(projection);
export const worldCountryNames = countries.features.map(country => country.properties.name);

export function WorldAtlas({ selected, onCountry }: { selected: string; onCountry: (country: string) => void }) {
  const graticule = useMemo(() => path(geoGraticule10()) || "", []);
  return <div className="atlas-wrap"><svg viewBox="0 0 1000 520" role="img" aria-label="Interactive world map with countries" preserveAspectRatio="xMidYMid meet"><path className="atlas-graticule" d={graticule}/>{countries.features.map((country, index) => {
    const name = country.properties.name;
    return <path key={`${name}-${index}`} d={path(country) || ""} className={selected === name ? "atlas-country selected" : "atlas-country"} onClick={() => onCountry(name)}><title>{name}</title></path>;
  })}</svg><span className="atlas-caption">Country borders are illustrative. Select a country or search for a city to explore.</span></div>;
}
