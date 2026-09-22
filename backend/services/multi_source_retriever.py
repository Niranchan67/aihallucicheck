"""
multi_source_retriever.py
-------------------------
Stage 3: Multi-Source Evidence Retrieval & Fallback Engine.

Retrieves ground-truth evidence across independent authoritative repositories:
1. OpenAlex API (250M+ scholarly works from Nature, Science, IEEE, Springer, ACM)
2. CrossRef REST API (official scholarly DOI registry & metadata)
3. Europe PMC / PubMed Central (NIH, medical, life sciences, clinical)
4. DataCite Global Registry (50M+ datasets & scientific publications)
5. DOAJ (Directory of Open Access Journals - 10M+ peer-reviewed articles)
6. ArXiv API (Cornell University scientific & computer science archive)
7. Live Web Search (DuckDuckGo live internet search for .gov, .edu, reputable news, primary documents)
8. Wikidata Structured Knowledge API (structured factual triples & descriptions)
9. Wikipedia REST API (used strictly as secondary reference discovery, NEVER primary ground truth)

FEATURES:
- Active contradiction search integration.
- Syndication / mirror deduplication (grouping by root domain).
- Adaptive retrieval retry with broader queries if initial retrieval lacks sufficient evidence.
"""

import asyncio
import re
import urllib.parse
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import List, Optional, Set
import httpx


@dataclass
class RetrievedEvidence:
    source_name: str
    source_url: str
    title: str
    snippet: str
    is_contradiction_probe: bool = False
    source_domain: str = ""
    publication_year: Optional[str] = None
    is_secondary: bool = False


def _extract_domain(url: str) -> str:
    """Extract clean root domain for syndication and duplicate detection."""
    try:
        host = url.split("//")[-1].split("/")[0].replace("www.", "").lower()
        return host
    except Exception:
        return "unknown"


