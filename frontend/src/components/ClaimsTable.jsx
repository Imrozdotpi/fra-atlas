// src/components/ClaimsTable.jsx
import React, { useMemo, useState } from "react";
import { API_BASE } from "../config";
import { authFetch } from "../libs/apiClient"; // <- added

/**
 * Props:
 * - claims: array of claim objects (id, village, patta_holder, status, date, lat, lon, district)
 * - onRowClick: function(claim) -> called when user wants map to zoom to claim (legacy)
 * - onZoom: function(claim) -> new dedicated zoom handler (preferred)
 * - onDeleteSuccess: function(arrayOfDeletedIds) -> optional parent callback to update state/map
 * - onEdit: function(claim) -> open edit form for claim
 * - onUpdate: function() -> optional callback to trigger a full reload (e.g. reloadDbClaims)
 * - onUpdateSuccess: function(updatedClaim) -> optional callback to apply an updated claim object to parent state
 */
export default function ClaimsTable({
  claims = [],
  onRowClick,
  onDeleteSuccess,
  onZoom,
  onEdit,
  onUpdate, // optional reload function
  onUpdateSuccess, // newly supported callback for updated claim object
}) {
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
    console.log("ClaimsTable: tryZoomToClaim", { claim: c, hasOnRowClick: !!onRowClick, hasOnZoom: !!onZoom });
    if (typeof onZoom === "function") {
      try {
        onZoom(c);
        return;
      } catch (e) {
        console.warn("onZoom threw, falling back", e);
      }
    }

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
      const res = await authFetch(`${base}/claims?confirm=true`, {
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

      // let parent fully refresh if it provided onUpdate (reloadDbClaims)
      if (typeof onUpdate === "function") {
        try {
          await onUpdate();
        } catch (err) {
          console.warn("onUpdate after bulk delete threw", err);
        }
      }
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
      const res = await authFetch(`${base}/claims/${id}`, { method: "DELETE" });
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

      // let parent fully refresh if it provided onUpdate (reloadDbClaims)
      if (typeof onUpdate === "function") {
        try {
          await onUpdate();
        } catch (err) {
          console.warn("onUpdate after delete threw", err);
        }
      }
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

  // Helper to determine displayable source (uploaded vs manual)
  const getSourceLabel = (c) => {
    if (c.source) return c.source;
    if (c._source) return c._source;
    if (c.source_filename) return "uploaded";
    // if claim was created via form and lacks a marker
    return "manual";
  };

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
              <th style={{ padding: 6, borderBottom: "1px solid #eee", width: 100 }}>Source</th>
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

                  <td style={{ padding: 6, fontSize: 12, color: "#374151" }}>{getSourceLabel(c)}</td>

                  <td style={{ padding: 6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {/* Edit: prefer parent onEdit (opens modal). Fallback to inline prompt + PUT */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        // If parent provided onEdit (modal/form), use it and pass onUpdate (reload) if desired
                        if (typeof onEdit === "function") {
                          try {
                            // allow parent to receive onUpdate to reload if needed
                            onEdit(c, onUpdate);
                            return;
                          } catch (err) {
                            console.warn("onEdit threw, falling back to inline edit", err);
                          }
                        }

                        // Minimal inline edit UX using prompt (replace with modal if you prefer)
                        try {
                          const newHolder = window.prompt("Edit Patta Holder (leave blank to keep):", c.patta_holder || "");
                          let newStatus = window.prompt("Edit Status (Pending / Granted):", c.status || "Pending");
                          if (newHolder === null && newStatus === null) return; // user cancelled both

                          // Build full payload expected by backend.
                          // Start with the current claim object, overriding fields changed by the user.
                          const payload = {
                            state: c.state || "",
                            district: c.district || "",
                            block: c.block || "",
                            village: c.village || "",
                            patta_holder: (newHolder === null || newHolder === "") ? c.patta_holder : newHolder,
                            address: c.address || "",
                            land_area: c.land_area != null ? Number(c.land_area) : null,
                            status: newStatus === null || newStatus === "" ? c.status : newStatus,
                            date: c.date || "",
                            lat: c.lat != null ? Number(c.lat) : null,
                            lon: c.lon != null ? Number(c.lon) : null,
                          };

                          // send PUT to the backend (using authFetch)
                          const res = await authFetch(`${base}/claims/${c.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });

                          if (!res.ok) {
                            const text = await res.text();
                            alert("Update failed: " + (text || res.statusText));
                            return;
                          }

                          // backend should return updated resource — try to parse it
                          let updated = null;
                          try {
                            updated = await res.json();
                          } catch (e) {
                            // If backend returns empty body but status 200, fallback to payload with id
                            updated = { id: c.id, ...payload };
                          }

                          // notify parent (App) to update state
                          if (typeof onUpdateSuccess === "function") {
                            try {
                              onUpdateSuccess(updated);
                            } catch (err) {
                              console.warn("onUpdateSuccess threw", err);
                            }
                          }

                          // Optionally trigger a full reload if parent provided onUpdate (e.g. reloadDbClaims)
                          if (typeof onUpdate === "function") {
                            try {
                              await onUpdate();
                            } catch (err) {
                              console.warn("onUpdate (reload) threw after edit", err);
                            }
                          }

                          alert("Claim updated.");
                        } catch (err) {
                          console.error("Update failed:", err);
                          alert("Update failed: " + (err.message || err));
                        }
                      }}
                      style={{ padding: "6px 8px", borderRadius: 6, background: "#0ea5e9", color: "white" }}
                      title="Edit this claim"
                    >
                      Edit
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
