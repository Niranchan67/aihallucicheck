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


_COMPOUND_CONJUNCTION_PATTERN = re.compile(
    r"(?:;\s*|,\s+(?:and|but|whereas|while|yet)\s+|—\s*|--\s*)",
    re.IGNORECASE,
)
_VERB_HEURISTIC = re.compile(
    r"\b(?:is|are|was|were|has|have|had|consists?|contains?|includes?|won|invented|created|discovered|died|born|became|ruled|built|wrote|developed|attended|graduated|worked|served|founded|established|signed|published|released|occurred|happens?|happened|causes?|caused|leads?|led)\b|[a-z]{3,}ed\b",
    re.IGNORECASE,
)


def _split_into_atomic_clauses(sentence: str) -> List[tuple]:
    """
    Deconstructs a compound sentence into independent atomic claims.
    Uses spaCy linguistic dependency analysis when available;
    falls back to heuristic clause boundary detection with verb verification.

    Returns a list of (atomic_claim_text, rel_start, rel_end).
    """
    cuts = []

    if _NLP is not None:
        try:
            doc = _NLP(sentence)
            # 1. Punctuation cuts: semicolons, em dashes
            for token in doc:
                if token.text in (';', '—', '--') and 2 < token.i < len(doc) - 2:
                    left_tokens = doc[:token.i]
                    right_tokens = doc[token.i + 1:]
                    if any(t.pos_ in ('VERB', 'AUX') for t in left_tokens) and any(t.pos_ in ('VERB', 'AUX') for t in right_tokens):
                        cuts.append((token.idx, token.idx + len(token.text)))

            # 2. Conjunction cuts: coordinate and contrast clauses
            for token in doc:
                if token.pos_ == 'CCONJ' or (token.pos_ == 'SCONJ' and token.text.lower() in ('while', 'whereas', 'although')):
                    left_tokens = doc[:token.i]
                    left_has_verb = any(t.pos_ in ('VERB', 'AUX') for t in left_tokens)
                    left_has_subj = any(t.dep_ in ('nsubj', 'nsubjpass', 'csubj') for t in left_tokens)
                    if not (left_has_verb and left_has_subj):
                        continue
                    right_verbs = [t for t in doc[token.i + 1:] if t.pos_ in ('VERB', 'AUX')]
                    for v in right_verbs:
                        has_subj = any(c.dep_ in ('nsubj', 'nsubjpass', 'csubj') for c in v.children)
                        if has_subj:
                            left_idx = token.idx
                            if token.i > 0 and doc[token.i - 1].text == ',':
                                left_idx = doc[token.i - 1].idx
                            cuts.append((left_idx, token.idx + len(token.text)))
                            break
        except Exception:
            cuts = []

    # Regex fallback if spaCy didn't find any cuts
    if not cuts:
        for m in _COMPOUND_CONJUNCTION_PATTERN.finditer(sentence):
            left = sentence[:m.start()]
            right = sentence[m.end():]
            if len(left.split()) >= 3 and len(right.split()) >= 3:
                if _VERB_HEURISTIC.search(left) and _VERB_HEURISTIC.search(right):
                    cuts.append((m.start(), m.end()))

    if not cuts:
        return [(sentence.strip(), 0, len(sentence))]

    cuts = sorted(cuts, key=lambda x: x[0])
    results: List[tuple] = []
    last_idx = 0
    for start_cut, end_cut in cuts:
        raw_chunk = sentence[last_idx:start_cut]
        trimmed = raw_chunk.strip()
        if len(trimmed) >= 8:
            trim_start = last_idx + raw_chunk.find(trimmed)
            trim_end = trim_start + len(trimmed)
            clean_stmt = trimmed.rstrip(',; ')
            if not clean_stmt.endswith('.'):
                clean_stmt += '.'
            results.append((clean_stmt, trim_start, trim_end))
        last_idx = end_cut

    tail_raw = sentence[last_idx:]
    tail_trimmed = tail_raw.strip()
    if len(tail_trimmed) >= 8:
        trim_start = last_idx + tail_raw.find(tail_trimmed)
        trim_end = trim_start + len(tail_trimmed)
        clean_stmt = tail_trimmed.lstrip(',; ')
        if clean_stmt and clean_stmt[0].islower():
            clean_stmt = clean_stmt[0].upper() + clean_stmt[1:]
        if not clean_stmt.endswith('.'):
            clean_stmt += '.'
        results.append((clean_stmt, trim_start, trim_end))

    return results if results else [(sentence.strip(), 0, len(sentence))]


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
    """Extract atomic, classified claims from a block of text with character boundary mapping.
    Compound sentences joined by conjunctions (e.g. 'and', 'but', ';') are deconstructed
    into discrete atomic claims for independent verification."""
    sentences = _split_sentences(text)
    claims: List[ExtractedClaim] = []
    search_pos = 0

    for sentence in sentences:
        clean_sentence = sentence.strip()
        if len(clean_sentence) < 8:
            # Too short to be a meaningful standalone claim (e.g. stray fragments)
            continue
        if _BARE_CITATION_FRAGMENT.match(clean_sentence):
            # Just an "Author, A. (Year)." fragment -- the citation itself is
            # already captured separately by extract_citation_strings().
            continue
        if _CONVERSATIONAL_FILLER.match(clean_sentence) and len(clean_sentence.split()) < 10:
            # Conversational preamble without standalone factual assertions
            continue

        # Map exact character index in original text
        sent_idx = text.find(clean_sentence, search_pos)
        if sent_idx == -1:
            sent_idx = text.find(clean_sentence)
        if sent_idx != -1:
            search_pos = sent_idx + len(clean_sentence)
        else:
            sent_idx = 0

        # Deconstruct compound sentence into atomic clauses
        atomic_clauses = _split_into_atomic_clauses(clean_sentence)

        for clause_text, rel_start, rel_end in atomic_clauses:
            clean_clause = clause_text.strip()
            if len(clean_clause) < 8:
                continue

            abs_start = sent_idx + rel_start
            abs_end = sent_idx + rel_end

            claim_type = _classify(clean_clause)
            citation_match = _CITATION_PATTERN.search(clean_clause)

            claims.append(
                ExtractedClaim(
                    id=f"claim-{uuid.uuid4().hex[:8]}",
                    text=clean_clause,
                    type=claim_type,
                    contains_citation=bool(citation_match),
                    citation_text=citation_match.group(1) if citation_match else "",
                    start_index=abs_start,
                    end_index=abs_end,
                )
            )
            if len(claims) >= max_claims:
                break

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
