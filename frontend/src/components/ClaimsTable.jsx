// frontend/src/components/ClaimsTable.jsx
import React, { useMemo, useState } from "react";
import { API_BASE } from "../config";

/**
 * Props:
 * - claims: array of claim objects (id, village, patta_holder, status, date, lat, lon, district)
 * - onRowClick: function(claim) -> called when user wants map to zoom to claim (legacy)
 * - onZoom: function(claim) -> new dedicated zoom handler (preferred)
 * - onDeleteSuccess: function(arrayOfDeletedIds) -> optional parent callback to update state/map
 */
export default function ClaimsTable({ claims = [], onRowClick, onDeleteSuccess, onZoom }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortByDateDesc, setSortByDateDesc] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [loadingDelete, setLoadingDelete] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = claims.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!s) return true;
      return (
        (c.village || "").toLowerCase().includes(s) ||
        (c.patta_holder || "").toLowerCase().includes(s) ||
        (c.district || "").toLowerCase().includes(s)
      );
    });

    // sort by date if date exists; fallback to original order
    out.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return sortByDateDesc ? db - da : da - db;
    });

    return out;
  }, [claims, q, statusFilter, sortByDateDesc]);

  const totalCount = claims.length;
  const filteredCount = filtered.length;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Copied to clipboard:", text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const tryZoomToClaim = (c) => {
    console.log("ClaimsTable: tryZoomToClaim", { claim: c, hasOnRowClick: !!onRowClick });
    if (onRowClick) {
      try {
        onRowClick(c);
        return;
      } catch (e) {
        console.warn("onRowClick threw", e);
      }
    }

    if (c.lat != null && c.lon != null) {
      window.dispatchEvent(
        new CustomEvent("fra-focus", { detail: { lat: Number(c.lat), lon: Number(c.lon), zoom: 13 } })
      );
      return;
    }

    console.warn("ClaimsTable: no coordinates available to zoom to for claim", c?.id);
  };

  // Build base url robustly
  const base = String(API_BASE || "").replace(/\/$/, "");

  // Bulk delete selected
  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected claim(s)? This cannot be undone.`)) return;

    setLoadingDelete(true);
    try {
      const res = await fetch(`${base}/claims?confirm=true`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert("Bulk delete failed: " + (text || res.statusText));
        setLoadingDelete(false);
        return;
      }

      // success
      onDeleteSuccess && onDeleteSuccess(ids);
      setSelectedIds(new Set());
      alert(`Deleted ${ids.length} claim(s).`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Bulk delete failed: " + (err.message || err));
    } finally {
      setLoadingDelete(false);
    }
  };

  // Delete single claim
  const handleDeleteOne = async (id) => {
    if (!window.confirm(`Delete claim ${id}? This cannot be undone.`)) return;
    setLoadingDelete(true);
    try {
      const res = await fetch(`${base}/claims/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        alert("Delete failed: " + (txt || res.statusText));
        setLoadingDelete(false);
        return;
      }
      onDeleteSuccess && onDeleteSuccess([id]);
      // if it was selected, remove from selection
      setSelectedIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      alert("Deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed: " + (err.message || err));
    } finally {
      setLoadingDelete(false);
    }
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input
          placeholder="Search village / holder / district"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="">All</option>
          <option>Pending</option>
          <option>Granted</option>
        </select>

        <button
          onClick={() => setSortByDateDesc((s) => !s)}
          title="Toggle sort by date"
          style={{ padding: "8px 10px" }}
        >
          {sortByDateDesc ? "Newest" : "Oldest"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <div style={{ color: "#6b7280" }}>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => {
              if (selectedIds.size === 0) return;
              const firstId = selectedIds.values().next().value;
              const found = claims.find((c) => c.id === firstId);
              if (found) tryZoomToClaim(found);
            }}
            style={{ padding: "6px 10px" }}
            title="Zoom to first selected"
          >
            Zoom to selected
          </button>
          <button onClick={selectAllVisible} style={{ padding: "6px 10px" }}>
            Select visible
          </button>
          <button onClick={clearSelection} style={{ padding: "6px 10px" }}>
            Clear selection
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || loadingDelete}
            style={{
              padding: "6px 10px",
              background: selectedIds.size === 0 ? "#e5e7eb" : "#ef4444",
              color: selectedIds.size === 0 ? "#6b7280" : "#fff",
              borderRadius: 6,
              border: "none",
            }}
          >
            {loadingDelete ? "Deleting..." : `Delete selected (${selectedIds.size})`}
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #eee" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 36 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={(e) => (e.target.checked ? selectAllVisible() : clearSelection())}
                />
              </th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 48 }}>ID</th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee" }}>Village</th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee" }}>Holder</th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 120 }}>Status</th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 120 }}>Date</th>
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 170 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const hasCoords = c.lat != null && c.lon != null;
              return (
                <tr
                  key={c.id}
                  style={{ cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
                  onDoubleClick={() => tryZoomToClaim(c)}
                >
                  <td style={{ padding: 6, textAlign: "center" }}>
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>

                  <td style={{ padding: 6 }}>{c.id}</td>

                  <td style={{ padding: 6 }} title="Double-click to zoom">
                    {c.village || "—"}
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{c.district || ""}</div>
                  </td>

                  <td style={{ padding: 6 }}>{c.patta_holder || "—"}</td>

                  <td style={{ padding: 6 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: c.status === "Granted" ? "#16a34a" : "#ef4444",
                        color: "white",
                        fontSize: 12,
                      }}
                    >
                      {c.status || "—"}
                    </span>
                    <div style={{ marginTop: 6 }}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: hasCoords ? "#ecfdf5" : "#f3f4f6",
                          color: hasCoords ? "#065f46" : "#6b7280",
                          border: "1px solid " + (hasCoords ? "#bbf7d0" : "transparent"),
                        }}
                      >
                        {hasCoords ? "Has coords" : "No coords"}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: 6 }}>{c.date || "—"}</td>

                  <td style={{ padding: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Prefer dedicated onZoom prop if provided
                        if (typeof onZoom === "function") {
                          try {
                            onZoom(c);
                          } catch (err) {
                            console.warn("onZoom threw, falling back to tryZoomToClaim", err);
                            tryZoomToClaim(c);
                          }
                        } else {
                          // fallback to existing behavior
                          tryZoomToClaim(c);
                        }
                      }}
                      style={{ padding: "6px 8px", borderRadius: 6, background: "#0ea5e9", color: "white" }}
                      title="Zoom to this claim"
                    >
                      Zoom
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasCoords) copyToClipboard(`${c.lat},${c.lon}`);
                      }}
                      disabled={!hasCoords}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: hasCoords ? "#10b981" : "#e5e7eb",
                        color: hasCoords ? "white" : "#6b7280",
                      }}
                      title={hasCoords ? "Copy coordinates" : "No coords to copy"}
                    >
                      Copy coords
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOne(c.id);
                      }}
                      style={{
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "#ef4444",
                        color: "white",
                      }}
                      title="Delete this claim"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
