/* eslint-disable */
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "./config";
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

// add near other imports
import useClaims from "./hooks/useClaims";

// STATE boundaries
import mpBoundary from "./geojson/mp.json";
import tripuraBoundary from "./geojson/tripura.json";
import odishaBoundary from "./geojson/odisha.json";
import telanganaBoundary from "./geojson/telangana.json";

// DISTRICT polygons
import mpShivpuri from "./geojson/districts/mp_shivpuri.json";
import mpChhindwara from "./geojson/districts/mp_chhindwara.json";
import odKoraput from "./geojson/districts/odisha_koraput.json";
import odKandhamal from "./geojson/districts/odisha_kandhamal.json";
import tgWarangal from "./geojson/districts/telangana_warangal.json";
import tgAdilabad from "./geojson/districts/telangana_adilabad.json";
import trWest from "./geojson/districts/tripura_west.json";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import NewClaimForm from "./components/NewClaimForm";
import ClaimsTable from "./components/ClaimsTable";

// NEW: DiagnosticsPanel import
import DiagnosticsPanel from "./components/DiagnosticsPanel";
import FraAtlasShell from "./components/ui/FraAtlasShell";

// --------------------------
// API normalizer
// --------------------------
const API = (() => {
  const b = String(API_BASE || "").replace(/\/$/, "");
  if (!b) return "/api";
  // if caller already passed in base with /api, keep it
  if (b.endsWith("/api")) return b;
  // if they passed full path including /api/..., don't add
  if (b.includes("/api/")) return b.replace(/\/$/, "");
  return b + "/api";
})();

// --------------------------
// Marker icons
// --------------------------
const grantedIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png", // green tick
  iconSize: [25, 25],
});
const pendingIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png", // red cross
  iconSize: [25, 25],
});
// blue pointer for village (default)
const villageIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // blue pointer
  iconSize: [26, 26],
});
// highlighted (active) village pointer (bigger)
const villageIconActive = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [36, 36],
});

// --------------------------
// MapResetter
// --------------------------
function MapResetter({ resetKey, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (resetKey > 0) {
      map.setView(center, zoom);
    }
  }, [resetKey, center, zoom, map]);
  return null;
}

// --------------------------
// Map click handler
// --------------------------
function MapClickHandler({ onMapClick }) {
  useMapEvent("click", (e) => {
    onMapClick && onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng });
  });
  return null;
}

