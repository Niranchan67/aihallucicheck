"""
independent_verifier.py
-----------------------
Stage 2 of the verification pipeline:
Formulates neutral, decontextualized verification questions and search queries
for each extracted claim in isolation to eliminate confirmation bias.
"""

import re
from dataclasses import dataclass
from typing import List, Tuple

_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "with", "by", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "from",
    "up", "down", "in", "out", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "don", "should", "now", "it", "its", "that", "this", "these", "those"
}


@dataclass
class VerificationPlan:
    claim_text: str
    neutral_question: str
    search_query: str
    key_entities: List[str]


def generate_independent_query(claim_text: str) -> VerificationPlan:
    """Generate neutral verification question and search terms from claim text."""
    clean = claim_text.strip()
    # Remove citations from query if present
    clean = re.sub(r'\([A-Za-z\s]+,?\s*\d{4}\)', '', clean).strip()

    # Find capitalized words/phrases (likely entities)
    entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', clean)

    # Find numbers / years / percentages
    numbers = re.findall(r'\b\d{1,4}(?:\.\d+)?%?\b', clean)

    # Extract keywords
    words = re.findall(r'\b[A-Za-z0-9\-_]{3,}\b', clean)
    keywords = [w for w in words if w.lower() not in _STOP_WORDS]

    # Build search query from entities + salient keywords (limit to 6 terms for clean search)
    query_parts = []
    for ent in entities:
        if ent not in query_parts:
            query_parts.append(ent)
    for num in numbers:
        if num not in query_parts:
            query_parts.append(num)
    for kw in keywords:
        if kw not in query_parts and len(query_parts) < 6:
            query_parts.append(kw)

    search_query = " ".join(query_parts[:6]) if query_parts else clean

    # Neutral question formulation
    if any(re.search(r'\b(invented|discovered|founded|created|developed|built)\b', clean, re.I) for _ in [1]):
        neutral_question = f"What are the historical facts and origin regarding: {search_query}?"
    elif numbers:
        neutral_question = f"What are the verified statistics or measurements regarding: {search_query}?"
    else:
        neutral_question = f"What is the factual consensus regarding {search_query}?"

    return VerificationPlan(
        claim_text=claim_text,
        neutral_question=neutral_question,
        search_query=search_query,
        key_entities=entities[:4],
    )
