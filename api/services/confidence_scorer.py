"""
confidence_scorer.py
---------------------
Aggregates individual claim/citation verdicts into an overall, clinical
confidence score (0-100) plus a verified/suspicious/hallucinated
distribution for the dashboard.

The weighting formula is intentionally simple and centralised here so it
can be tuned or replaced without touching the API layer.
"""

from dataclasses import dataclass
from typing import List

from schemas import ClaimStatus, Distribution

# Contribution of each claim status toward the overall score, on a 0-1 scale.
_STATUS_WEIGHT = {
    ClaimStatus.VERIFIED: 1.0,
    ClaimStatus.SUSPICIOUS: 0.45,
    ClaimStatus.UNVERIFIED: 0.35,
    ClaimStatus.HALLUCINATED: 0.0,
}


@dataclass
class ScoreSummary:
    overall_confidence: float
    distribution: Distribution
    verified_count: int
    suspicious_count: int
    hallucinated_count: int


def score_claims(statuses: List[ClaimStatus]) -> ScoreSummary:
    if not statuses:
        return ScoreSummary(
            overall_confidence=0.0,
            distribution=Distribution(verified_pct=0, suspicious_pct=0, hallucinated_pct=0),
            verified_count=0,
            suspicious_count=0,
            hallucinated_count=0,
        )

    total = len(statuses)
    verified = sum(1 for s in statuses if s == ClaimStatus.VERIFIED)
    suspicious = sum(1 for s in statuses if s == ClaimStatus.SUSPICIOUS)
    unverified = sum(1 for s in statuses if s == ClaimStatus.UNVERIFIED)
    hallucinated = sum(1 for s in statuses if s == ClaimStatus.HALLUCINATED)

    weighted_sum = sum(_STATUS_WEIGHT[s] for s in statuses)
    overall_confidence = round((weighted_sum / total) * 100, 1)

    # "Suspicious" bucket on the dashboard groups suspicious + unverified,
    # since both mean "needs human review", matching the reference UI's
    # three-way Verified / Suspicious / Hallucinated distribution.
    suspicious_like = suspicious + unverified

    distribution = Distribution(
        verified_pct=round((verified / total) * 100, 1),
        suspicious_pct=round((suspicious_like / total) * 100, 1),
        hallucinated_pct=round((hallucinated / total) * 100, 1),
    )

    return ScoreSummary(
        overall_confidence=overall_confidence,
        distribution=distribution,
        verified_count=verified,
        suspicious_count=suspicious_like,
        hallucinated_count=hallucinated,
    )
