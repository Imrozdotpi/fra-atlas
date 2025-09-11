// frontend/src/components/NewClaimForm.jsx
import React, { useState, useEffect } from "react";
import { API_BASE } from "../config"; // <-- uses backend base URL

/**
 * Props:
 * - open: boolean
 * - prefillCoords: { lat, lon } | null
 * - pickOnMap: boolean
 * - onTogglePick: (newBool) => void
 * - onClose: () => void
 * - onSaved: (createdClaim) => void
 */
export default function NewClaimForm({
  open,
  prefillCoords,
  pickOnMap,
  onTogglePick,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    state: "",
    district: "",
    block: "",
    village: "",
    patta_holder: "",
    address: "",
    land_area: "",
    status: "Pending",
    date: new Date().toISOString().slice(0, 10),
    lat: "",
    lon: "",
  });
  const [loading, setLoading] = useState(false);

  // When modal opens or prefill coords change, set lat/lon
  useEffect(() => {
    if (open && prefillCoords && prefillCoords.lat != null) {
      setForm((f) => ({
        ...f,
        lat: String(prefillCoords.lat),
        lon: String(prefillCoords.lon),
      }));
      console.log("NewClaimForm: prefillCoords applied", prefillCoords);
    }
    if (!open) {
      setLoading(false);
    }
  }, [prefillCoords, open]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Helper: build POST URL robustly depending on whether API_BASE already includes /api
  function buildClaimsUrl() {
    const base = String(API_BASE || "").replace(/\/$/, "");
    if (/\/api$/.test(base)) {
      return `${base}/claims`;
    } else {
      return `${base}/api/claims`;
    }
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    if (!form.state || !form.district || !form.village) {
      alert("Please fill State, District and Village.");
      return;
    }
    if (!form.lat || !form.lon) {
      alert("Please provide coordinates (type them or Pick on map).");
      return;
    }

    const payload = {
      state: form.state,
      district: form.district,
      block: form.block || null,
      village: form.village,
      patta_holder: form.patta_holder || null,
      address: form.address || null,
      land_area: form.land_area ? parseFloat(form.land_area) : null,
      status: form.status || "Pending",
      date: form.date || new Date().toISOString().slice(0, 10),
      lat: form.lat !== "" ? parseFloat(form.lat) : null,
      lon: form.lon !== "" ? parseFloat(form.lon) : null,
    };

    setLoading(true);
    try {
      const url = buildClaimsUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          /* non-JSON */
        }
      }
      if (!res.ok) {
        const msg =
          (data && (data.detail || data.message)) ||
          text ||
          res.statusText ||
          `HTTP ${res.status}`;
        alert("Save failed: " + msg);
        setLoading(false);
        return;
      }
      let created = null;
      if (data && data.claim) created = data.claim;
      else if (data && !data.claim && Object.keys(data).length > 0) created = data;
      else {
        alert("Save failed: unexpected server response");
        setLoading(false);
        return;
      }
      // normalize
      if (created) {
        if (created.lat != null) {
          const n = Number(created.lat);
          if (!Number.isNaN(n)) created.lat = n;
        }
        if (created.lon != null) {
          const n = Number(created.lon);
          if (!Number.isNaN(n)) created.lon = n;
        }
      }
      onSaved && onSaved(created);
      onClose && onClose();
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Network error: " + (err.message || err));
      setLoading(false);
    }
  }

  if (!open) return null;

  // Panel styles: when pickOnMap is true shrink & move to top-right so it doesn't block map center
  const panelStyle = pickOnMap
    ? {
        pointerEvents: "auto",
        position: "fixed",
        top: 12,
        right: 12,
        width: 340,
        maxHeight: "60vh",
        overflow: "auto",
        background: "#fff",
        padding: 12,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        zIndex: 10000,
      }
    : {
        pointerEvents: "auto",
        width: 760,
        maxHeight: "90vh",
        overflow: "auto",
        background: "#fff",
        padding: 16,
        borderRadius: 8,
      };

  // Outer overlay: click-through when pickOnMap true so map receives clicks.
  // Note: panelStyle keeps pointerEvents auto so its small controls remain clickable.
  const overlayStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    pointerEvents: pickOnMap ? "none" : "auto",
    background: pickOnMap ? "transparent" : "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: pickOnMap ? "flex-start" : "center",
    justifyContent: pickOnMap ? "flex-end" : "center",
    zIndex: 9999,
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>New FRA Claim</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={pickOnMap}
                onChange={(e) => onTogglePick && onTogglePick(e.target.checked)}
              />
              <span style={{ fontSize: 12 }}>Pick on map</span>
            </label>
            <button onClick={onClose} style={{ padding: "6px 10px" }}>
              Close
            </button>
          </div>
        </div>

        {/* If pickOnMap is active show compact instruction first, else show full form */}
        {pickOnMap ? (
          <div style={{ fontSize: 13, color: "#064e3b" }}>
            <div>Pick mode active — click anywhere on the map to choose coordinates.</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              {prefillCoords && prefillCoords.lat != null ? (
                <div style={{ color: "#065f46" }}>
                  Picked: {prefillCoords.lat.toFixed(6)}, {prefillCoords.lon.toFixed(6)}
                </div>
              ) : (
                <div style={{ color: "#065f46" }}>No coordinates picked yet.</div>
              )}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  // disable pick mode without closing form
                  onTogglePick && onTogglePick(false);
                }}
                style={{ padding: "6px 10px", borderRadius: 6 }}
              >
                Cancel pick
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="District"
                  value={form.district}
                  onChange={(e) => update("district", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="Block"
                  value={form.block}
                  onChange={(e) => update("block", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="Village"
                  value={form.village}
                  onChange={(e) => update("village", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="Patta holder"
                  value={form.patta_holder}
                  onChange={(e) => update("patta_holder", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <input
                  placeholder="Land area (e.g. 1.5)"
                  value={form.land_area}
                  onChange={(e) => update("land_area", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                >
                  <option>Pending</option>
                  <option>Granted</option>
                </select>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Latitude"
                    value={form.lat}
                    onChange={(e) => update("lat", e.target.value)}
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                  <input
                    placeholder="Longitude"
                    value={form.lon}
                    onChange={(e) => update("lon", e.target.value)}
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={onClose} style={{ padding: "8px 12px" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 14px",
                    background: "#0ea5e9",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                  }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Claim"}
                </button>
              </div>
            </form>

            {/* If the pickOnMap checkbox is toggled while the full form is shown, give a small hint */}
            {pickOnMap && (
              <div style={{ marginTop: 10, color: "#374151", fontSize: 13 }}>
                Click on the map to pick coordinates — they will appear in the Latitude / Longitude fields.
                {prefillCoords && prefillCoords.lat != null && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#065f46" }}>
                    Picked: {prefillCoords.lat.toFixed(6)}, {prefillCoords.lon.toFixed(6)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
