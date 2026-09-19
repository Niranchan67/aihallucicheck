"""
claim_analyzer.py
-----------------
Stage 1 of the Verification Pipeline:
Deep claim understanding, entity-relation-value extraction,
and taxonomy classification into an 11-category factual schema.

Decomposes complex, multi-part sentences into structured atomic propositions:
ENTITY -> RELATION -> VALUE / QUALIFIER

RULES:
- A sentence is NEVER treated as an indivisible semantic blob.
- Sub-clauses, prepositional phrases (reasons, dates, categories, locations, attributions)
  are isolated into discrete atomic propositions.
- Assigns internal factual taxonomy to determine adaptive evidence thresholds.
"""

from dataclasses import dataclass, field
from enum import Enum
import re
from typing import List, Optional, Set, Tuple
import spacy

# Load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")


class InternalClaimType(str, Enum):
    COMMON_FACT = "COMMON_FACT"                  # Basic general knowledge ("Paris is the capital of France")
    SPECIFIC_FACT = "SPECIFIC_FACT"              # Specific event or record ("SpaceX launched Falcon Heavy in 2018")
    HISTORICAL_FACT = "HISTORICAL_FACT"          # Past historical event ("World War II ended in 1945")
    SCIENTIFIC_FACT = "SCIENTIFIC_FACT"          # Scientific/medical/physics laws or properties ("DNA has a double helix")
    BIOGRAPHICAL_FACT = "BIOGRAPHICAL_FACT"      # Birth, death, awards, education of individuals
    CURRENT_FACT = "CURRENT_FACT"                # Recent or active news/events
    QUANTITATIVE_FACT = "QUANTITATIVE_FACT"      # Numerical, statistical, measurements ("Speed of light is 300,000 km/s")
    TEMPORAL_FACT = "TEMPORAL_FACT"              # Chronology, durations, specific dates
    CAUSAL_CLAIM = "CAUSAL_CLAIM"                # Assertions of cause, reason, mechanism ("Won prize for X", "Smoking causes cancer")
    OPINION_OR_SUBJECTIVE = "OPINION_OR_SUBJECTIVE"  # Subjective judgements ("Inception is the best movie")
    NON_FACTUAL_TEXT = "NON_FACTUAL_TEXT"        # Greetings, instructions, filler


@dataclass
class AtomicProposition:
    prop_type: str  # "primary", "reason", "date", "category", "location", "attribution", "quantity"
    statement: str
    raw_phrase: str
    subject: str = ""
    relation: str = ""
    value: str = ""
    content_terms: Set[str] = field(default_factory=set)
    is_material: bool = True  # If false, absence does not demote to SUSPICIOUS


@dataclass
class AnalyzedClaim:
    claim_id: str
    original_text: str
    clean_text: str
    internal_type: InternalClaimType
    subject_entity: str
    predicate_action: str
    object_value: str
    entities: List[str]
    atomic_propositions: List[AtomicProposition]
    requires_external_search: bool
    adaptive_verification_threshold: float  # e.g. 0.85 for scientific/historical, 0.65 for common fact
    is_opinion: bool = False
    start_index: int = 0
    end_index: int = 0


# Common facts patterns and indicators
_COMMON_FACT_TRIGGERS = [
    r"\b(?:capital of|capital city|capital|currency of|currency|largest ocean|planet in the solar system)\b",
    r"\b(?:orbits the sun|freezes at|boils at|water is made of|speed of light|formula for water|chemical symbol for)\b",
]

_SCIENTIFIC_KEYWORDS = {
    "molecule", "atom", "quantum", "dna", "rna", "protein", "cell", "velocity",
    "acceleration", "gravity", "species", "photosynthesis", "electron", "proton",
    "neutron", "element", "chemical", "physics", "biology", "thermodynamics",
}

