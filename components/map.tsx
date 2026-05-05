"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapItem {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: string;
  neighborhood?: string;
}

interface Cluster {
  key: string;
  lat: number;
  lng: number;
  items: MapItem[];
}

interface MapProps {
  items: MapItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const SANTIAGO_CENTRO: [number, number] = [-33.4430, -70.6503];

function buildClusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:#16a34a;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function clusterItems(items: MapItem[]): Cluster[] {
  const clusterMap = new globalThis.Map<string, Cluster>();

  for (const item of items) {
    const roundedLat = Math.round(item.lat * 1000) / 1000;
    const roundedLng = Math.round(item.lng * 1000) / 1000;
    const key = `${roundedLat},${roundedLng}`;

    const existing = clusterMap.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      clusterMap.set(key, { key, lat: roundedLat, lng: roundedLng, items: [item] });
    }
  }

  return Array.from(clusterMap.values());
}

export default function Map(props: MapProps) {
  const { items, center, zoom = 14, height = "500px" } = props;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = (): void => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const validItems = useMemo(
    () =>
      items.filter(
        (item) => typeof item.lat === "number" && typeof item.lng === "number"
      ),
    [items]
  );

  const clusters = useMemo(() => clusterItems(validItems), [validItems]);

  const mapCenter: [number, number] =
    center ?? (validItems.length > 0 ? [validItems[0].lat, validItems[0].lng] : SANTIAGO_CENTRO);

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

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
          url={tileUrl}
        />
        {clusters.map((cluster) => (
          <Marker
            key={cluster.key}
            position={[cluster.lat, cluster.lng]}
            icon={buildClusterIcon(cluster.items.length)}
          >
            <Popup>
              <div className="min-w-[160px] space-y-2">
                {cluster.items.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <p className="text-sm font-medium">{item.title}</p>
                    <a
                      href={`/items/${item.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver detalle
                    </a>
                  </div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
