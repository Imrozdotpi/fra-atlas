# backend/claims_db.py
import sqlite3
import os
from typing import List, Dict, Any, Optional
from pathlib import Path

# Resolve DB path consistently with backend.db where possible.
# If DATABASE_URL env var is a sqlite URL like "sqlite:///path/to/file", extract the file path.
ENV_DATABASE_URL = os.getenv("DATABASE_URL")
if ENV_DATABASE_URL and ENV_DATABASE_URL.startswith("sqlite"):
    DB_PATH = ENV_DATABASE_URL.split(":///")[-1]
else:
    # fallback to repository-file fra_atlas.db (one level up from backend/)
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fra_atlas.db")

DB_PATH = os.path.abspath(DB_PATH)

# Ensure DB directory exists (helps when DB path points into a nested dir)
db_dir = os.path.dirname(DB_PATH)
if db_dir and not os.path.exists(db_dir):
    try:
        os.makedirs(db_dir, exist_ok=True)
    except Exception:
        pass


def get_conn():
    """
    Return a sqlite3 connection with row_factory set to sqlite3.Row.
    check_same_thread=False makes it safe to use from FastAPI worker threads.
    """
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_claims_table():
    """
    Create 'claims' table if it doesn't exist.
    Also ensure new columns (source, raw_ocr) exist.
    Run this once at backend startup.
    """
    conn = get_conn()
    cur = conn.cursor()
    # base table creation
    cur.execute(
        """
    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT,
      district TEXT,
      block TEXT,
      village TEXT,
      patta_holder TEXT,
      address TEXT,
      land_area TEXT,
      status TEXT,
      date TEXT,
      lat REAL,
      lon REAL,
      source TEXT DEFAULT 'manual',
      raw_ocr TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    """
    )

    # ensure new columns exist (safe no-ops if they already exist)
    # Use generic Exception to be tolerant to different sqlite error messages across versions
    try:
        cur.execute("ALTER TABLE claims ADD COLUMN source TEXT DEFAULT 'manual'")
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE claims ADD COLUMN raw_ocr TEXT")
    except Exception:
        pass

    conn.commit()
    conn.close()


def insert_claim(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a claim and return the created row as a dict.
    Accepts the same payload shape as your async insert_claim.
    """
    conn = get_conn()
    cur = conn.cursor()

    # Ensure we don't pass Python None where sqlite expects NULL (that's fine) and preserve defaults if absent.
    cur.execute(
        """
      INSERT INTO claims (
        state, district, block, village,
        patta_holder, address, land_area, status, date,
        lat, lon, source, raw_ocr, created_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, COALESCE(:created_at, datetime('now')))
    """,
        (
            payload.get("state"),
            payload.get("district"),
            payload.get("block"),
            payload.get("village"),
            payload.get("patta_holder"),
            payload.get("address"),
            payload.get("land_area"),
            payload.get("status"),
            payload.get("date"),
            payload.get("lat"),
            payload.get("lon"),
            payload.get("source", "manual"),
            payload.get("raw_ocr"),
            # Note: sqlite python param binding with ? placeholders can't mix named COALESCE easily,
            # so we used VALUES(...) with ? placeholders and appended created_at at end; to keep it simple,
            # we pass created_at as the last param (or None to use default).
        ),
    )

    # If you'd rather pass created_at explicitly, you can include it in values. For now we rely on DB default.

    conn.commit()
    claim_id = cur.lastrowid
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    return dict(row) if row else {}


def query_claims(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Query claims with optional filters.
    """
    conn = get_conn()
    cur = conn.cursor()
    sql = "SELECT * FROM claims WHERE 1=1"
    params: List[Any] = []
    if filters.get("state"):
        sql += " AND state = ?"
        params.append(filters["state"])
    if filters.get("district"):
        sql += " AND district = ?"
        params.append(filters["district"])
    if filters.get("village"):
        sql += " AND village LIKE ?"
        params.append(f"%{filters['village']}%")
    if filters.get("status"):
        sql += " AND status = ?"
        params.append(filters["status"])
    if filters.get("q"):
        sql += " AND (village LIKE ? OR patta_holder LIKE ? OR address LIKE ?)"
        qv = f"%{filters['q']}%"
        params.extend([qv, qv, qv])

    sql += " ORDER BY created_at DESC"

    # optional pagination
    if filters.get("limit") is not None:
        limit = int(filters.get("limit"))
        offset = int(filters.get("offset", 0))
        sql += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

    rows = cur.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_claim_by_id(claim_id: int) -> Dict[str, Any]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    return dict(row) if row else {}
