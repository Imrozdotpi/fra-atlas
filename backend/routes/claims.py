# backend/routes/claims.py
from fastapi import APIRouter, Query, HTTPException, Path, status, Body, Depends, Response
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any
from pydantic import BaseModel
from backend import db
import sqlite3
from starlette.concurrency import run_in_threadpool
import pathlib
import logging
from sqlalchemy import text

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
# Additional endpoints migrated from main.py
# -------------------------

@router.post("/claims", tags=["claims"])
@router.post("/api/claims", tags=["claims"])
async def create_claim(payload: dict = Body(...), db_session = Depends(db.get_db)):
    """
    Create a new claim. Minimal required fields: state, district, village
    """
    required = ["state", "district", "village"]
    for r in required:
        if not payload.get(r):
            raise HTTPException(status_code=400, detail=f"{r} is required")
    try:
        created = await db.insert_claim(payload)
    except Exception as e:
        logger.exception("create_claim failed payload=%s", payload)
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, "claim": created}


@router.get("/claims/{claim_id}", tags=["claims"])
@router.get("/api/claims/{claim_id}", tags=["claims"])
async def get_claim(claim_id: int = Path(..., ge=1)):
    """
    Return a single claim by id.
    """
    try:
        claim = await db.get_claim_by_id(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        return {"claim": claim}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_claim failed id=%s", claim_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/claims/{claim_id}", tags=["claims"])
@router.delete("/api/claims/{claim_id}", tags=["claims"])
async def delete_claim(claim_id: int = Path(..., ge=1)):
    """
    Delete a single claim by id. Returns 204 on success.
    """
    try:
        async with db.engine.begin() as conn:
            row_res = await conn.execute(text("SELECT id FROM claims WHERE id = :id"), {"id": claim_id})
            found = row_res.fetchone()
            if not found:
                raise HTTPException(status_code=404, detail="Claim not found")
            await conn.execute(text("DELETE FROM claims WHERE id = :id"), {"id": claim_id})
        return Response(status_code=204)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("delete_claim failed id=%s", claim_id)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/claims", tags=["claims"])
@router.delete("/api/claims", tags=["claims"])
async def bulk_delete_claims(
    ids: Optional[str] = Query(None, description="Comma separated ids, e.g. ?ids=1,2,3"),
    payload: Optional[dict] = Body(None, description='Also accepts JSON body {"ids":[1,2,3]}'),
    confirm: bool = Query(False, description="Set true to confirm bulk delete"),
):
    """
    Bulk delete claims. Must pass confirm=true and ids either via ?ids=1,2 or JSON body {"ids":[...]}.
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Bulk delete not confirmed. Use ?confirm=true and provide ids as ?ids=1,2,3 or JSON body {ids:[...]}",
        )

    id_list = []
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.strip()]
    elif payload and isinstance(payload.get("ids"), list):
        try:
            id_list = [int(x) for x in payload.get("ids")]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid ids in payload")

    if not id_list:
        raise HTTPException(status_code=400, detail="No ids provided for bulk delete")

    id_csv = ",".join(str(i) for i in id_list)
    try:
        async with db.engine.begin() as conn:
            await conn.execute(text(f"DELETE FROM claims WHERE id IN ({id_csv})"))
        return {"deleted": len(id_list)}
    except Exception as e:
        logger.exception("bulk_delete_claims failed ids=%s", id_list)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/claims.csv", tags=["claims"])
@router.get("/api/export/claims.csv", tags=["claims"])
async def export_claims_csv():
    """
    Stream CSV of claims. Columns: id,state,district,block,village,patta_holder,address,land_area,status,date,lat,lon,created_at
    """
    async def iter_csv():
        header = ["id","state","district","block","village","patta_holder","address","land_area","status","date","lat","lon","created_at"]
        yield ",".join(header) + "\n"
        rows = await db.query_claims({})
        for r in rows:
            vals = [str(r.get(h,"") or "") for h in header]
            safe = [v.replace(",", " ") for v in vals]
            yield ",".join(safe) + "\n"
    return StreamingResponse(iter_csv(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=claims.csv"})
