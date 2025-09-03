from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pathlib import Path
import io

from backend.ocr import extract_text
from backend.ner import extract_entities
from backend.db import get_db, engine
from backend.models import Base, FRADocument

app = FastAPI()

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
# Database setup
# --------------------------
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --------------------------
# Health check
# --------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# --------------------------
# Ping API
# --------------------------
@app.get("/api/ping")
def ping():
    return {"message": "pong", "service": "FRA Atlas Backend"}

# --------------------------
# Upload FRA Document
# --------------------------
@app.post("/api/upload-fra")
async def upload_fra(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    try:
        # Save file to uploads/
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # OCR + NER
        text = extract_text(str(file_path))
        entities = extract_entities(text)

        # Pick first values (if available)
        village = entities["villages"][0] if entities["villages"] else None
        patta_holder = entities["patta_holders"][0] if entities["patta_holders"] else None
        date = entities["dates"][0] if entities["dates"] else None

        # Save to DB
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

        # Return entities + raw extracted text
        return {
            "filename": file.filename,
            "message": "File uploaded & saved",
            "entities": entities,
            "extracted_text": text,
            "id": new_doc.id,
        }

    except Exception as e:
        return {"error": str(e)}

# --------------------------
# Query FRA documents (filter by village/patta_holder)
# --------------------------
@app.get("/api/fra-docs")
async def get_fra_docs(
    village: str = None,
    patta_holder: str = None,
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

# --------------------------
# Export FRA documents as CSV
# --------------------------
@app.get("/api/export/csv")
async def export_csv(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FRADocument))
    docs = result.scalars().all()

    # Write to CSV in memory
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
