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
  useMap, // <-- used by MapResetter to guarantee resets
} from "react-leaflet";
import mockClaims from "./mock_claims.json";

// STATE boundaries
import mpBoundary from "./geojson/mp.json";
import tripuraBoundary from "./geojson/tripura.json";
import odishaBoundary from "./geojson/odisha.json";
import telanganaBoundary from "./geojson/telangana.json";

// DISTRICT polygons you created
import mpShivpuri from "./geojson/districts/mp_shivpuri.json";
import mpChhindwara from "./geojson/districts/mp_chhindwara.json";
import odKoraput from "./geojson/districts/odisha_koraput.json";
import odKandhamal from "./geojson/districts/odisha_kandhamal.json";
import tgWarangal from "./geojson/districts/telangana_warangal.json";
import tgAdilabad from "./geojson/districts/telangana_adilabad.json";
import trWest from "./geojson/districts/tripura_west.json";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --------------------------
// Marker icons
// --------------------------
const grantedIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  iconSize: [25, 25],
});
const pendingIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
  iconSize: [25, 25],
});
const villageIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/845/845646.png",
  iconSize: [24, 24],
});

// --------------------------
// Internal helper to force map reset reliably
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
// App
// --------------------------
export default function App() {
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(false);

  // View mode + breadcrumbs
  const [viewMode, setViewMode] = useState("state"); // 'state' | 'district'
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Layer toggles
  const [showStates, setShowStates] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showGranted, setShowGranted] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showVillages, setShowVillages] = useState(true); // controls green village pins

  // Simple search
  const [search, setSearch] = useState("");

  // Map ref + reset
  const mapRef = useRef(null);
  const defaultCenter = [21.15, 79.09];
  const defaultZoom = 5;

  // Ensures reset even if ref timing is off
  const [resetTick, setResetTick] = useState(0);

  // Ping API
  async function handlePing() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/ping`);
      const data = await res.json();
      setPing(data);
    } catch (e) {
      setPing({ error: e?.message || "Failed to reach backend" });
    } finally {
      setLoading(false);
    }
  }

  // File Upload (OCR + NER)
  const [file, setFile] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!file) return alert("Select a file first");
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/api/upload-fra`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setOcrResult(data);
      fetchDocs(); // refresh docs table after upload
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  // FRA Docs from DB
  const [docs, setDocs] = useState([]);
  const [filters, setFilters] = useState({ village: "", patta_holder: "" });

  async function fetchDocs() {
    let url = `${API_BASE}/api/fra-docs`;
    const params = [];
    if (filters.village) params.push(`village=${filters.village}`);
    if (filters.patta_holder) params.push(`patta_holder=${filters.patta_holder}`);
    if (params.length > 0) url += "?" + params.join("&");
    try {
      const res = await fetch(url);
      const data = await res.json();
      setDocs(data);
    } catch (e) {
      console.error("Fetch docs failed", e);
    }
  }

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Geocoding cache + fetch (for DB villages)
  const [geoCache, setGeoCache] = useState({});
  async function geocodeVillage(village) {
    if (!village) return null;
    if (geoCache[village]) return geoCache[village];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          village
        )}, India`
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
    docs.forEach((doc) => {
      if (doc.village && !geoCache[doc.village]) geocodeVillage(doc.village);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs]);

  // -------- Basemap choices --------
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
      attribution:
        '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap',
    },
    {
      key: "Esri",
      name: "Esri World Imagery",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri",
    },
  ];

  // -------- Districts bundle + handler --------
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

  function onEachDistrict(feature, layer) {
    // Hover tooltip
    const name =
      feature?.properties?.DISTRICT ||
      feature?.properties?.district ||
      feature?.properties?.name ||
      "District";
    layer.bindTooltip(name, { sticky: true });

    // Click: zoom to bounds + set breadcrumbs
    layer.on("click", () => {
      const map = layer._map;
      if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      setSelectedDistrict(name);
      setViewMode("district");
    });
  }

  // -------- Lightweight “clustering” to reduce clutter --------
  // Hide mock claims when zoomed out < 5.5 (tweak as needed)
  const [currentZoom, setCurrentZoom] = useState(defaultZoom);
  const handleMapCreated = (map) => {
    mapRef.current = map;
    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });
  };
  const showMockNow = currentZoom >= 5.5;

  // -------- Search: village/patta holder from mock + DB --------
  function handleSearchGo() {
    const q = search.trim().toLowerCase();
    if (!q || !mapRef.current) return;

    // Priority: mock claims first, then DB docs
    const matchMock = mockClaims.find(
      (c) =>
        c.village.toLowerCase().includes(q) ||
        c.patta_holder.toLowerCase().includes(q) ||
        (c.district || "").toLowerCase().includes(q)
    );
    if (matchMock) {
      mapRef.current.setView([matchMock.coordinates[1], matchMock.coordinates[0]], 10);
      return;
    }
    const matchDoc = docs.find(
      (d) =>
        (d.village || "").toLowerCase().includes(q) ||
        (d.patta_holder || "").toLowerCase().includes(q)
    );
    if (matchDoc) {
      const coords = geoCache[matchDoc.village];
      if (coords) mapRef.current.setView(coords, 10);
    }
  }

  // Export CSV
  function handleExport() {
    window.open(`${API_BASE}/api/export/csv`, "_blank");
  }

  // Reset View (also used by "Back to States")
  function handleReset() {
    // try immediate ref-based reset
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, defaultZoom);
    }
    // ensure reset via MapResetter
    setResetTick((t) => t + 1);

    // breadcrumb state
    setViewMode("state");
    setSelectedDistrict(null);
  }

  // Filter mock claims by status + district view
  const filteredMock = useMemo(() => {
    return mockClaims.filter((c) => {
      if (viewMode === "district" && selectedDistrict) {
        if ((c.district || "").toLowerCase() !== selectedDistrict.toLowerCase()) {
          return false;
        }
      }
      if (c.status === "Granted" && !showGranted) return false;
      if (c.status === "Pending" && !showPending) return false;
      return true;
    });
  }, [viewMode, selectedDistrict, showGranted, showPending]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 shadow flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-xl font-bold">FRA Atlas — Prototype</h1>
        <div className="flex gap-2 items-center">
          <input
            placeholder="Search village / holder / district"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-64"
          />
          <button
            onClick={handleSearchGo}
            className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:opacity-90"
          >
            Go
          </button>
          <button
            onClick={handlePing}
            className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90"
          >
            {loading ? "Pinging..." : "Ping API"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
          >
            Reset View
          </button>
        </div>
      </header>

      {/* Layer toggles & status chips */}
      <div className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex gap-3">
          <label>
            <input
              type="checkbox"
              checked={showStates}
              onChange={() => setShowStates((v) => !v)}
              className="mr-1"
            />
            Show States
          </label>
          <label>
            <input
              type="checkbox"
              checked={showDistricts}
              onChange={() => setShowDistricts((v) => !v)}
              className="mr-1"
            />
            Show Districts
          </label>
          <label>
            <input
              type="checkbox"
              checked={showVillages}
              onChange={() => setShowVillages((v) => !v)}
              className="mr-1"
            />
            Show Villages
          </label>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 items-center">
          <button
            className={`px-3 py-1 rounded-full border ${
              showGranted ? "bg-green-600 text-white" : "bg-white"
            }`}
            onClick={() => setShowGranted((v) => !v)}
          >
            Granted
          </button>
          <button
            className={`px-3 py-1 rounded-full border ${
              showPending ? "bg-red-600 text-white" : "bg-white"
            }`}
            onClick={() => setShowPending((v) => !v)}
          >
            Pending
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex gap-2 items-center text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded">Level: {viewMode}</span>
          {viewMode === "district" && selectedDistrict && (
            <>
              <span>→</span>
              <span className="px-2 py-1 bg-blue-50 rounded border">{selectedDistrict}</span>
              <button
                className="ml-2 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleReset}
              >
                Back to States
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-4 space-y-6">
        {/* Map */}
        <div className="h-[62vh] relative">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            scrollWheelZoom={true}
            className="h-full w-full"
            whenCreated={handleMapCreated}
          >
            {/* Forces the reset zoom whenever resetTick increments */}
            <MapResetter resetKey={resetTick} center={defaultCenter} zoom={defaultZoom} />

            <LayersControl position="topright">
              {/* Basemaps */}
              {baseLayers.map((b, i) => (
                <LayersControl.BaseLayer key={b.key} name={b.name} checked={i === 0}>
                  <TileLayer attribution={b.attribution} url={b.url} />
                </LayersControl.BaseLayer>
              ))}

              {/* States layer */}
              {showStates && (
                <LayersControl.Overlay name="State Boundaries" checked>
                  <div>
                    <GeoJSON data={mpBoundary} style={{ color: "blue", weight: 2 }} />
                    <GeoJSON data={tripuraBoundary} style={{ color: "red", weight: 2 }} />
                    <GeoJSON data={odishaBoundary} style={{ color: "green", weight: 2 }} />
                    <GeoJSON data={telanganaBoundary} style={{ color: "orange", weight: 2 }} />
                  </div>
                </LayersControl.Overlay>
              )}

              {/* Districts layer */}
              {showDistricts && (
                <LayersControl.Overlay name="District Boundaries" checked>
                  <div>
                    {districtLayers.map((d, idx) => (
                      <GeoJSON
                        key={idx}
                        data={d.data}
                        style={{ color: d.color, weight: 1.5, fillOpacity: 0.05 }}
                        onEachFeature={onEachDistrict}
                      />
                    ))}
                  </div>
                </LayersControl.Overlay>
              )}

              {/* Mock Claims */}
              {showGranted && (
                <LayersControl.Overlay name="Mock Claims: Granted" checked>
                  <div>
                    {showMockNow &&
                      filteredMock
                        .filter((c) => c.status === "Granted")
                        .map((claim, idx) => (
                          <Marker
                            key={`granted-${idx}`}
                            position={[claim.coordinates[1], claim.coordinates[0]]}
                            icon={grantedIcon}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                              {claim.village}
                            </Tooltip>
                            <Popup>
                              <strong>{claim.village}</strong>
                              <br />
                              State: {claim.state}
                              <br />
                              District: {claim.district}
                              <br />
                              Patta Holder: {claim.patta_holder}
                              <br />
                              Area: {claim.area}
                              <br />
                              Status: {claim.status}
                            </Popup>
                          </Marker>
                        ))}
                  </div>
                </LayersControl.Overlay>
              )}

              {showPending && (
                <LayersControl.Overlay name="Mock Claims: Pending" checked>
                  <div>
                    {showMockNow &&
                      filteredMock
                        .filter((c) => c.status === "Pending")
                        .map((claim, idx) => (
                          <Marker
                            key={`pending-${idx}`}
                            position={[claim.coordinates[1], claim.coordinates[0]]}
                            icon={pendingIcon}
                          >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                              {claim.village}
                            </Tooltip>
                            <Popup>
                              <strong>{claim.village}</strong>
                              <br />
                              State: {claim.state}
                              <br />
                              District: {claim.district}
                              <br />
                              Patta Holder: {claim.patta_holder}
                              <br />
                              Area: {claim.area}
                              <br />
                              Status: {claim.status}
                            </Popup>
                          </Marker>
                        ))}
                  </div>
                </LayersControl.Overlay>
              )}

              {/* DB Claims (OCR uploads) */}
              <LayersControl.Overlay name="DB Claims (OCR uploads)" checked>
                <div>
                  {docs.map((doc) => {
                    const coords = geoCache[doc.village];
                    if (!coords) return null;
                    return (
                      <Marker key={`db-${doc.id}`} position={coords} icon={grantedIcon}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                          {doc.village || "Unknown Village"}
                        </Tooltip>
                        <Popup>
                          <strong>{doc.village || "Unknown Village"}</strong>
                          <br />
                          Patta Holder: {doc.patta_holder || "N/A"}
                          <br />
                          Date: {doc.date || "N/A"}
                        </Popup>
                      </Marker>
                    );
                  })}
                </div>
              </LayersControl.Overlay>
            </LayersControl>

            {/* Village Pins (controlled by Show Villages) */}
            {showVillages &&
              mockClaims.map((v, idx) => (
                <Marker
                  key={`village-${idx}`}
                  position={[v.coordinates[1], v.coordinates[0]]}
                  icon={villageIcon}
                >
                  <Popup>
                    <strong>{v.village}</strong>
                    <br />
                    District: {v.district}
                    <br />
                    State: {v.state}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        {/* Upload FRA PDF */}
        <div className="space-y-2">
          <h2 className="font-semibold">Upload FRA Document</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-2 rounded"
          />
          <button
            onClick={handleUpload}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:opacity-90"
          >
            {uploading ? "Uploading..." : "Upload & Process"}
          </button>
        </div>

        {/* OCR + NER Result */}
        {ocrResult && (
          <div className="space-y-2">
            <h2 className="font-semibold">OCR + NER Result</h2>
            <pre className="bg-gray-100 p-3 rounded-xl overflow-auto">
              {JSON.stringify(ocrResult, null, 2)}
            </pre>
          </div>
        )}

        {/* FRA Docs Table */}
        <div className="space-y-2">
          <h2 className="font-semibold">Stored FRA Documents</h2>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="Filter by village"
              value={filters.village}
              onChange={(e) => setFilters({ ...filters, village: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              placeholder="Filter by patta holder"
              value={filters.patta_holder}
              onChange={(e) =>
                setFilters({ ...filters, patta_holder: e.target.value })
              }
              className="border p-2 rounded"
            />
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:opacity-90"
            >
              Export CSV
            </button>
          </div>

          {/* Table */}
          <table className="w-full border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID</th>
                <th className="border p-2">Filename</th>
                <th className="border p-2">Village</th>
                <th className="border p-2">Patta Holder</th>
                <th className="border p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td className="border p-2">{doc.id}</td>
                  <td className="border p-2">{doc.filename}</td>
                  <td className="border p-2">{doc.village || "—"}</td>
                  <td className="border p-2">{doc.patta_holder || "—"}</td>
                  <td className="border p-2">{doc.date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ping Result */}
        <div className="space-y-2">
          <h2 className="font-semibold">Backend Ping Response</h2>
          <pre className="bg-gray-100 p-3 rounded-xl overflow-auto">
            {JSON.stringify(ping, null, 2)}
          </pre>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-sm text-gray-500">
        Prototype: 4 States • District drilldown • Basemap switcher • Legend & toggles •
        Search • Upload+OCR+DB • Show Villages • Back-to-States resets zoom
      </footer>
    </div>
  );
}
