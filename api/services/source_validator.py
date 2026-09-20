"""
source_validator.py
--------------------
Stage 4: Source Quality & Relevance Analyzer.

Calculates:
1. Source Authority Tier (Academic, Government, Structured Knowledge, News, Web)
2. Relevance to the exact atomic claim (discarding irrelevant sources even if high authority)
3. Primary vs Secondary Source classification
4. Source Independence & Diversity metrics
"""

from enum import Enum
import re
from typing import List, Set, Tuple
from urllib.parse import urlparse


class SourceTier(str, Enum):
    PEER_REVIEWED_ACADEMIC = "peer_reviewed_academic"
    OFFICIAL_INSTITUTIONAL = "official_institutional"
    STRUCTURED_KNOWLEDGE = "structured_knowledge"
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
    "worldbank.org", "imf.org", "unesco.org", "esa.int", "nobelprize.org"
}

_STRUCTURED_KNOWLEDGE_DOMAINS = {
    "wikidata.org", "dbpedia.org"
}

_REPUTABLE_REFERENCE_DOMAINS = {
    "britannica.com", "plato.stanford.edu", "merriam-webster.com", "oed.com",
    "wikipedia.org", "en.wikipedia.org"
}

_ESTABLISHED_NEWS_DOMAINS = {
    "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "nytimes.com",
    "washingtonpost.com", "wsj.com", "theguardian.com", "npr.org", "bloomberg.com",
    "economist.com", "ft.com"
}


def classify_source_authority(source_name: str, source_url: str) -> Tuple[SourceTier, float, str, bool]:
    """
    Evaluates source reliability and determines whether it serves as a primary source.
    Returns: (SourceTier, authority_weight (0.0 - 1.0), description, is_primary)
    """
    if not source_url:
        return SourceTier.UNVERIFIED, 0.0, "Missing source URL.", False

    try:
        parsed = urlparse(source_url)
        domain = (parsed.hostname or "").lower()
        if domain.startswith("www."):
            domain = domain[4:]
    except Exception:
        return SourceTier.UNVERIFIED, 0.0, "Malformed source URL.", False

    name_low = (source_name or "").lower()

    # 1. Peer-reviewed academic & registry sources (Primary research)
    if any(ad in domain for ad in _ACADEMIC_DOMAINS) or any(
        term in name_low for term in [
            "openalex", "pubmed", "arxiv", "nature", "science", "pnas",
            "ieee", "springer", "crossref", "peer-reviewed", "journal"
        ]
    ):
        return SourceTier.PEER_REVIEWED_ACADEMIC, 1.0, "Peer-reviewed scientific or scholarly literature.", True

    # 2. Government & University institutional domains (Primary records)
    if (
        domain.endswith(".gov")
        or domain.endswith(".mil")
        or domain.endswith(".edu")
        or domain.endswith(".ac.uk")
        or any(od in domain for od in _OFFICIAL_DOMAINS)
        or "nobelprize.org" in domain
    ):
        return SourceTier.OFFICIAL_INSTITUTIONAL, 0.95, "Official government, educational, or international research institution.", True

    # 3. Structured Knowledge Graph (Wikidata)
    if any(sk in domain for sk in _STRUCTURED_KNOWLEDGE_DOMAINS) or "wikidata" in name_low:
        return SourceTier.STRUCTURED_KNOWLEDGE, 0.90, "Structured factual knowledge graph (Wikidata).", False

    # 4. Established encyclopedic reference
    if any(rd in domain for rd in _REPUTABLE_REFERENCE_DOMAINS) or "britannica" in name_low:
        is_wiki = "wikipedia" in domain or "wikipedia" in name_low
        return SourceTier.REPUTABLE_REFERENCE, 0.82 if not is_wiki else 0.78, "Established reference archive.", False

    # 5. Established journalism & news agencies
    if any(nd in domain for nd in _ESTABLISHED_NEWS_DOMAINS):
        return SourceTier.ESTABLISHED_NEWS, 0.75, "Established independent news organisation.", False

    # 6. General web source
    return SourceTier.OPEN_WEB, 0.45, "General public web source.", False


def evaluate_source_relevance(
    claim_terms: Set[str],
    entities: List[str],
    snippet: str,
    title: str = "",
) -> Tuple[bool, float]:
    """
    CRITICAL RULE:
    A highly authoritative source that is irrelevant to the claim is NOT evidence.
    Do not display or credit irrelevant sources merely because they have high authority.

    Returns: (is_relevant, relevance_score [0.0 - 1.0])
    """
    text = f"{title} {snippet}".lower()
    if not text.strip():
        return False, 0.0

    # 1. Check entity presence
    entity_hits = 0
    clean_entities = [e.lower() for e in entities if len(e) > 2]
    for ent in clean_entities:
        ent_words = [w for w in re.findall(r"\b\w+\b", ent) if len(w) > 2]
        if any(w in text for w in ent_words):
            entity_hits += 1

    entity_coverage = (entity_hits / len(clean_entities)) if clean_entities else 0.5

    # 2. Check claim term overlap
    clean_claim_terms = {t.lower() for t in claim_terms if len(t) > 2}
    matched_terms = [t for t in clean_claim_terms if t in text]
    term_coverage = (len(matched_terms) / len(clean_claim_terms)) if clean_claim_terms else 0.5

    # Weighted relevance score
    relevance_score = (entity_coverage * 0.55) + (term_coverage * 0.45)

    # Minimum threshold to be considered materially relevant evidence
    is_relevant = relevance_score >= 0.28 or (entity_hits >= 1 and len(matched_terms) >= 2)

    return is_relevant, round(relevance_score, 2)


def is_authoritative_for_verification(tier: SourceTier) -> bool:
    """Only Tier 1 and Tier 2 authoritative sources can establish VERIFIED status."""
    return tier in (
        SourceTier.PEER_REVIEWED_ACADEMIC,
        SourceTier.OFFICIAL_INSTITUTIONAL,
        SourceTier.STRUCTURED_KNOWLEDGE,
        SourceTier.REPUTABLE_REFERENCE,
        SourceTier.ESTABLISHED_NEWS,
    )
