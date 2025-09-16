// src/hooks/useClaims.js
import { useState, useRef } from "react";
import { API_BASE } from "../config";
import { authFetch } from "../libs/apiClient"; // <- added
// Demo fallback JSON
import sampleClaims from "../data/sample_claims_demo.json";

/**
 * useClaims - simple in-memory cache for claims per-village.
 *
 * API:
 *   const { getClaimsForVillage, getCountForVillage, upsertClaim, removeClaim, cacheRef, loading, error } = useClaims();
 *   await getClaimsForVillage("Chhoti Bari"); // fills cacheRef.current[village]
 *
 * Behavior:
 * - Fetches from the /claims endpoint (not fra-docs).
 * - Accepts backend responses that are either an array or an object ({ claims: [...] }).
 * - Normalizes lat/lon and land_area to numbers (or null).
 * - Stores data under both original and lowercased village keys to allow case-insensitive lookup.
 * - getCountForVillage reads /claims/count endpoint and caches count.
 * - Falls back to local sample_claims_demo.json when backend is unavailable.
 * - Exposes upsertClaim/removeClaim helpers so created/updated/deleted claims can be reflected in the cache.
 */
export default function useClaims() {
  const cacheRef = useRef({}); // { [village]: { claims: [], count: number, source: "backend"|"demo" } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to normalize a single claim object (lat/lon and numeric land_area)
  function normalizeClaim(c) {
    if (!c || typeof c !== "object") return null;
    const copy = { ...c };

    if (copy.lat != null && copy.lat !== "") {
      const n = Number(copy.lat);
      copy.lat = Number.isFinite(n) ? n : null;
    } else {
      copy.lat = null;
    }

    if (copy.lon != null && copy.lon !== "") {
      const n = Number(copy.lon);
      copy.lon = Number.isFinite(n) ? n : null;
    } else {
      copy.lon = null;
    }

    if (copy.land_area != null && copy.land_area !== "") {
      const n = Number(copy.land_area);
      copy.land_area = Number.isFinite(n) ? n : null;
    } else {
      copy.land_area = null;
    }

    // Normalize status
    if (copy.status != null) {
      const s = String(copy.status).trim().toLowerCase();
      if (s === "granted" || s === "grant" || s === "approved") copy.status = "Granted";
      else copy.status = "Pending";
    } else {
      copy.status = "Pending";
    }

    return copy;
  }

  // Normalize array of claims
  function normalizeClaimsArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((c) => normalizeClaim(c)).filter(Boolean);
  }

  // Build base URL robustly (API_BASE may already include /api)
  function claimsBaseUrl() {
    const base = String(API_BASE || "").replace(/\/$/, "");
    if (!base) return `/api/claims`;
    if (base.endsWith("/api")) return base + "/claims";
    return base + "/claims";
  }

  // Helper: filter and normalize demo claims for a village
  function demoClaimsForVillage(village) {
    if (!Array.isArray(sampleClaims) || !village) return [];
    const key = village.toString().trim().toLowerCase();
    const filtered = sampleClaims.filter((c) => (c && (c.village || "").toString().trim().toLowerCase() === key));
    return normalizeClaimsArray(filtered);
  }

  // Upsert a single claim into cache so newly-created/updated claims (e.g. uploaded) appear immediately.
  function upsertClaim(claim) {
    if (!claim || typeof claim !== "object") return;
    const n = normalizeClaim(claim);
    const villageKey = (n.village || "").toString();
    const lowerKey = villageKey.toLowerCase();

    if (!villageKey) {
      // If we don't have a village, put it under a generic key to avoid losing it
      const generic = "_ungrouped_";
      cacheRef.current[generic] = cacheRef.current[generic] || { claims: [], count: 0, source: "local" };
      // replace if id exists else prepend
      const existsIdx = cacheRef.current[generic].claims.findIndex((c) => c.id === n.id);
      if (existsIdx !== -1) cacheRef.current[generic].claims[existsIdx] = { ...cacheRef.current[generic].claims[existsIdx], ...n };
      else cacheRef.current[generic].claims.unshift(n);
      cacheRef.current[generic].count = cacheRef.current[generic].claims.length;
      return;
    }

    // Ensure both exact and lowercase keys exist and are synced
    [villageKey, lowerKey].forEach((k) => {
      cacheRef.current[k] = cacheRef.current[k] || { claims: [], count: 0, source: "local" };
      const idx = cacheRef.current[k].claims.findIndex((c) => c.id === n.id);
      if (idx !== -1) {
        cacheRef.current[k].claims[idx] = { ...cacheRef.current[k].claims[idx], ...n };
      } else {
        // Prepend new claim so it shows up first in lists
        cacheRef.current[k].claims.unshift(n);
      }
      cacheRef.current[k].count = cacheRef.current[k].claims.length;
    });
  }

  // Remove a claim from cache by id (used after deletes)
  function removeClaimById(id) {
    if (!id) return;
    Object.keys(cacheRef.current).forEach((k) => {
      if (!cacheRef.current[k] || !Array.isArray(cacheRef.current[k].claims)) return;
      const before = cacheRef.current[k].claims.length;
      cacheRef.current[k].claims = cacheRef.current[k].claims.filter((c) => c.id !== id);
      const after = cacheRef.current[k].claims.length;
      if (before !== after) {
        cacheRef.current[k].count = cacheRef.current[k].claims.length;
      }
    });
  }

  /**
   * getClaimsForVillage
   * - Reads from the /claims endpoint with ?village=...
   * - Caches results under both original and lowercased village keys
   * - Accepts several response shapes (array, { claims: [...] }, { claim: {...} })
   */
  async function getClaimsForVillage(village, { force = false } = {}) {
    if (!village) return [];
    const key = village.toString().trim();
    const lowerKey = key.toLowerCase();

    try {
      // Return cached if present (and not forcing)
      if (!force && cacheRef.current[key] && Array.isArray(cacheRef.current[key].claims)) {
        return cacheRef.current[key].claims;
      }
      if (!force && cacheRef.current[lowerKey] && Array.isArray(cacheRef.current[lowerKey].claims)) {
        return cacheRef.current[lowerKey].claims;
      }

      setLoading(true);
      setError(null);

      const url = `${claimsBaseUrl()}?village=${encodeURIComponent(village)}`;
      const res = await authFetch(url); // <- replaced fetch with authFetch

      if (!res.ok) throw new Error(`Failed to fetch claims: ${res.status}`);

      const data = await res.json().catch(() => null);

      // Accept several shapes:
      // - array => data is the array
      // - { claims: [...] } or { value: [...] } => take the array
      // - { claim: {...} } => single object -> wrap in array
      let arr = [];
      if (Array.isArray(data)) {
        arr = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.claims)) arr = data.claims;
        else if (Array.isArray(data.value)) arr = data.value;
        else if (Array.isArray(data.results)) arr = data.results;
        else if (data.claim && typeof data.claim === "object") arr = [data.claim];
        else {
          // unknown object shape: try to detect array-like props
          const maybeArray = Object.values(data).find((v) => Array.isArray(v));
          if (maybeArray) arr = maybeArray;
        }
      }

      const normalized = normalizeClaimsArray(arr);

      // populate cache under both exact and lowercase keys
      cacheRef.current[key] = cacheRef.current[key] || {};
      cacheRef.current[key].claims = normalized.slice();
      cacheRef.current[key].count = normalized.length;
      cacheRef.current[key].source = "backend";

      if (key !== lowerKey) {
        cacheRef.current[lowerKey] = cacheRef.current[lowerKey] || {};
        cacheRef.current[lowerKey].claims = normalized.slice();
        cacheRef.current[lowerKey].count = normalized.length;
        cacheRef.current[lowerKey].source = "backend";
      }

      setError(null);
      return normalized;
    } catch (err) {
      console.warn("useClaims.getClaimsForVillage error:", err);

      // Attempt demo fallback if available
      try {
        const demo = demoClaimsForVillage(village);
        if (Array.isArray(demo) && demo.length > 0) {
          // cache demo results
          cacheRef.current[key] = cacheRef.current[key] || {};
          cacheRef.current[key].claims = demo;
          cacheRef.current[key].count = demo.length;
          cacheRef.current[key].source = "demo";

          if (key !== lowerKey) {
            cacheRef.current[lowerKey] = cacheRef.current[lowerKey] || {};
            cacheRef.current[lowerKey].claims = demo;
            cacheRef.current[lowerKey].count = demo.length;
            cacheRef.current[lowerKey].source = "demo";
          }

          setError(`Backend fetch failed; using demo fallback (${err?.message || "error"})`);
          return demo;
        }
      } catch (demoErr) {
        console.warn("useClaims: demo fallback failed", demoErr);
      }

      setError(err);
      // return cached value if present (even if stale), else empty array
      return (cacheRef.current[key] && cacheRef.current[key].claims) || (cacheRef.current[lowerKey] && cacheRef.current[lowerKey].claims) || [];
    } finally {
      setLoading(false);
    }
  }

  /**
   * getCountForVillage
   * - Reads /claims/count?village=...
   * - Caches result
   */
  async function getCountForVillage(village, { force = false } = {}) {
    if (!village) return 0;
    const key = village.toString().trim();
    const lowerKey = key.toLowerCase();

    try {
      if (!force && cacheRef.current[key] && typeof cacheRef.current[key].count === "number") {
        return cacheRef.current[key].count;
      }
      if (!force && cacheRef.current[lowerKey] && typeof cacheRef.current[lowerKey].count === "number") {
        return cacheRef.current[lowerKey].count;
      }

      const base = String(API_BASE || "").replace(/\/$/, "");
      const countBase = base ? (base.endsWith("/api") ? base + "/claims/count" : base + "/claims/count") : "/api/claims/count";
      const url = `${countBase}?village=${encodeURIComponent(village)}`;
      const res = await authFetch(url); // <- replaced fetch with authFetch
      if (!res.ok) throw new Error(`Failed to fetch count: ${res.status}`);
      const j = await res.json().catch(() => null);
      const cnt = Number(j?.count || j?.Count || j?.count_value || 0);

      cacheRef.current[key] = cacheRef.current[key] || {};
      cacheRef.current[key].count = Number.isFinite(Number(cnt)) ? Number(cnt) : 0;
      cacheRef.current[key].source = "backend";

      if (key !== lowerKey) {
        cacheRef.current[lowerKey] = cacheRef.current[lowerKey] || {};
        cacheRef.current[lowerKey].count = cacheRef.current[key].count;
        cacheRef.current[lowerKey].source = "backend";
      }

      return cacheRef.current[key].count;
    } catch (err) {
      console.warn("useClaims.getCountForVillage error:", err);

      // fallback to demo count if available
      try {
        const demo = demoClaimsForVillage(village);
        if (Array.isArray(demo) && demo.length > 0) {
          cacheRef.current[key] = cacheRef.current[key] || {};
          cacheRef.current[key].count = demo.length;
          cacheRef.current[key].source = "demo";

          if (key !== lowerKey) {
            cacheRef.current[lowerKey] = cacheRef.current[lowerKey] || {};
            cacheRef.current[lowerKey].count = demo.length;
            cacheRef.current[lowerKey].source = "demo";
          }

          setError(`Backend count fetch failed; using demo fallback (${err?.message || "error"})`);
          return demo.length;
        }
      } catch (demoErr) {
        console.warn("useClaims: demo fallback for count failed", demoErr);
      }

      return (cacheRef.current[key] && cacheRef.current[key].count) || (cacheRef.current[lowerKey] && cacheRef.current[lowerKey].count) || 0;
    }
  }

  return {
    getClaimsForVillage,
    getCountForVillage,
    upsertClaim, // call this after creating/updating a claim so UI cache stays in sync
    removeClaimById, // call this after deleting a claim to keep cache clean
    cacheRef,
    loading,
    error,
  };
}
