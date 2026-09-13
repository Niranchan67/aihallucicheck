"""
main.py
-------
FastAPI server for the AI Hallucination Verification System (HalluciCheck).

Coordinates the multi-stage pipeline:
1. Claim Extraction (NLP parsing & classification)
2. Independent Verification (Neutral query formulation)
3. Source Cross-Check (Wikipedia & DuckDuckGo retrieval)
4. Citation Validation (CrossRef, Semantic Scholar, DOI registry)
5. Confidence Scoring & SQLite persistence
"""

import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import get_settings
from db import SessionLocal, get_db, init_db
from models import CitationORM, ClaimORM, ReportORM
from schemas import (
    HealthResponse,
    VerificationRequest,
    VerificationResponse,
)
from services.citation_validator import validate_citations_pipeline
from services.claim_extractor import extract_citation_strings, extract_claims
from services.confidence_scorer import score_claims
from services.fact_checker import verify_claims_pipeline

settings = get_settings()

app = FastAPI(
    title="AI Hallucination Verification System",
    description="Multi-stage verification pipeline to detect, verify, and flag hallucinations in AI-generated text.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# If static frontend build is not found, fallback to API info at root
_frontend_dist_check = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
)
if not os.path.exists(_frontend_dist_check):
    @app.get("/")
    def root():
        return {
            "status": "online",
            "system": "AI Hallucination Verification System",
            "version": "2.0.0",
        }


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    providers = {
        "wikipedia": "connected (REST API)",
        "duckduckgo": "connected (Web Search)",
        "crossref": "connected (Scholarly Index)",
        "doi_registry": "connected (doi.org)",
        "gemini": "connected" if os.getenv("GEMINI_API_KEY") else "fallback_semantic_engine",
        "database": "sqlite_connected",
    }
    return HealthResponse(
        status="online",
        demo_mode=False,
        providers=providers,
        version="2.0.0",
    )


@app.post("/api/verify", response_model=VerificationResponse)
@app.post("/verify", response_model=VerificationResponse)
async def verify_content(
    payload: VerificationRequest,
    db: Session = Depends(get_db),
):
    raw_text = payload.text.strip()
    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content cannot be empty.",
        )

    if len(raw_text) > settings.max_input_chars:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Content exceeds maximum limit of {settings.max_input_chars} characters.",
        )

    # 1. Stage 1: Claim Extraction & Classification
    extracted_claims = extract_claims(raw_text, max_claims=settings.max_claims_per_request)
    extracted_citation_strings = extract_citation_strings(raw_text)

    # 2. Stage 2 & 3: Independent Querying & Multi-Source Cross-Checking
    claim_results = []
    if payload.verify_claims and extracted_claims:
        batch_input = [(c.id, c.text, c.type) for c in extracted_claims]
        claim_results = await verify_claims_pipeline(batch_input)

    # 3. Stage 4: Citation & Reference Validation
    citation_results = []
    if payload.verify_citations and extracted_citation_strings:
        citation_results = await validate_citations_pipeline(extracted_citation_strings)

    # 4. Stage 5: Confidence Scoring
    score_summary = score_claims([c.status for c in claim_results])

    verification_id = f"hc-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc)

    stages = [
        "Claim Extraction",
        "Independent Verification",
        "Source Cross-Check",
        "Citation Validation",
        "Confidence Scoring",
    ]

    response_data = VerificationResponse(
        verification_id=verification_id,
        created_at=created_at,
        model=payload.model or "unknown",
        overall_confidence=score_summary.overall_confidence,
        claims_checked=len(claim_results),
        verified_count=score_summary.verified_count,
        suspicious_count=score_summary.suspicious_count,
        hallucinated_count=score_summary.hallucinated_count,
        distribution=score_summary.distribution,
        claims=claim_results,
        citations=citation_results,
        demo_mode=False,
        stages=stages,
    )

    # 5. Persistent Storage in SQLite
    try:
        report_orm = ReportORM(
            verification_id=verification_id,
            created_at=created_at,
            input_text=raw_text,
            model=payload.model or "unknown",
            overall_confidence=score_summary.overall_confidence,
            claims_checked=len(claim_results),
            verified_count=score_summary.verified_count,
            suspicious_count=score_summary.suspicious_count,
            hallucinated_count=score_summary.hallucinated_count,
            demo_mode=False,
            result_json=response_data.model_dump(mode="json"),
        )
        db.add(report_orm)
        db.flush()

        for c in claim_results:
            claim_row = ClaimORM(
                report_id=report_orm.id,
                claim_text=c.text,
                status=c.status.value,
                confidence=c.confidence,
                evidence=c.evidence,
            )
            db.add(claim_row)

        for cite in citation_results:
            cite_row = CitationORM(
                report_id=report_orm.id,
                citation_text=cite.raw_text,
                status=cite.status.value,
                url=cite.url,
            )
            db.add(cite_row)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[main] SQLite persistence warning: {e}")

    return response_data


@app.get("/api/verifications/{verification_id}", response_model=VerificationResponse)
def get_verification(verification_id: str, db: Session = Depends(get_db)):
    report = (
        db.query(ReportORM)
        .filter(ReportORM.verification_id == verification_id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification report '{verification_id}' not found.",
        )
    return report.result_json


@app.get("/api/verifications")
def list_verifications(limit: int = 25, db: Session = Depends(get_db)):
    reports = (
        db.query(ReportORM)
        .order_by(ReportORM.created_at.desc())
        .limit(limit)
        .all()
    )
    out = []
    for r in reports:
        out.append({
            "verification_id": r.verification_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "model": r.model,
            "overall_confidence": r.overall_confidence,
            "claims_checked": r.claims_checked,
            "verified_count": r.verified_count,
            "suspicious_count": r.suspicious_count,
            "hallucinated_count": r.hallucinated_count,
            "snippet": r.input_text[:120] if r.input_text else "",
        })
    return out


@app.delete("/api/verifications/{verification_id}")
def delete_verification(verification_id: str, db: Session = Depends(get_db)):
    report = (
        db.query(ReportORM)
        .filter(ReportORM.verification_id == verification_id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification report '{verification_id}' not found.",
        )
    db.delete(report)
    db.commit()
    return {"deleted": True, "verification_id": verification_id}


# Mount production frontend build for single-port fullstack deployment
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
)
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)