_OPINION_MARKERS = [
    r"\b(?:in my opinion|i think|i believe|arguably|best|worst|greatest|favorite|masterpiece)\b",
    r"\b(?:terrible|wonderful|overrated|underrated|beautiful|ugly|boring|exciting)\b",
]

_CAUSAL_MARKERS = [
    r"\b(?:because of|due to|as a result of|caused by|leads to|results in|owing to)\b",
    r"\b(?:in recognition of|for his|for her|for their|for its|for discovering|for inventing)\b",
]


def classify_internal_claim_type(text: str, doc) -> Tuple[InternalClaimType, float, bool]:
    """
    Classifies the claim into the 11-category taxonomy and determines
    the adaptive evidence threshold required for verification.
    Returns: (InternalClaimType, adaptive_threshold, requires_external_search)
    """
    lower = text.lower().strip()

    # 1. Subjective / Opinion Check
    if any(re.search(pat, lower) for pat in _OPINION_MARKERS):
        if not re.search(r"\b(won|awarded|died|born|signed|discovered|invented|measured)\b", lower):
            return InternalClaimType.OPINION_OR_SUBJECTIVE, 0.0, False

    # 2. Non-factual check (greetings, questions, meta text)
    if lower.endswith("?") or lower.startswith(("hello", "hi", "how do i", "can you", "please tell")):
        return InternalClaimType.NON_FACTUAL_TEXT, 0.0, False

    # 3. Causal Claims (Reasons, Attributions, Mechanisms)
    if any(re.search(pat, lower) for pat in _CAUSAL_MARKERS):
        return InternalClaimType.CAUSAL_CLAIM, 0.88, True

    # 4. Quantitative & Statistical Facts
    if re.search(r"\b\d+(?:\.\d+)?(?:\s*%)|\b\d+\s*(?:km|miles|kg|meters|seconds|degrees|percent|billion|million)\b", lower):
        return InternalClaimType.QUANTITATIVE_FACT, 0.85, True

    # 5. Temporal / Chronological Facts
    years = re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", text)
    if years and re.search(r"\b(in|during|between|since|until|before|after|by)\s+(?:1[6-9]\d{2}|20\d{2})\b", lower):
        if any(w in lower for w in ["born", "died", "won", "discovered", "invented", "founded"]):
            return InternalClaimType.BIOGRAPHICAL_FACT, 0.85, True
        return InternalClaimType.HISTORICAL_FACT, 0.85, True

    # 6. Common / Simple Knowledge Facts
    if any(re.search(pat, lower) for pat in _COMMON_FACT_TRIGGERS):
        return InternalClaimType.COMMON_FACT, 0.70, True

    # Equivalence copula for simple common facts: "X is the capital of Y", "Paris is France's capital"
    if re.search(r"^[A-Z][a-z]+ is (?:the )?(?:capital|largest city|currency) of [A-Z][a-z]+", text):
        return InternalClaimType.COMMON_FACT, 0.70, True

    # 7. Scientific Facts
    tokens = {t.text.lower() for t in doc}
    if tokens & _SCIENTIFIC_KEYWORDS:
        return InternalClaimType.SCIENTIFIC_FACT, 0.88, True

    # 8. Biographical Facts
    person_ents = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
    if person_ents and any(w in lower for w in ["won", "awarded", "invented", "developed", "born", "died", "wrote", "directed"]):
        return InternalClaimType.BIOGRAPHICAL_FACT, 0.85, True

    # 9. Historical Facts
    if years or any(w in lower for w in ["century", "ancient", "war", "battle", "treaty", "empire", "revolution"]):
        return InternalClaimType.HISTORICAL_FACT, 0.85, True

    # Default to Specific Fact
    return InternalClaimType.SPECIFIC_FACT, 0.80, True


