// frontend/src/components/MapComponent.jsx
import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMapEvent,
  LayersControl,
  LayerGroup,
} from "react-leaflet";

/**
 * Props:
 * - center: [lat, lon]
 * - zoom: number
 * - mapRef: a React ref (passed from parent) — will be set by MapContainer when created
 * - dbClaims: array of claim objects (id, village, lat, lon, status, patta_holder, land_area, date)
 * - onMapClick: ({lat, lon}) => void
 * - pickCoords: { lat, lon } | null  (used to render a temporary selected marker)
 * - onRunDiagnostics: (claim) => void   <-- NEW: called when user clicks "Run diagnostics"
 */
function MapClickHandler({ onMapClick }) {
  useMapEvent("click", (e) => {
    onMapClick && onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
  });
  return null;
}

export default function MapComponent({
  center = [22, 78],
  zoom = 6,
  mapRef,
  dbClaims = [],
  onMapClick,
  pickCoords,
  onRunDiagnostics, // new prop
}) {
  // optional: listen for external 'fra-focus' event to flyTo
  useEffect(() => {
    function handler(e) {
      const d = e.detail || {};
      if (!d.lat || !d.lon) return;
      if (mapRef && mapRef.current) {
        mapRef.current.flyTo([d.lat, d.lon], d.zoom || 13);
      }
    }
    window.addEventListener("fra-focus", handler);
    return () => window.removeEventListener("fra-focus", handler);
  }, [mapRef]);

  return (
    <MapContainer
      whenCreated={(m) => (mapRef.current = m)}
      center={center}
      zoom={zoom}
      style={{ height: "70vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onMapClick={onMapClick} />

      {/* LayersControl wrapper */}
      <LayersControl position="topright">
        <LayersControl.Overlay name="Villages" checked>
          <LayerGroup>
            {/* DB claims shown as colored circle markers */}
            {dbClaims.map((c) => {
              if (!c.lat || !c.lon) return null;
              const lat = Number(c.lat),
                lon = Number(c.lon);
              const color = c.status === "Granted" ? "#16a34a" : "#ef4444";
              return (
                <CircleMarker
                  key={`claim-${c.id}`}
                  center={[lat, lon]}
                  radius={8}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.8,
                  }}
                >
                  <Tooltip>
                    {c.village} — {c.status}
                  </Tooltip>
                  <Popup>
                    <div style={{ fontSize: 13 }}>
                      <strong>{c.village}</strong>
                      <br />
                      Holder: {c.patta_holder || "—"}
                      <br />
                      Status: {c.status}
                      <br />
                      Area: {c.land_area || "—"}
                      <br />
                      Date: {c.date || "—"}
                      <br />
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button
                          style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #2b6cb0",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent("fra-focus", {
                                detail: { lat, lon, zoom: 13 },
                              })
                            );
                          }}
                        >
                          Zoom
                        </button>

                        {/* Run diagnostics button: only for Granted claims */}
                        {c.status === "Granted" && typeof onRunDiagnostics === "function" && (
                          <button
                            style={{
                              marginLeft: 2,
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #16a34a",
                              background: "#16a34a",
                              color: "#fff",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            onClick={(ev) => {
                              // prevent the popup from closing immediately in some leaflet setups
                              ev.stopPropagation?.();
                              onRunDiagnostics(c);
                            }}
                            aria-label={`Run diagnostics for claim ${c.id || c.patta_holder || ""}`}
                          >
                            Run diagnostics
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      {/* A temporary marker for pick-on-map (blue) */}
      {pickCoords && pickCoords.lat != null && (
        <CircleMarker
          center={[pickCoords.lat, pickCoords.lon]}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.9,
          }}
        >
          <Tooltip permanent>Selected</Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
