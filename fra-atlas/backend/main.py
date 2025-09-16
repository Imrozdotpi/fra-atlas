# backend/main.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Body, Query, Response, Request
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
import datetime

# your existing project helpers (keep insert_claim, query_claims, etc.)
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
from backend.models import Base, Village  # removed FRADocument import because we no longer persist docs

# --- register diagnostics router (assumes backend/routes/diagnostics.py exists) ---
from backend.routes.diagnostics import router as diagnostics_router

# --- include auth router (assumes backend/routes/auth.py exists with `router`) ---
from backend.routes.auth import router as auth_router

app = FastAPI()

# NOTE: We DO NOT include a separate claims router here because this file defines the /api/claims handlers inline.
# If you prefer to move claims endpoints to backend/routes/claims.py, then:
#  - move the inline handlers into that router, and
#  - add: from backend.routes.claims import router as claims_router; app.include_router(claims_router, prefix="/api")
# For now we keep the inline handlers to avoid duplicate registration.

# include the diagnostics router under /api
app.include_router(diagnostics_router, prefix="/api")

# include the auth router under /api (provides /api/login etc.)
app.include_router(auth_router, prefix="/api")

# --------------------------
# Debug echo endpoint
# --------------------------
# This endpoint reads the raw request body bytes, logs length and content (or repr if non-utf8),
# and returns the length. Useful when debugging webhook payloads or raw uploads.
@app.post("/debug/echo")
async def debug_echo(request: Request):
    text = await request.body()
    print("DEBUG ECHO GOT BYTES:", len(text), flush=True)
    try:
        s = text.decode("utf-8")
    except Exception:
        s = repr(text)
    print("DEBUG ECHO BODY:", s, flush=True)
    return {"ok": True, "len": len(text)}

# --------------------------
# CORS setup
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Karan UI (React dev)
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # FRA Atlas frontend (Vite / dev server)
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
# Report which DATABASE_URL / DB file the backend actually uses (from backend.db)
# --------------------------
# Import the authoritative DATABASE_URL so the printed value matches the engine's config.
from backend.db import DATABASE_URL  # we already import engine/get_db above, so this is safe
print("DEBUG: backend.main sees DATABASE_URL =", DATABASE_URL, flush=True)

# --------------------------
# Database setup: create tables + seed villages if empty
# --------------------------
@app.on_event("startup")
async def on_startup():
    # create SQLAlchemy models
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
                # scalar_one() may not be available depending on result; handle safely
                try:
                    count = res.scalar_one()
                except Exception:
                    row = res.fetchone()
                    count = int(row[0]) if row else 0
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
    """
    Return information about which DB file the app will try to open,
    and a quick peek at villages/claims rows (or any error that occurs).
    This endpoint prefers the DATABASE_URL from backend.db (if sqlite) rather than relying on cwd.
    """
    # prefer the DATABASE_URL from backend.db (if sqlite) and fall back to env or repo-root file
    from backend.db import DATABASE_URL
    env_url = os.environ.get("DATABASE_URL", None)

    resolved = None
    file_part = None
    try:
        # if DATABASE_URL is a sqlite URL, extract the file path portion and resolve it
        if isinstance(DATABASE_URL, str) and DATABASE_URL.startswith("sqlite"):
            file_part = DATABASE_URL.split(":///")[-1]
            resolved = str(Path(file_part).resolve())
        elif env_url and isinstance(env_url, str) and env_url.startswith("sqlite"):
            file_part = env_url.split(":///")[-1]
            resolved = str(Path(file_part).resolve())
        else:
            # fallback: try repo-root fra_atlas.db (best-effort)
            repo_root = Path(__file__).resolve().parent.parent
            resolved = str((repo_root / "fra_atlas.db").resolve())
    except Exception:
        # one last fallback to a simple string path
        try:
            resolved = str(Path(file_part).as_posix())
        except Exception:
            resolved = "unknown"

    villages = None
    claims = None
    try:
        # open the resolved file directly (absolute path)
        conn = sqlite3.connect(resolved)
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

    return {"env_DATABASE_URL": env_url, "resolved_db_file": resolved, "villages_rows": villages, "claims_rows": claims}

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
# FRA Document upload + OCR/NER -> create Claim (changed)
# --------------------------
@app.post("/api/upload-fra")
async def upload_fra(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload a FRA PDF, run OCR+NER, and create a claim directly.
    The created claim is returned in the response so the frontend can treat it
    identically to a claim created via the form.
    """
    try:
        # save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # run OCR and NER (these are project-specific)
        text = extract_text(str(file_path))
        entities = extract_entities(text)

        # Map entities to claim fields (tweak as your NER returns different keys)
        claim_payload = {
            "state": entities.get("state") or entities.get("states") and (entities.get("states")[0] if isinstance(entities.get("states"), list) else None) or "Unknown",
            "district": entities.get("district") or (entities.get("districts") and (entities.get("districts")[0] if isinstance(entities.get("districts"), list) else None)) or "Unknown",
            "village": (entities.get("villages") or [None])[0],
            "patta_holder": (entities.get("patta_holders") or [None])[0],
            "date": (entities.get("dates") or [None])[0],
            "land_area": entities.get("land_area") or entities.get("area") or None,
            # coords left null — frontend can geocode or claim creation can be updated later by user
            "lat": None,
            "lon": None,
            "status": "Pending",
            # provenance
            "source": "uploaded",
            "raw_ocr": json.dumps({"entities": entities, "extracted_text": text}),
        }

        # Validate required minimal fields (state/district/village) — you can relax if desired
        # We fallback to 'Unknown' for state/district above; ensure 'village' exists
        if not claim_payload.get("village"):
            # still allow creation but frontend should let user edit village when claim is shown
            claim_payload["village"] = None

        # Insert claim into claims table using your helper
        created = await insert_claim(claim_payload)

        # return created claim so frontend can call handleClaimSaved(created.claim)
        return {
            "filename": file.filename,
            "message": "File uploaded, OCR/NER extracted and claim created",
            "entities": entities,
            "extracted_text": text,
            "claim": created,
        }

    except Exception as e:
        # keep the exception readable for debugging
        raise HTTPException(status_code=500, detail=str(e))

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
