// src/components/NewClaimForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config"; // <-- ensure this exists and is correct
import { authFetch } from "../libs/apiClient"; // <- added

/**
 * Props:
 * - open: boolean
 * - editClaim: claim object | null
 * - prefillCoords: { lat, lon } | null
 * - pickOnMap: boolean
 * - onTogglePick: (newBool) => void
 * - onClose: () => void
 * - onSaved: (createdOrUpdatedClaim) => void
 * - onUpdate: (updatedClaim) => Promise<void>   // optional callback used to refresh parent data
 * - prefillFromUpload: (optional) parsedClaimObject from OCR/NER to prefill fields
 *
 * Notes:
 * - prefillFromUpload should use the same normalized claim keys that the backend / client uses:
 *   { state, district, block, village, patta_holder, address, land_area, status, date, lat, lon, source_filename, extracted_text }
 * - If prefillFromUpload is provided and editClaim is null, the form will be prefilled from it when opened.
 */
export default function NewClaimForm({
  open,
  editClaim = null,
  prefillCoords = null,
  pickOnMap = false,
  onTogglePick,
  onClose,
  onSaved,
  onUpdate,
  prefillFromUpload = null,
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
  const initialisedRef = useRef(false);

  // parse number helper -> returns number or null
  function safeNumber(v) {
    if (v === "" || v == null) return null;
    const s = String(v).replace(/,/g, "").trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // Build claims API base URL robustly.
  function claimsBaseUrl() {
    const base = String(API_BASE || "").replace(/\/$/, "");
    if (!base) return `/api/claims`;
    // If API_BASE already contains /api at end, don't re-add
    if (base.endsWith("/api")) return base + "/claims";
    return base + "/api/claims";
  }

  // read response body helper
  async function readResponseBody(res) {
    try {
      const json = await res.json();
      return JSON.stringify(json, null, 2);
    } catch (err) {
      try {
        return await res.text();
      } catch (e2) {
        return "<unable to read body>";
      }
    }
  }

  // fetch claim by id (fallback when PUT doesn't return body)
  async function fetchClaimById(id) {
    try {
      const url = `${claimsBaseUrl().replace(/\/$/, "")}/${encodeURIComponent(id)}`;
      const r = await authFetch(url);
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      if (!j) return null;
      if (j.claim) return j.claim;
      // The endpoint may return the object directly
      return j;
    } catch (e) {
      console.warn("fetchClaimById failed", e);
      return null;
    }
  }

  // Keep form in sync when opening for edit or when prefill coords/ upload arrive.
  useEffect(() => {
    // When the panel opens, prefer editClaim (if provided).
    // If editClaim absent but prefillFromUpload provided, prefill from upload (useful for verification).
    // If neither, and prefillCoords exist, fill lat/lon only.
    if (!open) {
      // keep form values while closed so user can re-open; only reset loading and initialised flag
      setLoading(false);
      initialisedRef.current = false;
      return;
    }

    // If editing an existing claim, populate form from it
    if (editClaim) {
      setForm({
        state: editClaim.state || "",
        district: editClaim.district || "",
        block: editClaim.block || "",
        village: editClaim.village || "",
        patta_holder: editClaim.patta_holder || "",
        address: editClaim.address || "",
        land_area: editClaim.land_area != null ? String(editClaim.land_area) : "",
        status: editClaim.status || "Pending",
        date: editClaim.date || new Date().toISOString().slice(0, 10),
        lat: editClaim.lat != null ? String(editClaim.lat) : "",
        lon: editClaim.lon != null ? String(editClaim.lon) : "",
      });
      setLoading(false);
      initialisedRef.current = true;
      return;
    }

    // If a prefillFromUpload object is provided (e.g., user uploaded a PDF and you want them to verify before creation)
    // populate form from it but only once per open.
    if (prefillFromUpload && !initialisedRef.current) {
      setForm((f) => ({
        state: prefillFromUpload.state || f.state || "",
        district: prefillFromUpload.district || f.district || "",
        block: prefillFromUpload.block || f.block || "",
        village:
          prefillFromUpload.village ||
          (Array.isArray(prefillFromUpload.villages) && prefillFromUpload.villages[0]) ||
          f.village ||
          "",
        patta_holder:
          prefillFromUpload.patta_holder ||
          (Array.isArray(prefillFromUpload.patta_holders) && prefillFromUpload.patta_holders[0]) ||
          f.patta_holder ||
          "",
        address: prefillFromUpload.address || f.address || "",
        land_area: prefillFromUpload.land_area != null ? String(prefillFromUpload.land_area) : f.land_area || "",
        status: prefillFromUpload.status || prefillFromUpload.claim_status || f.status || "Pending",
        date: prefillFromUpload.date || (Array.isArray(prefillFromUpload.dates) && prefillFromUpload.dates[0]) || f.date || new Date().toISOString().slice(0, 10),
        lat: prefillFromUpload.lat != null ? String(prefillFromUpload.lat) : f.lat || "",
        lon: prefillFromUpload.lon != null ? String(prefillFromUpload.lon) : f.lon || "",
      }));
      setLoading(false);
      initialisedRef.current = true;
      return;
    }

    // If coords are provided (pick on map), inject lat/lon if not already populated
    if (prefillCoords && !initialisedRef.current) {
      setForm((f) => ({
        ...f,
        lat: f.lat && f.lat !== "" ? f.lat : String(prefillCoords.lat || ""),
        lon: f.lon && f.lon !== "" ? f.lon : String(prefillCoords.lon || ""),
      }));
      initialisedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editClaim, prefillCoords, prefillFromUpload]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e && e.preventDefault();

    // minimal validation
    if (!form.state || !form.district || !form.village) {
      alert("Please fill State, District and Village.");
      return;
    }
    if (form.lat === "" || form.lon === "") {
      alert("Please provide coordinates (type them or Pick on map).");
      return;
    }

    const payload = {
      state: form.state || null,
      district: form.district || null,
      block: form.block || null,
      village: form.village || null,
      patta_holder: form.patta_holder || null,
      address: form.address || null,
      land_area: safeNumber(form.land_area),
      status: form.status || "Pending",
      date: form.date || new Date().toISOString().slice(0, 10),
      lat: safeNumber(form.lat),
      lon: safeNumber(form.lon),
    };

    setLoading(true);
    try {
      const base = claimsBaseUrl();

      let res;
      if (editClaim && editClaim.id) {
        // Update (PUT)
        const url = `${base.replace(/\/$/, "")}/${encodeURIComponent(editClaim.id)}`;
        res = await authFetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const bodyText = await readResponseBody(res);
          console.error("Save failed response:", res.status, bodyText);
          alert(`Save failed (status ${res.status}):\n${bodyText}`);
          setLoading(false);
          return;
        }

        let savedData = null;
        try {
          savedData = await res.json().catch(() => null);
        } catch (e) {
          savedData = null;
        }

        if (!savedData) {
          // server returned no JSON body — try to fetch the updated row
          const fetched = await fetchClaimById(editClaim.id);
          if (fetched) savedData = fetched;
        }

        // Normalise to claim object
        let claimResult = null;
        if (savedData && typeof savedData === "object") {
          if (savedData.claim) claimResult = savedData.claim;
          else if (savedData.updated) claimResult = savedData.updated;
          else if (Object.keys(savedData).length > 0) claimResult = savedData;
        }

        if (!claimResult) {
          // fallback: use payload + id
          claimResult = { ...payload, id: editClaim.id };
        }

        // ensure lat/lon are numbers
        if (claimResult.lat != null) claimResult.lat = Number(claimResult.lat);
        if (claimResult.lon != null) claimResult.lon = Number(claimResult.lon);

        // notify parent
        onSaved && onSaved(claimResult);
        if (typeof onUpdate === "function") {
          try {
            await onUpdate(claimResult);
          } catch (err) {
            console.warn("onUpdate callback threw", err);
          }
        }

        onClose && onClose();
        setLoading(false);
        return;
      } else {
        // Create (POST)
        res = await authFetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const bodyText = await readResponseBody(res);
          console.error("Create failed response:", res.status, bodyText);
          alert(`Create failed (status ${res.status}):\n${bodyText}`);
          setLoading(false);
          return;
        }

        const savedData = await res.json().catch(() => null);
        let claimResult = null;
        if (savedData && typeof savedData === "object") {
          if (savedData.claim) claimResult = savedData.claim;
          else if (Object.keys(savedData).length > 0) claimResult = savedData;
        }

        if (!claimResult) {
          alert("Save succeeded but server returned no claim data. Please refresh to see the new claim.");
          onClose && onClose();
          setLoading(false);
          return;
        }

        if (claimResult.lat != null) claimResult.lat = Number(claimResult.lat);
        if (claimResult.lon != null) claimResult.lon = Number(claimResult.lon);

        onSaved && onSaved(claimResult);
        if (typeof onUpdate === "function") {
          try {
            await onUpdate(claimResult);
          } catch (err) {
            console.warn("onUpdate threw on create", err);
          }
        }

        onClose && onClose();
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Save request failed", err);
      alert("Save failed: " + (err?.message || JSON.stringify(err)));
      setLoading(false);
    }
  }

  if (!open) return null;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{editClaim ? `Edit Claim #${editClaim.id || ""}` : "New FRA Claim"}</h3>
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
                <input placeholder="State" value={form.state} onChange={(e) => update("state", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="District" value={form.district} onChange={(e) => update("district", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="Block" value={form.block} onChange={(e) => update("block", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="Village" value={form.village} onChange={(e) => update("village", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="Patta holder" value={form.patta_holder} onChange={(e) => update("patta_holder", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <input placeholder="Land area (e.g. 1.5)" value={form.land_area} onChange={(e) => update("land_area", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <select value={form.status} onChange={(e) => update("status", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}>
                  <option>Pending</option>
                  <option>Granted</option>
                </select>
                <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Latitude" value={form.lat} onChange={(e) => update("lat", e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                  <input placeholder="Longitude" value={form.lon} onChange={(e) => update("lon", e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ddd" }} />
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" onClick={onClose} style={{ padding: "8px 12px" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 14px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 4 }} disabled={loading}>
                  {loading ? "Saving..." : editClaim ? "Save changes" : "Save Claim"}
                </button>
              </div>
            </form>

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
