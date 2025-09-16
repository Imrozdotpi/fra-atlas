-- backend/sql/create_officers.sql
CREATE TABLE IF NOT EXISTS officers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  role TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
