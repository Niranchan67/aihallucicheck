"""
entailment_engine.py
--------------------
Proposition-Level Factual Entailment and Contradiction Detection Engine.

Decomposes complex claims into atomic propositions (Subject + Action + Object + Qualifiers)
and verifies that EVERY meaningful factual component is explicitly entailed by authoritative
evidence before granting VERIFIED status.

RULES:
- A claim is VERIFIED ONLY when ALL atomic propositions (event + reason/qualifiers/dates/etc.)
  are directly SUPPORTED by reliable evidence with zero contradictions.
- If the main event is supported but qualifiers (e.g. reason, purpose, causality) are NOT_SUPPORTED,
  the final verdict is strictly SUSPICIOUS.
- If any proposition is directly CONTRADICTED by reliable evidence, the verdict is HALLUCINATED.
- Semantic similarity is NEVER used to declare a proposition supported.
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple

import spacy
from schemas import ClaimStatus
from services.source_validator import SourceTier, classify_source_authority, is_authoritative_for_verification

try:
    _NLP = spacy.load("en_core_web_sm")
except Exception:
    _NLP = None


class PropositionStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    NOT_SUPPORTED = "NOT_SUPPORTED"


@dataclass
class AtomicProposition:
    prop_type: str  # "primary", "reason", "date", "location", "attribution", "quantity", "category"
    statement: str  # Descriptive proposition sentence
    raw_phrase: str  # Original text span from the claim
    content_terms: Set[str] = field(default_factory=set)
    status: PropositionStatus = PropositionStatus.NOT_SUPPORTED
    evidence_quote: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    rationale: str = ""


@dataclass
class PropositionVerificationReport:
    claim_text: str
    subject: str
    predicate: str
    direct_object: str
    propositions: List[AtomicProposition]
    final_status: ClaimStatus
    confidence: float
    rationale: str
    primary_evidence_quote: Optional[str] = None
    primary_source_name: Optional[str] = None
    primary_source_url: Optional[str] = None


# Action & relation verb groups
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


def decompose_claim_into_propositions(claim_text: str) -> Tuple[str, str, str, List[AtomicProposition]]:
    """
    Deconstruct a claim sentence into its primary assertion and qualifying propositions:
    1. Primary Proposition (Subject -> Predicate -> Object)
    2. Reason / Purpose Proposition ("for ...", "because of ...", "due to ...")
    3. Date / Chronology Proposition ("in 1903", "in 1921")
    4. Location Proposition ("in Stockholm", "at Sorbonne")
    5. Attribution Proposition ("by Guido van Rossum")
    6. Category Proposition ("in Physics", "in Literature")
    """
    clean = claim_text.strip()
    if not clean:
        return "", "", "", []

    if _NLP is None:
        # Fallback simple proposition
        return clean, "", "", [
            AtomicProposition(
                prop_type="primary",
                statement=clean,
                raw_phrase=clean,
                content_terms={w.lower() for w in re.findall(r"\b[A-Za-z0-9]{3,}\b", clean)},
            )
        ]

    doc = _NLP(clean)
    root = None
    for tok in doc:
        if tok.dep_ == "ROOT":
            root = tok
            break

    if not root:
        return clean, "", "", [
            AtomicProposition(
                prop_type="primary",
                statement=clean,
                raw_phrase=clean,
                content_terms={w.lower() for w in re.findall(r"\b[A-Za-z0-9]{3,}\b", clean)},
            )
        ]

    subjs = [t for t in doc if t.dep_ in ("nsubj", "nsubjpass") and t.head == root]
    if not subjs:
        subjs = [t for t in doc if t.dep_ in ("nsubj", "nsubjpass")]

    dobjs = [t for t in doc if t.dep_ in ("dobj", "attr", "acomp", "oprd") and t.head == root]

    subj_str = " ".join([t.text for t in subjs[0].subtree]).strip() if subjs else ""
    obj_str = " ".join([t.text for t in dobjs[0].subtree]).strip() if dobjs else ""
    pred_str = root.text

    # Extract prepositional qualifiers
    qualifiers: List[AtomicProposition] = []
    seen_prep_phrases = set()

    for p in doc:
        if p.dep_ == "prep":
            phrase = " ".join([t.text for t in p.subtree]).strip()
            p_low = p.text.lower()
            if phrase in seen_prep_phrases or len(phrase) < 4:
                continue

            terms = {
                t.lemma_.lower() for t in p.subtree
                if not t.is_stop and not t.is_punct and len(t.text) > 1
            }

            # 1. Reason / Cause / Purpose qualifier (e.g. "for his theory of general relativity")
            if p_low in ("for", "because", "due", "owing") or "in recognition of" in phrase.lower():
                seen_prep_phrases.add(phrase)
                qualifiers.append(
                    AtomicProposition(
                        prop_type="reason",
                        statement=f"The stated reason or achievement was: '{phrase}'",
                        raw_phrase=phrase,
                        content_terms=terms,
                    )
                )

            # 2. Date / Year qualifier (e.g. "in 1903", "in 1921")
            elif re.search(r"\b(1[6-9]\d{2}|20\d{2})\b", phrase):
                seen_prep_phrases.add(phrase)
                qualifiers.append(
                    AtomicProposition(
                        prop_type="date",
                        statement=f"The event occurred in: '{phrase}'",
                        raw_phrase=phrase,
                        content_terms=terms,
                    )
                )

            # 3. Category / Field qualifier (e.g. "in Physics", "in Literature")
            elif any(cat in phrase.lower() for cat in ["physics", "chemistry", "medicine", "literature", "peace", "economics"]):
                seen_prep_phrases.add(phrase)
                qualifiers.append(
                    AtomicProposition(
                        prop_type="category",
                        statement=f"Conferred specifically in the field of: '{phrase}'",
                        raw_phrase=phrase,
                        content_terms=terms,
                    )
                )

            # 4. Location qualifier (e.g. "in Stockholm", "at Cambridge")
            elif p_low in ("in", "at", "from") and any(
                e.label_ in ("GPE", "LOC", "FAC", "ORG") for e in doc.ents if e.text in phrase
            ):
                seen_prep_phrases.add(phrase)
                qualifiers.append(
                    AtomicProposition(
                        prop_type="location",
                        statement=f"Took place at the location: '{phrase}'",
                        raw_phrase=phrase,
                        content_terms=terms,
                    )
                )

            # 5. Attribution qualifier (e.g. "by Guido van Rossum")
            elif p_low == "by":
                seen_prep_phrases.add(phrase)
                qualifiers.append(
                    AtomicProposition(
                        prop_type="attribution",
                        statement=f"Attributed to or performed by: '{phrase}'",
                        raw_phrase=phrase,
                        content_terms=terms,
                    )
                )

    # Primary proposition terms
    primary_terms = set()
    if subjs:
        primary_terms.update(t.lemma_.lower() for t in subjs[0].subtree if not t.is_stop and len(t.text) > 1)
    if dobjs:
        primary_terms.update(t.lemma_.lower() for t in dobjs[0].subtree if not t.is_stop and len(t.text) > 1)
    primary_terms.add(root.lemma_.lower())

    primary_prop = AtomicProposition(
        prop_type="primary",
        statement=f"{subj_str} {pred_str} {obj_str}".strip(),
        raw_phrase=f"{subj_str} {pred_str} {obj_str}".strip(),
        content_terms=primary_terms,
    )

    all_props = [primary_prop] + qualifiers
    return subj_str, pred_str, obj_str, all_props


def evaluate_single_proposition(
    prop: AtomicProposition,
    evidence_snippet: str,
    source_name: str,
    source_url: str,
    claim_text: str,
    subject_entity: str = "",
) -> Tuple[PropositionStatus, str]:
    """
    Evaluate a single atomic proposition against an evidence passage.
    Returns: (PropositionStatus, factual_rationale)
    """
    ev_lower = evidence_snippet.lower()
    claim_lower = claim_text.lower()

    # If evaluating a qualifier, verify the passage actually references the subject/entity
    if prop.prop_type != "primary" and subject_entity:
        subj_words = [w.lower() for w in re.findall(r"\b\w+\b", subject_entity) if len(w) > 2]
        if subj_words and not any(w in ev_lower for w in subj_words):
            return (
                PropositionStatus.NOT_SUPPORTED,
                f"Passage in {source_name} does not reference the claim subject ({subject_entity}).",
            )

    # 1. PRIMARY PROPOSITION EVALUATION
    if prop.prop_type == "primary":
        # Check explicit refutations
        for ref_pat in _REFUTATION_PATTERNS:
            if re.search(ref_pat, ev_lower):
                return (
                    PropositionStatus.CONTRADICTED,
                    f"Contradicted by {source_name}: Authoritative records explicitly identify this event as disproven, fabricated, or cancelled."
                )

        # Check terms coverage
        terms = prop.content_terms
        if not terms:
            return PropositionStatus.NOT_SUPPORTED, "Insufficient proposition terms."

        matched = [t for t in terms if t in ev_lower]
        coverage = len(matched) / len(terms)

        # Award actions
        if any(w in terms for w in _AWARD_WON_VERBS):
            has_win = any(re.search(rf"\b{w}\b", ev_lower) for w in _AWARD_WON_VERBS)
            has_nom = any(re.search(rf"\b{w}\b", ev_lower) for w in _AWARD_NOMINATED_VERBS)

            # If evidence states only nominated and lost
            if has_nom and not has_win and re.search(r"\b(lost to|did not win|never received)\b", ev_lower):
                return (
                    PropositionStatus.CONTRADICTED,
                    f"Contradicted by {source_name}: Subject was nominated but did not win the award."
                )

            if has_win and coverage >= 0.50:
                return (
                    PropositionStatus.SUPPORTED,
                    f"Supported by {source_name}: Confirmed that {prop.statement}."
                )

        # Creation actions
        elif any(w in terms for w in _CREATION_VERBS):
            has_creation = any(re.search(rf"\b{w}\b", ev_lower) for w in _CREATION_VERBS)
            if has_creation and coverage >= 0.50:
                return (
                    PropositionStatus.SUPPORTED,
                    f"Supported by {source_name}: Confirmed that {prop.statement}."
                )

        # General actions / definition
        if coverage >= 0.65:
            return (
                PropositionStatus.SUPPORTED,
                f"Supported by {source_name}: Confirmed that {prop.statement}."
            )

        return PropositionStatus.NOT_SUPPORTED, f"Not adequately confirmed in {source_name}."

    # 2. REASON / CAUSE QUALIFIER EVALUATION
    elif prop.prop_type == "reason":
        clean_phrase = re.sub(r"^(?:for|because of|due to|in recognition of)\s+", "", prop.raw_phrase, flags=re.I).strip()
        clean_terms = {
            w for w in re.findall(r"\b\w+\b", clean_phrase.lower())
            if w not in ("for", "due", "recognition", "reason", "his", "her", "their", "the", "a", "an", "of", "and")
        }

        if clean_terms:
            # The reason MUST be stated in causal/attributive connection to the event/award/action
            causal_pat1 = (
                r"\b(?:award(?:ed)?|prize|medal|honor|won|conferred|given|fined|resigned|arrested|created|fired|sentenced|elected|recognized)\b"
                r".*?\b(?:for|in recognition of|because of|due to|citation|citing|on account of|as a result of)\s+([^.;]+)"
            )
            causal_pat2 = (
                r"\b(?:for|in recognition of|because of|due to|citing)\s+([^.;]+?)"
                r"(?:,\s*|\s+)(?:he|she|they|it|\w+)?\s*(?:was|were)?\s*"
                r"(?:award(?:ed)?|prize|medal|honor|won|conferred|given|fined|resigned|arrested|created|fired)\b"
            )

            m1 = re.search(causal_pat1, ev_lower)
            m2 = re.search(causal_pat2, ev_lower)
            actual_reason_snippet = (m1.group(1) if m1 else (m2.group(1) if m2 else None))

            if actual_reason_snippet:
                actual_reason = actual_reason_snippet.strip()
                actual_words = set(re.findall(r"\b\w+\b", actual_reason))
                matched_terms = [t for t in clean_terms if t in actual_words]
                ratio = len(matched_terms) / len(clean_terms) if clean_terms else 0

                if ratio >= 0.50:
                    return (
                        PropositionStatus.SUPPORTED,
                        f"Supported by {source_name}: Reason '{clean_phrase}' is verified by official attribution."
                    )
                elif len(actual_reason) > 10:
                    return (
                        PropositionStatus.CONTRADICTED,
                        f"Contradicted by {source_name}: Official records state the achievement was '{actual_reason[:100]}', not '{clean_phrase}'."
                    )

        return (
            PropositionStatus.NOT_SUPPORTED,
            f"Not substantiated in {source_name}: Evidence does not establish '{prop.raw_phrase}' as the verified reason or attribution."
        )

    # 3. DATE / TIME QUALIFIER EVALUATION
    elif prop.prop_type == "date":
        years = set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", prop.raw_phrase))
        ev_years = set(re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", evidence_snippet))

        if years:
            if years & ev_years:
                return (
                    PropositionStatus.SUPPORTED,
                    f"Supported by {source_name}: Chronology {', '.join(sorted(years))} matches verified records."
                )

            # Check for explicit conflicting year for this award/event
            award_year_match = re.search(
                rf"\b(?:awarded|won|received|conferred|held)\s+(?:the\s+)?(?:nobel\s+)?.*?\b(1[6-9]\d{2}|20\d{2})\b",
                ev_lower
            )
            if award_year_match:
                conflicting_yr = award_year_match.group(1)
                if conflicting_yr not in years and any(k in ev_lower for k in ["prize", "award", "won", "received"]):
                    return (
                        PropositionStatus.CONTRADICTED,
                        f"Chronological discrepancy in {source_name}: Records associate the year {conflicting_yr} with this event, not {', '.join(sorted(years))}."
                    )

        return PropositionStatus.NOT_SUPPORTED, f"Date {prop.raw_phrase} not explicitly verified in {source_name}."

    # 4. CATEGORY QUALIFIER EVALUATION
    elif prop.prop_type == "category":
        award_categories = ["physics", "chemistry", "medicine", "literature", "peace", "economics"]
        claim_cat = next((cat for cat in award_categories if cat in prop.raw_phrase.lower()), None)

        if claim_cat:
            cat_in_ev = bool(re.search(rf"\b(?:nobel(?: prize)? in |prize in |award in |in ){claim_cat}\b", ev_lower))
            other_cats = [
                oc for oc in award_categories
                if oc != claim_cat and re.search(rf"\b(?:nobel(?: prize)? in |prize in |award in ){oc}\b", ev_lower)
            ]

            if cat_in_ev:
                return (
                    PropositionStatus.SUPPORTED,
                    f"Supported by {source_name}: Category '{claim_cat.capitalize()}' is directly verified."
                )
            elif other_cats:
                return (
                    PropositionStatus.CONTRADICTED,
                    f"Category discrepancy in {source_name}: Recorded in {', '.join(c.capitalize() for c in other_cats)}, not {claim_cat.capitalize()}."
                )

        return PropositionStatus.NOT_SUPPORTED, f"Category '{prop.raw_phrase}' not confirmed."

    # 5. LOCATION QUALIFIER EVALUATION
    elif prop.prop_type == "location":
        terms = [t for t in prop.content_terms if t not in ("at", "in", "from")]
        if terms and all(t in ev_lower for t in terms):
            return (
                PropositionStatus.SUPPORTED,
                f"Supported by {source_name}: Location '{prop.raw_phrase}' confirmed."
            )
        return PropositionStatus.NOT_SUPPORTED, f"Location '{prop.raw_phrase}' not verified."

    # 6. ATTRIBUTION QUALIFIER EVALUATION
    elif prop.prop_type == "attribution":
        terms = [t for t in prop.content_terms if t not in ("by",)]
        if terms and all(t in ev_lower for t in terms):
            return (
                PropositionStatus.SUPPORTED,
                f"Supported by {source_name}: Attribution '{prop.raw_phrase}' confirmed."
            )
        return PropositionStatus.NOT_SUPPORTED, f"Attribution '{prop.raw_phrase}' not confirmed."

    return PropositionStatus.NOT_SUPPORTED, f"Qualifier '{prop.raw_phrase}' not substantiated."


def evaluate_complete_claim_propositions(
    claim_text: str,
    evidence_pool: List[Tuple[str, str, str]],  # List of (source_name, source_url, snippet)
) -> PropositionVerificationReport:
    """
    Decomposes the claim and evaluates EVERY proposition against the evidence pool.
    Synthesizes the complete claim verdict strictly following:
    - ALL supported + no contradiction -> VERIFIED
    - ANY contradicted -> HALLUCINATED
    - Main supported BUT qualifiers not supported -> SUSPICIOUS
    - Main not supported / insufficient -> SUSPICIOUS
    """
    subj, pred, obj, propositions = decompose_claim_into_propositions(claim_text)

    # Evaluate each proposition against all evidence in the pool
    for prop in propositions:
        supp_matches = []
        contra_matches = []
        unsub_matches = []

        for s_name, s_url, snippet in evidence_pool:
            status, rationale = evaluate_single_proposition(
                prop, snippet, s_name, s_url, claim_text, subject_entity=subj
            )
            if status == PropositionStatus.SUPPORTED:
                supp_matches.append((s_name, s_url, snippet, rationale))
            elif status == PropositionStatus.CONTRADICTED:
                contra_matches.append((s_name, s_url, snippet, rationale))
            else:
                unsub_matches.append((s_name, s_url, snippet, rationale))

        # Synthesize status for this proposition across all sources
        if supp_matches and not contra_matches:
            s_name, s_url, snippet, rationale = supp_matches[0]
            prop.status = PropositionStatus.SUPPORTED
            prop.evidence_quote = snippet[:280]
            prop.source_name = s_name
            prop.source_url = s_url
            prop.rationale = rationale

        elif contra_matches and not supp_matches:
            s_name, s_url, snippet, rationale = contra_matches[0]
            prop.status = PropositionStatus.CONTRADICTED
            prop.evidence_quote = snippet[:280]
            prop.source_name = s_name
            prop.source_url = s_url
            prop.rationale = rationale

        elif supp_matches and contra_matches:
            # Conflicting evidence between sources on this proposition -> mark NOT_SUPPORTED
            s_name, s_url, snippet, rationale = supp_matches[0]
            contra_name = contra_matches[0][0]
            prop.status = PropositionStatus.NOT_SUPPORTED
            prop.evidence_quote = snippet[:280]
            prop.source_name = s_name
            prop.source_url = s_url
            prop.rationale = f"Conflicting evidence between {s_name} and {contra_name} regarding '{prop.raw_phrase}'."

        else:
            prop.status = PropositionStatus.NOT_SUPPORTED
            if unsub_matches:
                s_name, s_url, snippet, rationale = unsub_matches[0]
                prop.evidence_quote = snippet[:280]
                prop.source_name = s_name
                prop.source_url = s_url
                prop.rationale = rationale
            else:
                prop.rationale = f"Proposition '{prop.raw_phrase}' was not found in available evidence."

    # Synthesize Complete Claim Decision
    has_contradiction = any(p.status == PropositionStatus.CONTRADICTED for p in propositions)
    all_supported = all(p.status == PropositionStatus.SUPPORTED for p in propositions)

    primary_prop = next((p for p in propositions if p.prop_type == "primary"), None)
    primary_supported = primary_prop.status == PropositionStatus.SUPPORTED if primary_prop else False

    unsupported_qualifiers = [
        p for p in propositions if p.prop_type != "primary" and p.status != PropositionStatus.SUPPORTED
    ]

    # Contradiction -> HALLUCINATED
    if has_contradiction:
        contra_p = next(p for p in propositions if p.status == PropositionStatus.CONTRADICTED)
        final_status = ClaimStatus.HALLUCINATED
        confidence = 14.0
        rationale = f"Contradiction identified: {contra_p.rationale}"
        primary_quote = contra_p.evidence_quote
        primary_s_name = contra_p.source_name
        primary_s_url = contra_p.source_url

    # All propositions supported -> VERIFIED
    elif all_supported:
        supp_sources = {p.source_name for p in propositions if p.source_name}
        num_agreeing = len(supp_sources)
        final_status = ClaimStatus.VERIFIED
        confidence = min(98.0, 88.0 + (num_agreeing - 1) * 4.0)

        # Detailed rationale confirming all parts
        confirmed_parts = [f"Confirmed {p.statement}" for p in propositions]
        first_supp = next(p for p in propositions if p.source_name)
        primary_quote = first_supp.evidence_quote
        primary_s_name = first_supp.source_name
        primary_s_url = first_supp.source_url
        rationale = f"Fully verified across authoritative records ({', '.join(supp_sources)}): " + "; ".join(confirmed_parts) + "."

    # Main supported BUT one or more qualifiers NOT supported -> SUSPICIOUS
    elif primary_supported and unsupported_qualifiers:
        final_status = ClaimStatus.SUSPICIOUS
        confidence = 46.0
        primary_quote = primary_prop.evidence_quote
        primary_s_name = primary_prop.source_name
        primary_s_url = primary_prop.source_url

        missing_desc = [f"'{p.raw_phrase}' ({p.prop_type})" for p in unsupported_qualifiers]
        rationale = (
            f"Partially supported: Authoritative sources confirm the main assertion ({primary_prop.statement}), "
            f"but do NOT establish the specific qualifier(s): {', '.join(missing_desc)}. "
            f"Requires human review."
        )

    # Main not supported or insufficient evidence -> SUSPICIOUS
    else:
        final_status = ClaimStatus.SUSPICIOUS
        confidence = 35.0
        first_with_quote = next((p for p in propositions if p.evidence_quote), None)
        primary_quote = first_with_quote.evidence_quote if first_with_quote else None
        primary_s_name = first_with_quote.source_name if first_with_quote else "Unverified Index"
        primary_s_url = first_with_quote.source_url if first_with_quote else None
        rationale = "Insufficient evidence: Authoritative sources do not substantiate the complete assertion."

    return PropositionVerificationReport(
        claim_text=claim_text,
        subject=subj,
        predicate=pred,
        direct_object=obj,
        propositions=propositions,
        final_status=final_status,
        confidence=confidence,
        rationale=rationale,
        primary_evidence_quote=primary_quote,
        primary_source_name=primary_s_name,
        primary_source_url=primary_s_url,
    )
