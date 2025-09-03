import { useState, useEffect } from "react";
import { API_BASE } from "./config";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import villageData from "./mock_villages.json";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --------------------------
// Custom icons for statuses
// --------------------------
const grantedIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
  iconSize: [25, 25],
});

const pendingIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
  iconSize: [25, 25],
});

export default function App() {
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(false);

  // --------------------------
  // Ping API
  // --------------------------
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

  // --------------------------
  // File Upload (OCR + NER)
  // --------------------------
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

  // --------------------------
  // FRA Docs from DB
  // --------------------------
  const [docs, setDocs] = useState([]);
  const [filters, setFilters] = useState({ village: "", patta_holder: "" });

  async function fetchDocs() {
    let url = `${API_BASE}/api/fra-docs`;
    const params = [];
    if (filters.village) params.push(`village=${filters.village}`);
    if (filters.patta_holder) params.push(`patta_holder=${filters.patta_holder}`);
    if (params.length > 0) url += "?" + params.join("&");

    const res = await fetch(url);
    const data = await res.json();
    setDocs(data);
  }

  useEffect(() => {
    fetchDocs();
  }, [filters]);

  // --------------------------
  // Geocoding cache + fetch
  // --------------------------
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
    // Pre-fetch coordinates for unique villages in docs
    docs.forEach((doc) => {
      if (doc.village && !geoCache[doc.village]) {
        geocodeVillage(doc.village);
      }
    });
  }, [docs]);

  // --------------------------
  // Export CSV
  // --------------------------
  function handleExport() {
    window.open(`${API_BASE}/api/export/csv`, "_blank");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 shadow flex items-center justify-between">
        <h1 className="text-xl font-bold">FRA Atlas — Phase 4</h1>
        <button
          onClick={handlePing}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
        >
          {loading ? "Pinging..." : "Ping API"}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 space-y-6">
        {/* Map block */}
        <div className="h-[50vh]">
          <MapContainer
            center={[21.15, 79.09]}
            zoom={5}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Mock demo markers */}
            {villageData.features.map((village, idx) => {
              const [lng, lat] = village.geometry.coordinates;
              return (
                <Marker
                  key={`mock-${idx}`}
                  position={[lat, lng]}
                  icon={
                    village.properties.status === "Granted"
                      ? grantedIcon
                      : pendingIcon
                  }
                >
                  <Popup>
                    <strong>{village.properties.village}</strong>
                    <br />
                    Granted Claims: {village.properties.granted_claims}
                    <br />
                    Status: {village.properties.status}
                  </Popup>
                </Marker>
              );
            })}

            {/* DB markers with geocoding */}
            {docs.map((doc) => {
              const coords = geoCache[doc.village];
              if (!coords) return null; // skip if not geocoded yet
              return (
                <Marker key={`db-${doc.id}`} position={coords} icon={grantedIcon}>
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
          <div className="flex gap-2">
            <input
              placeholder="Filter by village"
              value={filters.village}
              onChange={(e) =>
                setFilters({ ...filters, village: e.target.value })
              }
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
        Phase 4: FRA Upload + OCR + NER + DB • Filters • Export CSV • Map + Table with Geocoding
      </footer>
    </div>
  );
}
