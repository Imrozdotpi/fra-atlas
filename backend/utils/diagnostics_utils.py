# backend/utils/diagnostics_utils.py
"""
Deterministic diagnostics utilities for FRA Atlas.

This module provides deterministic, repeatable pseudo-metrics and
rule-based scoring for demo diagnostics. It is intentionally simple
and transparent so judges can see exactly how scores are derived.

Functions:
- compute_metrics(lat, lon, land_area) -> dict
- score_schemes(metrics, claim=None) -> list[dict] (sorted by score desc)
- generate_diagnostics(lat=None, lon=None, land_area=None, claim=None) -> dict
"""

from typing import Optional, Dict, Any, List


def compute_metrics(lat: float = 0.0, lon: float = 0.0, land_area: float = 0.0) -> Dict[str, Any]:
    """
    Deterministic, repeatable computation of pseudo-metrics from lat/lon and land_area.

    Args:
        lat: latitude (float)
        lon: longitude (float)
        land_area: land area in hectares (float)

    Returns:
        dict with keys:
          - seed (int)
          - lat, lon (floats)
          - soilIndex (float 0-1)
          - gwIndex (float 0-1)
          - distanceToWaterKm (float)
          - pendingClaimRatio (float)
          - land_area (float)
    """
    try:
        lat_n = float(lat or 0.0)
    except Exception:
        lat_n = 0.0
    try:
        lon_n = float(lon or 0.0)
    except Exception:
        lon_n = 0.0
    try:
        la = float(land_area or 0.0)
    except Exception:
        la = 0.0

    # deterministic seed derived from coords (repeatable)
    seed = (int(abs(lat_n * 1000)) + int(abs(lon_n * 1000))) % 1000

    soilIndex = (seed % 61) / 60.0  # 0 - 1 scale
    gwIndex = ((seed * 7) % 97) / 96.0  # 0 - 1 scale
    distanceToWaterKm = round((100 - (seed % 100)) / 10.0, 1)  # 0.0 - 10.0 km
    pendingClaimRatio = 0.5  # demo fixed value (placeholder)

    return {
        "seed": int(seed),
        "lat": lat_n,
        "lon": lon_n,
        "soilIndex": round(soilIndex, 4),
        "gwIndex": round(gwIndex, 4),
        "distanceToWaterKm": distanceToWaterKm,
        "pendingClaimRatio": round(pendingClaimRatio, 3),
        "land_area": round(la, 4),
    }


def score_schemes(metrics: Dict[str, Any], claim: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Apply simple explainable rules to compute scores for schemes.

    The logic mirrors the frontend:
      - MGNREGA: base 0.45 + boosts for low groundwater, low soil, large area, pending claims
      - JJM: base 0.20 + boosts for distance to water and low groundwater
      - PM-KISAN: base 0.15 + boosts for land area thresholds

    Args:
        metrics: output of compute_metrics()
        claim: optional claim dict (may contain land_area etc.)

    Returns:
        List of dicts: [{"name": str, "score": int (0-100), "reasons": [str,...]}, ...] sorted desc
    """
    la = float(claim.get("land_area")) if (claim and claim.get("land_area") is not None) else float(metrics.get("land_area", 0.0))
    soilIndex = float(metrics.get("soilIndex", 0.0))
    gwIndex = float(metrics.get("gwIndex", 0.0))
    distance = float(metrics.get("distanceToWaterKm", 0.0))
    pendingClaimRatio = float(metrics.get("pendingClaimRatio", 0.5))

    # clamp helper allowing sums up to 2.0 before final normalization
    def clamp(v: float, lo: float = 0.0, hi: float = 2.0) -> float:
        return max(lo, min(hi, v))

    # MGNREGA
    mScore = 0.45
    mReasons: List[str] = ["Base priority for employment & land works (base 0.45)"]
    if gwIndex < 0.40:
        mScore += 0.35
        mReasons.append("Low groundwater index → higher need for land/infrastructure works (+0.35)")
    if soilIndex < 0.45:
        mScore += 0.15
        mReasons.append("Low soil fertility → soil/regeneration work recommended (+0.15)")
    if la > 1.5:
        mScore += 0.05
        mReasons.append("Larger land area (>1.5 ha) → more scope for MGNREGA interventions (+0.05)")
    if pendingClaimRatio > 0.5:
        mScore += 0.05
        mReasons.append("Higher pending claims in area (demo) → targeted employment programs (+0.05)")

    # JJM (Jal Jeevan Mission)
    jScore = 0.20
    jReasons: List[str] = ["Base priority for water supply (base 0.20)"]
    if distance > 2.5:
        jScore += 0.50
        jReasons.append("Far from water sources (>2.5 km) → high priority for water supply (+0.50)")
    if gwIndex < 0.35:
        jScore += 0.15
        jReasons.append("Low groundwater availability → piped/managed supply useful (+0.15)")

    # PM-KISAN
    pScore = 0.15
    pReasons: List[str] = ["Base income-support priority (base 0.15)"]
    if la > 0.5:
        pScore += 0.45
        pReasons.append("Land area > 0.5 ha → strong eligibility/benefit (+0.45)")
    if la > 2.0:
        pScore += 0.10
        pReasons.append("Land area > 2.0 ha → additional weighting (+0.10)")

    schemes_raw = [
        {"name": "MGNREGA", "raw": clamp(mScore), "reasons": mReasons},
        {"name": "JJM", "raw": clamp(jScore), "reasons": jReasons},
        {"name": "PM-KISAN", "raw": clamp(pScore), "reasons": pReasons},
    ]

    normalized: List[Dict[str, Any]] = []
    for s in schemes_raw:
        pct = int(round(s["raw"] * 100))
        pct = max(0, min(100, pct))
        normalized.append({"name": s["name"], "score": pct, "reasons": list(s["reasons"])})

    # sort descending by score
    normalized.sort(key=lambda x: x["score"], reverse=True)
    return normalized


def generate_diagnostics(lat: Optional[float] = None, lon: Optional[float] = None,
                         land_area: Optional[float] = None,
                         claim: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Convenience function to compute metrics + recommendations for given inputs.

    Prefers explicit lat/lon/land_area arguments. If those are None and `claim`
    contains those fields, claim values are used.

    Returns:
        {
          "metrics": {...},
          "recommendations": [...],
        }
    """
    # resolve inputs
    lat_val = lat if lat is not None else (claim.get("lat") if claim and claim.get("lat") is not None else 0.0)
    lon_val = lon if lon is not None else (claim.get("lon") if claim and claim.get("lon") is not None else 0.0)
    la_val = land_area if land_area is not None else (claim.get("land_area") if claim and claim.get("land_area") is not None else 0.0)

    metrics = compute_metrics(lat=lat_val, lon=lon_val, land_area=la_val)
    recommendations = score_schemes(metrics, claim=claim)

    return {
        "metrics": metrics,
        "recommendations": recommendations,
    }


# Optional: small CLI/test when run directly
if __name__ == "__main__":
    # Quick smoke test
    sample = generate_diagnostics(lat=21.15, lon=79.09, land_area=1.8)
    import pprint
    pprint.pprint(sample)