def decompose_claim_into_atomic_propositions(claim_text: str) -> Tuple[str, str, str, List[str], List[AtomicProposition]]:
    """
    Decomposes a sentence into its primary assertion and discrete qualifiers:
    - Primary Proposition: Subject -> Predicate -> Direct Object
    - Reason Proposition: 'for [achievement]' / 'because of [cause]'
    - Date Proposition: 'in [year]' / 'during [time]'
    - Category Proposition: 'in [category]' / 'for [field]'
    - Location Proposition: 'at [location]' / 'in [place]'
    - Attribution Proposition: 'by [author/entity]'
    """
    doc = nlp(claim_text)

    # Extract all recognized Named Entities
    entities = [ent.text for ent in doc.ents]

    # Find root predicate verb
    root = next((token for token in doc if token.head == token), None)
    if not root:
        terms = {t.lemma_.lower() for t in doc if not t.is_stop and len(t.text) > 1}
        prop = AtomicProposition(
            prop_type="primary",
            statement=claim_text.strip(),
            raw_phrase=claim_text.strip(),
            subject="",
            relation="",
            value=claim_text.strip(),
            content_terms=terms,
            is_material=True,
        )
        return "", "", "", entities, [prop]

    # Find Subject
    subjs = [t for t in root.lefts if t.dep_ in ("nsubj", "nsubjpass", "csubj")]
    subj_str = " ".join([t.text for t in subjs[0].subtree]) if subjs else ""
    if not subj_str and entities:
        subj_str = entities[0]

    # Find Object
    dobjs = [t for t in root.rights if t.dep_ in ("dobj", "attr", "acomp", "pobj")]
    obj_str = " ".join([t.text for t in dobjs[0].subtree]) if dobjs else ""

    # Predicate
    pred_str = root.lemma_.lower()

    qualifiers: List[AtomicProposition] = []

    # Parse prepositional attachments
    for prep in [t for t in root.rights if t.dep_ == "prep"]:
        prep_phrase = " ".join([t.text for t in prep.subtree])
        prep_lower = prep.text.lower()

        # 1. Reason / Cause qualifier
        if prep_lower in ("for", "because", "due"):
            reason_clean = re.sub(r"^(?:for|because of|due to|in recognition of)\s+", "", prep_phrase, flags=re.I).strip()
            terms = {t.lemma_.lower() for t in prep.subtree if not t.is_stop and len(t.text) > 1}
            qualifiers.append(
                AtomicProposition(
                    prop_type="reason",
                    statement=f"The stated reason or achievement was: '{prep_phrase}'",
                    raw_phrase=prep_phrase,
                    subject=subj_str,
                    relation="conferred_for_reason",
                    value=reason_clean,
                    content_terms=terms,
                    is_material=True,
                )
            )

        # 2. Date / Chronology qualifier
        elif prep_lower in ("in", "during", "on", "at") and re.search(r"\b(1[6-9]\d{2}|20\d{2})\b", prep_phrase):
            year_match = re.search(r"\b(1[6-9]\d{2}|20\d{2})\b", prep_phrase)
            year_val = year_match.group(1) if year_match else prep_phrase
            qualifiers.append(
                AtomicProposition(
                    prop_type="date",
                    statement=f"The event occurred in: '{prep_phrase}'",
                    raw_phrase=prep_phrase,
                    subject=subj_str,
                    relation="occurred_at_time",
                    value=year_val,
                    content_terms={year_val},
                    is_material=True,
                )
            )

        # 3. Category / Field qualifier
        elif prep_lower == "in" and any(cat in prep_phrase.lower() for cat in [
            "physics", "chemistry", "medicine", "literature", "peace", "economics",
            "computer science", "mathematics", "biology", "astronomy"
        ]):
            cat_terms = {t.lemma_.lower() for t in prep.subtree if not t.is_stop and len(t.text) > 1}
            qualifiers.append(
                AtomicProposition(
                    prop_type="category",
                    statement=f"Conferred specifically in the field of: '{prep_phrase}'",
                    raw_phrase=prep_phrase,
                    subject=subj_str,
                    relation="field_of_activity",
                    value=prep_phrase,
                    content_terms=cat_terms,
                    is_material=True,
                )
            )

        # 4. Location qualifier
        elif prep_lower in ("in", "at") and any(ent in prep_phrase for ent in entities if ent != subj_str):
            loc_terms = {t.lemma_.lower() for t in prep.subtree if not t.is_stop and len(t.text) > 1}
            qualifiers.append(
                AtomicProposition(
                    prop_type="location",
                    statement=f"Occurred at location: '{prep_phrase}'",
                    raw_phrase=prep_phrase,
                    subject=subj_str,
                    relation="located_in",
                    value=prep_phrase,
                    content_terms=loc_terms,
                    is_material=True,
                )
            )

        # 5. Attribution / Agency qualifier
        elif prep_lower in ("by", "with") and any(ent in prep_phrase for ent in entities):
            by_terms = {t.lemma_.lower() for t in prep.subtree if not t.is_stop and len(t.text) > 1}
            qualifiers.append(
                AtomicProposition(
                    prop_type="attribution",
                    statement=f"Attributed to: '{prep_phrase}'",
                    raw_phrase=prep_phrase,
                    subject=subj_str,
                    relation="attributed_to",
                    value=prep_phrase,
                    content_terms=by_terms,
                    is_material=True,
                )
            )

    # Standalone Year check
    standalone_years = re.findall(r"\b(1[6-9]\d{2}|20\d{2})\b", claim_text)
    covered_years = {
        q.value for q in qualifiers if q.prop_type == "date"
    }
    for yr in standalone_years:
        if yr not in covered_years:
            qualifiers.append(
                AtomicProposition(
                    prop_type="date",
                    statement=f"The event is situated in year {yr}",
                    raw_phrase=f"in {yr}",
                    subject=subj_str,
                    relation="occurred_at_time",
                    value=yr,
                    content_terms={yr},
                    is_material=True,
                )
            )
            covered_years.add(yr)

    # Primary Proposition: Subject -> Action -> Object
    primary_terms = set()
    if subjs:
        primary_terms.update(t.lemma_.lower() for t in subjs[0].subtree if not t.is_stop and len(t.text) > 1)
    if dobjs:
        primary_terms.update(t.lemma_.lower() for t in dobjs[0].subtree if not t.is_stop and len(t.text) > 1)
    primary_terms.add(root.lemma_.lower())

    primary_statement = f"{subj_str} {root.text} {obj_str}".strip() if (subj_str or obj_str) else claim_text.strip()
    primary_prop = AtomicProposition(
        prop_type="primary",
        statement=primary_statement,
        raw_phrase=primary_statement,
        subject=subj_str,
        relation=pred_str,
        value=obj_str,
        content_terms=primary_terms,
        is_material=True,
    )

    all_props = [primary_prop] + qualifiers
    return subj_str, pred_str, obj_str, entities, all_props


def analyze_claim(
    claim_id: str,
    claim_text: str,
    start_index: int = 0,
    end_index: int = 0,
) -> AnalyzedClaim:
    """
    Main entry point for Stage 1 Claim Understanding.
    Parses, types, and decomposes any user claim into structured propositions.
    """
    clean_text = claim_text.strip()
    doc = nlp(clean_text)

    internal_type, adaptive_threshold, requires_search = classify_internal_claim_type(clean_text, doc)
    subj, pred, obj, entities, propositions = decompose_claim_into_atomic_propositions(clean_text)

    is_opinion = (internal_type == InternalClaimType.OPINION_OR_SUBJECTIVE)

    return AnalyzedClaim(
        claim_id=claim_id,
        original_text=claim_text,
        clean_text=clean_text,
        internal_type=internal_type,
        subject_entity=subj,
        predicate_action=pred,
        object_value=obj,
        entities=entities,
        atomic_propositions=propositions,
        requires_external_search=requires_search,
        adaptive_verification_threshold=adaptive_threshold,
        is_opinion=is_opinion,
        start_index=start_index,
        end_index=end_index,
    )
