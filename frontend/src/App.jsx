import { useState } from "react";
import { API_BASE } from "./config";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function App() {
  const [ping, setPing] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <main className="flex-1">
        {/* Map block */}
        <div className="h-[70vh]">
          <MapContainer
            center={[21.15, 79.09]} // India-ish center
            zoom={5}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </div>

        {/* Ping result */}
        <div className="p-4">
          <h2 className="font-semibold mb-2">Backend Response</h2>
          <pre className="bg-gray-100 p-3 rounded-xl overflow-auto">
            {JSON.stringify(ping, null, 2)}
          </pre>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-sm text-gray-500">
        Phase 1: Setup • React + Tailwind + Leaflet + FastAPI
      </footer>
    </div>
  );
}
