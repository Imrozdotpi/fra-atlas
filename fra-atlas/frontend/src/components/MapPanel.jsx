// src/components/MapPanel.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  LayersControl,
  Tooltip,
  useMap,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import mpBoundary from "../geojson/mp.json";
import tripuraBoundary from "../geojson/tripura.json";
import odishaBoundary from "../geojson/odisha.json";
import telanganaBoundary from "../geojson/telangana.json";

import mpShivpuri from "../geojson/districts/mp_shivpuri.json";
import mpChhindwara from "../geojson/districts/mp_chhindwara.json";
import odKoraput from "../geojson/districts/odisha_koraput.json";
import odKandhamal from "../geojson/districts/odisha_kandhamal.json";
import tgWarangal from "../geojson/districts/telangana_warangal.json";
import tgAdilabad from "../geojson/districts/telangana_adilabad.json";
import trWest from "../geojson/districts/tripura_west.json";

import { grantedIcon, pendingIcon, villageIcon, villageIconActive } from "../utils/mapIcons";

/* Small helpers */
function MapResetter({ resetKey, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (resetKey > 0) map.setView(center, zoom);
  }, [resetKey, center, zoom, map]);
  return null;
}
function MapClickHandler({ onMapClick }) {
  useMapEvent("click", (e) => {
    onMapClick && onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
  });
  return null;
}

