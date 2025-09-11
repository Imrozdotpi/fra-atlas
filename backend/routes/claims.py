# backend/routes/claims.py
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend import db

router = APIRouter()


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
        raise HTTPException(status_code=500, detail=str(e))
