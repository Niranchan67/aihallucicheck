"""
claim_extractor.py
-------------------
Deconstructs raw AI-generated text into atomic, testable claims.

This uses lightweight, dependency-free NLP (regex sentence splitting +
heuristic classification) so the app runs without needing to download
spaCy language models. If spaCy is installed and a model is available,
it is used opportunistically for better sentence boundaries; otherwise
we fall back to a robust regex splitter.
"""

import re
import uuid
from dataclasses import dataclass, field
from typing import List

from schemas import ClaimType

_ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "e.g", "i.e",
    "fig", "no", "vol", "st", "u.s", "u.k", "u.n", "a.m", "p.m",
}

_CITATION_PATTERN = re.compile(
    r"([A-Z][a-zA-Z\-]+(?:,?\s+[A-Z]\.){1,3}\s*\(\d{4}\)\.[^.]*\.)"
)
_STAT_PATTERN = re.compile(
    r"(\d[\d,]*\.?\d*\s?%|\b\d{2,}[\d,]*\b|\bexactly\b|\bprecisely\b|\bapproximately\b)",
    re.IGNORECASE,
)
_HISTORICAL_PATTERN = re.compile(
    r"\b(1[0-9]{3}|20[0-9]{2})\b|\b(founded|established|born|died|invented|discovered|signed)\b",
    re.IGNORECASE,
)
_OPINION_PATTERN = re.compile(
    r"^(i think|i believe|in my opinion|arguably|it seems|i feel|personally)\b",
    re.IGNORECASE,
)
_BARE_CITATION_FRAGMENT = re.compile(
    r"^[A-Z][a-zA-Z\-]+,?(?:\s+[A-Z]\.){1,3}\s*\(\d{4}\)\.?$"
)

_CONVERSATIONAL_FILLER = re.compile(
    r"^(sure!?|certainly!?|here is|here are|as an ai|i hope this helps|let me know if|in summary|overall|in conclusion|to summarize)\b",
    re.IGNORECASE,
)

try:
    import spacy  # type: ignore

    try:
        _NLP = spacy.load("en_core_web_sm")
    except Exception:
        _NLP = None
except ImportError:
    _NLP = None


@dataclass
class ExtractedClaim:
    id: str
    text: str
    type: ClaimType
    contains_citation: bool = False
    citation_text: str = ""
    start_index: int = 0
    end_index: int = 0


def _split_sentences(text: str) -> List[str]:
    """Split text into sentences.

    Prefers spaCy if a model is loaded (handles abbreviations, decimals,
    quotes correctly). Falls back to a regex splitter that is careful
    about common abbreviations and decimal numbers.
    """
    text = text.strip()
    if not text:
        return []

    if _NLP is not None:
        doc = _NLP(text)
        return [s.text.strip() for s in doc.sents if s.text.strip()]

    # Protect decimals and known abbreviations from being treated as sentence
    # boundaries by temporarily replacing their periods.
    protected = text
    for abbr in _ABBREVIATIONS:
        protected = re.sub(
            rf"\b({re.escape(abbr)})\.",
            lambda m: m.group(1).replace(".", "\uE000") + "\uE000",
            protected,
            flags=re.IGNORECASE,
        )
    protected = re.sub(r"(\d)\.(\d)", r"\1" + "\uE001" + r"\2", protected)

    raw_sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])", protected)

    sentences = []
    for s in raw_sentences:
        restored = s.replace("\uE000", ".").replace("\uE001", ".")
        restored = restored.strip()
        if restored:
            sentences.append(restored)
    return sentences


def _classify(sentence: str) -> ClaimType:
    if _OPINION_PATTERN.search(sentence.strip()):
        return ClaimType.OPINION
    if _CITATION_PATTERN.search(sentence) or _HISTORICAL_PATTERN.search(sentence):
        if _HISTORICAL_PATTERN.search(sentence) and re.search(r"\b(founded|established|born|died|invented|discovered|signed)\b", sentence, re.IGNORECASE):
            return ClaimType.HISTORICAL
    if _STAT_PATTERN.search(sentence):
        return ClaimType.STATISTICAL
    if _HISTORICAL_PATTERN.search(sentence):
        return ClaimType.HISTORICAL
    return ClaimType.FACTUAL


def extract_claims(text: str, max_claims: int = 40) -> List[ExtractedClaim]:
    """Extract atomic, classified claims from a block of text with character boundary mapping."""
    sentences = _split_sentences(text)
    claims: List[ExtractedClaim] = []
    search_pos = 0

    for sentence in sentences:
        clean = sentence.strip()
        if len(clean) < 8:
            # Too short to be a meaningful standalone claim (e.g. stray fragments)
            continue
        if _BARE_CITATION_FRAGMENT.match(clean):
            # Just an "Author, A. (Year)." fragment -- the citation itself is
            # already captured separately by extract_citation_strings().
            continue
        if _CONVERSATIONAL_FILLER.match(clean) and len(clean.split()) < 10:
            # Conversational preamble without standalone factual assertions
            continue

        # Map exact character index in original text for the Semantic Highlighting Engine
        idx = text.find(clean, search_pos)
        if idx == -1:
            idx = text.find(clean)
        start_idx = idx if idx != -1 else 0
        end_idx = start_idx + len(clean)
        if idx != -1:
            search_pos = end_idx

        claim_type = _classify(clean)
        citation_match = _CITATION_PATTERN.search(clean)

        claims.append(
            ExtractedClaim(
                id=f"claim-{uuid.uuid4().hex[:8]}",
                text=clean,
                type=claim_type,
                contains_citation=bool(citation_match),
                citation_text=citation_match.group(1) if citation_match else "",
                start_index=start_idx,
                end_index=end_idx,
            )
        )
        if len(claims) >= max_claims:
            break

    return claims


def extract_citation_strings(text: str) -> List[str]:
    """Pull out citation-like references (Author, A. (Year). Title.) plus bare
    URLs and DOIs that appear anywhere in the text, independent of sentence
    splitting -- citations sometimes span multiple "sentences" due to periods
    in initials."""
    found = set(m.group(1).strip() for m in _CITATION_PATTERN.finditer(text))

    url_pattern = re.compile(r"https?://[^\s)\]]+")
    for m in url_pattern.finditer(text):
        found.add(m.group(0).strip().rstrip(".,)"))

    doi_pattern = re.compile(r"\b10\.\d{4,9}/[^\s)\]]+")
    for m in doi_pattern.finditer(text):
        found.add(m.group(0).strip().rstrip(".,)"))

    return list(found)
