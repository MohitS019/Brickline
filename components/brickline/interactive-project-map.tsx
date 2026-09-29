"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { statusColor, type Project } from "@/lib/brickline-data";

const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function featureCollection(
  projects: Project[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: projects.flatMap((project) => {
      const { latitude, longitude } = project.coordinates;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [
        {
          type: "Feature" as const,
          id: project.id,
          geometry: {
            type: "Point" as const,
            coordinates: [longitude!, latitude!],
          },
          properties: {
            projectId: project.id,
            name: project.name,
            status: project.status,
          },
        },
      ];
    }),
  };
}

export function InteractiveProjectMap({
  projects,
  selectedId,
  focusProjects,
  resetToken = 0,
  onSelect,
}: {
  projects: Project[];
  selectedId: string | null;
  focusProjects: Project[] | null;
  resetToken?: number;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectRef = useRef(onSelect);
  const initialProjectsRef = useRef(projects);
  const initialSelectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: INDIA_CENTER,
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.on("load", () => {
      map.addSource("projects", {
        type: "geojson",
        data: featureCollection(initialProjectsRef.current),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 46,
      });
      map.addLayer({
        id: "project-clusters",
        type: "circle",
        source: "projects",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#25211d",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 23, 30, 29],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "projects",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "project-pins",
        type: "circle",
        source: "projects",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "projectId"], initialSelectedIdRef.current || ""],
            11,
            8,
          ],
          "circle-color": [
            "match",
            ["get", "status"],
            "New construction",
            statusColor["New construction"],
            "Construction started",
            statusColor["Construction started"],
            "Redevelopment",
            statusColor.Redevelopment,
            "Approval stage",
            statusColor["Approval stage"],
            statusColor["New construction"],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.on("click", "project-clusters", async (event) => {
        const feature = map.queryRenderedFeatures(event.point, {
          layers: ["project-clusters"],
        })[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        if (!Number.isFinite(clusterId)) return;
        const zoom = await (
          map.getSource("projects") as GeoJSONSource
        ).getClusterExpansionZoom(clusterId);
        map.easeTo({
          center: (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ],
          zoom,
        });
      });
      map.on("click", "project-pins", (event) => {
        const id = event.features?.[0]?.properties?.projectId;
        if (typeof id === "string") selectRef.current(id);
      });
      for (const layer of ["project-clusters", "project-pins"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () =>
      (map.getSource("projects") as GeoJSONSource | undefined)?.setData(
        featureCollection(projects),
      );
    if (map.loaded()) update();
    else map.once("load", update);
  }, [projects]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("project-pins")) return;
    map.setPaintProperty("project-pins", "circle-radius", [
      "case",
      ["==", ["get", "projectId"], selectedId || ""],
      11,
      8,
    ]);
  }, [selectedId]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusProjects) return;
    const points = focusProjects.flatMap((project) => {
      const { latitude, longitude } = project.coordinates;
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [[longitude!, latitude!] as [number, number]]
        : [];
    });
    if (!points.length) return;
    if (points.length === 1)
      map.easeTo({ center: points[0], zoom: 13, duration: 900 });
    else {
      const bounds = points
        .slice(1)
        .reduce(
          (box, point) => box.extend(point),
          new maplibregl.LngLatBounds(points[0], points[0]),
        );
      map.fitBounds(bounds, { padding: 75, maxZoom: 13, duration: 900 });
    }
  }, [focusProjects]);
  useEffect(() => {
    if (resetToken)
      mapRef.current?.easeTo({ center: INDIA_CENTER, zoom: 4, duration: 900 });
  }, [resetToken]);
  return (
    <div
      ref={containerRef}
      className="interactive-project-map"
      aria-label="Interactive map of registered real-estate projects in India"
    />
  );
}
