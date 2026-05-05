"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export interface MapItem {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: string;
}

interface MapProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function Map(props: MapProps) {
  const { items, center, zoom = 13, height = "500px" } = props;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const mapCenter: [number, number] =
    center ??
    (items.length > 0 ? [items[0].lat, items[0].lng] : [-33.4, -70.6]);

  const validItems = items.filter(
    (item) => typeof item.lat === "number" && typeof item.lng === "number"
  );

  return (
    <div
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-lg border"
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        {validItems.map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]}>
            <Popup>
              <div className="min-w-[120px] space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {item.status}
                </p>
                <a
                  href={`/items/${item.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Ver detalle
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
