from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from pathlib import Path

# Import your OCR and NER modules
from backend.ocr import extract_text
from backend.ner import extract_entities

app = FastAPI(title="FRA Atlas Backend")

# Allow frontend dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create folder to store uploaded files
UPLOAD_DIR = Path("uploaded_docs")
UPLOAD_DIR.mkdir(exist_ok=True)

# -----------------------------
# Health & Ping Endpoints
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/ping")
def ping():
    return {"message": "pong", "service": "FRA Atlas Backend"}

# -----------------------------
# New Endpoint: Upload FRA docs + OCR + NER
# -----------------------------
@app.post("/api/upload-fra")
async def upload_fra(file: UploadFile = File(...)):
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Extract text using OCR
        text = extract_text(str(file_path))

        # Run NER on extracted text
        entities = extract_entities(text)

        return JSONResponse(
            content={
                "filename": file.filename,
                "message": "File uploaded successfully",
                "path": str(file_path),
                "extracted_text": text[:1000],  # first 1000 chars for preview
                "entities": entities
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
