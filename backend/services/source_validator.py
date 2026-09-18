"""
source_validator.py
--------------------
Classifies the credibility, authority tier, and institutional provenance
of evidence sources retrieved during the verification process.

Ensures that claims are only marked VERIFIED when backed by authoritative,
reputable sources (academic peer-reviewed, governmental, or reputable reference).
"""

from enum import Enum
from typing import Tuple
from urllib.parse import urlparse


class SourceTier(str, Enum):
    PEER_REVIEWED_ACADEMIC = "peer_reviewed_academic"
    OFFICIAL_INSTITUTIONAL = "official_institutional"
    REPUTABLE_REFERENCE = "reputable_reference"
    ESTABLISHED_NEWS = "established_news"
    OPEN_WEB = "open_web"
    UNVERIFIED = "unverified"


_ACADEMIC_DOMAINS = {
    "doi.org", "crossref.org", "openalex.org", "ncbi.nlm.nih.gov", "pubmed.ncbi.nlm.nih.gov",
    "europepmc.org", "arxiv.org", "nature.com", "science.org", "pnas.org",
    "ieee.org", "ieeexplore.ieee.org", "acm.org", "springer.com", "sciencedirect.com",
    "wiley.com", "cell.com", "thelancet.com", "jamanetwork.com", "plos.org",
    "oup.com", "cambridge.org", "biorxiv.org", "medrxiv.org"
}

_OFFICIAL_DOMAINS = {
    "nasa.gov", "who.int", "un.org", "cern.ch", "cdc.gov", "nih.gov",
    "noaa.gov", "nist.gov", "usgs.gov", "energy.gov", "state.gov", "europa.eu",
    "worldbank.org", "imf.org", "unesco.org", "esa.int"
}

_REPUTABLE_REFERENCE_DOMAINS = {
    "wikipedia.org", "en.wikipedia.org", "britannica.com", "plato.stanford.edu",
    "merriam-webster.com", "oed.com"
}

_ESTABLISHED_NEWS_DOMAINS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "nytimes.com",
    "washingtonpost.com", "wsj.com", "theguardian.com", "npr.org", "bloomberg.com",
    "economist.com", "ft.com"
}


def classify_source_authority(source_name: str, source_url: str) -> Tuple[SourceTier, float, str]:
    """
    Evaluate source reliability based on domain, protocol, and provenance.
    Returns: (SourceTier, authority_weight (0.0 - 1.0), description)
    """
    if not source_url:
        return SourceTier.UNVERIFIED, 0.0, "Missing source URL."

    try:
        parsed = urlparse(source_url)
        domain = (parsed.hostname or "").lower()
        if domain.startswith("www."):
            domain = domain[4:]
    except Exception:
        return SourceTier.UNVERIFIED, 0.0, "Malformed source URL."

    # 1. Peer-reviewed academic & registry sources
    name_low = (source_name or "").lower()
    if any(ad in domain for ad in _ACADEMIC_DOMAINS) or any(
        term in name_low for term in [
            "openalex", "pubmed", "arxiv", "nature", "science", "pnas",
            "ieee", "springer", "crossref", "peer-reviewed", "journal"
        ]
    ):
        return SourceTier.PEER_REVIEWED_ACADEMIC, 1.0, "Peer-reviewed scientific or scholarly literature."

    # 2. Government & University institutional domains (.gov, .mil, .edu, official bodies)
    if (
        domain.endswith(".gov")
        or domain.endswith(".mil")
        or domain.endswith(".edu")
        or domain.endswith(".ac.uk")
        or any(od in domain for od in _OFFICIAL_DOMAINS)
    ):
        return SourceTier.OFFICIAL_INSTITUTIONAL, 0.95, "Official government, educational, or international research institution."

    # 3. Established encyclopedic reference
    if any(rd in domain for rd in _REPUTABLE_REFERENCE_DOMAINS) or "wikipedia" in name_low or "britannica" in name_low:
        return SourceTier.REPUTABLE_REFERENCE, 0.85, "Reputable encyclopedic reference."

    # 4. Established journalism & news agencies
    if any(nd in domain for nd in _ESTABLISHED_NEWS_DOMAINS):
        return SourceTier.ESTABLISHED_NEWS, 0.70, "Established independent news organisation."

    # 5. General web source
    return SourceTier.OPEN_WEB, 0.45, "General public web source."


def is_authoritative_for_verification(tier: SourceTier) -> bool:
    """Only high and medium-high authority sources can establish VERIFIED status."""
    return tier in (
        SourceTier.PEER_REVIEWED_ACADEMIC,
        SourceTier.OFFICIAL_INSTITUTIONAL,
        SourceTier.REPUTABLE_REFERENCE,
    )
