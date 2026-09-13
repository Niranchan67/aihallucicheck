"""
multi_source_retriever.py
-------------------------
Retrieves ground-truth evidence across multiple independent sources:
1. OpenAlex API (250M+ scholarly works from Nature, IEEE, Springer, Science, etc.)
2. Europe PMC / PubMed (medical, biomedical, life science repository)
3. ArXiv API (Cornell University scientific & computer science archive)
4. DuckDuckGo Web & News Search (live web corroboration)
5. Wikipedia REST API (encyclopedic ground truth)
"""

import asyncio
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import List, Optional
import httpx


@dataclass
class RetrievedEvidence:
    source_name: str
    source_url: str
    title: str
    snippet: str


# --------------------------------------------------------------------------
# 1. OpenAlex Scholarly Knowledge Base (Nature, Science, IEEE, Springer, ACM)
# --------------------------------------------------------------------------
async def fetch_openalex_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
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
                    location = item.get("primary_location") or {}
                    landing_url = location.get("landing_page_url") or doi or "https://openalex.org"
                    source_obj = location.get("source") or {}
                    source_name = source_obj.get("display_name") or "Scholarly Literature (OpenAlex)"

                    # Reconstruct abstract inverted index if available
                    abstract_inverted = item.get("abstract_inverted_index")
                    abstract_text = ""
                    if abstract_inverted and isinstance(abstract_inverted, dict):
                        word_positions = []
                        for word, positions in abstract_inverted.items():
                            for pos in positions:
                                word_positions.append((pos, word))
                        word_positions.sort(key=lambda x: x[0])
                        abstract_text = " ".join([w[1] for w in word_positions[:50]])

                    snippet = abstract_text or f"Publication: {title} indexed in {source_name}."
                    if title and landing_url:
                        results.append(
                            RetrievedEvidence(
                                source_name=source_name,
                                source_url=landing_url,
                                title=title,
                                snippet=snippet[:350],
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] OpenAlex notice: {e}")

    return results


# --------------------------------------------------------------------------
# 2. Europe PMC / PubMed Central (NIH, Biomedical, Health, Clinical)
# --------------------------------------------------------------------------
async def fetch_pubmed_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            url = "https://api.europepmc.org/search"
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
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] Europe PMC notice: {e}")

    return results


# --------------------------------------------------------------------------
# 3. ArXiv Open Science Repository (Computer Science, Physics, AI, Math)
# --------------------------------------------------------------------------
async def fetch_arxiv_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
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
                # Atom namespace
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall("atom:entry", ns):
                    title_elem = entry.find("atom:title", ns)
                    summary_elem = entry.find("atom:summary", ns)
                    id_elem = entry.find("atom:id", ns)

                    title = title_elem.text.strip().replace("\n", " ") if title_elem is not None else ""
                    summary = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None else ""
                    link = id_elem.text.strip() if id_elem is not None else "https://arxiv.org"

                    if title and title != "Error":
                        results.append(
                            RetrievedEvidence(
                                source_name="ArXiv Scientific Repository",
                                source_url=link,
                                title=title,
                                snippet=summary[:350],
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] ArXiv notice: {e}")

    return results


# --------------------------------------------------------------------------
# 4. DuckDuckGo Web & News Search (Live Internet Records)
# --------------------------------------------------------------------------
async def fetch_duckduckgo_evidence(query: str, max_results: int = 3) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = query.strip()
    if not clean_query:
        return results

    def _sync_ddg_search():
        out = []
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(clean_query, max_results=max_results))
                for r in ddg_results:
                    title = r.get("title", "")
                    href = r.get("href", "")
                    body = r.get("body", "")
                    domain = "Web Source"
                    if href:
                        try:
                            host = href.split("//")[-1].split("/")[0].replace("www.", "")
                            domain = host.capitalize()
                        except Exception:
                            pass
                    out.append(
                        RetrievedEvidence(
                            source_name=domain,
                            source_url=href or "https://duckduckgo.com",
                            title=title or clean_query,
                            snippet=body[:350],
                        )
                    )
        except Exception as exc:
            pass
        return out

    loop = asyncio.get_event_loop()
    try:
        results = await loop.run_in_executor(None, _sync_ddg_search)
    except Exception as e:
        pass

    # Fallback to DuckDuckGo Instant Answers API
    if not results:
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": clean_query, "format": "json", "no_html": 1, "skip_disambig": 1},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    abstract = data.get("AbstractText", "")
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
                            )
                        )
        except Exception as e:
            pass

    return results


# --------------------------------------------------------------------------
# 5. Wikipedia REST & Search APIs (Encyclopedic Baseline)
# --------------------------------------------------------------------------
async def fetch_wikipedia_evidence(query: str, max_results: int = 2) -> List[RetrievedEvidence]:
    results: List[RetrievedEvidence] = []
    clean_query = re.sub(r'[^\w\s]', ' ', query).strip()
    if not clean_query:
        return results

    headers = {
        "User-Agent": "HalluciCheck/2.0 (academic hallucination verification; contact@hallucicheck.edu)"
    }

    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, headers=headers) as client:
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
                    snippet_text = re.sub(r"<[^>]+>", "", snippet_html)

                    summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{httpx.URL(title).raw_path.decode('utf-8', 'ignore')}"
                    try:
                        summary_resp = await client.get(summary_url)
                        if summary_resp.status_code == 200:
                            sdata = summary_resp.json()
                            extract = sdata.get("extract", snippet_text)
                            page_url = sdata.get("content_urls", {}).get("desktop", {}).get("page") or f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                            results.append(
                                RetrievedEvidence(
                                    source_name="Wikipedia",
                                    source_url=page_url,
                                    title=title,
                                    snippet=extract[:350],
                                )
                            )
                        else:
                            results.append(
                                RetrievedEvidence(
                                    source_name="Wikipedia",
                                    source_url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                                    title=title,
                                    snippet=snippet_text[:300],
                                )
                            )
                    except Exception:
                        results.append(
                            RetrievedEvidence(
                                source_name="Wikipedia",
                                source_url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                                title=title,
                                snippet=snippet_text[:300],
                            )
                        )
    except Exception as e:
        print(f"[multi_source_retriever] Wikipedia notice: {e}")

    return results


# --------------------------------------------------------------------------
# Parallel Aggregation across ALL Sources
# --------------------------------------------------------------------------
async def retrieve_multi_source_evidence(query: str) -> List[RetrievedEvidence]:
    """
    Concurrently query diverse authoritative repositories:
    OpenAlex, PubMed, ArXiv, DuckDuckGo Web, and Wikipedia.
    """
    tasks = [
        fetch_openalex_evidence(query, max_results=2),
        fetch_pubmed_evidence(query, max_results=2),
        fetch_arxiv_evidence(query, max_results=1),
        fetch_duckduckgo_evidence(query, max_results=3),
        fetch_wikipedia_evidence(query, max_results=2),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    evidence_pool: List[RetrievedEvidence] = []
    seen_urls = set()

    # Interleave sources to ensure rich diversity (not just Wikipedia)
    for res_list in results:
        if isinstance(res_list, list):
            for ev in res_list:
                if ev.source_url and ev.source_url not in seen_urls:
                    seen_urls.add(ev.source_url)
                    evidence_pool.append(ev)

    return evidence_pool
