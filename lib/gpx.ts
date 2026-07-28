import { gpx, kml } from "@tmcw/togeojson";
import { computeTrackStats, type TrackStats } from "./geo";

export interface ParsedTrack {
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
  stats: TrackStats;
  name: string | null;
}

function mergeCoordinates(
  geometry: GeoJSON.Geometry
): number[][] {
  if (geometry.type === "LineString") return geometry.coordinates;
  if (geometry.type === "MultiLineString") return geometry.coordinates.flat();
  return [];
}

/** Parses an uploaded GPX or KML file (browser only) into a single track. */
export async function parseTrackFile(file: File): Promise<ParsedTrack> {
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const isKml = /\.kml$/i.test(file.name) || doc.documentElement.tagName.toLowerCase() === "kml";

  const collection = isKml ? kml(doc) : gpx(doc);

  const lineFeature = collection.features.find(
    (f) => f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString"
  );

  if (!lineFeature || !lineFeature.geometry) {
    throw new Error("No se ha encontrado ninguna traza (track) en el archivo.");
  }

  const geometry = lineFeature.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
  const coords = mergeCoordinates(geometry);
  const stats = computeTrackStats(coords);
  const name = (lineFeature.properties?.name as string | undefined) ?? null;

  return { geometry, stats, name };
}
