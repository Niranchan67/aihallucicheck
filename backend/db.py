"""
db.py
-----
SQLAlchemy engine/session setup for persistent storage.

Defaults to a local SQLite file (hallucicheck.db) so the app keeps working
with zero configuration, exactly like the rest of the project. Set
DATABASE_URL to point at Postgres/MySQL/etc. in production without
changing any other code.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        # Normalize Postgres schemes for SQLAlchemy 2.0 + psycopg2
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/hallucicheck.db"
    return "sqlite:///./hallucicheck.db"


DATABASE_URL = _get_database_url()

if DATABASE_URL.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=_connect_args)
else:
    # PostgreSQL (Supabase) configuration with automatic ping and connection recycling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, always closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they don't exist yet. Safe to call on every startup."""
    try:
        import models  # noqa: F401  (registers ORM classes with Base before create_all)
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print(f"[db] Notice: Table auto-creation: {exc}")


# Auto-initialize tables safely so serverless invocations never encounter missing tables
try:
    init_db()
except Exception:
    pass
