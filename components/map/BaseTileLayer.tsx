import { TileLayer } from "react-leaflet";

/** OpenTopoMap: free, no API key, shows contour lines/relief which fits a hiking app. */
export function BaseTileLayer() {
  return (
    <TileLayer
      attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
      url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      maxZoom={17}
    />
  );
}
