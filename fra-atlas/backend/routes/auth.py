# backend/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import sqlite3
from jose import jwt, JWTError
from passlib.context import CryptContext
from typing import Optional
from starlette.concurrency import run_in_threadpool

router = APIRouter()

# Config from env (provide these via environment or defaults)
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
DATABASE_FILE = os.getenv("DATABASE_FILE", "backend/fra_atlas.db")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginIn(BaseModel):
    username: str
    password: str

def get_db_conn():
    conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

async def get_user_by_username(username: str):
    def _q():
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, username, hashed_password, full_name, role FROM officers WHERE username = ?", (username,))
        row = cur.fetchone()
        conn.close()
        return row
    row = await run_in_threadpool(_q)
    return row

@router.post("/login")
async def login(payload: LoginIn):
    row = await get_user_by_username(payload.username)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    hashed = row["hashed_password"]
    if not verify_password(payload.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    user = {"id": row["id"], "username": row["username"], "role": row["role"], "full_name": row["full_name"]}
    token = create_access_token({"sub": row["username"], "role": row["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }

# helper to get current user from Authorization header
async def get_current_user(request: Request):
    auth: str = request.headers.get("Authorization") or ""
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    row = await get_user_by_username(username)
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": row["id"], "username": row["username"], "role": row["role"]}

# -----------------------------
# Added /me endpoint
# -----------------------------
@router.get("/me")
async def me(request: Request):
    """
    Returns the currently authenticated officer (based on bearer token).
    """
    # get_current_user will raise HTTPException(401) if unauthorized
    user = await get_current_user(request)

    # fetch full user row for additional fields (full_name, role, etc.)
    row = await get_user_by_username(user["username"])
    if not row:
        raise HTTPException(status_code=401, detail="User not found")

    # convert sqlite3.Row to plain dict so we can safely use .get()
    try:
        row_dict = dict(row)
    except Exception:
        # fallback mapping
        row_dict = {k: row[k] for k in row.keys()}

    return {
        "user": {
            "id": row_dict.get("id"),
            "username": row_dict.get("username"),
            "full_name": row_dict.get("full_name"),
            "role": row_dict.get("role"),
        }
    }