export default function MapPanel({
  defaultCenter = [21.15, 79.09],
  defaultZoom = 5,
  resetTick = 0,
  onMapCreated,
  onMapClick,
  onStateSelected,
  onDistrictSelected,
  onVillageClick,
  onRunDiagnostics,
  onZoomToClaim,
  zoomToVillageAndShowClaims,
  visibleVillages = [],
  showStates = true,
  showDistricts = true,
  showVillages = true,
  showClaimsVisible = false,
  claimsDrawerVillage = null,
  claimsCacheRef,
  showGranted = true,
  showPending = true,
}) {
  const localMapRef = useRef(null);

  const districtLayers = useMemo(
    () => [
      { data: mpShivpuri, color: "#6b46c1" },
      { data: mpChhindwara, color: "#6b46c1" },
      { data: odKoraput, color: "#b7791f" },
      { data: odKandhamal, color: "#b7791f" },
      { data: tgWarangal, color: "#dd6b20" },
      { data: tgAdilabad, color: "#dd6b20" },
      { data: trWest, color: "#e53e3e" },
    ],
    []
  );

  function getStateName(feature) {
    return (
      feature?.properties?.STATE ||
      feature?.properties?.st_name ||
      feature?.properties?.name ||
      feature?.properties?.NAME_1 ||
      "State"
    );
  }

  function onEachState(feature, layer) {
    const name = getStateName(feature);
    layer.bindTooltip(name, { sticky: true });
    layer.on("click", (e) => {
      e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
      try {
        const b = layer.getBounds();
        const isValid = b && typeof b.isValid === "function" ? b.isValid() : true;
        if (isValid) layer._map.fitBounds(b, { padding: [20, 20], maxZoom: 7 });
        else {
          const center = b && b.getCenter ? b.getCenter() : null;
          if (center) layer._map.setView(center, 6);
        }
      } catch (err) {
        try {
          layer._map.setView(defaultCenter, 6);
        } catch (_) {}
      }
      onStateSelected && onStateSelected(feature);
    });
  }

  function onEachDistrict(feature, layer) {
    const name =
      feature?.properties?.DISTRICT || feature?.properties?.district || feature?.properties?.name || "District";
    layer.bindTooltip(name, { sticky: true });
    layer.on("click", (e) => {
      e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
      try {
        const bounds = layer.getBounds();
        const isValid = bounds && typeof bounds.isValid === "function" ? bounds.isValid() : true;
        if (isValid) layer._map.fitBounds(bounds, { padding: [20, 20], maxZoom: 11 });
        else {
          const center = bounds && bounds.getCenter ? bounds.getCenter() : null;
          if (center) layer._map.setView(center, 9);
        }
      } catch (err) {
        try {
          layer._map.setView(layer._map ? layer._map.getCenter() : defaultCenter, 9);
        } catch (_) {}
      }
      onDistrictSelected && onDistrictSelected(feature);
    });
  }

  function handleCreated(map) {
    localMapRef.current = map;
    if (typeof onMapCreated === "function") onMapCreated(map);
    try {
      if (!map.getPane("maskPane")) {
        map.createPane("maskPane");
        const p = map.getPane("maskPane");
        p.style.zIndex = 450;
        p.style.pointerEvents = "none";
      }
    } catch (e) {}
    map.on("zoomend", () => {});
  }

  return (
    <div className="h-full w-full">
      <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={true} className="h-full w-full" whenCreated={handleCreated}>
        <MapResetter resetKey={resetTick} center={defaultCenter} zoom={defaultZoom} />
        <MapClickHandler onMapClick={onMapClick} />

        <LayersControl position="topright">
          <LayersControl.BaseLayer name="OpenStreetMap" checked>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Carto Positron">
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Esri World Imagery">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>

          {showStates && (
            <LayersControl.Overlay name="State Boundaries" checked>
              <div>
                <GeoJSON data={mpBoundary} style={{ color: "blue", weight: 2 }} onEachFeature={onEachState} />
                <GeoJSON data={tripuraBoundary} style={{ color: "red", weight: 2 }} onEachFeature={onEachState} />
                <GeoJSON data={odishaBoundary} style={{ color: "green", weight: 2 }} onEachFeature={onEachState} />
                <GeoJSON data={telanganaBoundary} style={{ color: "orange", weight: 2 }} onEachFeature={onEachState} />
              </div>
            </LayersControl.Overlay>
          )}

          {showDistricts && (
            <LayersControl.Overlay name="District Boundaries" checked>
              <div>
                {districtLayers.map((d, idx) => (
                  <GeoJSON key={idx} data={d.data} style={{ color: d.color, weight: 1.5, fillOpacity: 0.05 }} onEachFeature={onEachDistrict} />
                ))}
              </div>
            </LayersControl.Overlay>
          )}

          {showClaimsVisible && claimsDrawerVillage && (
            <LayersControl.Overlay name={`Claims: ${claimsDrawerVillage}`} checked>
              <div>
                {(() => {
                  const claimsForVillage = (claimsCacheRef?.current?.[claimsDrawerVillage]?.claims) || [];
                  return claimsForVillage
                    .filter((c) => c && c.lat != null && c.lon != null)
                    .filter((c) => {
                      if (c.status === "Granted" && !showGranted) return false;
                      if (c.status === "Pending" && !showPending) return false;
                      return true;
                    })
                    .map((claim) => (
                      <Marker key={`drawer-overlay-claim-${claim.id || (claim.lat + "-" + claim.lon)}`} position={[Number(claim.lat), Number(claim.lon)]} icon={claim.status === "Granted" ? grantedIcon : pendingIcon}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={1}>{claim.village}</Tooltip>
                        <Popup>
                          <div style={{ fontSize: 13 }}>
                            <strong>{claim.village}</strong><br />State: {claim.state}<br />District: {claim.district}<br />Patta Holder: {claim.patta_holder}<br />Area: {claim.land_area}<br />Status: {claim.status}
                            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                              <button style={{ padding: "6px 8px", borderRadius: 6 }} onClick={(e) => { e?.stopPropagation?.(); onZoomToClaim && onZoomToClaim(claim); }}>Zoom</button>
                              {claim.status === "Granted" && <button style={{ padding: "6px 10px", borderRadius: 6, background: "#16a34a", color: "#fff" }} onClick={(e) => { e?.stopPropagation?.(); onRunDiagnostics && onRunDiagnostics(claim); }}>Run diagnostics</button>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ));
                })()}
              </div>
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {showVillages && visibleVillages.map((v) => {
          if (v.lat == null || v.lon == null) return null;
          const isActive = false;
          return (
            <Marker key={`village-${v.id}`} position={[v.lat, v.lon]} icon={isActive ? villageIconActive : villageIcon} eventHandlers={{ click: () => onVillageClick && onVillageClick(v) }}>
              <Tooltip direction="top" offset={[0, -10]}>{v.village}</Tooltip>
              <Popup>
                <strong>{v.village}</strong><br />District: {v.district}<br />State: {v.state}
                <div style={{ marginTop: 6 }}>
                  <button className="px-2 py-1 rounded bg-sky-600 text-white" onClick={(e) => { e?.stopPropagation?.(); zoomToVillageAndShowClaims && zoomToVillageAndShowClaims(v); }}>
                    {`Show Claims${(claimsCacheRef?.current?.[v.village]?.count) ? ` (${claimsCacheRef.current[v.village].count})` : ""}`}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showClaimsVisible && claimsDrawerVillage && (() => {
          const claimsForVillage = (claimsCacheRef?.current?.[claimsDrawerVillage]?.claims) || [];
          return claimsForVillage.map((c, i) => {
            const icon = c.status === "Granted" ? grantedIcon : pendingIcon;
            if (c.lat == null || c.lon == null) return null;
            return (
              <Marker key={`drawer-claim-${c.id || i}`} position={[Number(c.lat), Number(c.lon)]} icon={icon}>
                <Popup>
                  <div style={{ fontSize: 13 }}>
                    <strong>{c.patta_holder || "Claim"}</strong><br />{c.village || "—"} — {c.district || "—"}, {c.state || "—"}<br />Area: {c.land_area || "—"}<br />Status: {c.status || "—"}
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button onClick={(e) => { e?.stopPropagation?.(); onZoomToClaim && onZoomToClaim(c); }}>Zoom</button>
                      {c.status === "Granted" && <button onClick={(e) => { e?.stopPropagation?.(); onRunDiagnostics && onRunDiagnostics(c); }}>Run diagnostics</button>}
                    </div>
                  </div>
                </Popup>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>{c.village || "Claim"}</Tooltip>
              </Marker>
            );
          });
        })()}
      </MapContainer>
    </div>
  );
}
