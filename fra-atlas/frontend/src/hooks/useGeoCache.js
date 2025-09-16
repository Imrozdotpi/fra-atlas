// src/hooks/useGeoCache.js
import { useState, useCallback } from "react";

/**
 * Simple geocode cache using Nominatim.
 * Returns { geoCache, geocodeVillage }.
 *
 * NOTE: Nominatim has rate limits — this caches results in memory for the session.
 */
export default function useGeoCache() {
  const [geoCache, setGeoCache] = useState({});

  const geocodeVillage = useCallback(
    async (village) => {
      if (!village) return null;
      if (geoCache[village]) return geoCache[village];
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(village)}, India`
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
    },
    [geoCache]
  );

  return { geoCache, geocodeVillage };
}