# --------------------------------------------------------------------------
# 1. OpenAlex Scholarly Knowledge Base (Nature, Science, IEEE, Springer, ACM)
# --------------------------------------------------------------------------
async def fetch_openalex_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s+#]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://api.openalex.org/works"
            params = {
                "search": clean_query,
                "per-page": max_results,
                "mailto": "research@hallucicheck.edu",
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json().get("results", [])
                for item in data:
                    title = item.get("display_name") or item.get("title", "")
                    doi = item.get("doi")
                    pub_year = str(item.get("publication_year", ""))
                    location = item.get("primary_location") or {}
                    landing_url = location.get("landing_page_url") or doi or "https://openalex.org"
                    source_obj = location.get("source") or {}
                    source_name = source_obj.get("display_name") or "Scholarly Literature (OpenAlex)"

                    # Reconstruct abstract inverted index
                    abstract_inverted = item.get("abstract_inverted_index")
                    abstract_text = ""
                    if abstract_inverted and isinstance(abstract_inverted, dict):
                        word_positions = []
                        for word, positions in abstract_inverted.items():
                            for pos in positions:
                                word_positions.append((pos, word))
                        word_positions.sort(key=lambda x: x[0])
                        abstract_text = " ".join([w[1] for w in word_positions[:60]])

                    snippet = abstract_text or f"Publication: {title} indexed in {source_name}."
                    if title and landing_url:
                        results.append(
                            RetrievedEvidence(
                                source_name=source_name,
                                source_url=landing_url,
                                title=title,
                                snippet=snippet[:380],
                                source_domain=_extract_domain(landing_url),
                                publication_year=pub_year,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] OpenAlex notice: {e}")

    return results


# --------------------------------------------------------------------------
# 2. CrossRef Scholarly Index (Official DOI Registry & Scientific Metadata)
# --------------------------------------------------------------------------
async def fetch_crossref_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s+#]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://api.crossref.org/works"
            params = {
                "query": clean_query,
                "rows": max_results,
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                items = resp.json().get("message", {}).get("items", [])
                for item in items:
                    title_list = item.get("title", [])
                    title = title_list[0] if title_list else ""
                    doi = item.get("DOI")
                    container_titles = item.get("container-title", [])
                    journal = container_titles[0] if container_titles else "Scholarly Index (CrossRef)"
                    landing_url = f"https://doi.org/{doi}" if doi else "https://crossref.org"

                    issued = item.get("issued", {}).get("date-parts", [[]])[0]
                    year_str = str(issued[0]) if issued else ""

                    abstract = item.get("abstract", "")
                    clean_abstract = re.sub(r"<[^>]+>", "", abstract).strip()
                    snippet = clean_abstract[:350] if clean_abstract else f"Indexed article: {title} published in {journal}."

                    if title:
                        results.append(
                            RetrievedEvidence(
                                source_name=journal,
                                source_url=landing_url,
                                title=title,
                                snippet=snippet,
                                source_domain=_extract_domain(landing_url),
                                publication_year=year_str,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] CrossRef notice: {e}")

    return results


# --------------------------------------------------------------------------
# 3. Europe PMC / PubMed Central (NIH, Biomedical, Health, Clinical)
# --------------------------------------------------------------------------
async def fetch_pubmed_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
            params = {
                "query": clean_query,
                "format": "json",
                "pageSize": max_results,
                "resultType": "lite",
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                entries = resp.json().get("resultList", {}).get("result", [])
                for entry in entries:
                    title = entry.get("title", "").rstrip(".")
                    pmid = entry.get("pmid")
                    doi = entry.get("doi")
                    journal = entry.get("journalTitle") or "PubMed / Europe PMC"
                    pub_year = str(entry.get("pubYear", ""))

                    if doi:
                        article_url = f"https://doi.org/{doi}"
                    elif pmid:
                        article_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    else:
                        article_url = f"https://europepmc.org/article/MED/{entry.get('id', '')}"

                    author = entry.get("authorString", "Researchers")
                    snippet = f"Study published in {journal} by {author}: {title}."

                    if title:
                        results.append(
                            RetrievedEvidence(
                                source_name=f"{journal} (PubMed)",
                                source_url=article_url,
                                title=title,
                                snippet=snippet[:350],
                                source_domain=_extract_domain(article_url),
                                publication_year=pub_year,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] Europe PMC notice: {e}")

    return results


# --------------------------------------------------------------------------
# 4. ArXiv Open Science Repository (Computer Science, Physics, AI, Math)
# --------------------------------------------------------------------------
async def fetch_arxiv_evidence(query: str, max_results: int = 1) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://export.arxiv.org/api/query"
            params = {
                "search_query": f"all:{clean_query}",
                "start": 0,
                "max_results": max_results,
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200 and resp.text:
                root = ET.fromstring(resp.text)
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall("atom:entry", ns):
                    title_elem = entry.find("atom:title", ns)
                    summary_elem = entry.find("atom:summary", ns)
                    id_elem = entry.find("atom:id", ns)
                    pub_elem = entry.find("atom:published", ns)

                    title = title_elem.text.strip().replace("\n", " ") if (title_elem is not None and title_elem.text) else ""
                    summary = summary_elem.text.strip().replace("\n", " ") if (summary_elem is not None and summary_elem.text) else ""
                    link = id_elem.text.strip() if (id_elem is not None and id_elem.text) else "https://arxiv.org"
                    year = pub_elem.text[:4] if (pub_elem is not None and pub_elem.text) else None

                    if title and title != "Error":
                        results.append(
                            RetrievedEvidence(
                                source_name="ArXiv Scientific Repository",
                                source_url=link,
                                title=title,
                                snippet=summary[:350],
                                source_domain=_extract_domain(link),
                                publication_year=year,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] ArXiv notice: {e}")

    return results


# --------------------------------------------------------------------------
# 4b. DataCite Global Research Repository (50M+ Datasets & Scholarly Outputs)
# --------------------------------------------------------------------------
async def fetch_datacite_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://api.datacite.org/dois"
            params = {"query": clean_query, "page[size]": max_results}
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for item in data:
                    attrs = item.get("attributes", {})
                    titles = attrs.get("titles", [])
                    title = titles[0].get("title", "") if titles else ""
                    doi = attrs.get("doi")
                    publisher = attrs.get("publisher") or "DataCite Consortium"
                    pub_year = str(attrs.get("publicationYear", ""))
                    landing_url = f"https://doi.org/{doi}" if doi else "https://datacite.org"
                    descriptions = attrs.get("descriptions", [])
                    desc = descriptions[0].get("description", "") if descriptions else ""
                    clean_desc = re.sub(r'<[^>]+>', '', desc).strip()
                    snippet = clean_desc[:350] if clean_desc else f"Research data record: {title} published by {publisher}."

                    if title:
                        results.append(
                            RetrievedEvidence(
                                source_name=f"{publisher} (DataCite)",
                                source_url=landing_url,
                                title=title,
                                snippet=snippet,
                                source_domain=_extract_domain(landing_url),
                                publication_year=pub_year,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] DataCite notice: {e}")

    return results


# --------------------------------------------------------------------------
# 4c. DOAJ (Directory of Open Access Journals - 10M+ Peer-Reviewed Articles)
# --------------------------------------------------------------------------
async def fetch_doaj_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = f"https://doaj.org/api/search/articles/{urllib.parse.quote(clean_query)}"
            params = {"pageSize": max_results}
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                items = resp.json().get("results", [])
                for item in items:
                    bib = item.get("bibjson", {})
                    title = bib.get("title", "")
                    journal_info = bib.get("journal", {})
                    journal = journal_info.get("title") or "Peer-Reviewed Open Access Journal"
                    year = str(bib.get("year", ""))
                    abstract = bib.get("abstract", "")
                    doi_id = None
                    for ident in bib.get("identifier", []):
                        if ident.get("type", "").lower() == "doi":
                            doi_id = ident.get("id")
                            break

                    landing_url = f"https://doi.org/{doi_id}" if doi_id else f"https://doaj.org/article/{item.get('id', '')}"
                    snippet = abstract[:350] if abstract else f"Peer-reviewed article: {title} in {journal}."

                    if title:
                        results.append(
                            RetrievedEvidence(
                                source_name=f"{journal} (DOAJ)",
                                source_url=landing_url,
                                title=title,
                                snippet=snippet,
                                source_domain=_extract_domain(landing_url),
                                publication_year=year,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] DOAJ notice: {e}")

    return results


# --------------------------------------------------------------------------
# 5. Live Web Search (DuckDuckGo Live HTML & Instant Answers for .gov, .edu, News)
# --------------------------------------------------------------------------
async def fetch_live_web_evidence(query: str, max_results: int = 4) -> List[RetrievedEvidence]:
    """
    Direct asynchronous live web search across official websites, universities,
    reputable news agencies, and government portals.
    """
    results: List[RetrievedEvidence] = []
    clean_query = query.strip()
    if not clean_query:
        return results

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, headers=headers) as client:
            resp = await client.post("https://html.duckduckgo.com/html/", data={"q": clean_query})
            if resp.status_code in (200, 202):
                matches = re.findall(r'<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', resp.text)
                for href, raw_snippet in matches[:max_results]:
                    snip = re.sub(r'<[^>]+>', '', raw_snippet).strip()
                    actual_url = href.strip()
                    if "uddg=" in actual_url:
                        m = re.search(r'uddg=([^&]+)', actual_url)
                        if m:
                            actual_url = urllib.parse.unquote(m.group(1))

                    domain = _extract_domain(actual_url)
                    source_name = domain.capitalize() if domain else "Web Source"

                    if actual_url and snip:
                        results.append(
                            RetrievedEvidence(
                                source_name=source_name,
                                source_url=actual_url,
                                title=clean_query,
                                snippet=snip[:350],
                                source_domain=domain,
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] Live web search notice: {e}")

    # Fallback to DuckDuckGo Instant Answer API if HTML search failed
    if not results:
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": clean_query, "format": "json", "no_html": 1, "skip_disambig": 1},
                )
                if resp.status_code in (200, 202):
                    data = resp.json()
                    abstract = data.get("Abstract") or data.get("AbstractText", "")
                    heading = data.get("Heading", clean_query)
                    abstract_url = data.get("AbstractURL", "")
                    source = data.get("AbstractSource") or "DuckDuckGo Web Index"
                    if abstract and abstract_url:
                        results.append(
                            RetrievedEvidence(
                                source_name=source,
                                source_url=abstract_url,
                                title=heading,
                                snippet=abstract[:350],
                                source_domain=_extract_domain(abstract_url),
                                is_secondary=False,
                            )
                        )
        except Exception:
            pass

    return results


# --------------------------------------------------------------------------
# 6. Wikidata Structured Knowledge API (Primary Triples & Factual Definitions)
# --------------------------------------------------------------------------
async def fetch_wikidata_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    """
    Retrieves structured entity-relation definitions directly from Wikidata.
    Ideal for capitals, inventors, discovery years, scientific constants, and common facts.
    """
    results: List[RetrievedEvidence] = []
    clean_query = query.strip()
    if not clean_query:
        return results

    headers = {"User-Agent": "HalluciCheck/2.0 (structured fact verification; contact@hallucicheck.edu)"}

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers=headers) as client:
            url = "https://www.wikidata.org/w/api.php"
            params = {
                "action": "wbsearchentities",
                "search": clean_query,
                "language": "en",
                "format": "json",
                "limit": max_results,
            }
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                entities = resp.json().get("search", [])
                for ent in entities:
                    label = ent.get("label", "")
                    description = ent.get("description", "")
                    ent_id = ent.get("id", "")
                    concept_url = ent.get("concepturi") or f"https://www.wikidata.org/wiki/{ent_id}"

                    if label and description:
                        snippet = f"Wikidata Knowledge Graph record for {label}: {description}."
                        results.append(
                            RetrievedEvidence(
                                source_name="Wikidata Knowledge Base",
                                source_url=concept_url,
                                title=label,
                                snippet=snippet,
                                source_domain="wikidata.org",
                                is_secondary=False,
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] Wikidata notice: {e}")

    return results


# --------------------------------------------------------------------------
# 7. Wikipedia REST API (Strictly Secondary Discovery / Reference Only)
# --------------------------------------------------------------------------
async def fetch_wikipedia_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    """
    Wikipedia is queried purely as a secondary reference source, NEVER as the primary universal ground truth.
    """
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s+#]', ' ', query).strip()
    if not clean_query:
        return results

    headers = {"User-Agent": "HalluciCheck/2.0 (verification tool; contact@hallucicheck.edu)"}

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True, headers=headers) as client:
            search_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "list": "search",
                "srsearch": clean_query,
                "utf8": 1,
                "format": "json",
                "srlimit": max_results,
            }
            resp = await client.get(search_url, params=params)
            if resp.status_code == 200:
                search_data = resp.json().get("query", {}).get("search", [])
                for item in search_data:
                    title = item.get("title")
                    snippet_html = item.get("snippet", "")
                    snippet_text = re.sub(r"<[^>]+>", "", snippet_html).strip()

                    encoded_title = urllib.parse.quote(str(title).replace(' ', '_'), safe='')
                    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded_title}"
                    try:
                        summary_resp = await client.get(summary_url)
                        if summary_resp.status_code == 200:
                            sdata = summary_resp.json()
                            extract = sdata.get("extract", snippet_text)
                            page_url = sdata.get("content_urls", {}).get("desktop", {}).get("page") or f"https://en.wikipedia.org/wiki/{encoded_title}"
                            results.append(
                                RetrievedEvidence(
                                    source_name="Wikipedia",
                                    source_url=page_url,
                                    title=title,
                                    snippet=extract[:350],
                                    source_domain="wikipedia.org",
                                    is_secondary=True,  # Explicitly secondary
                                )
                            )
                        else:
                            page_url = f"https://en.wikipedia.org/wiki/{encoded_title}"
                            results.append(
                                RetrievedEvidence(
                                    source_name="Wikipedia",
                                    source_url=page_url,
                                    title=title,
                                    snippet=snippet_text[:300],
                                    source_domain="wikipedia.org",
                                    is_secondary=True,
                                )
                            )
                    except Exception:
                        pass
    except Exception as e:
        print(f"[multi_source_retriever] Wikipedia secondary notice: {e}")

    return results


# --------------------------------------------------------------------------
# Multi-Source Aggregator & Adaptive Retrieval Engine
# --------------------------------------------------------------------------
async def retrieve_multi_source_evidence(
    query: str,
    subclaim_queries: Optional[List[str]] = None,
    contradiction_queries: Optional[List[str]] = None,
    broad_fallback_query: Optional[str] = None,
) -> List[RetrievedEvidence]:
    """
    Executes concurrent multi-source retrieval across all primary authoritative
    repositories. Interleaves results, deduplicates syndicated mirrors,
    and runs contradiction searches to actively discover refutations.
    """
    all_tasks = [
        fetch_live_web_evidence(query, max_results=3),
        fetch_wikidata_evidence(query, max_results=2),
        fetch_openalex_evidence(query, max_results=2),
        fetch_crossref_evidence(query, max_results=2),
        fetch_pubmed_evidence(query, max_results=2),
        fetch_datacite_evidence(query, max_results=2),
        fetch_doaj_evidence(query, max_results=2),
        fetch_arxiv_evidence(query, max_results=1),
        fetch_wikipedia_evidence(query, max_results=2),  # Secondary
    ]

    # Subclaim queries
    if subclaim_queries:
        for sub_q in subclaim_queries[:2]:
            all_tasks.append(fetch_live_web_evidence(sub_q, max_results=2))
            all_tasks.append(fetch_openalex_evidence(sub_q, max_results=1))

    # Contradiction search queries (tagged as contradiction probe)
    contra_tasks = []
    if contradiction_queries:
        for c_q in contradiction_queries[:3]:
            contra_tasks.append(fetch_live_web_evidence(c_q, max_results=2))
            contra_tasks.append(fetch_wikidata_evidence(c_q, max_results=1))
            contra_tasks.append(fetch_wikipedia_evidence(c_q, max_results=1))

    # Run primary tasks concurrently
    raw_results = await asyncio.gather(*all_tasks, return_exceptions=True)

    evidence_pool: List[RetrievedEvidence] = []
    seen_urls: Set[str] = set()
    domain_counts: dict = {}

    for res in raw_results:
        if isinstance(res, list):
            for ev in res:
                if not ev.source_url or ev.source_url in seen_urls:
                    continue

                # Syndication / duplicate suppression: maximum 2 items from the exact same root domain
                dom = ev.source_domain or _extract_domain(ev.source_url)
                if domain_counts.get(dom, 0) >= 2:
                    continue

                seen_urls.add(ev.source_url)
                domain_counts[dom] = domain_counts.get(dom, 0) + 1
                evidence_pool.append(ev)

    # Run contradiction queries if available
    if contra_tasks:
        contra_results = await asyncio.gather(*contra_tasks, return_exceptions=True)
        for res in contra_results:
            if isinstance(res, list):
                for ev in res:
                    if not ev.source_url or ev.source_url in seen_urls:
                        continue
                    dom = ev.source_domain or _extract_domain(ev.source_url)
                    if domain_counts.get(dom, 0) >= 4:
                        continue

                    ev.is_contradiction_probe = True
                    seen_urls.add(ev.source_url)
                    domain_counts[dom] = domain_counts.get(dom, 0) + 1
                    evidence_pool.append(ev)

    # Adaptive Retrieval Retry: If pool is empty or too sparse, retry with broad fallback
    if len(evidence_pool) < 2 and broad_fallback_query and broad_fallback_query != query:
        fallback_tasks = [
            fetch_live_web_evidence(broad_fallback_query, max_results=3),
            fetch_wikidata_evidence(broad_fallback_query, max_results=2),
            fetch_openalex_evidence(broad_fallback_query, max_results=2),
        ]
        fallback_results = await asyncio.gather(*fallback_tasks, return_exceptions=True)
        for res in fallback_results:
            if isinstance(res, list):
                for ev in res:
                    if ev.source_url and ev.source_url not in seen_urls:
                        seen_urls.add(ev.source_url)
                        evidence_pool.append(ev)

    return evidence_pool
