// frontend/src/components/DiagnosticsPanel.jsx 
import React, { useEffect, useState, useRef } from "react";
import { computeMetrics, scoreSchemes } from "../utils/diagnosticsUtils";
import { API_BASE } from "../config";
import { authFetch } from "../libs/apiClient"; // <- added

export default function DiagnosticsPanel({ claim = null, onClose = () => {} }) {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [results, setResults] = useState(null);
  const [usedBackend, setUsedBackend] = useState(false);
  const [apiError, setApiError] = useState(null);
  const timersRef = useRef([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        cleanupTimers();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cleanupTimers();
    };
  }, []);

  useEffect(() => {
    cleanupTimers();
    setLogs([]);
    setMetrics(null);
    setResults(null);
    setUsedBackend(false);
    setApiError(null);

    const push = (t) => setLogs((prev) => [...prev, t]);
    push("Collecting claim data…");

    timersRef.current.push(
      setTimeout(() => {
        push("Collecting NavIC telemetry (simulated)...");
        const mLocal = computeMetrics(claim || {});
        setMetrics(mLocal);
      }, 1000)
    );
    timersRef.current.push(
      setTimeout(() => {
        push("Analyzing…");
      }, 2000)
    );
    timersRef.current.push(
      setTimeout(async () => {
        push("Generating recommendations…");
        const payload = {};
        if (claim && claim.id != null) payload.claim_id = Number(claim.id);
        if (claim && claim.lat != null) payload.lat = Number(claim.lat);
        if (claim && claim.lon != null) payload.lon = Number(claim.lon);
        if (claim && claim.land_area != null) payload.land_area = Number(claim.land_area);

        const doLocal = () => {
          try {
            const m = computeMetrics(claim || {});
            setMetrics(m);
            const scored = scoreSchemes(m, claim || {});
            setResults(scored);
            setUsedBackend(false);
            push("Results generated (local fallback).");
          } catch (e) {
            console.error("Local diagnostics failed", e);
            push("Local diagnostics failed.");
          }
        };

        if (API_BASE) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            // ✅ Use authFetch (preserves Response-like behavior)
            const res = await authFetch(`${API_BASE.replace(/\/$/, "")}/diagnostics`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify(payload),
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
              const txt = await res.text().catch(() => "");
              throw new Error(`API ${res.status}: ${txt}`);
            }
            const data = await res.json().catch(() => null);
            if (!data || !data.metrics || !data.recommendations) {
              throw new Error("Invalid diagnostics response");
            }

            setMetrics(data.metrics);
            const recs = Array.isArray(data.recommendations) ? data.recommendations : data.recommendations?.recommendations || [];
            setResults(
              recs.map((r) => ({
                name: r.name || r.scheme || r.title || "Unknown",
                score: typeof r.score === "number" ? r.score : Number(r.score) || 0,
                reasons: Array.isArray(r.reasons) ? r.reasons : (r.reasons ? [String(r.reasons)] : []),
              }))
            );
            setUsedBackend(true);
            push("Recommendations received from backend.");
          } catch (err) {
            console.warn("Diagnostics API failed, falling back to local:", err);
            setApiError(String(err?.message || err));
            push("Diagnostics API failed — using local fallback.");
            doLocal();
          }
        } else {
          push("No backend configured — using local diagnostics.");
          doLocal();
        }
      }, 3000)
    );

    return () => {
      cleanupTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  function cleanupTimers() {
    try {
      timersRef.current.forEach((t) => clearTimeout(t));
    } catch (e) {}
    timersRef.current = [];
  }

  function handleClose() {
    cleanupTimers();
    onClose();
  }

  function toCSV(report) {
    const rows = [];
    const header = [
      "generated_at",
      "claim_id",
      "patta_holder",
      "village",
      "district",
      "state",
      "lat",
      "lon",
      "land_area",
      "soilIndex",
      "gwIndex",
      "distanceToWaterKm",
      "pendingClaimRatio",
      "provenance",
      "top_recommendation",
      "top_score",
    ];
    for (let i = 1; i <= 3; i++) {
      header.push(`scheme_${i}_name`, `scheme_${i}_score`, `scheme_${i}_reasons`);
    }
    rows.push(header.join(","));

    const claimObj = report.claim || {};
    const m = report.metrics || {};
    const r = report.results || [];

    const row = [
      `"${report.timestamp || ""}"`,
      `"${claimObj.id || ""}"`,
      `"${(claimObj.patta_holder || "").replace(/"/g, '""')}"`,
      `"${(claimObj.village || "").replace(/"/g, '""')}"`,
      `"${(claimObj.district || "").replace(/"/g, '""')}"`,
      `"${(claimObj.state || "").replace(/"/g, '""')}"`,
      `${m?.lat ?? claimObj.lat ?? ""}`,
      `${m?.lon ?? claimObj.lon ?? ""}`,
      `${m?.land_area ?? (claimObj.land_area ?? "")}`,
      `${(typeof m?.soilIndex === "number" ? m.soilIndex.toFixed(2) : m?.soilIndex ?? "")}`,
      `${(typeof m?.gwIndex === "number" ? m.gwIndex.toFixed(2) : m?.gwIndex ?? "")}`,
      `${m?.distanceToWaterKm ?? ""}`,
      `${(typeof m?.pendingClaimRatio === "number" ? m.pendingClaimRatio.toFixed(2) : m?.pendingClaimRatio ?? "")}`,
      `"${report.provenance || ""}"`,
      `"${(r[0]?.name) || ""}"`,
      `${(r[0]?.score) || ""}`,
    ];

    for (let i = 0; i < 3; i++) {
      const s = r[i];
      if (s) {
        const reasons = Array.isArray(s.reasons) ? s.reasons.join(" | ").replace(/"/g, '""') : "";
        row.push(`"${s.name}"`, `${s.score}`, `"${reasons}"`);
      } else {
        row.push("", "", "");
      }
    }

    rows.push(row.join(","));
    return rows.join("\n");
  }

  function handleExportJSON() {
    const payload = {
      timestamp: new Date().toISOString(),
      provenance: usedBackend ? "backend" : "local",
      apiError: apiError || null,
      claim: claim || null,
      metrics: metrics || null,
      results: results || null,
      logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const idPart = claim?.id ? `claim-${claim.id}` : claim?.patta_holder ? `claim-${claim.patta_holder.replace(/\s+/g, "_")}` : "diagnostics";
    a.download = `${idPart}-diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const payload = {
      timestamp: new Date().toISOString(),
      provenance: usedBackend ? "backend" : "local",
      claim: claim || null,
      metrics: metrics || null,
      results: results || null,
      logs,
    };
    const csv = toCSV(payload);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const idPart = claim?.id ? `claim-${claim.id}` : claim?.patta_holder ? claim?.patta_holder.replace(/\s+/g, "_") : "diagnostics";
    a.download = `${idPart}-diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function badgeForScore(score) {
    if (score > 70) return { label: "High priority", color: "#16a34a" };
    if (score >= 40) return { label: "Medium priority", color: "#f59e0b" };
    return { label: "Low priority", color: "#9ca3af" };
  }

  const displayLandArea = metrics?.land_area ?? (claim?.land_area ?? null);

  function formatLocal(ts = Date.now()) {
    try {
      return new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", hour12: false });
    } catch (e) {
      return new Date(ts).toISOString();
    }
  }

  const top = results && results.length ? results[0] : null;
  const topBadge = top ? badgeForScore(top.score) : null;

  function fallbackReasonsForScheme(schemeName, metricsObj = {}, claimObj = {}) {
    const reasons = [];
    const gw = metricsObj?.gwIndex ?? 0;
    const soil = metricsObj?.soilIndex ?? 0;
    const dist = metricsObj?.distanceToWaterKm ?? 0;
    const la = Number(claimObj?.land_area ?? metricsObj?.land_area ?? 0);

    if (schemeName === "MGNREGA") {
      if (gw < 0.4) reasons.push("Low groundwater index → +0.35 MGNREGA");
      if (soil < 0.45) reasons.push("Soil fertility low → +0.15 MGNREGA");
      if (la > 1.5) reasons.push("Large parcel area → +0.05 MGNREGA");
    }
    if (schemeName === "JJM") {
      if (dist > 2.5) reasons.push("Far from water source → +0.50 JJM");
      if (gw < 0.35) reasons.push("Low groundwater → +0.15 JJM");
    }
    if (schemeName === "PM-KISAN") {
      if (la > 0.5) reasons.push("Land area > 0.5 ha → +0.45 PM-KISAN");
      if (la > 2.0) reasons.push("Land area > 2.0 ha → +0.10 PM-KISAN");
    }
    return reasons.slice(0, 3);
  }

  return (
    <div
      role="dialog"
      aria-label="Diagnostics panel"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 460,
        maxWidth: "98vw",
        background: "#fff",
        boxShadow: "-6px 0 24px rgba(0,0,0,0.12)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        transform: "translateX(0)",
        transition: "transform 240ms ease",
        fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: "1px solid #eee" }}>
        <div>
          <div style={{ fontSize: 15, color: "#111", fontWeight: 800 }}>Diagnostics</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {claim ? (
              <>
                <strong style={{ fontWeight: 700 }}>{claim.patta_holder || claim.id || claim.village || "—"}</strong>
                <span style={{ marginLeft: 8, color: "#444" }}>{claim.village ? `• ${claim.village}` : ""}</span>
                <span style={{ marginLeft: 8, color: "#888", fontSize: 11 }}>{usedBackend ? "• backend" : "• local"}</span>
              </>
            ) : (
              "Diagnostics running..."
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "#666", textAlign: "right" }}>{formatLocal()}</div>
          <button
            onClick={handleClose}
            aria-label="Close diagnostics"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 20,
              padding: 8,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        {/* ... body same as before ... */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Staged logs</div>
          <div style={{ fontSize: 13, color: "#444" }}>
            {logs.length === 0 ? <div>Initializing…</div> : logs.map((l, i) => <div key={i}>• {l}</div>)}
          </div>
        </div>

        {results ? (
          <>
            {/* Recommendation block, ranked list, metrics — unchanged */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Recommendation</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  {top ? (
                    <>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: topBadge?.color || "#ddd",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 13,
                        }}>{top.name}</span>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{top.score}%</div>
                      </div>
                      <div style={{ fontSize: 13, color: "#444" }}>{topBadge?.label}</div>
                    </>
                  ) : (
                    <div>No recommendation</div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
                <div>{usedBackend ? "Computed by API" : "Computed locally"}</div>
                <div style={{ marginTop: 6 }}>NavIC / satellite metrics (simulated)</div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "8px 0 14px" }} />

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Ranked recommendations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.map((r, idx) => {
                  const reasons = (Array.isArray(r.reasons) && r.reasons.length > 0) ? r.reasons : fallbackReasonsForScheme(r.name, metrics, claim);
                  return (
                    <div key={r.name} style={{ padding: 12, border: "1px solid #eee", borderRadius: 10, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 800 }}>{idx + 1}. {r.name}</div>
                        <div style={{ fontWeight: 800, color: "#111" }}>{r.score}%</div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        {(reasons || []).slice(0, 3).map((reason, i) => (
                          <div key={i} style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>• {reason}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Numeric indicators</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#fafafa", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>Soil fertility index</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{(metrics?.soilIndex ?? 0).toFixed(2)}</div>
                </div>
                <div style={{ background: "#fafafa", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>Groundwater index</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{(metrics?.gwIndex ?? 0).toFixed(2)}</div>
                </div>
                <div style={{ background: "#fafafa", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>Distance to nearest water (km)</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{metrics?.distanceToWaterKm ?? "—"}</div>
                </div>
                <div style={{ background: "#fafafa", border: "1px solid #eee", padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "#666" }}>Land area (ha)</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{displayLandArea != null ? Number(displayLandArea).toFixed(2) : "—"}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "#666" }}>Running diagnostics — results will appear shortly.</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #eee", padding: 12, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666" }}>
          Demo — simulated NavIC & satellite metrics.
          <div style={{ marginTop: 6, fontSize: 11 }}>Generated: {formatLocal()}</div>
          {apiError && <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 11 }}>API error: {apiError}</div>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {/* Visible action button (previously plain white) */}
          <button onClick={handleClose} className="btn-footer-action px-4 py-2 rounded-lg">
            Close
          </button>

          {/* Download JSON */}
          <button onClick={handleExportJSON} className="btn-download-json px-4 py-2 rounded-lg">
            Download JSON
          </button>

          {/* Download CSV */}
          <button onClick={handleExportCSV} className="btn-download-csv px-4 py-2 rounded-lg">
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
