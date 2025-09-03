import { useState } from "react";
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
  // Ping API (existing)
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
  // File Upload (FRA PDF)
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
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 shadow flex items-center justify-between">
        <h1 className="text-xl font-bold">FRA Atlas — MVP</h1>
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

            {/* Village markers from GeoJSON */}
            {villageData.features.map((village, idx) => {
              const [lng, lat] = village.geometry.coordinates;
              return (
                <Marker
                  key={idx}
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
        Phase 2: FRA Upload + OCR + NER • React + Tailwind + Leaflet + FastAPI
      </footer>
    </div>
  );
}
