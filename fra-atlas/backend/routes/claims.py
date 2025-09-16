# backend/routes/claims.py
from fastapi import APIRouter, Query, HTTPException, Path, status, Body
from typing import Optional, Dict, Any
from pydantic import BaseModel
from backend import db
import sqlite3
from starlette.concurrency import run_in_threadpool
import pathlib
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/claims", tags=["claims"])
@router.get("/api/claims", tags=["claims"])
async def get_claims(
    village: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = Query(None, ge=1),
    offset: int = 0,
):
    """
    Return claims. If `village` is provided, filters to that village.
    Supports optional `status`, `limit`, `offset`.
    """
    try:
        filters = {}
        if village:
            filters["village"] = village
        if status:
            filters["status"] = status
        if limit is not None:
            filters["limit"] = int(limit)
            filters["offset"] = int(offset)
        rows = await db.query_claims(filters)
        return rows
    except Exception as e:
        logger.exception("get_claims failed: village=%s status=%s limit=%s offset=%s", village, status, limit, offset)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/claims/count", tags=["claims"])
@router.get("/api/claims/count", tags=["claims"])
async def get_claims_count(village: str):
    """
    Return {"count": N} for the exact village name provided.
    """
    if not village:
        raise HTTPException(status_code=400, detail="Missing 'village' query parameter")
    try:
        cnt = await db.count_claims_by_village(village)
        return {"count": cnt}
    except Exception as e:
        logger.exception("get_claims_count failed for village=%s", village)
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------
# PUT /claims/{id} endpoint (real update handler)
# -------------------------
class ClaimUpdate(BaseModel):
    village: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    patta_holder: Optional[str] = None
    # Changed land_area to numeric type (float). Frontend should send numbers.
    land_area: Optional[float] = None
    status: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    date: Optional[str] = None


async def _sqlite_get_claim_by_id(db_path: str, claim_id: int) -> Optional[Dict[str, Any]]:
    def _fn():
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM claims WHERE id = ?", (claim_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None
    return await run_in_threadpool(_fn)


async def _sqlite_update_claim(db_path: str, claim_id: int, updates: Dict[str, Any]) -> None:
    def _fn():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        if not updates:
            conn.close()
            return
        # Build SET clause safely
        sets = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values())
        params.append(claim_id)
        sql = f"UPDATE claims SET {sets} WHERE id = ?"
        cur.execute(sql, params)
        conn.commit()
        conn.close()
    return await run_in_threadpool(_fn)


def _get_default_db_path() -> str:
    # try to guess project DB path relative to this file; change if your DB lives elsewhere
    base = pathlib.Path(__file__).resolve().parents[1]  # backend/.. -> project root
    candidate = base / "fra_atlas.db"
    return str(candidate)


@router.put("/claims/{claim_id}", tags=["claims"])
@router.put("/api/claims/{claim_id}", tags=["claims"])
async def update_claim(claim_id: int = Path(..., ge=1), payload: ClaimUpdate = Body(...)):
    """
    Update a claim by id. Accepts only the fields defined in ClaimUpdate.
    Commits changes and returns the updated row.
    """
    db_path = _get_default_db_path()
    logger.info("update_claim called id=%s payload=%s", claim_id, payload.dict(exclude_unset=True))

    # Ensure claim exists
    try:
        existing = await _sqlite_get_claim_by_id(db_path, claim_id)
    except Exception as e:
        logger.exception("failed to read claim before update id=%s", claim_id)
        raise HTTPException(status_code=500, detail="Failed to read claim before update")

    if not existing:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Build updates dict from provided fields (exclude unset -> don't overwrite missing fields)
    updates = payload.dict(exclude_unset=True)

    # Optionally: sanitize or restrict fields to allowed set
    allowed = {"state", "district", "block", "village", "patta_holder", "address", "land_area", "status", "date", "lat", "lon"}
    updates = {k: v for k, v in updates.items() if k in allowed}

    if not updates:
        # Nothing to change — return existing record
        return existing

    # Perform update
    try:
        await _sqlite_update_claim(db_path, claim_id, updates)
    except Exception as e:
        logger.exception("failed to update claim id=%s updates=%s", claim_id, updates)
        raise HTTPException(status_code=500, detail="Failed to update claim")

    # Read back the updated row
    try:
        updated = await _sqlite_get_claim_by_id(db_path, claim_id)
    except Exception as e:
        logger.exception("failed to fetch updated claim id=%s", claim_id)
        raise HTTPException(status_code=500, detail="Failed to fetch updated claim")

    if not updated:
        # This is unexpected: we updated something but can't find the row
        raise HTTPException(status_code=500, detail="Claim updated but could not be retrieved")

    logger.info("update_claim succeeded id=%s", claim_id)
    return updated


# -------------------------
# (Legacy helpers kept below in case you want to re-enable original handler)
# -------------------------

# Note: _sqlite_get_claim_by_id, _sqlite_update_claim, _get_default_db_path are defined above and reused.
