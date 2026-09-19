"""
schemas.py
----------
Pydantic models shared across the HalluciCheck API.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ClaimType(str, Enum):
    FACTUAL = "factual"
    STATISTICAL = "statistical"
    HISTORICAL = "historical"
    OPINION = "opinion"


class ClaimStatus(str, Enum):
    VERIFIED = "verified"
    SUSPICIOUS = "suspicious"
    HALLUCINATED = "hallucinated"
    UNVERIFIED = "unverified"


class CitationStatus(str, Enum):
    VALID = "valid"
    FABRICATED = "fabricated"
    UNVERIFIED = "unverified"


# --------------------------------------------------------------------------
# Request
# --------------------------------------------------------------------------
class VerificationRequest(BaseModel):
    text: str = Field(..., description="Raw AI-generated content to verify.")
    model: Optional[str] = Field(
        default="unknown", description="Which AI system produced the text (informational only)."
    )
    verify_claims: bool = Field(default=True, description="Run factual claim verification.")
    verify_citations: bool = Field(default=True, description="Run citation / DOI validation.")
    verify_statistics: bool = Field(
        default=False, description="Apply stricter scrutiny to numeric/statistical claims."
    )

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text must not be empty")
        return v


# --------------------------------------------------------------------------
# Results
# --------------------------------------------------------------------------
class SourceCitation(BaseModel):
    name: str
    url: str
    title: Optional[str] = None


class PropositionProof(BaseModel):
    statement: str
    prop_type: str = "primary"  # primary, reason, date, location, attribution
    status: str = "supported"   # supported, contradicted, unverified
    evidence_excerpt: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None


class AuthorityCheck(BaseModel):
    domain: str
    source_name: str
    authority_tier: float = 0.85
    authority_label: str = "Reputable Reference"
    dataset: str = "Live Web Index"
    status: str = "verified"


class EvidenceProof(BaseModel):
    dataset: str
    source_title: str
    source_url: str
    quote: str
    authority_tier: float = 0.85
    authority_label: str = "Reputable Reference"
    publication_year: Optional[str] = None


class ClaimResult(BaseModel):
    id: str
    text: str
    type: ClaimType
    status: ClaimStatus
    confidence: float = Field(..., ge=0, le=100)
    evidence: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    sources: Optional[List[SourceCitation]] = []
    reasoning: Optional[str] = None
    propositions_evaluated: Optional[List[PropositionProof]] = []
    authority_checks: Optional[List[AuthorityCheck]] = []
    evidence_proofs: Optional[List[EvidenceProof]] = []
    contradiction_details: Optional[str] = None
    start_index: Optional[int] = None
    end_index: Optional[int] = None


class CitationResult(BaseModel):
    id: str
    raw_text: str
    source: Optional[str] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    exists: bool
    status: CitationStatus
    note: Optional[str] = None


class Distribution(BaseModel):
    verified_pct: float
    suspicious_pct: float
    hallucinated_pct: float


class VerificationResponse(BaseModel):
    verification_id: str
    created_at: datetime
    model: str
    overall_confidence: float = Field(..., ge=0, le=100)
    claims_checked: int
    verified_count: int
    suspicious_count: int
    hallucinated_count: int
    distribution: Distribution
    claims: List[ClaimResult]
    citations: List[CitationResult]
    demo_mode: bool
    stages: List[str]


class HealthResponse(BaseModel):
    status: str
    demo_mode: bool
    providers: dict
    version: str = "1.0.0"
