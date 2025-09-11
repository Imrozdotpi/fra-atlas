from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Body, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from pathlib import Path
import io
import json
from typing import Optional, Dict, Any

# added imports for debug endpoint
import os
import pathlib
import sqlite3

# your existing project helpers
from backend.ocr import extract_text
from backend.ner import extract_entities
from backend.db import (
    get_db,
    engine,
    init_claims_table,
    insert_claim,
    query_claims,
    get_claim_by_id,
    init_villages_table,  # NEW: ensure village table is initialized
)
from backend.models import Base, FRADocument, Village

# --- register claims router ---
from backend.routes.claims import router as claims_router

app = FastAPI()

# include the claims router (registers /claims and /api/claims routes)
app.include_router(claims_router)

# --------------------------
# CORS setup
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],  # frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# Ensure upload directory exists
# --------------------------
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# --------------------------
# Database setup: create tables + seed villages if empty
# --------------------------
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # init claims + villages helper tables
    await init_claims_table()
    await init_villages_table()  # NEW

    # Optional: seed villages if DB empty
    # --- remove/guard demo village seeding ---
    # Previously the code inserted demo villages here on every startup.
    # We now skip seeding by default. If you need to seed for local dev,
    # set the environment variable SEED_VILLAGES=1 before starting uvicorn.
    try:
        async with engine.begin() as conn:
            try:
                res = await conn.execute(text("SELECT COUNT(*) FROM villages"))
                count = res.scalar_one()
            except Exception:
                count = 0

            if count == 0:
                # Only seed demo villages if SEED_VILLAGES=1
                if os.environ.get("SEED_VILLAGES") == "1":
                    await conn.execute(text("""
                    INSERT INTO villages (state,district,block,village,lat,lon,created_at)
                    VALUES
                      ('Unknown','Unknown',NULL,'Village A',21.14,79.08,datetime('now')),
                      ('Unknown','Unknown',NULL,'Village B',21.16,79.10,datetime('now')),
                      ('Unknown','Unknown',NULL,'Village C',21.12,79.12,datetime('now'))
                    ;
                    """))
                # otherwise do nothing (no demo seeds)
    except Exception:
        # Fail startup seeding silently (we don't want this to crash app)
        pass
    # --- end guarded seed ---

# --------------------------
# temporary debug endpoint — remove after debugging
# --------------------------
@app.get("/api/_debug_db_info")
async def _debug_db_info():
    url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./fra_atlas.db")
    resolved = None
    if isinstance(url, str) and url.startswith("sqlite"):
        try:
            # convert sqlite+aiosqlite:///./fra_atlas.db -> ./fra_atlas.db
            parts = url.split(":///")
            if len(parts) >= 2:
                candidate = parts[-1]
            else:
                candidate = url
            resolved = str(pathlib.Path(candidate).resolve())
        except Exception:
            resolved = url
    villages = None
    claims = None
    try:
        dbfile = resolved or url
        # if url still contains a scheme, try to strip prefix for sqlite
        if isinstance(dbfile, str) and dbfile.startswith("sqlite"):
            try:
                dbfile = dbfile.split(":///")[-1]
            except Exception:
                pass
        conn = sqlite3.connect(dbfile)
        cur = conn.cursor()
        try:
            villages = cur.execute("SELECT id,state,district,block,village,lat,lon FROM villages ORDER BY id").fetchall()
        except Exception as e:
            villages = f"ERR:{e}"
        try:
            claims = cur.execute("SELECT id,state,district,village,lat,lon FROM claims ORDER BY id").fetchall()
        except Exception as e:
            claims = f"ERR:{e}"
        conn.close()
    except Exception as e:
        villages = f"ERR_OPEN:{e}"
        claims = f"ERR_OPEN:{e}"
    return {"env_DATABASE_URL": url, "resolved_db_file": resolved, "villages_rows": villages, "claims_rows": claims}

# --------------------------
# Helper to convert row -> dict
# --------------------------
def _row_to_dict(row) -> Dict[str, Any]:
    if row is None:
        return {}
    try:
        return {k: row[k] for k in row.keys()}
    except Exception:
        try:
            return dict(row)
        except Exception:
            return {}

# --------------------------
# Health check + ping
# --------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/ping")
def ping():
    return {"message": "pong", "service": "FRA Atlas Backend"}

