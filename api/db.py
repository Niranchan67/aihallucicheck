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
    if os.getenv("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/hallucicheck.db"
    return "sqlite:///./hallucicheck.db"


DATABASE_URL = _get_database_url()

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)

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
    import models  # noqa: F401  (registers ORM classes with Base before create_all)

    Base.metadata.create_all(bind=engine)
