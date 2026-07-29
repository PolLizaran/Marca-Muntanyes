import { TileLayer } from "react-leaflet";

/**
 * CARTO Voyager: free, no API key, plain roads/labels with no hillshade or
 * contour lines, so tiles are much lighter and faster to render than
 * OpenTopoMap while still showing enough context for a hiking app.
 */
export function BaseTileLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      subdomains="abcd"
      maxZoom={19}
    />
  );
}
