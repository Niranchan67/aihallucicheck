"""
models.py
---------
SQLAlchemy ORM models backing persistent storage.

`ReportORM.result_json` stores the exact serialized VerificationResponse,
so GET /api/verifications/{id} can re-serve a byte-for-byte match of what
was originally returned without re-deriving it from the child rows. The
`claims` / `citations` relationships exist for future querying (filtering,
stats, search) without needing to parse result_json every time.
"""

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from db import Base


class ReportORM(Base):
    __tablename__ = "verification_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    verification_id = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    input_text = Column(Text, nullable=False)
    model = Column(String, default="unknown")
    overall_confidence = Column(Float, default=0.0)
    claims_checked = Column(Integer, default=0)
    verified_count = Column(Integer, default=0)
    suspicious_count = Column(Integer, default=0)
    hallucinated_count = Column(Integer, default=0)
    demo_mode = Column(Boolean, default=True)
    result_json = Column(JSON, nullable=False)

    claims = relationship("ClaimORM", back_populates="report", cascade="all, delete-orphan")
    citations = relationship("CitationORM", back_populates="report", cascade="all, delete-orphan")


class ClaimORM(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("verification_reports.id"), nullable=False)
    claim_text = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    evidence = Column(Text, nullable=True)

    report = relationship("ReportORM", back_populates="claims")


class CitationORM(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(Integer, ForeignKey("verification_reports.id"), nullable=False)
    citation_text = Column(Text, nullable=False)
    status = Column(String, nullable=False)
    url = Column(String, nullable=True)

    report = relationship("ReportORM", back_populates="citations")
