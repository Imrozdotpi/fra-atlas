/* src/App.jsx */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "./config";
import useClaims from "./hooks/useClaims";

import HeaderToolbar from "./components/HeaderToolbar";
import MapPanel from "./components/MapPanel";
import UploadPanel from "./components/UploadPanel";
import ClaimsPanelWrapper from "./components/ClaimsPanelWrapper";
import NewClaimForm from "./components/NewClaimForm";
import DiagnosticsPanel from "./components/DiagnosticsPanel";

// ✅ use authFetch instead of fetch for API calls
// also import fetchCurrentUser and removeToken for current-user + logout handling
import { authFetch, fetchCurrentUser, removeToken } from "./libs/apiClient";

/* API normalizer */
const API = (() => {
  const b = String(API_BASE || "").replace(/\/$/, "");
  if (!b) return "/api";
  if (b.endsWith("/api")) return b;
  if (b.includes("/api/")) return b.replace(/\/$/, "");
  return b + "/api";
})();

export default function App() {
  // -------------------------
  // Legacy app state (unchanged)
  // -------------------------
  // view + selection
  const [viewMode, setViewMode] = useState("state");
  const [selectedStateFeature, setSelectedStateFeature] = useState(null);
  const [selectedDistrictFeature, setSelectedDistrictFeature] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [selectedStateBounds, setSelectedStateBounds] = useState(null);

  // toggles
  const [showStates, setShowStates] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showGranted, setShowGranted] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showVillages, setShowVillages] = useState(true);

  // map ref + defaults
  const mapRef = useRef(null);
  const defaultCenter = [21.15, 79.09];
  const defaultZoom = 5;
  const [resetTick, setResetTick] = useState(0);

  // UI + data
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dbClaims, setDbClaims] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pickOnMap, setPickOnMap] = useState(false);
  const [pickCoords, setPickCoords] = useState(null);
  const [editingClaim, setEditingClaim] = useState(null);
  const [villages, setVillages] = useState([]);

  // NEW: current user
  const [currentUser, setCurrentUser] = useState(null);

  // claims drawer + cache via hook
  const [showClaimsVisible, setShowClaimsVisible] = useState(false);
  const [claimsDrawerVillage, setClaimsDrawerVillage] = useState(null);
  const { getClaimsForVillage, cacheRef: claimsCacheRef, upsertClaim } = useClaims();

  // diagnostics
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [selectedClaimForDiagnostics, setSelectedClaimForDiagnostics] = useState(null);

  function handleRunDiagnostics(claim) {
    if (!claim) return;
    setSelectedClaimForDiagnostics(claim);
    setDiagnosticsOpen(true);
  }

  /* Upload (kept in App for API handling and cache updates) */
  async function handleUpload() {
    if (!file) return alert("Select a file first");
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await authFetch(`${API}/upload-fra`, { method: "POST", body: formData });
      // authFetch returns the fetch Response object; use .json() accordingly
      const data = await res.json();

      const createdClaim = data?.claim || data?.result || null;
      if (createdClaim) {
        handleClaimSaved(createdClaim);
        try { if (typeof upsertClaim === "function") upsertClaim(createdClaim); } catch (e) {}
        if (createdClaim?.lat != null && createdClaim?.lon != null && mapRef.current) {
          try { mapRef.current.flyTo([Number(createdClaim.lat), Number(createdClaim.lon)], 14); } catch (e) {}
        }
        setFile(null);
        setUploading(false);
        return;
      }

      // fallback: create from entities
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

      const createRes = await authFetch(`${API}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimPayload),
      });
      if (!createRes.ok) throw new Error(`Create claim failed: ${createRes.status}`);
      const created = await createRes.json();
      const normalizedFallback = created?.claim || created;
      handleClaimSaved(normalizedFallback);
      try { if (typeof upsertClaim === "function") upsertClaim(normalizedFallback); } catch (e) {}
      if (normalizedFallback?.lat != null && normalizedFallback?.lon != null && mapRef.current) {
        try { mapRef.current.flyTo([Number(normalizedFallback.lat), Number(normalizedFallback.lon)], 16, { duration: 0.8 }); } catch (e) {}
      }
      setFile(null);
    } catch (err) {
      console.error("handleUpload error", err);
      alert("Upload/create failed: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  }

  /* load claims */
  async function loadDbClaims() {
    try {
      const res = await authFetch(`${API}/claims`);
      const json = await res.json();
      const raw = Array.isArray(json) ? json : json?.claims || [];
      const normalized = raw.map((c) => ({ ...c, lat: c.lat != null ? Number(c.lat) : null, lon: c.lon != null ? Number(c.lon) : null }));
      setDbClaims(normalized);
    } catch (err) {
      console.error("Failed to load claims", err);
      setDbClaims([]);
    }
  }
  async function reloadDbClaims() {
    try {
      const res = await authFetch(`${API}/claims`);
      if (!res.ok) throw new Error(`reload claims failed: ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : json?.claims || [];
      const normalized = arr.map((c) => ({ ...c, lat: c.lat != null ? Number(c.lat) : null, lon: c.lon != null ? Number(c.lon) : null }));
      setDbClaims(normalized);
    } catch (e) {
      console.error("reloadDbClaims error", e);
    }
  }

  useEffect(() => { loadDbClaims(); }, []);

  /* load villages */
  useEffect(() => {
    async function loadVillages() {
      try {
        const res = await authFetch(`${API}/villages`);
        const json = await res.json();
        let arr = [];
        if (Array.isArray(json)) arr = json;
        else if (Array.isArray(json.villages)) arr = json.villages;
        const normalized = arr.map((v) => ({ ...v, lat: v.lat != null ? Number(v.lat) : null, lon: v.lon != null ? Number(v.lon) : null }));
        setVillages(normalized);
      } catch (err) { console.error("Failed to load villages", err); setVillages([]); }
    }
    loadVillages();
  }, []);

  // NEW: load current user on mount and handle expiry/401
  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const u = await fetchCurrentUser();
        if (mounted) setCurrentUser(u);
      } catch (err) {
        console.warn("Could not fetch current user:", err);
        // handle 401 (token expired / invalid)
        if (err && (err.status === 401 || err.statusCode === 401 || err.message === "Unauthorized")) {
          try { removeToken(); } catch (e) {}
          window.location.href = import.meta.env.VITE_LOGIN_URL || "http://localhost:3000/login";
        }
      }
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  /* pick on map */
  function handleMapClick(coords) {
    if (pickOnMap) {
      setPickCoords(coords);
      setPickOnMap(false);
      setShowForm(true);
    }
  }

  /* create/update claim in UI state */
  function handleClaimSaved(createdOrUpdated) {
    if (!createdOrUpdated) return;
    if (createdOrUpdated.lat != null) createdOrUpdated.lat = Number(createdOrUpdated.lat);
    if (createdOrUpdated.lon != null) createdOrUpdated.lon = Number(createdOrUpdated.lon);

    setDbClaims((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === createdOrUpdated.id);
      if (existsIndex !== -1) {
        const copy = [...prev];
        copy[existsIndex] = { ...copy[existsIndex], ...createdOrUpdated };
        return copy;
      } else {
        return [createdOrUpdated, ...prev];
      }
    });

    try { if (typeof upsertClaim === "function") upsertClaim(createdOrUpdated); } catch (e) {}
    setEditingClaim(null);

    try {
      if (mapRef?.current && createdOrUpdated.lat != null && createdOrUpdated.lon != null) {
        mapRef.current.flyTo([Number(createdOrUpdated.lat), Number(createdOrUpdated.lon)], 16, { duration: 0.8 });
      } else {
        window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: createdOrUpdated.lat, lon: createdOrUpdated.lon } }));
      }
    } catch (err) { console.warn("flyTo failed:", err); }
  }

  function handleEditClaim(claim) {
    if (!claim) return;
    setEditingClaim(claim);
    setShowForm(true);
    if (mapRef.current && claim.lat != null && claim.lon != null) {
      try { mapRef.current.flyTo([Number(claim.lat), Number(claim.lon)], 14); } catch (e) {}
    }
  }

  async function zoomToVillageAndShowClaims(villageObj) {
    if (!villageObj) return;
    const villageName = villageObj.village;
    if (!villageName) return;

    setSelectedVillage(villageName);
    setClaimsDrawerVillage(villageName);

    let fetched = null;
    try { fetched = await getClaimsForVillage(villageName); } catch (err) { console.warn("getClaimsForVillage threw", err); }

    const cachedEntry = claimsCacheRef?.current && claimsCacheRef.current[villageName];
    let claims = Array.isArray(fetched) ? fetched : (cachedEntry && Array.isArray(cachedEntry.claims) ? cachedEntry.claims.slice() : []);

    if ((!claims || claims.length === 0) && claimsCacheRef?.current) {
      const lowerKey = Object.keys(claimsCacheRef.current).find((k) => k && k.toLowerCase() === villageName.toLowerCase());
      if (lowerKey && claimsCacheRef.current[lowerKey] && Array.isArray(claimsCacheRef.current[lowerKey].claims)) {
        claims = claimsCacheRef.current[lowerKey].claims.slice();
      }
    }

    if (Array.isArray(claims) && claims.length > 1) {
      const pts = claims.filter((c) => c && c.lat != null && c.lon != null).map((c) => [Number(c.lat), Number(c.lon)]);
      if (pts.length > 0 && mapRef.current) {
        try {
          const bounds = L.latLngBounds(pts);
          mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        } catch (e) {
          if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
        }
      } else {
        if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
      }
    } else if (Array.isArray(claims) && claims.length === 1) {
      const c = claims[0];
      if (c.lat != null && c.lon != null && mapRef.current) {
        try { mapRef.current.flyTo([Number(c.lat), Number(c.lon)], 16); return; } catch (e) { if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16); }
      } else if (villageObj.lat != null && villageObj.lon != null && mapRef.current) {
        mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
      }
    } else {
      if (villageObj.lat != null && villageObj.lon != null && mapRef.current) mapRef.current.flyTo([villageObj.lat, villageObj.lon], 16);
    }

    setShowClaimsVisible(true);

    if ((!claims || claims.length === 0) && Array.isArray(fetched) && fetched.length > 0) {
      try { claimsCacheRef.current = claimsCacheRef.current || {}; claimsCacheRef.current[villageName] = { claims: fetched.slice(), count: fetched.length }; } catch (e) {}
    }
  }

  function handleClaimsDeleted(deletedIds) {
    if (!Array.isArray(deletedIds) || deletedIds.length === 0) return;
    setDbClaims((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
  }

  function handleClaimUpdated(updated) {
    if (!updated || !updated.id) return;
    if (updated.lat != null) updated.lat = Number(updated.lat);
    if (updated.lon != null) updated.lon = Number(updated.lon);

    setDbClaims((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));

    try {
      const name = updated.village;
      if (name && claimsCacheRef?.current && claimsCacheRef.current[name]) {
        const entry = claimsCacheRef.current[name];
        entry.claims = entry.claims.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        claimsCacheRef.current[name] = entry;
      }
    } catch (e) {}

    if (claimsDrawerVillage && updated.village && claimsDrawerVillage.toLowerCase() === updated.village.toLowerCase()) {
      setShowClaimsVisible(false);
      setTimeout(() => setShowClaimsVisible(true), 50);
    }
  }

  const [geoCache, setGeoCache] = useState({});
  async function geocodeVillage(village) {
    if (!village) return null;
    if (geoCache[village]) return geoCache[village];
    try {
      // leave Nominatim call unchanged (we don't auth this)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(village)}, India`);
      const data = await res.json();
      if (data && data[0]) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setGeoCache((prev) => ({ ...prev, [village]: coords }));
        return coords;
      }
    } catch (e) { console.error("Geocoding failed:", e); }
    return null;
  }

  useEffect(() => {
    dbClaims.forEach((c) => {
      if (c.village && !geoCache[c.village]) geocodeVillage(c.village);
    });
  }, [dbClaims]);

  const baseLayers = useMemo(() => [
    { key: "OSM", name: "OpenStreetMap", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap contributors" },
    { key: "Carto", name: "Carto Positron", url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap' },
    { key: "Esri", name: "Esri World Imagery", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" },
  ], []);

  const districtLayers = useMemo(() => [
    // kept in MapPanel file (no need to duplicate here)
  ], []);

  // map created callback (MapPanel calls this)
  function handleMapCreated(map) {
    mapRef.current = map;
    try { window.__MAP__ = map; window.__APP__ = window.__APP__ || {}; window.__APP__.mapCreatedAt = new Date().toISOString(); } catch (e) {}
  }

  function handleZoomToClaim(claim) {
    if (!mapRef.current) {
      if (claim?.lat != null && claim?.lon != null) {
        window.dispatchEvent(new CustomEvent("fra-focus", { detail: { lat: Number(claim.lat), lon: Number(claim.lon), zoom: 13 } }));
        return;
      }
      alert("Map not ready yet.");
      return;
    }
    if (claim?.lat != null && claim?.lon != null) {
      try { mapRef.current.flyTo([Number(claim.lat), Number(claim.lon)], 15, { duration: 0.7 }); return; } catch (err) {}
    }
    if (claim?.village && geoCache[claim.village]) {
      try { const [lat, lon] = geoCache[claim.village]; mapRef.current.flyTo([lat, lon], 13, { duration: 0.7 }); return; } catch (err) {}
    }
    alert("No coordinates available for this claim or village.");
  }

  function handleReset() {
    if (mapRef.current) mapRef.current.setView(defaultCenter, defaultZoom);
    setResetTick((t) => t + 1);
    setViewMode("state");
    setSelectedDistrictFeature(null);
    setSelectedVillage(null);
    setSelectedStateBounds(null);
    setShowClaimsVisible(false);
    setClaimsDrawerVillage(null);
  }

  function handleBackToState() {
    if (selectedStateBounds && mapRef.current) {
      try { mapRef.current.fitBounds(selectedStateBounds, { padding: [20, 20] }); } catch (e) { handleReset(); }
    } else handleReset();
    setViewMode("state");
    setSelectedDistrictFeature(null);
    setSelectedVillage(null);
    setShowClaimsVisible(false);
    setClaimsDrawerVillage(null);
  }

  /* prepare visibleVillages */
  const visibleVillages = useMemo(() => {
    if (viewMode !== "district" || !selectedDistrictFeature) return [];
    const sd =
      (selectedDistrictFeature.properties?.DISTRICT || selectedDistrictFeature.properties?.district || selectedDistrictFeature.properties?.name || "")
        .toString()
        .trim()
        .toLowerCase();
    if (!sd) return [];
    return villages.filter((v) => ((v.district || "").toString().trim().toLowerCase()) === sd);
  }, [villages, viewMode, selectedDistrictFeature]);

  /* filtered DB claims */
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

  /* logout handler */
  function handleLogout() {
    try {
      // clear token
      removeToken();

      // clear sensitive client state (optional)
      setDbClaims([]);           // clear loaded claims
      setVillages([]);          // clear villages
      setCurrentUser(null);     // clear current user state
      setEditingClaim(null);
      setShowForm(false);

      // redirect to Karan login (use env if present)
      const loginUrl = import.meta.env.VITE_LOGIN_URL || "http://localhost:3000/login";
      window.location.href = loginUrl;
    } catch (e) {
      console.error("Logout failed:", e);
      window.location.href = import.meta.env.VITE_LOGIN_URL || "http://localhost:3000/login";
    }
  }

  // -------------------------
  // Render legacy dashboard
  // -------------------------
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderToolbar
        onNewClaim={() => { setShowForm(true); setPickOnMap(false); setPickCoords(null); }}
        onReset={handleReset}
        showStates={showStates} setShowStates={setShowStates}
        showDistricts={showDistricts} setShowDistricts={setShowDistricts}
        showVillages={showVillages} setShowVillages={setShowVillages}
        showGranted={showGranted} setShowGranted={setShowGranted}
        showPending={showPending} setShowPending={setShowPending}
        viewMode={viewMode}
        selectedStateFeature={selectedStateFeature}
        selectedDistrictFeature={selectedDistrictFeature}
        onBackToState={handleBackToState}
        onBackToDistrict={handleBackToState}

        /* NEW props: currentUser + onLogout */
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 space-y-6">
        <div className="h-[62vh] relative">
          <MapPanel
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            resetTick={resetTick}
            onMapCreated={handleMapCreated}
            onMapClick={handleMapClick}
            onStateSelected={(f) => { setSelectedStateFeature(f); setSelectedDistrictFeature(null); setSelectedVillage(null); setViewMode("state"); setShowClaimsVisible(false); setClaimsDrawerVillage(null); }}
            onDistrictSelected={(f) => { setSelectedDistrictFeature(f); setViewMode("district"); setSelectedVillage(null); setShowClaimsVisible(false); setClaimsDrawerVillage(null); }}
            onVillageClick={(v) => { setSelectedVillage(v.village); if (v.lat != null && v.lon != null && mapRef.current) mapRef.current.flyTo([v.lat, v.lon], 13); }}
            onRunDiagnostics={handleRunDiagnostics}
            onZoomToClaim={handleZoomToClaim}
            zoomToVillageAndShowClaims={zoomToVillageAndShowClaims}
            visibleVillages={visibleVillages}
            showStates={showStates}
            showDistricts={showDistricts}
            showVillages={showVillages}
            showClaimsVisible={showClaimsVisible}
            claimsDrawerVillage={claimsDrawerVillage}
            claimsCacheRef={claimsCacheRef}
            showGranted={showGranted}
            showPending={showPending}
          />
        </div>

        <UploadPanel file={file} setFile={setFile} uploading={uploading} onUpload={handleUpload} />

        <ClaimsPanelWrapper
          dbClaims={dbClaims}
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
          onEdit={handleEditClaim}
          onUpdateSuccess={handleClaimUpdated}
          onUpdate={reloadDbClaims}
        />
      </main>

      <NewClaimForm
        open={showForm}
        editClaim={editingClaim}
        prefillCoords={pickCoords}
        pickOnMap={pickOnMap}
        onTogglePick={(b) => { setPickOnMap(b); if (!b) setPickCoords(null); }}
        onClose={() => { setShowForm(false); setPickOnMap(false); setPickCoords(null); setEditingClaim(null); }}
        onSaved={(createdOrUpdated) => { handleClaimSaved(createdOrUpdated); setShowForm(false); }}
        onUpdate={reloadDbClaims}
      />

      {diagnosticsOpen && (
        <DiagnosticsPanel
          claim={selectedClaimForDiagnostics}
          onClose={() => { setDiagnosticsOpen(false); setSelectedClaimForDiagnostics(null); }}
        />
      )}
    </div>
  );
}
