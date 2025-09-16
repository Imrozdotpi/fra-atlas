# fra-atlas/backend/routes/diagnostics.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from pathlib import Path
import math
import json
import os

router = APIRouter()


class DiagnosticsRequest(BaseModel):
    claim_id: Optional[int] = Field(None, description="Optional claim ID to look up (demo)")
    lat: Optional[float] = Field(None, description="Latitude (if sending coords directly)")
    lon: Optional[float] = Field(None, description="Longitude (if sending coords directly)")
    land_area: Optional[float] = Field(None, description="Land area in hectares (optional)")

class SchemeResult(BaseModel):
    name: str
    score: int
    reasons: List[str]

class DiagnosticsResponse(BaseModel):
    claim_id: Optional[int]
    input: Dict[str, Any]
    metrics: Dict[str, Any]
    recommendations: List[SchemeResult]


# --- Helper: attempt to load claim from demo JSON (optional, best-effort) ---
def try_load_claim_from_demo(claim_id: int) -> Optional[Dict[str, Any]]:
    """
    Tries to load claim entry from a demo JSON file if present.
    The frontend demo JSON in the project is often at:
      frontend/src/data/sample_claims_demo.json
    This function tries a few likely relative paths. If not found, returns None.
    """
    candidate_paths = [
        # relative to backend package
        Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "sample_claims_demo.json",
        Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data" / "sample_claims_demo.json",
        # project root guesses
        Path.cwd() / "frontend" / "src" / "data" / "sample_claims_demo.json",
        Path.cwd() / "fra-atlas" / "frontend" / "src" / "data" / "sample_claims_demo.json",
    ]
    for p in candidate_paths:
        try:
            if p.exists():
                with open(p, "r", encoding="utf-8") as fh:
                    arr = json.load(fh)
                    if isinstance(arr, list):
                        for item in arr:
                            # match claim by id (if id field exists) or by numeric id-like property
                            if item is None:
                                continue
                            if ("id" in item and item.get("id") == claim_id) or (item.get("claim_id") == claim_id):
                                return item
        except Exception:
            # ignore errors and try next
            pass
    return None


# --- Deterministic metrics (mirrors frontend logic) ---
def compute_metrics_from_values(lat: float, lon: float, land_area: float):
    """
    Deterministic, repeatable computation of pseudo-metrics from lat/lon and land_area.
    Returns a dict with seed, soilIndex, gwIndex, distanceToWaterKm, pendingClaimRatio, land_area, lat, lon
    """
    try:
        lat_n = float(lat or 0.0)
        lon_n = float(lon or 0.0)
    except Exception:
        lat_n = 0.0
        lon_n = 0.0

    try:
        la = float(land_area or 0.0)
    except Exception:
        la = 0.0

    seed = (int(abs(lat_n * 1000)) + int(abs(lon_n * 1000))) % 1000
    soilIndex = (seed % 61) / 60.0  # 0 - 1
    gwIndex = ((seed * 7) % 97) / 96.0  # 0 - 1
    distanceToWaterKm = round((100 - (seed % 100)) / 10.0, 1)  # 0.0 - 10.0
    pendingClaimRatio = 0.5  # demo fixed value

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


