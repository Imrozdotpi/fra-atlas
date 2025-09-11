# backend/claims_db.py
import sqlite3
import os
from typing import List, Dict, Any

# Path to the sqlite DB file (same file your project uses)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "fra_atlas.db")

def get_conn():
    # check_same_thread=False makes it safe to reuse in FastAPI threads
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_claims_table():
    """
    Create 'claims' table if it doesn't exist.
    Run this once at backend startup.
    """
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
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
    )
    """)
    conn.commit()
    conn.close()

def insert_claim(payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
      INSERT INTO claims (state,district,block,village,patta_holder,address,land_area,status,date,lat,lon)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (
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
    ))
    conn.commit()
    claim_id = cur.lastrowid
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    return dict(row) if row else {}

def query_claims(filters: Dict[str, str]) -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    sql = "SELECT * FROM claims WHERE 1=1"
    params = []
    if filters.get("state"):
        sql += " AND state = ?"; params.append(filters["state"])
    if filters.get("district"):
        sql += " AND district = ?"; params.append(filters["district"])
    if filters.get("village"):
        sql += " AND village LIKE ?"; params.append(f"%{filters['village']}%")
    if filters.get("status"):
        sql += " AND status = ?"; params.append(filters["status"])
    sql += " ORDER BY created_at DESC"
    rows = cur.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_claim_by_id(claim_id: int) -> Dict[str, Any]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    return dict(row) if row else {}
