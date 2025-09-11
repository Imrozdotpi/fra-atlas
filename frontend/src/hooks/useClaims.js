// src/hooks/useClaims.js
import { useState, useRef } from "react";
import { API_BASE } from "../config";

/**
 * useClaims - simple in-memory cache for claims per-village.
 *
 * API:
 *   const { getClaimsForVillage, getCountForVillage, cache } = useClaims();
 *   await getClaimsForVillage("Chhoti Bari"); // fills cache[village]
 *
 * This keeps everything session-scoped (memory). No external deps.
 */
export default function useClaims() {
  const cacheRef = useRef({}); // { [village]: { claims: [], count: number } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getClaimsForVillage(village, { force = false } = {}) {
    if (!village) return [];
    try {
      if (!force && cacheRef.current[village] && cacheRef.current[village].claims) {
        return cacheRef.current[village].claims;
      }
      setLoading(true);
      const res = await fetch(`${API_BASE}/claims?village=${encodeURIComponent(village)}`);
      if (!res.ok) throw new Error(`Failed to fetch claims: ${res.status}`);
      const data = await res.json();
      cacheRef.current[village] = cacheRef.current[village] || {};
      cacheRef.current[village].claims = Array.isArray(data) ? data : (data.value || []);
      // optionally update count if available in payload
      cacheRef.current[village].count = Array.isArray(data) ? data.length : (data.Count || cacheRef.current[village].count || 0);
      setError(null);
      return cacheRef.current[village].claims;
    } catch (err) {
      setError(err);
      return cacheRef.current[village]?.claims || [];
    } finally {
      setLoading(false);
    }
  }

  async function getCountForVillage(village, { force = false } = {}) {
    if (!village) return 0;
    try {
      if (!force && cacheRef.current[village] && typeof cacheRef.current[village].count === "number") {
        return cacheRef.current[village].count;
      }
      const res = await fetch(`${API_BASE}/claims/count?village=${encodeURIComponent(village)}`);
      if (!res.ok) throw new Error(`Failed to fetch count: ${res.status}`);
      const j = await res.json();
      const cnt = Number(j?.count || 0);
      cacheRef.current[village] = cacheRef.current[village] || {};
      cacheRef.current[village].count = cnt;
      return cnt;
    } catch (err) {
      // fallback to cached value or 0
      return cacheRef.current[village]?.count || 0;
    }
  }

  return {
    getClaimsForVillage,
    getCountForVillage,
    cacheRef, // exposing ref if you want to inspect cache
    loading,
    error,
  };
}
