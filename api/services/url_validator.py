"""
url_validator.py
----------------
Strict asynchronous URL format and reachability validation engine.
Ensures every evidence source displayed to the user is a genuine, reachable,
canonical URL retrieved from external registries.
"""

import asyncio
import re
from typing import Dict, Optional, Set, Tuple
from urllib.parse import urlparse
import httpx

_URL_PATTERN = re.compile(
    r"^(?:http)s?://"  # http:// or https://
    r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|"  # domain...
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ...or ip
    r"(?::\d+)?"  # optional port
    r"(?:/?|[/?]\S+)$",
    re.IGNORECASE,
)

_BLOCKED_HOSTS = {
    "localhost", "127.0.0.1", "0.0.0.0", "example.com", "placeholder.com", "test.com"
}

_URL_CACHE: Dict[str, Tuple[bool, Optional[str], Optional[str]]] = {}
_CACHE_LOCK = asyncio.Lock()


def is_valid_url_format(url: str) -> bool:
    """Validate URL syntax, scheme, and non-local hostname."""
    if not url or not isinstance(url, str):
        return False
    clean = url.strip()
    if len(clean) < 10 or len(clean) > 2048:
        return False
    if not _URL_PATTERN.match(clean):
        return False
    try:
        parsed = urlparse(clean)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").lower()
        if not hostname or hostname in _BLOCKED_HOSTS or hostname.endswith(".local"):
            return False
        return True
    except Exception:
        return False


async def validate_and_resolve_url(
    url: str,
    expected_title: Optional[str] = None,
    timeout: float = 3.5,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate that a URL is well-formed, reachable, and follow redirects to obtain canonical URL.
    Returns: (is_valid, canonical_url, note)
    """
    clean_url = (url or "").strip()
    if not is_valid_url_format(clean_url):
        return False, None, "Invalid URL format or blocked host."

    async with _CACHE_LOCK:
        if clean_url in _URL_CACHE:
            return _URL_CACHE[clean_url]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers=headers) as client:
            try:
                resp = await client.head(clean_url)
                if resp.status_code in (405, 403, 400):
                    resp = await client.get(clean_url)
            except (httpx.RequestError, httpx.HTTPStatusError):
                resp = await client.get(clean_url)

            if resp.status_code < 400:
                canonical = str(resp.url)
                content_type = resp.headers.get("content-type", "").lower()
                if "text" in content_type or "html" in content_type:
                    sample = resp.text[:1500].lower() if hasattr(resp, "text") else ""
                    if "page not found" in sample or "404 not found" in sample or "article does not exist" in sample:
                        result = (False, None, "Soft 404: Page not found content returned.")
                    else:
                        result = (True, canonical, f"Verified reachable (HTTP {resp.status_code}).")
                else:
                    result = (True, canonical, f"Verified reachable (HTTP {resp.status_code}).")
            else:
                result = (False, None, f"Endpoint returned HTTP {resp.status_code}.")

    except asyncio.TimeoutError:
        result = (False, None, "Connection timed out while verifying URL.")
    except Exception as exc:
        result = (False, None, f"URL reachability check failed: {type(exc).__name__}.")

    async with _CACHE_LOCK:
        _URL_CACHE[clean_url] = result

    return result


async def batch_validate_urls(urls: Set[str]) -> Dict[str, Tuple[bool, Optional[str], Optional[str]]]:
    """Validate multiple URLs concurrently."""
    tasks = {u: validate_and_resolve_url(u) for u in urls if u}
    if not tasks:
        return {}
    results = await asyncio.gather(*tasks.values())
    return dict(zip(tasks.keys(), results))