// --------------------------
// App
// --------------------------
export default function App() {
  // Debug: indicate module loaded
  console.debug("DEBUG: App.jsx loaded", new Date().toISOString());

  // View mode + selected features
  const [viewMode, setViewMode] = useState("state"); // 'state' | 'district'
  const [selectedStateFeature, setSelectedStateFeature] = useState(null);
  const [selectedDistrictFeature, setSelectedDistrictFeature] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);

  // save state bounds for Back to State
  const [selectedStateBounds, setSelectedStateBounds] = useState(null);

  // Layer toggles
  const [showStates, setShowStates] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showGranted, setShowGranted] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showVillages, setShowVillages] = useState(true);

  // Map ref + reset
  const mapRef = useRef(null);
  const defaultCenter = [21.15, 79.09];
  const defaultZoom = 5;
  const [resetTick, setResetTick] = useState(0);

  // App data and UI state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dbClaims, setDbClaims] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pickOnMap, setPickOnMap] = useState(false);
  const [pickCoords, setPickCoords] = useState(null);

  // NEW: editingClaim state for editing existing claims
  const [editingClaim, setEditingClaim] = useState(null);

  // --------------------
  // NEW: villages state (from backend)
  // --------------------
  const [villages, setVillages] = useState([]);

  // ------------ show-claims state & cache ------------
  const [showClaimsVisible, setShowClaimsVisible] = useState(false);
  const [claimsDrawerVillage, setClaimsDrawerVillage] = useState(null);
  // we'll keep a local cache too but prefer the hook
  const {
    getClaimsForVillage,
    getCountForVillage,
    cacheRef: claimsCacheRef,
    upsertClaim, // optional - keep cache fresh when we create/upload claims
  } = useClaims();

  // --------------------
  // NEW: Diagnostics UI state
  // --------------------
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [selectedClaimForDiagnostics, setSelectedClaimForDiagnostics] = useState(null);

  // ------------ helpers: open diagnostics ------------
  function handleRunDiagnostics(claim) {
    if (!claim) return;
    setSelectedClaimForDiagnostics(claim);
    setDiagnosticsOpen(true);
    // Later: kick off fetch/analysis here if needed
    console.debug("Diagnostics started for claim:", claim.id || claim.patta_holder || claim.village);
  }

  // -------------------- (rest of App: API helpers, load functions, etc.) --------------------
  // handleUpload: upload PDF -> expect backend to create a claim and return it (data.claim)
  async function handleUpload() {
    if (!file) return alert("Select a file first");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch(`${API}/upload-fra`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Prefer server-created claim
      const createdClaim = data?.claim || data?.result || null;
      if (createdClaim) {
        const normalized = createdClaim;
        // Insert into UI state (same path as form saves)
        handleClaimSaved(normalized);

        // update claims hook cache if available
        try {
          if (typeof upsertClaim === "function") upsertClaim(normalized);
        } catch (e) {
          console.warn("upsertClaim failed", e);
        }

        // optional: fly to coords if available
        if (normalized?.lat != null && normalized?.lon != null && mapRef.current) {
          try {
            mapRef.current.flyTo([Number(normalized.lat), Number(normalized.lon)], 14);
          } catch (e) {
            console.warn("flyTo after upload failed", e);
          }
        }

        setFile(null);
        setUploading(false);
        return;
      }

      // Fallback: if upload-fra only returned OCR/NER entities (no created claim),
      // build a claim on the frontend and POST to /claims (Option B behavior).
      console.warn("upload-fra did not return a created claim; attempting frontend-create fallback.");
      const entities = data?.entities || {};
      const claimPayload = {
        state: entities.state || "",
        district: entities.district || "",
        village: (entities.villages && entities.villages[0]) || entities.village || "",
        patta_holder: (entities.patta_holders && entities.patta_holders[0]) || entities.patta_holder || "",
        date: (entities.dates && entities.dates[0]) || data.date || "",
        land_area: entities.area || entities.land_area || null,
        status: entities.claim_status || "Pending",
        lat: data?.lat ?? null,
        lon: data?.lon ?? null,
        source_filename: data?.filename || null,
        extracted_text: data?.extracted_text || null,
      };

      // Create claim on backend as fallback
      const createRes = await fetch(`${API}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimPayload),
      });

      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`Create claim failed: ${createRes.status} ${txt}`);
      }
      const created = await createRes.json();
      const createdClaimFallback = created?.claim || created;
      const normalizedFallback = createdClaimFallback || created;

      // Push into UI and cache
      handleClaimSaved(normalizedFallback);
      try {
        if (typeof upsertClaim === "function") upsertClaim(normalizedFallback);
      } catch (e) {
        console.warn("upsertClaim failed on fallback", e);
      }

      if (normalizedFallback?.lat != null && normalizedFallback?.lon != null && mapRef.current) {
        try {
          mapRef.current.flyTo([Number(normalizedFallback.lat), Number(normalizedFallback.lon)], 14);
        } catch (e) {
          console.warn("flyTo after create fallback failed", e);
        }
      }

      setFile(null);
    } catch (err) {
      console.error("handleUpload error", err);
      alert("Upload/create failed: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  }

  // fetchDocs removed (we no longer maintain stored FRA docs list client-side)

  useEffect(() => {
    // removed fetchDocs effect (we no longer maintain docs/filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load DB claims
  async function loadDbClaims() {
    try {
      const res = await fetch(`${API}/claims`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json?.claims || [];
      const normalized = raw.map((c) => ({
        ...c,
        lat: c.lat != null ? Number(c.lat) : null,
        lon: c.lon != null ? Number(c.lon) : null,
      }));
      // debug: what we fetched
      console.debug("DEBUG: loadDbClaims fetched", { count: normalized.length, sample: normalized.slice(0, 5) });
      setDbClaims(normalized);
    } catch (err) {
      console.error("Failed to load claims", err);
      setDbClaims([]);
    }
  }

  // NEW: reload / refresh function (added as requested)
  async function reloadDbClaims() {
    try {
      const res = await fetch(`${API}/claims`);
      if (!res.ok) throw new Error(`reload claims failed: ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json?.claims || [];
      const normalized = arr.map((c) => ({
        ...c,
        lat: c.lat != null ? Number(c.lat) : null,
        lon: c.lon != null ? Number(c.lon) : null,
      }));
      setDbClaims(normalized);
    } catch (e) {
      console.error("reloadDbClaims error", e);
    }
  }

  useEffect(() => {
    loadDbClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------
  // NEW: load villages from backend
  // --------------------
  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await fetch(`${API}/villages`);
        const json = await res.json();
        // handle either array or { villages: [...] }
        let arr = [];
        if (Array.isArray(json)) arr = json;
        else if (Array.isArray(json.villages)) arr = json.villages;
        // normalize lat/lon to numbers or null
        const normalized = arr.map((v) => ({
          ...v,
          lat: v.lat != null ? Number(v.lat) : null,
          lon: v.lon != null ? Number(v.lon) : null,
        }));
        console.debug("DEBUG: villages fetched", normalized.length, normalized.slice(0, 5));
        setVillages(normalized);
      } catch (err) {
        console.error("Failed to load villages", err);
        setVillages([]);
      }
    }
    loadVillages();
  }, []);

  // pick on map handler
  function handleMapClick(coords) {
    if (pickOnMap) {
      setPickCoords(coords);
      setPickOnMap(false);
      setShowForm(true);
    }
  }

  // REPLACED handleClaimSaved — now handles both create and updates
  function handleClaimSaved(createdOrUpdated) {
    if (!createdOrUpdated) return;
    // ensure numeric coords
    if (createdOrUpdated.lat != null) createdOrUpdated.lat = Number(createdOrUpdated.lat);
    if (createdOrUpdated.lon != null) createdOrUpdated.lon = Number(createdOrUpdated.lon);

    setDbClaims((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === createdOrUpdated.id);
      if (existsIndex !== -1) {
        // update existing entry in-place (replace)
        const copy = [...prev];
        copy[existsIndex] = { ...copy[existsIndex], ...createdOrUpdated };
        return copy;
      } else {
        // new claim: prepend
        return [createdOrUpdated, ...prev];
      }
    });

    // update claims hook cache if available (keeps village-level cache fresh)
    try {
      if (typeof upsertClaim === "function") upsertClaim(createdOrUpdated);
    } catch (e) {
      console.warn("upsertClaim failed in handleClaimSaved", e);
    }

    // clear editing state (if any)
    setEditingClaim(null);

    try {
      if (mapRef?.current && createdOrUpdated.lat != null && createdOrUpdated.lon != null) {
        mapRef.current.flyTo([Number(createdOrUpdated.lat), Number(createdOrUpdated.lon)], 16, { duration: 0.8 });
      } else {
        window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: createdOrUpdated.lat, lon: createdOrUpdated.lon } }));
      }
    } catch (err) {
      console.warn("flyTo failed:", err);
    }
  }

  // NEW: handler to start editing an existing claim — opens form prefilled
  function handleEditClaim(claim) {
    if (!claim) return;
    setEditingClaim(claim);
    setShowForm(true);
    // optionally fly to claim if coords available
    if (mapRef.current && claim.lat != null && claim.lon != null) {
      try { mapRef.current.flyTo([Number(claim.lat), Number(claim.lon)], 14); } catch (e) {}
    }
  }

  // -----------------------------
  // NEW helper: zoom to village / claim extents and show claims
  // -----------------------------
  async function zoomToVillageAndShowClaims(villageObj) {
    if (!villageObj) return;
    const villageName = villageObj.village;
    if (!villageName) return;

    // set selection early so UI state is consistent
    setSelectedVillage(villageName);
    setClaimsDrawerVillage(villageName);

    // fetch claims (use return value if provided, but also rely on cache)
    let fetched = null;
    try {
      fetched = await getClaimsForVillage(villageName);
    } catch (err) {
      console.warn("getClaimsForVillage threw", err);
    }

    // prefer returned value, else read cache
    const cachedEntry = claimsCacheRef.current && claimsCacheRef.current[villageName];
    let claims = Array.isArray(fetched) ? fetched : (cachedEntry && Array.isArray(cachedEntry.claims) ? cachedEntry.claims.slice() : []);

    console.debug("zoomToVillageAndShowClaims:", {
      villageName,
      fetchedCount: Array.isArray(fetched) ? fetched.length : null,
      cachedCount: cachedEntry ? (cachedEntry.count || (cachedEntry.claims && cachedEntry.claims.length)) : null,
    });

    // Try case-insensitive key fallback if we don't have claims
    if ((!claims || claims.length === 0) && claimsCacheRef.current) {
      const lowerKey = Object.keys(claimsCacheRef.current).find((k) => k && k.toLowerCase() === villageName.toLowerCase());
      if (lowerKey && claimsCacheRef.current[lowerKey] && Array.isArray(claimsCacheRef.current[lowerKey].claims)) {
        console.debug("Found claims under different-case key:", lowerKey);
        claims = claimsCacheRef.current[lowerKey].claims.slice();
      }
    }

    // compute behaviour
    if (Array.isArray(claims) && claims.length > 1) {
      // build a bounds from claim coordinates (ignore claims without coords)
      const pts = claims
        .filter((c) => c && c.lat != null && c.lon != null)
        .map((c) => [Number(c.lat), Number(c.lon)]);
      if (pts.length > 0 && mapRef.current) {
        try {
          const bounds = L.latLngBounds(pts);
          // fit bounds with padding; cap zoom so we don't zoom beyond tile detail
          mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        } catch (e) {
          console.warn("fitBounds failed, falling back to flyTo", e);
          if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
        }
      } else {
        // no coords for claims -> fly to village if available
        if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
      }
    } else if (Array.isArray(claims) && claims.length === 1) {
      const c = claims[0];
      if (c.lat != null && c.lon != null && mapRef.current) {
        try {
          mapRef.current.flyTo([Number(c.lat), Number(c.lon)], 16);
        } catch (e) {
          console.warn("flyTo single claim failed", e);
          if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
        }
      } else if (villageObj.lat != null && villageObj.lon != null && mapRef.current) {
        mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
      }
    } else {
      // zero claims -> fly to village if coords available
      if (villageObj.lat != null && villageObj.lon != null && mapRef.current) {
        mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
      }
    }

    // finally show claims overlay / markers
    setShowClaimsVisible(true);

    // extra safety: if cache is empty but fetched result exists, ensure cache is populated for render code:
    if ((!claims || claims.length === 0) && Array.isArray(fetched) && fetched.length > 0) {
      try {
        claimsCacheRef.current = claimsCacheRef.current || {};
        claimsCacheRef.current[villageName] = { claims: fetched.slice(), count: fetched.length };
      } catch (e) {
        console.warn("could not write to claimsCacheRef", e);
      }
    }

    // debug current cache entry
    console.debug("claimsCache entry after zoom:", claimsCacheRef.current && claimsCacheRef.current[villageName]);
  }

  function handleClaimsDeleted(deletedIds) {
    if (!Array.isArray(deletedIds) || deletedIds.length === 0) return;
    setDbClaims((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
  }

  // --- add this handler inside App (near other handlers) ---
  function handleClaimUpdated(updated) {
    if (!updated || !updated.id) return;

    // normalize lat/lon to numbers
    if (updated.lat != null) updated.lat = Number(updated.lat);
    if (updated.lon != null) updated.lon = Number(updated.lon);

    // update dbClaims state (replace item)
    setDbClaims((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));

    // update claims cache (if present)
    try {
      const name = updated.village;
      if (name && claimsCacheRef.current && claimsCacheRef.current[name]) {
        const entry = claimsCacheRef.current[name];
        entry.claims = entry.claims.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        // update any count/other fields if needed:
        claimsCacheRef.current[name] = entry;
      }
    } catch (e) {
      console.warn("handleClaimUpdated: cache update failed", e);
    }

    // if the edited claim is currently shown in the drawer, ensure showing markers updates
    if (claimsDrawerVillage && updated.village && claimsDrawerVillage.toLowerCase() === updated.village.toLowerCase()) {
      // toggling showClaimsVisible off/on forces rerender of markers when the UI reads cache
      // but usually updating claimsCacheRef.current should be enough; if not, force a small cycle:
      setShowClaimsVisible(false);
      setTimeout(() => setShowClaimsVisible(true), 50);
    }
  }

  function handleZoomToClaim(claim) {
    if (!mapRef.current) {
      // Try dispatching a global event as a fallback
      if (claim?.lat != null && claim?.lon != null) {
        window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: Number(claim.lat), lon: Number(claim.lon), zoom: 13 } }));
        return;
      }
      alert("Map not ready yet.");
      return;
    }

    // Prefer claim coordinates (more precise)
    if (claim?.lat != null && claim?.lon != null) {
      try {
        mapRef.current.flyTo([Number(claim.lat), Number(claim.lon)], 15, { duration: 0.7 });
        return;
      } catch (err) {
        console.warn("flyTo(claim) failed", err);
      }
    }

    // Fallback: village centroid from geoCache
    if (claim?.village && geoCache[claim.village]) {
      try {
        const [lat, lon] = geoCache[claim.village];
        mapRef.current.flyTo([lat, lon], 13, { duration: 0.7 });
        return;
      } catch (err) {
        console.warn("flyTo(geoCache) failed", err);
      }
    }

    // final fallback
    alert("No coordinates available for this claim or village.");
  }

  // geocoding cache
  const [geoCache, setGeoCache] = useState({});
  async function geocodeVillage(village) {
    if (!village) return null;
    if (geoCache[village]) return geoCache[village];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(village)}, India`
      );
      const data = await res.json();
      if (data && data[0]) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setGeoCache((prev) => ({ ...prev, [village]: coords }));
        return coords;
      }
    } catch (e) {
      console.error("Geocoding failed:", e);
    }
    return null;
  }

  useEffect(() => {
    // Geocode villages from dbClaims (Option A)
    dbClaims.forEach((c) => {
      if (c.village && !geoCache[c.village]) geocodeVillage(c.village);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbClaims]);

  // basemaps + district bundle
  const baseLayers = [
    {
      key: "OSM",
      name: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
    },
    {
      key: "Carto",
      name: "Carto Positron",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap',
    },
    {
      key: "Esri",
      name: "Esri World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
  ];

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

  // map creation + zoom handling (DEBUGGING version)
  const [currentZoom, setCurrentZoom] = useState(defaultZoom);

  const handleMapCreated = (map) => {
    // note the debug logs — if you don't see these, your edited file is not being served
    console.debug("DEBUG: handleMapCreated called", !!map, "map.getCenter?", typeof map?.getCenter === "function");
    mapRef.current = map;

    // expose map globally for console debugging
    try {
      window.__MAP__ = map;
      window.__APP__ = window.__APP__ || {};
      window.__APP__.mapCreatedAt = new Date().toISOString();
      console.debug("DEBUG: window.__MAP__ set, map center:", map.getCenter && map.getCenter());
    } catch (e) {
      console.warn("DEBUG: Could not set window.__MAP__", e);
    }

    // debug marker so you immediately see blue icon on load
    try {
      const debugIcon = L.icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", iconSize: [26,26] });
      const debugMarker = L.marker([21.15, 79.09], { icon: debugIcon, zIndexOffset: 1000 }).addTo(map);
      debugMarker.bindPopup("<strong>DEBUG: Blue pointer</strong>").openPopup();
      console.debug("DEBUG: added debug marker with blue icon");
    } catch (e) {
      console.warn("DEBUG: failed to add debug marker", e);
    }

    // create dedicated mask pane once
    try {
      if (!map.getPane("maskPane")) {
        map.createPane("maskPane");
        const p = map.getPane("maskPane");
        // put the mask above tile/overlay, below markers
        p.style.zIndex = 450; // overlayPane is usually 400; markerPane is 600
        p.style.pointerEvents = "none";
      }
    } catch (e) {
      console.warn("pane create failed", e);
    }

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
      console.debug("DEBUG: zoomend ->", map.getZoom());
    });

    // final debug
    try {
      console.debug("handleMapCreated: center=", map.getCenter(), "zoom=", map.getZoom());
    } catch (e) {}
  };

  // cleanup the debug global on unload/unmount
  useEffect(() => {
    function cleanup() {
      try {
        if (window.__MAP__) delete window.__MAP__;
      } catch (e) {}
    }
    window.addEventListener("beforeunload", cleanup);
    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  // fra-focus listener
  useEffect(() => {
    function onFraFocus(e) {
      const d = e?.detail || {};
      if (!d || d.lat == null || d.lon == null) return;
      if (mapRef.current) {
        try {
          mapRef.current.flyTo([Number(d.lat), Number(d.lon)], d.zoom || 13);
        } catch (err) {
          console.warn("fra-focus: flyTo failed", err);
        }
      }
    }
    window.addEventListener("fra-focus", onFraFocus);
    return () => window.removeEventListener("fra-focus", onFraFocus);
  }, []);

  // reset view - full reset to world
  function handleReset() {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, defaultZoom);
    }
    setResetTick((t) => t + 1);
    setViewMode("state");
    setSelectedDistrictFeature(null);
    setSelectedVillage(null);
    setSelectedStateBounds(null);

    // hide claims UI when resetting
    setShowClaimsVisible(false);
    setClaimsDrawerVillage(null);
  }

  // onEach for districts (safeguarded fitBounds)
  function onEachDistrict(feature, layer) {
    const name =
      feature?.properties?.DISTRICT ||
      feature?.properties?.district ||
      feature?.properties?.name ||
      "District";
    layer.bindTooltip(name, { sticky: true });
    layer.on("click", (e) => {
      console.debug("DEBUG: DISTRICT CLICKED:", name);
      e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
      const map = layer._map;
      if (layer.getBounds) {
        try {
          const bounds = layer.getBounds();
          // bounds.isValid exists on Leaflet LatLngBounds; guard before using
          const isValid = bounds && typeof bounds.isValid === "function" ? bounds.isValid() : true;
          if (isValid) {
            // cap maxZoom so we don't accidentally zoom out to world
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 11 });
          } else {
            // fallback: setView to center-ish at district with a reasonable zoom
            const center = bounds && bounds.getCenter ? bounds.getCenter() : null;
            if (center) map.setView(center, 9);
          }
        } catch (err) {
          console.warn("fitBounds failed in onEachDistrict:", err);
          try { map.setView(layer._map ? layer._map.getCenter() : defaultCenter, 9); } catch (_) {}
        }
      }
      setSelectedDistrictFeature(feature);
      setViewMode("district");
      setSelectedVillage(null);

      // hide claims when navigating away
      setShowClaimsVisible(false);
      setClaimsDrawerVillage(null);
    });
  }

  // state handlers
  function getStateName(feature) {
    return (
      feature?.properties?.STATE ||
      feature?.properties?.st_name ||
      feature?.properties?.name ||
      feature?.properties?.NAME_1 ||
      "State"
    );
  }
  // onEach for states (also safer)
  function onEachState(feature, layer) {
    const name = getStateName(feature);
    layer.bindTooltip(name, { sticky: true });
    layer.on("click", (e) => {
      console.debug("DEBUG: STATE CLICKED:", name);
      e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation();
      const map = layer._map;
      if (layer.getBounds) {
        try {
          const b = layer.getBounds();
          const isValid = b && typeof b.isValid === "function" ? b.isValid() : true;
          if (isValid) {
            map.fitBounds(b, { padding: [20, 20], maxZoom: 7 });
            setSelectedStateBounds(b);
          } else {
            const center = b && b.getCenter ? b.getCenter() : null;
            if (center) map.setView(center, 6);
          }
        } catch (err) {
          console.warn("fitBounds failed in onEachState:", err);
          try { map.setView(defaultCenter, 6); } catch (_) {}
        }
      }
      setSelectedStateFeature(feature);
      setSelectedDistrictFeature(null);
      setSelectedVillage(null);
      setViewMode("state");

      // hide claims when navigating away
      setShowClaimsVisible(false);
      setClaimsDrawerVillage(null);
    });
  }

  // filtered claims (DB only)
  const filteredDbClaims = useMemo(() => {
    return dbClaims.filter((c) => {
      if (!c) return false;
      if (viewMode === "district" && selectedDistrictFeature) {
        const sd = ((selectedDistrictFeature.properties?.DISTRICT || selectedDistrictFeature.properties?.name) || "").toLowerCase();
        if ((c.district || "").toLowerCase() !== sd) return false;
      }
      if (c.status === "Granted" && !showGranted) return false;
      if (c.status === "Pending" && !showPending) return false;
      return true;
    });
  }, [dbClaims, viewMode, selectedDistrictFeature, showGranted, showPending]);

  // Debug logs to confirm data + markers
  useEffect(() => {
    console.debug("DEBUG: dbClaims state changed", { length: dbClaims.length, sample: dbClaims.slice(0, 3) });
  }, [dbClaims]);

  useEffect(() => {
    console.debug("DEBUG: filteredDbClaims length:", filteredDbClaims.length, "sample:", filteredDbClaims.slice(0, 3));
  }, [filteredDbClaims]);

  useEffect(() => {
    setTimeout(() => {
      try {
        const imgs = Array.from(document.querySelectorAll(".leaflet-marker-icon"))
          .map((el) => {
            if (el.tagName && el.tagName.toLowerCase() === "img") return el.src;
            const imgChild = el.querySelector && el.querySelector("img");
            if (imgChild && imgChild.src) return imgChild.src;
            try {
              const bg = window.getComputedStyle(el).getPropertyValue("background-image");
              if (bg && bg !== "none") {
                const m = bg.match(/url\(["']?(.*?)["']?\)/);
                if (m) return m[1];
              }
            } catch (e) {}
            return null;
          })
          .filter(Boolean);
        console.debug("DEBUG: DOM marker srcs", imgs);
      } catch (e) {
        console.debug("DEBUG: DOM marker srcs failed", e);
      }
    }, 800);
  }, [dbClaims, filteredDbClaims]);

  // ---------- Masking ----------
  const maskRef = useRef(null);
  function ringToLatLngs(ring) {
    return ring.map((pt) => [pt[1], pt[0]]);
  }
  function createMaskFromFeature(feature) {
    if (!feature || !mapRef.current) return null;
    const geom = feature.geometry;
    if (!geom) return null;
    const outer = [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180],
    ];
    let hole = null;
    if (geom.type === "Polygon") {
      hole = ringToLatLngs(geom.coordinates[0]);
    } else if (geom.type === "MultiPolygon") {
      let largest = geom.coordinates[0];
      let largestLen = largest[0].length;
      geom.coordinates.forEach((poly) => {
        if (poly[0].length > largestLen) {
          largest = poly;
          largestLen = poly[0].length;
        }
      });
      hole = ringToLatLngs(largest[0]);
    } else {
      return null;
    }

    const poly = L.polygon([outer, hole], {
      color: "#ffffff",
      weight: 0,
      fillColor: "#ffffff",
      fillOpacity: 0.98,
      interactive: false,
      pane: "maskPane",
    });
    return poly;
  }

  // create/remove mask whenever selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (maskRef.current) {
      try {
        mapRef.current.removeLayer(maskRef.current);
      } catch (e) {}
      maskRef.current = null;
    }

    let featureToUse = null;
    if (viewMode === "district" && selectedDistrictFeature) featureToUse = selectedDistrictFeature;
    else if (selectedStateFeature) featureToUse = selectedStateFeature;

    if (featureToUse) {
      const mask = createMaskFromFeature(featureToUse);
      if (mask) {
        mask.addTo(mapRef.current);
        if (typeof mask.bringToFront === "function") mask.bringToFront();
        maskRef.current = mask;
        console.debug("DEBUG: Mask added for", (featureToUse.properties?.NAME || featureToUse.properties?.STATE || featureToUse.properties?.DISTRICT || "<unnamed>"));
      }
    }

    return () => {
      if (maskRef.current) {
        try {
          mapRef.current.removeLayer(maskRef.current);
        } catch (e) {}
        maskRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStateFeature, selectedDistrictFeature, viewMode]);

  // Back to state handler (fit to saved bounds)
  function handleBackToState() {
    if (selectedStateBounds && mapRef.current) {
      try {
        mapRef.current.fitBounds(selectedStateBounds, { padding: [20, 20] });
      } catch (e) {
        handleReset();
      }
    } else {
      handleReset();
    }
    setViewMode("state");
    setSelectedDistrictFeature(null);
    setSelectedVillage(null);

    // hide claims when navigating away
    setShowClaimsVisible(false);
    setClaimsDrawerVillage(null);
  }

  // village click → select and fly
  function onVillageClick(villageName, lat, lon) {
    setSelectedVillage(villageName);
    if (mapRef.current && lat != null && lon != null) {
      try {
        mapRef.current.flyTo([lat, lon], 13);
      } catch (e) {}
    }
  }

  // claims for selected village (DB only)
  const claimsForSelectedVillage = useMemo(() => {
    if (!selectedVillage) return [];
    const lower = selectedVillage.toLowerCase();
    const fromDb = dbClaims.filter((d) => (d.village || "").toLowerCase() === lower);
    return fromDb.map((c) => ({ ...c, _source: "db" }));
  }, [selectedVillage, dbClaims]);

  // -----------------------------
  // NEW: visibleVillages — only show villages inside selected district
  // -----------------------------
  const visibleVillages = useMemo(() => {
    if (viewMode !== "district" || !selectedDistrictFeature) return [];

    const sd =
      (selectedDistrictFeature.properties?.DISTRICT ||
        selectedDistrictFeature.properties?.district ||
        selectedDistrictFeature.properties?.name ||
        "")
        .toString()
        .trim()
        .toLowerCase();

    if (!sd) return [];

    return villages.filter((v) => {
      const vd = (v.district || "").toString().trim().toLowerCase();
      return vd === sd;
    });
  }, [villages, viewMode, selectedDistrictFeature]);

  // -----------------------------------
  // Render
  // -----------------------------------
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 shadow flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-xl font-bold">FRA Atlas</h1>
        <div className="flex gap-2 items-center">
          <button onClick={() => { setShowForm(true); setPickOnMap(false); setPickCoords(null); }} className="px-3 py-2 rounded-xl bg-sky-600 text-white hover:opacity-90">New FRA Claim</button>
          <button onClick={handleReset} className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300">Reset View</button>
        </div>
      </header>

      {/* Layer toggles */}
      <div className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-3">
          <label><input type="checkbox" checked={showStates} onChange={() => setShowStates((v) => !v)} className="mr-1" />Show States</label>
          <label><input type="checkbox" checked={showDistricts} onChange={() => setShowDistricts((v) => !v)} className="mr-1" />Show Districts</label>
          <label><input type="checkbox" checked={showVillages} onChange={() => setShowVillages((v) => !v)} className="mr-1" />Show Villages</label>
        </div>

        <div className="flex gap-2 items-center">
          <button className={`px-3 py-1 rounded-full border ${showGranted ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => setShowGranted((v) => !v)}>Granted</button>
          <button className={`px-3 py-1 rounded-full border ${showPending ? "bg-red-600 text-white" : "bg-white"}`} onClick={() => setShowPending((v) => !v)}>Pending</button>
        </div>

        <div className="flex gap-2 items-center text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded">Level: {viewMode}</span>
          {selectedStateFeature && (
            <>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-50 rounded border">{getStateName(selectedStateFeature)}</span>
              <button className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={() => { handleReset(); }}>Back to States</button>
            </>
          )}
          {viewMode === "district" && selectedDistrictFeature && (
            <>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-50 rounded border">{(selectedDistrictFeature.properties?.DISTRICT || selectedDistrictFeature.properties?.name)}</span>
              <button className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300" onClick={handleBackToState}>Back to State</button>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 p-4 space-y-6">
        <div className="h-[62vh] relative">
          <MapContainer center={defaultCenter} zoom={defaultZoom} scrollWheelZoom={true} className="h-full w-full" whenCreated={handleMapCreated}>
            <MapResetter resetKey={resetTick} center={defaultCenter} zoom={defaultZoom} />
            <MapClickHandler onMapClick={handleMapClick} />

            <LayersControl position="topright">
              {baseLayers.map((b, i) => (
                <LayersControl.BaseLayer key={b.key} name={b.name} checked={i === 0}>
                  <TileLayer attribution={b.attribution} url={b.url} />
                </LayersControl.BaseLayer>
              ))}

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

              {/* Only render claims for the currently-open "Show Claims" village (if any) */}
              {showClaimsVisible && claimsDrawerVillage && (
                <LayersControl.Overlay name={`Claims: ${claimsDrawerVillage}`} checked>
                  <div>
                    {(() => {
                      // Get cached claims for the open village (fallback to empty array)
                      const claimsForVillage = (claimsCacheRef.current[claimsDrawerVillage] && claimsCacheRef.current[claimsDrawerVillage].claims) || [];
                      return claimsForVillage
                        .filter((c) => c && c.lat != null && c.lon != null)
                        .filter((c) => {
                          // apply the Granted/Pending toggles
                          if (c.status === "Granted" && !showGranted) return false;
                          if (c.status === "Pending" && !showPending) return false;
                          return true;
                        })
                        .map((claim) => (
                          <Marker
                            key={`drawer-overlay-claim-${claim.id || (claim.lat + '-' + claim.lon)}`}
                            position={[Number(claim.lat), Number(claim.lon)]}
                            icon={claim.status === "Granted" ? grantedIcon : pendingIcon}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>{claim.village}</Tooltip>
                            <Popup>
                              <div style={{ fontSize: 13 }}>
                                <strong>{claim.village}</strong><br/>State: {claim.state}<br/>District: {claim.district}<br/>Patta Holder: {claim.patta_holder}<br/>Area: {claim.land_area}<br/>Status: {claim.status}
                                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                  <button
                                    style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #2b6cb0", background: "#fff", cursor: "pointer" }}
                                    onClick={(e) => { e?.stopPropagation?.(); handleZoomToClaim(claim); }}
                                  >
                                    Zoom
                                  </button>

                                  {/* Run diagnostics button only for Granted claims */}
                                  {claim.status === "Granted" && (
                                    <button
                                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                                      onClick={(e) => { e?.stopPropagation?.(); handleRunDiagnostics(claim); }}
                                      aria-label={`Run diagnostics for ${claim.id || claim.patta_holder || claim.village}`}
                                    >
                                      Run diagnostics
                                    </button>
                                  )}
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

            {/* ---------------------------
                Render villages from backend (blue pointers)
                Only show villages when user is in 'district' view (not in 'state' or country view)
                --------------------------- */}
            {showVillages && viewMode === "district" && visibleVillages.map((v) => {
              if (v.lat == null || v.lon == null) return null;
              const isActive = selectedVillage && selectedVillage.toLowerCase() === (v.village || "").toLowerCase();
              return (
                <Marker
                  key={`village-${v.id}`}
                  position={[v.lat, v.lon]}
                  icon={isActive ? villageIconActive : villageIcon}
                  eventHandlers={{ click: () => onVillageClick(v.village, v.lat, v.lon) }}
                >
                  <Tooltip direction="top" offset={[0, -10]}>{v.village}</Tooltip>
                  <Popup>
                    <strong>{v.village}</strong><br/>District: {v.district}<br/>State: {v.state}
                    <div style={{ marginTop: 6 }}>
                      <button
                        className="px-2 py-1 rounded bg-sky-600 text-white"
                        onClick={(e) => {
                          e?.stopPropagation?.();
                          // call hardened helper
                          zoomToVillageAndShowClaims(v);
                        }}
                      >
                        {`Show Claims${(claimsCacheRef.current[v.village] && typeof claimsCacheRef.current[v.village].count === "number") ? ` (${claimsCacheRef.current[v.village].count})` : ""}`}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Render claims for the drawer-open village (only when Show Claims pressed) */}
            {showClaimsVisible && claimsDrawerVillage && (() => {
              const claimsForVillage = (claimsCacheRef.current[claimsDrawerVillage] && claimsCacheRef.current[claimsDrawerVillage].claims) || [];
              return claimsForVillage.map((c, i) => {
                const icon = c.status === "Granted" ? grantedIcon : pendingIcon;
                if (c.lat == null || c.lon == null) return null;
                const pos = [Number(c.lat), Number(c.lon)];
                return (
                  <Marker key={`drawer-claim-${c.id || i}`} position={pos} icon={icon}>
                    <Popup>
                      <div style={{ fontSize: 13 }}>
                        <strong>{c.patta_holder || "Claim"}</strong><br/>{c.village || "—"} — {c.district || "—"}, {c.state || "—"}<br/>Area: {c.land_area || "—"}<br/>Status: {c.status || "—"}
                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                          <button
                            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #2b6cb0", background: "#fff", cursor: "pointer" }}
                            onClick={(e) => { e?.stopPropagation?.(); handleZoomToClaim(c); }}
                          >
                            Zoom
                          </button>

                          {/* Run diagnostics: only for Granted */}
                          {c.status === "Granted" && (
                            <button
                              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                              onClick={(e) => { e?.stopPropagation?.(); handleRunDiagnostics(c); }}
                              aria-label={`Run diagnostics for ${c.id || c.patta_holder || c.village}`}
                            >
                              Run diagnostics
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0,-10]} opacity={1}>{c.village || "Claim"}</Tooltip>
                  </Marker>
                );
              });
            })()}

            {/* NOTE: no unconditional pending markers here — claims only render for the open village's overlay above */}

          </MapContainer>
        </div>

        {/* Upload UI */}
        <div className="space-y-2">
          <h2 className="font-semibold">Upload FRA Document</h2>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} className="border p-2 rounded" />
          <button onClick={handleUpload} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90">{uploading ? "Uploading..." : "Upload & Create Claim"}</button>
        </div>

        {/* Claims table */}
        <div className="space-y-2">
          <h2 className="font-semibold">Claims (DB)</h2>
          <ClaimsTable
            claims={dbClaims}
            onRowClick={(c) => {
              if (c.lat != null && c.lon != null) {
                if (mapRef.current) {
                  try { mapRef.current.flyTo([Number(c.lat), Number(c.lon)], 13); return; } catch (err) { console.warn("mapRef.flyTo failed", err); }
                }
                window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: Number(c.lat), lon: Number(c.lon), zoom: 13 } }));
                return;
              }
              if (c.village && geoCache[c.village]) {
                if (mapRef.current) {
                  try { mapRef.current.flyTo(geoCache[c.village], 13); return; } catch (err) { console.warn("mapRef.flyTo(geoCache) failed", err); }
                }
                window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: geoCache[c.village][0], lon: geoCache[c.village][1], zoom: 13 } }));

                return;
              }
              console.warn("no coords available for claim", c?.id);
            }}
            onDeleteSuccess={handleClaimsDeleted}
            onZoom={handleZoomToClaim}
            onEdit={handleEditClaim} // <-- new prop to enable editing from the table
            onUpdateSuccess={handleClaimUpdated} // <-- NEW prop wired to App handler (optimistic/local update)
            onUpdate={reloadDbClaims} // <-- ensure ClaimsTable can trigger a full reload when needed
          />
        </div>
      </main>

      <NewClaimForm
        open={showForm}
        editClaim={editingClaim}                                // <-- pass the editing claim
        prefillCoords={pickCoords}
        pickOnMap={pickOnMap}
        onTogglePick={(b) => { setPickOnMap(b); if (!b) setPickCoords(null); }}
        onClose={() => { setShowForm(false); setPickOnMap(false); setPickCoords(null); setEditingClaim(null); }} // clear editing state on close
        onSaved={(createdOrUpdated) => { handleClaimSaved(createdOrUpdated); setShowForm(false); }}
        // wire reload so edit form can trigger a full refresh after PUT
        onUpdate={reloadDbClaims}
      />

      {/* Diagnostics Panel (renders when diagnosticsOpen is true) */}
      {diagnosticsOpen && (
        <DiagnosticsPanel
          claim={selectedClaimForDiagnostics}
          onClose={() => {
            setDiagnosticsOpen(false);
            setSelectedClaimForDiagnostics(null);
          }}
        />
      )}
    </div>
  );
}
