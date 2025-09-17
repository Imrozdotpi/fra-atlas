// frontend/src/utils/diagnosticsUtils.js
// Deterministic pseudo-metrics and rule-based scoring for Diagnostics (Phase 2/4)

export function computeMetrics(claim = {}) {
  const lat = Number(claim.lat || 0);
  const lon = Number(claim.lon || 0);
  const land_area = Number(claim.land_area || 0);

  // deterministic seed derived from lat/lon (repeatable)
  const seed = (Math.floor(Math.abs(lat * 1000)) + Math.floor(Math.abs(lon * 1000))) % 1000;

  const soilIndex = (seed % 61) / 60; // 0 - 1
  const gwIndex = ((seed * 7) % 97) / 96; // 0 - 1
  const distanceToWaterKm = Number(((100 - (seed % 100)) / 10).toFixed(1)); // 0.0 - 10.0
  const pendingClaimRatio = 0.5; // demo fixed value (could be computed from village)

  return {
    seed,
    lat,
    lon,
    soilIndex,
    gwIndex,
    distanceToWaterKm,
    pendingClaimRatio,
    land_area,
  };
}

/**
 * scoreSchemes(metrics, claim)
 * Apply simple explainable rules to compute scores for a small set of schemes.
 * Returns an array of { name, score (0-100 integer), reasons: string[] }
 */
export function scoreSchemes(metrics = {}, claim = {}) {
  const land_area = Number(claim.land_area || metrics.land_area || 0);
  const { soilIndex = 0, gwIndex = 0, distanceToWaterKm = 0, pendingClaimRatio = 0 } = metrics;

  // helper to clamp allowing sums up to 2 before final normalization
  const clamp = (v, lo = 0, hi = 2) => Math.max(lo, Math.min(hi, v));

  // MGNREGA
  let mScore = 0.45;
  const mReasons = ["Base priority for employment & land works (base 0.45)"];
  if (gwIndex < 0.40) {
    mScore += 0.35;
    mReasons.push("Low groundwater index → higher need for land/infrastructure works (+0.35)");
  }
  if (soilIndex < 0.45) {
    mScore += 0.15;
    mReasons.push("Low soil fertility → soil/regeneration work recommended (+0.15)");
  }
  if (land_area > 1.5) {
    mScore += 0.05;
    mReasons.push("Larger land area (>1.5 ha) → more scope for MGNREGA interventions (+0.05)");
  }
  if (pendingClaimRatio > 0.5) {
    mScore += 0.05;
    mReasons.push("Higher pending claims in area (demo) → targeted employment programs (+0.05)");
  }

  // Jal Jeevan Mission (JJM)
  let jScore = 0.20;
  const jReasons = ["Base priority for water supply (base 0.20)"];
  if (distanceToWaterKm > 2.5) {
    jScore += 0.50;
    jReasons.push("Far from water sources (>2.5 km) → high priority for water supply (+0.50)");
  }
  if (gwIndex < 0.35) {
    jScore += 0.15;
    jReasons.push("Low groundwater availability → piped/managed supply useful (+0.15)");
  }

  // PM-KISAN
  let pScore = 0.15;
  const pReasons = ["Base income-support priority (base 0.15)"];
  if (land_area > 0.5) {
    pScore += 0.45;
    pReasons.push("Land area > 0.5 ha → strong eligibility/benefit (+0.45)");
  }
  if (land_area > 2.0) {
    pScore += 0.10;
    pReasons.push("Land area > 2.0 ha → additional weighting (+0.10)");
  }

  // finalize: convert to percentages and clamp
  const schemes = [
    {
      name: "MGNREGA",
      raw: clamp(mScore, 0, 2),
      reasons: mReasons,
    },
    {
      name: "JJM",
      raw: clamp(jScore, 0, 2),
      reasons: jReasons,
    },
    {
      name: "PM-KISAN",
      raw: clamp(pScore, 0, 2),
      reasons: pReasons,
    },
  ];

  // Normalize: take raw * 100 and cap 0-100
  const normalized = schemes.map((s) => {
    let pct = Math.round(s.raw * 100);
    if (pct > 100) pct = 100;
    if (pct < 0) pct = 0;
    return { name: s.name, score: pct, reasons: s.reasons.slice() };
  });

  // sort descending by score
  normalized.sort((a, b) => b.score - a.score);

  return normalized;
}