# --- Rule-based scoring (mirrors frontend logic) ---
def score_schemes(metrics: Dict[str, Any], claim: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Returns list of schemes with integer scores (0-100) and reasons (strings).
    """
    la = float(claim.get("land_area") if claim and claim.get("land_area") is not None else metrics.get("land_area") or 0.0)
    soilIndex = float(metrics.get("soilIndex") or 0.0)
    gwIndex = float(metrics.get("gwIndex") or 0.0)
    distance = float(metrics.get("distanceToWaterKm") or 0.0)
    pendingClaimRatio = float(metrics.get("pendingClaimRatio") or 0.5)

    # clamp helper (allow raw sums up to 2 before normalization)
    def clamp(v, lo=0.0, hi=2.0):
        return max(lo, min(hi, v))

    # MGNREGA
    mScore = 0.45
    mReasons = ["Base priority for employment & land works (base 0.45)"]
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

    # JJM
    jScore = 0.20
    jReasons = ["Base priority for water supply (base 0.20)"]
    if distance > 2.5:
        jScore += 0.50
        jReasons.append("Far from water sources (>2.5 km) → high priority for water supply (+0.50)")
    if gwIndex < 0.35:
        jScore += 0.15
        jReasons.append("Low groundwater availability → piped/managed supply useful (+0.15)")

    # PM-KISAN
    pScore = 0.15
    pReasons = ["Base income-support priority (base 0.15)"]
    if la > 0.5:
        pScore += 0.45
        pReasons.append("Land area > 0.5 ha → strong eligibility/benefit (+0.45)")
    if la > 2.0:
        pScore += 0.10
        pReasons.append("Land area > 2.0 ha → additional weighting (+0.10)")

    schemes = [
        {"name": "MGNREGA", "raw": clamp(mScore), "reasons": mReasons},
        {"name": "JJM", "raw": clamp(jScore), "reasons": jReasons},
        {"name": "PM-KISAN", "raw": clamp(pScore), "reasons": pReasons},
    ]

    normalized = []
    for s in schemes:
        pct = int(round(s["raw"] * 100))
        pct = max(0, min(100, pct))
        normalized.append({
            "name": s["name"],
            "score": pct,
            "reasons": s["reasons"]
        })

    # sort descending by score
    normalized = sorted(normalized, key=lambda x: x["score"], reverse=True)
    return normalized


# --- API route ---
@router.post("/diagnostics", response_model=DiagnosticsResponse)
def run_diagnostics(req: DiagnosticsRequest):
    """
    Compute deterministic diagnostics for a claim.
    Accepts either:
      - claim_id (int) -> will attempt to load claim data from demo JSON if available, else use deterministic seed from claim_id
      - lat & lon (and optional land_area) -> compute metrics deterministically from coords

    Returns metrics + ranked recommendations with reasons.
    """
    # try to derive lat/lon/land_area from incoming request
    lat = req.lat
    lon = req.lon
    land_area = req.land_area

    claim_data = None
    if req.claim_id is not None:
        # Try to load claim data from demo JSON (best-effort)
        try:
            found = try_load_claim_from_demo(req.claim_id)
            if found:
                claim_data = found
                # if the demo entry has numeric lat/lon/land_area, prefer those
                lat = lat if lat is not None else (found.get("lat") or found.get("latitude") or found.get("lat_n"))
                lon = lon if lon is not None else (found.get("lon") or found.get("longitude") or found.get("lon_n"))
                la_val = found.get("land_area") or found.get("area") or found.get("landArea")
                land_area = land_area if land_area is not None else (la_val if la_val is not None else land_area)
        except Exception:
            # ignore and continue
            claim_data = None

    # If coords not provided, but claim_id present, use deterministic seed derived from claim_id to produce pseudo coords.
    if (lat is None or lon is None):
        if req.claim_id is not None:
            # use claim_id-derived fake coords but deterministic
            # (these are artificial and for demo only)
            seed = (req.claim_id * 123) % 1000
            lat = (seed % 90) * 0.1  # ~0-9 degrees; purely demo
            lon = ((seed * 7) % 180) * 0.1  # demo
            if land_area is None:
                # derive demo land_area from seed so score changes with id
                land_area = round(((seed % 500) / 100.0), 2)  # 0.00 - 5.00 ha
        else:
            # fallback default
            lat = 0.0
            lon = 0.0
            land_area = land_area if land_area is not None else 0.0

    # ensure numeric values
    try:
        lat = float(lat)
        lon = float(lon)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid lat/lon")

    try:
        land_area = float(land_area) if land_area is not None else 0.0
    except Exception:
        land_area = 0.0

    # compute deterministic metrics and scoring
    metrics = compute_metrics_from_values(lat, lon, land_area)
    recommendations = score_schemes(metrics, claim_data or {"land_area": land_area})

    result = {
        "claim_id": req.claim_id,
        "input": {"lat": lat, "lon": lon, "land_area": land_area},
        "metrics": metrics,
        "recommendations": recommendations,
    }

    return result


# --- How to include this router in your app ---
# In your backend main (e.g. fra-atlas/backend/main.py) add:
#
# from fastapi import FastAPI
# from routes import diagnostics  # adjust import path as needed
#
# app = FastAPI()
# app.include_router(diagnostics.router, prefix="/api")
#
# Then run with: uvicorn backend.main:app --reload   (adjust module path to your main)
#
