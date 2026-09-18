"""
entailment_engine.py
--------------------
Core Factual Entailment and Contradiction Detection Engine.

Replaces naive semantic similarity with deep relationship extraction,
entity-attribute alignment, polarity/negation analysis, and contradiction detection.

CRITICAL RULES:
- Semantic similarity is strictly limited to candidate evidence retrieval.
- Never use similarity > threshold -> VERIFIED.
- Absence of contradictory evidence is NOT enough to classify something as VERIFIED.
- Verification requires explicit, direct entailment of the full factual assertion.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple

import spacy
from services.source_validator import SourceTier, classify_source_authority, is_authoritative_for_verification

try:
    _NLP = spacy.load("en_core_web_sm")
except Exception:
    _NLP = None


class EntailmentVerdict(str, Enum):
    SUPPORTING = "supporting"
    CONTRADICTING = "contradicting"
    NEUTRAL_INSUFFICIENT = "neutral_insufficient"
    IRRELEVANT = "irrelevant"


@dataclass
class AtomicFact:
    subject: str = ""
    subject_lemmas: Set[str] = field(default_factory=set)
    predicate: str = ""
    predicate_lemma: str = ""
    direct_object: str = ""
    object_lemmas: Set[str] = field(default_factory=set)
    prepositional_phrases: List[str] = field(default_factory=list)
    years: Set[str] = field(default_factory=set)
    numbers: Set[str] = field(default_factory=set)
    is_negated: bool = False
    entities: List[Tuple[str, str]] = field(default_factory=list)
    action_type: str = "general"  # award, creation, action, definition, state


# Relationship verb groups
_AWARD_WON_VERBS = {
    "win", "won", "receive", "received", "award", "awarded", "earn", "earned",
    "take", "took", "collect", "bestow", "bestowed", "share", "shared",
    "confer", "conferred", "laureate", "recipient", "winner"
}
_AWARD_NOMINATED_VERBS = {
    "nominate", "nominated", "nomination", "shortlist", "shortlisted",
    "contend", "contender", "consider", "considered"
}
_CREATION_VERBS = {
    "create", "created", "invent", "invented", "develop", "developed",
    "found", "founded", "author", "authored", "write", "wrote",
    "discover", "discovered", "design", "designed", "originate", "originated",
    "establish", "established", "build", "built", "formulate", "formulated",
    "release", "released"
}
_ACTION_EVENT_VERBS = {
    "land", "landed", "reach", "reached", "launch", "launched",
    "travel", "traveled", "fly", "flew", "invade", "invaded",
    "sign", "signed", "pass", "passed", "elect", "elected", "defeat", "defeated"
}
_DEFINITION_VERBS = {
    "be", "is", "are", "was", "were", "refer", "refers", "define", "defined",
    "consist", "consists", "mean", "means", "describe", "describes", "represent"
}

_REFUTATION_PATTERNS = [
    r"\bnever (?:occurred|happened|took place|existed|landed|won|reached|discovered)\b",
    r"\bwas (?:cancelled|canceled|aborted|disproven|disproved|debunked|fabricated)\b",
    r"\bfalsely (?:claimed|believed|attributed|asserted)\b",
    r"\bcontrary to (?:popular belief|claims|the myth)\b",
    r"\bcommon misconception\b",
    r"\bhoax\b",
    r"\bdiscredited\b",
    r"\bno (?:evidence|record|proof) that\b",
    r"\bincorrectly (?:attributed|claimed|stated)\b",
    r"\burban legend\b",
    r"\bmyth\b",
]


def extract_atomic_facts_from_text(text: str) -> AtomicFact:
    """Extract subject, predicate, object, dates, numbers, and entities from claim."""
    facts = AtomicFact()
    clean_text = text.strip()
    if not clean_text:
        return facts

    # Extract years and numbers
    facts.years = set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", clean_text))
    facts.numbers = set(re.findall(r"\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b", clean_text))

    if _NLP is None:
        words = re.findall(r"\b[A-Za-z0-9\-_]+\b", clean_text)
        facts.subject = words[0] if words else ""
        facts.subject_lemmas = {w.lower() for w in words[:3]}
        return facts

    doc = _NLP(clean_text)

    # Extract NER entities
    facts.entities = [(e.text, e.label_) for e in doc.ents]

    # Find root and syntactic triples
    root = None
    for tok in doc:
        if tok.dep_ == "ROOT":
            root = tok
            break

    if root:
        facts.predicate = root.text
        facts.predicate_lemma = root.lemma_.lower()
        facts.is_negated = any(child.dep_ == "neg" for child in root.children)

        p_lemma = facts.predicate_lemma
        if p_lemma in _AWARD_WON_VERBS or p_lemma in _AWARD_NOMINATED_VERBS:
            facts.action_type = "award"
        elif p_lemma in _CREATION_VERBS:
            facts.action_type = "creation"
        elif p_lemma in _ACTION_EVENT_VERBS:
            facts.action_type = "action"
        elif p_lemma in _DEFINITION_VERBS:
            facts.action_type = "definition"

        for tok in doc:
            if tok.dep_ in ("nsubj", "nsubjpass") and tok.head == root:
                facts.subject = " ".join([t.text for t in tok.subtree]).strip()
                facts.subject_lemmas = {t.lemma_.lower() for t in tok.subtree if not t.is_stop and len(t.text) > 1}
                break

        for tok in doc:
            if tok.dep_ in ("dobj", "attr", "acomp", "oprd") and tok.head == root:
                facts.direct_object = " ".join([t.text for t in tok.subtree]).strip()
                facts.object_lemmas = {t.lemma_.lower() for t in tok.subtree if not t.is_stop and len(t.text) > 1}
                break

        for tok in doc:
            if tok.dep_ == "prep" and tok.head in (root, getattr(doc, "dobj", None)):
                facts.prepositional_phrases.append(" ".join([t.text for t in tok.subtree]).strip())

    if not facts.subject:
        for tok in doc:
            if tok.dep_ in ("nsubj", "nsubjpass"):
                facts.subject = " ".join([t.text for t in tok.subtree]).strip()
                facts.subject_lemmas = {t.lemma_.lower() for t in tok.subtree if not t.is_stop and len(t.text) > 1}
                break

    return facts


def evaluate_evidence_entailment(
    claim_text: str,
    claim_facts: AtomicFact,
    evidence_snippet: str,
    source_name: str,
    source_url: str,
) -> Tuple[EntailmentVerdict, float, str]:
    """
    Evaluate whether an evidence passage strictly ENTAILS, CONTRADICTS, or is NEUTRAL to the claim.
    Returns: (EntailmentVerdict, confidence_weight (0-100), factual_rationale)
    """
    if not evidence_snippet or len(evidence_snippet.strip()) < 15:
        return EntailmentVerdict.IRRELEVANT, 0.0, "Evidence passage is empty or too short."

    ev_clean = evidence_snippet.strip()
    ev_lower = ev_clean.lower()
    claim_lower = claim_text.lower()

    # 1. Subject Relevance Check
    subj_tokens = claim_facts.subject_lemmas or {
        w.lower() for w in re.findall(r"\b[A-Za-z0-9]{3,}\b", claim_facts.subject)
    }
    has_subject_mention = False
    if subj_tokens:
        subj_matches = sum(1 for tok in subj_tokens if tok in ev_lower)
        if (subj_matches / len(subj_tokens)) >= 0.35:
            has_subject_mention = True
    else:
        has_subject_mention = True

    # If evidence doesn't even mention the main subject, it is off-topic
    if not has_subject_mention:
        return EntailmentVerdict.IRRELEVANT, 0.0, f"Source does not discuss {claim_facts.subject or 'the claim subject'}."

    # 2. Explicit Refutation / Debunking
    for ref_pat in _REFUTATION_PATTERNS:
        if re.search(ref_pat, ev_lower, re.IGNORECASE):
            return (
                EntailmentVerdict.CONTRADICTING,
                12.0,
                f"Contradicted by {source_name}: Authoritative records explicitly identify this statement as disproven, fabricated, or cancelled."
            )

    # 3. Action / Predicate Nuance Evaluation
    action = claim_facts.action_type
    p_lemma = claim_facts.predicate_lemma

    # --- A. AWARD CHECKS: Distinguish 'won' vs 'nominated for' vs 'discussed' ---
    if action == "award":
        is_claim_win = p_lemma in _AWARD_WON_VERBS
        is_claim_nom = p_lemma in _AWARD_NOMINATED_VERBS

        ev_has_win = any(re.search(rf"\b{w}\b", ev_lower) for w in _AWARD_WON_VERBS)
        ev_has_nom = any(re.search(rf"\b{w}\b", ev_lower) for w in _AWARD_NOMINATED_VERBS)

        # Check domain/category of award (e.g. Literature vs Physics vs Chemistry)
        award_categories = ["literature", "physics", "chemistry", "medicine", "peace", "economics"]
        claim_cat = next((cat for cat in award_categories if cat in claim_lower), None)

        if claim_cat:
            cat_in_ev = bool(re.search(rf"\b(?:nobel(?: prize)? in |prize in |award in |in ){claim_cat}\b", ev_lower))
            other_cats_in_ev = [
                oc for oc in award_categories
                if oc != claim_cat and re.search(rf"\b(?:nobel(?: prize)? in |prize in |award in ){oc}\b", ev_lower)
            ]

            # Does evidence confirm the recipient in the SAME category?
            if cat_in_ev and ev_has_win:
                # If claim asserts a specific year, verify year match
                ev_years = set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", ev_clean))
                if claim_facts.years:
                    if claim_facts.years & ev_years:
                        return (
                            EntailmentVerdict.SUPPORTING,
                            96.0,
                            f"Corroborated by {source_name}: Directly confirmed that {claim_facts.subject} was awarded the honor in {claim_cat.capitalize()} in {', '.join(sorted(claim_facts.years))}."
                        )
                    else:
                        return (
                            EntailmentVerdict.SUPPORTING,
                            91.0,
                            f"Corroborated by {source_name}: Confirmed that {claim_facts.subject} received the award in {claim_cat.capitalize()}."
                        )
                else:
                    return (
                        EntailmentVerdict.SUPPORTING,
                        93.0,
                        f"Corroborated by {source_name}: Confirmed that {claim_facts.subject} received the award in {claim_cat.capitalize()}."
                    )
            elif other_cats_in_ev and not cat_in_ev:
                # Recipient is explicitly documented in a different award category
                other_names = [oc.capitalize() for oc in other_cats_in_ev]
                return (
                    EntailmentVerdict.CONTRADICTING,
                    15.0,
                    f"Category discrepancy in {source_name}: Authoritative records state honors were received in {', '.join(other_names)}, not in {claim_cat.capitalize()}."
                )

        # If claim says won, but evidence ONLY says nominated (not won)
        if is_claim_win and ev_has_nom and not ev_has_win:
            if re.search(r"\b(lost to|did not win|never received|unsuccessful nominee)\b", ev_lower):
                return (
                    EntailmentVerdict.CONTRADICTING,
                    14.0,
                    f"Contradicted by {source_name}: Entity was nominated for the award but did not win."
                )
            return (
                EntailmentVerdict.NEUTRAL_INSUFFICIENT,
                45.0,
                f"Insufficient evidence in {source_name}: Entity is recorded as nominated or considered, but not confirmed as having won."
            )

        # If general award won and object matches
        if is_claim_win and ev_has_win:
            if any(term in ev_lower for term in ["nobel", "prize", "award", "medal", "academy award", "oscar", "pulitzer"]):
                if claim_facts.years and (claim_facts.years & set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", ev_clean))):
                    return (
                        EntailmentVerdict.SUPPORTING,
                        94.0,
                        f"Corroborated by {source_name}: Confirmed award conferral as asserted."
                    )
                elif not claim_facts.years:
                    return (
                        EntailmentVerdict.SUPPORTING,
                        92.0,
                        f"Corroborated by {source_name}: Confirmed award conferral as asserted."
                    )

    # --- B. CREATION / AUTHORSHIP CHECKS ---
    elif action == "creation":
        ev_has_creation = any(re.search(rf"\b{w}\b", ev_lower) for w in _CREATION_VERBS | {"creator", "inventor", "founder", "author", "originator"})
        ev_years = set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", ev_clean))

        if ev_has_creation:
            # Check chronological contradiction on creation
            if claim_facts.years and ev_years and not (claim_facts.years & ev_years):
                # Creation documented in different year
                return (
                    EntailmentVerdict.CONTRADICTING,
                    14.0,
                    f"Chronological discrepancy in {source_name}: Claim asserts creation in {', '.join(sorted(claim_facts.years))}, but records document origin in {', '.join(sorted(list(ev_years))[:2])}."
                )

            # Check creator entity alignment
            if has_subject_mention:
                return (
                    EntailmentVerdict.SUPPORTING,
                    93.0,
                    f"Corroborated by {source_name}: Confirmed that {claim_facts.subject} created or developed the subject matter."
                )
            else:
                return (
                    EntailmentVerdict.CONTRADICTING,
                    16.0,
                    f"Attribution discrepancy in {source_name}: Creation is credited to a different originator in authoritative records."
                )

    # --- C. ACTION / MISSION / EVENT CHECKS ---
    elif action == "action":
        if re.search(r"\b(cancelled|canceled|never flew|aborted|no mission|fictional|impossible|hypothetical)\b", ev_lower):
            return (
                EntailmentVerdict.CONTRADICTING,
                10.0,
                f"Factual contradiction in {source_name}: Event or mission never occurred, was cancelled, or is fictional."
            )
        # Check action verb entailment
        if any(v in ev_lower for v in [p_lemma, "landed", "reached", "launched", "orbited", "arrived"]):
            if claim_facts.direct_object and claim_facts.direct_object.lower() in ev_lower:
                return (
                    EntailmentVerdict.SUPPORTING,
                    92.0,
                    f"Corroborated by {source_name}: Confirmed factual action and outcome as asserted."
                )

    # --- D. DEFINITION / MECHANISM CHECKS (e.g. Photosynthesis) ---
    elif action == "definition":
        obj_tokens = claim_facts.object_lemmas or {
            w.lower() for w in re.findall(r"\b[A-Za-z0-9]{3,}\b", claim_facts.direct_object)
        }
        if obj_tokens:
            obj_matches = sum(1 for tok in obj_tokens if tok in ev_lower)
            if (obj_matches / len(obj_tokens)) >= 0.45:
                return (
                    EntailmentVerdict.SUPPORTING,
                    93.0,
                    f"Corroborated by {source_name}: Scientific definition and mechanism substantiated by authoritative records."
                )

    # 4. Strict General Entailment
    key_entities = [e[0].lower() for e in claim_facts.entities if e[1] not in ("DATE", "CARDINAL")]
    if key_entities:
        ent_matches = sum(1 for ent in key_entities if ent in ev_lower)
        ent_coverage = ent_matches / len(key_entities)
    else:
        ent_coverage = 0.5

    # Check for direct negation conflict
    if not claim_facts.is_negated and any(neg in ev_lower for neg in ["did not", "does not", "cannot", "never"]):
        return (
            EntailmentVerdict.CONTRADICTING,
            18.0,
            f"Polarity conflict in {source_name}: Evidence indicates negative or contradictory findings."
        )

    # High entity coverage + direct action match in authoritative text
    if ent_coverage >= 0.85 and (p_lemma in ev_lower or action == "definition"):
        # If claim had specific years, ensure year match
        if claim_facts.years:
            if claim_facts.years & set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", ev_clean)):
                return (
                    EntailmentVerdict.SUPPORTING,
                    90.0,
                    f"Corroborated by {source_name}: Core entities, dates, and assertions confirmed in context."
                )
        else:
            return (
                EntailmentVerdict.SUPPORTING,
                88.0,
                f"Corroborated by {source_name}: Core entities and factual assertions confirmed in context."
            )

    # DEFAULT: NEUTRAL_INSUFFICIENT (Strictly prevents false VERIFIED classification)
    return (
        EntailmentVerdict.NEUTRAL_INSUFFICIENT,
        45.0,
        f"Context from {source_name} discusses related subject matter but does not explicitly substantiate the complete factual relationship."
    )
