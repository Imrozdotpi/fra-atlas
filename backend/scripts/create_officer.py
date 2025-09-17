# backend/scripts/create_officer.py
import sqlite3
import os
import argparse
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB = os.getenv("DATABASE_FILE", "backend/fra_atlas.db")

def create_officer(username, password, full_name="Admin User", role="admin"):
    hashed = pwd_ctx.hash(password)
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS officers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          hashed_password TEXT NOT NULL,
          full_name TEXT,
          role TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    try:
        cur.execute("INSERT INTO officers (username, hashed_password, full_name, role) VALUES (?, ?, ?, ?)",
                    (username, hashed, full_name, role))
        conn.commit()
        print("Inserted officer:", username)
    except sqlite3.IntegrityError:
        print("User already exists:", username)
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--full_name", default="Admin User")
    parser.add_argument("--role", default="admin")
    args = parser.parse_args()
    create_officer(args.username, args.password, args.full_name, args.role)