# --------------------------
# FRA Document upload + OCR/NER
# --------------------------
@app.post("/api/upload-fra")
async def upload_fra(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        text = extract_text(str(file_path))
        entities = extract_entities(text)

        village = entities.get("villages", [None])[0] if entities.get("villages") else None
        patta_holder = entities.get("patta_holders", [None])[0] if entities.get("patta_holders") else None
        date = entities.get("dates", [None])[0] if entities.get("dates") else None

        new_doc = FRADocument(
            filename=file.filename,
            village=village,
            patta_holder=patta_holder,
            date=date,
            extracted_text=text,
        )
        db.add(new_doc)
        await db.commit()
        await db.refresh(new_doc)

        return {
            "filename": file.filename,
            "message": "File uploaded & saved",
            "entities": entities,
            "extracted_text": text,
            "id": new_doc.id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# FRA Documents list + CSV
# --------------------------
@app.get("/api/fra-docs")
async def get_fra_docs(
    village: Optional[str] = None,
    patta_holder: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(FRADocument)
    if village:
        stmt = stmt.where(FRADocument.village == village)
    if patta_holder:
        stmt = stmt.where(FRADocument.patta_holder == patta_holder)

    result = await db.execute(stmt)
    docs = result.scalars().all()

    return [
        {
            "id": d.id,
            "filename": d.filename,
            "village": d.village,
            "patta_holder": d.patta_holder,
            "date": d.date,
            "created_at": d.created_at,
        }
        for d in docs
    ]

@app.get("/api/export/csv")
async def export_csv(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FRADocument))
    docs = result.scalars().all()

    output = io.StringIO()
    headers = ["id", "filename", "village", "patta_holder", "date", "created_at"]
    output.write(",".join(headers) + "\n")

    for d in docs:
        line = [
            str(d.id),
            d.filename or "",
            d.village or "",
            d.patta_holder or "",
            d.date or "",
            str(d.created_at or ""),
        ]
        output.write(",".join(line) + "\n")

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fra_documents.csv"},
    )

# --------------------------
# Villages endpoint
# --------------------------
@app.get("/api/villages")
async def list_villages(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Village))
        villages = result.scalars().all()
        return [
            {
                "id": v.id,
                "state": v.state,
                "district": v.district,
                "block": v.block,
                "village": v.village,
                "lat": v.lat,
                "lon": v.lon,
                "created_at": v.created_at,
            }
            for v in villages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# Claims endpoints (create, list, get, delete, bulk delete, export CSV)
# --------------------------
@app.post("/api/claims")
async def create_claim(payload: dict, db: AsyncSession = Depends(get_db)):
    required = ["state", "district", "village"]
    for r in required:
        if not payload.get(r):
            raise HTTPException(status_code=400, detail=f"{r} is required")
    try:
        created = await insert_claim(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"success": True, "claim": created}

@app.get("/api/claims")
async def list_claims(
    state: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    status: Optional[str] = None,
):
    try:
        filters = {k: v for k, v in {"state": state, "district": district, "village": village, "status": status}.items() if v}
        claims = await query_claims(filters)
        return {"claims": claims}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/claims/{claim_id}")
async def get_claim(claim_id: int):
    try:
        claim = await get_claim_by_id(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        return {"claim": claim}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/claims/{claim_id}")
async def delete_claim(claim_id: int):
    async with engine.begin() as conn:
        row_res = await conn.execute(text("SELECT id FROM claims WHERE id = :id"), {"id": claim_id})
        found = row_res.fetchone()
        if not found:
            raise HTTPException(status_code=404, detail="Claim not found")
        await conn.execute(text("DELETE FROM claims WHERE id = :id"), {"id": claim_id})
    return Response(status_code=204)

@app.delete("/api/claims")
async def bulk_delete_claims(
    ids: Optional[str] = Query(None, description="Comma separated ids, e.g. ?ids=1,2,3"),
    payload: Optional[dict] = Body(None, description='Also accepts JSON body {"ids":[1,2,3]}'),
    confirm: bool = Query(False, description="Set true to confirm bulk delete"),
):
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Bulk delete not confirmed. Use ?confirm=true and provide ids as ?ids=1,2,3 or JSON body {ids:[...]}",
        )

    id_list = []
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.strip()]
    elif payload and isinstance(payload.get("ids"), list):
        id_list = [int(x) for x in payload.get("ids")]

    if not id_list:
        raise HTTPException(status_code=400, detail="No ids provided for bulk delete")

    id_csv = ",".join(str(i) for i in id_list)
    async with engine.begin() as conn:
        await conn.execute(text(f"DELETE FROM claims WHERE id IN ({id_csv})"))
    return {"deleted": len(id_list)}

@app.get("/api/export/claims.csv")
async def export_claims_csv():
    async def iter_csv():
        header = ["id","state","district","block","village","patta_holder","address","land_area","status","date","lat","lon","created_at"]
        yield ",".join(header) + "\n"
        rows = await query_claims({})
        for r in rows:
            vals = [str(r.get(h,"") or "") for h in header]
            safe = [v.replace(",", " ") for v in vals]
            yield ",".join(safe) + "\n"
    return StreamingResponse(iter_csv(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=claims.csv"})
