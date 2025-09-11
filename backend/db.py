# backend/db.py
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
import os
import datetime

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./fra_atlas.db")

# Async engine + session factory
engine = create_async_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_claims_table() -> None:
    """
    Create the claims table if it does not exist.
    Fields: id, state, district, block, village, patta_holder, address,
            land_area, status, date, lat, lon, created_at
    """
    sql = """
    CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT,
        district TEXT,
        block TEXT,
        village TEXT,
        patta_holder TEXT,
        address TEXT,
        land_area REAL,
        status TEXT,
        date TEXT,
        lat REAL,
        lon REAL,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """
    async with engine.begin() as conn:
        await conn.execute(text(sql))
        # no commit needed with engine.begin()


async def insert_claim(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a claim and return the created row as a dict.
    """
    insert_sql = text(
        """
        INSERT INTO claims (state,district,block,village,patta_holder,address,land_area,status,date,lat,lon,created_at)
        VALUES (:state,:district,:block,:village,:patta_holder,:address,:land_area,:status,:date,:lat,:lon,:created_at)
        """
    )
    params = {
        "state": payload.get("state"),
        "district": payload.get("district"),
        "block": payload.get("block"),
        "village": payload.get("village"),
        "patta_holder": payload.get("patta_holder"),
        "address": payload.get("address"),
        "land_area": payload.get("land_area"),
        "status": payload.get("status"),
        "date": payload.get("date"),
        "lat": payload.get("lat"),
        "lon": payload.get("lon"),
        "created_at": payload.get("created_at", datetime.datetime.utcnow().isoformat()),
    }

    async with engine.begin() as conn:
        # execute insert
        await conn.execute(insert_sql, params)
        # fetch the last inserted row id (sqlite specific)
        last_row = await conn.execute(text("SELECT last_insert_rowid() AS id"))
        # fetchone() returns a Row object (synchronous on the result) — do not await it
        last_id = last_row.fetchone()[0]
        # fetch the inserted row
        row_res = await conn.execute(text("SELECT * FROM claims WHERE id = :id"), {"id": last_id})
        row = row_res.fetchone()
        return dict(row._mapping) if row else {}


# --- replaced query_claims with pagination support ---
async def query_claims(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Query claims with optional filters:
    filters may contain: state, district, village, status, q (search), limit, offset
    """
    sql = "SELECT * FROM claims WHERE 1=1"
    params: Dict[str, Any] = {}

    if filters.get("state"):
        sql += " AND state = :state"
        params["state"] = filters["state"]
    if filters.get("district"):
        sql += " AND district = :district"
        params["district"] = filters["district"]
    if filters.get("village"):
        # allow partial matches if you want; remove LIKE for exact-match
        sql += " AND village LIKE :village"
        params["village"] = f"%{filters['village']}%"
    if filters.get("status"):
        sql += " AND status = :status"
        params["status"] = filters["status"]
    if filters.get("q"):
        sql += " AND (village LIKE :q OR patta_holder LIKE :q OR address LIKE :q)"
        params["q"] = f"%{filters['q']}%"

    # default sort
    sql += " ORDER BY created_at DESC"

    # optional pagination
    if filters.get("limit") is not None:
        # ensure offset present
        params["limit"] = int(filters.get("limit"))
        params["offset"] = int(filters.get("offset", 0))
        sql += " LIMIT :limit OFFSET :offset"

    async with engine.begin() as conn:
        result = await conn.execute(text(sql), params)
        rows = result.fetchall()  # synchronous on result object; do NOT await
        return [dict(r._mapping) for r in rows]


# --- added helper: count_claims_by_village ---
async def count_claims_by_village(village: str) -> int:
    """
    Return integer count of claims for a village (exact match).
    """
    sql = "SELECT COUNT(*) AS cnt FROM claims WHERE village = :village"
    async with engine.begin() as conn:
        result = await conn.execute(text(sql), {"village": village})
        row = result.fetchone()
        if not row:
            return 0
        # row[0] should be the integer count
        try:
            return int(row[0])
        except Exception:
            # fallback for RowMapping
            return int(row._mapping.get("cnt", 0))


async def get_claim_by_id(claim_id: int) -> Optional[Dict[str, Any]]:
    async with engine.begin() as conn:
        row_res = await conn.execute(text("SELECT * FROM claims WHERE id = :id"), {"id": claim_id})
        r = row_res.fetchone()
        return dict(r._mapping) if r else None


# ---------------------------
# New village helpers start here
# ---------------------------

async def init_villages_table() -> None:
    """
    Create the villages table if it does not exist.
    Fields: id, state, district, block, village, lat, lon, created_at
    NOTE: This function only creates the table — it does NOT insert demo rows.
    """
    sql = """
    CREATE TABLE IF NOT EXISTS villages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        block TEXT,
        village TEXT NOT NULL,
        lat REAL,
        lon REAL,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """
    async with engine.begin() as conn:
        await conn.execute(text(sql))


async def insert_village(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a village and return the created row as a dict.
    """
    insert_sql = text(
        """
        INSERT INTO villages (state,district,block,village,lat,lon,created_at)
        VALUES (:state,:district,:block,:village,:lat,:lon,:created_at)
        """
    )
    params = {
        "state": payload.get("state"),
        "district": payload.get("district"),
        "block": payload.get("block"),
        "village": payload.get("village"),
        "lat": payload.get("lat"),
        "lon": payload.get("lon"),
        "created_at": payload.get("created_at", datetime.datetime.utcnow().isoformat()),
    }

    async with engine.begin() as conn:
        await conn.execute(insert_sql, params)
        last_row = await conn.execute(text("SELECT last_insert_rowid() AS id"))
        last_id = last_row.fetchone()[0]
        row_res = await conn.execute(text("SELECT * FROM villages WHERE id = :id"), {"id": last_id})
        row = row_res.fetchone()
        return dict(row._mapping) if row else {}

# ---------------------------
# New village helpers end here
# ---------------------------


# Dependency for FastAPI routes if needed
async def get_db():
    async with SessionLocal() as session:
        yield session
