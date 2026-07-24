import socket
import ipaddress
import httpx
import logging
import asyncio
import time
import json
from urllib.parse import urlparse, urlunparse
from fastapi import HTTPException, status
from bs4 import BeautifulSoup
from readability import Document as ReadabilityDocument
import trafilatura
from playwright.async_api import async_playwright
from app.config import URL_INGESTION_TIMEOUT, URL_INGESTION_RETRIES, URL_INGESTION_MIN_THRESHOLD

logger = logging.getLogger("app.services.url_extractor")

def safe_print(text: str):
    logger.info(text)

def raise_url_extraction_error(
    status_code: int,
    error_type: str,
    reason: str,
    suggestions: list,
    time_taken: float = 0.0,
    http_status: int = None,
    stage: str = "fetch"
):
    """
    Standardized URL ingestion failure logger and structured HTTPException thrower.
    """
    logger.error(
        f"[URL EXTRACTION FAILURE] Type: {error_type} | Reason: {reason} | "
        f"HTTP Status: {http_status} | Stage: {stage} | Time Taken: {time_taken:.2f}s"
    )
    
    # Return structured metadata as serialized JSON string to keep string assertions passing
    payload = {
        "error_type": error_type,
        "reason": reason,
        "suggestions": suggestions,
        "time_taken": round(time_taken, 2),
        "http_status": http_status,
        "stage": stage
    }
    raise HTTPException(
        status_code=status_code,
        detail=json.dumps(payload)
    )

def validate_and_sanitize_url(url_str: str) -> str:
    """
    Validates a URL to prevent SSRF by checking for non-HTTP schemes,
    loopback addresses, private IP subnets, and link-local ranges.
    Also normalizes the URL formatting.
    """
    if not url_str:
        raise_url_extraction_error(
            status_code=400,
            error_type="INVALID_URL",
            reason="The URL string is empty or invalid.",
            suggestions=[
                "Ensure you enter a valid URL.",
                "Try another URL."
            ],
            stage="validation"
        )

    # Normalize whitespace
    url_str = url_str.strip()

    try:
        parsed = urlparse(url_str)
    except Exception:
        raise_url_extraction_error(
            status_code=400,
            error_type="INVALID_URL",
            reason="The URL is formatted incorrectly.",
            suggestions=[
                "Verify the URL format matches https://example.com/terms",
                "Try another URL."
            ],
            stage="validation"
        )
        
    if parsed.scheme not in ("http", "https"):
        raise_url_extraction_error(
            status_code=400,
            error_type="UNSUPPORTED_PROTOCOL",
            reason="Only HTTP and HTTPS URL schemes are supported.",
            suggestions=[
                "Ensure the URL starts with http:// or https://"
            ],
            stage="validation"
        )
        
    hostname = parsed.hostname
    if not hostname:
        raise_url_extraction_error(
            status_code=400,
            error_type="INVALID_URL",
            reason="The URL hostname segment is empty.",
            suggestions=[
                "Verify the URL format is correct."
            ],
            stage="validation"
        )
        
    h_lower = hostname.lower()
    if h_lower == "localhost" or h_lower == "127.0.0.1" or h_lower == "0.0.0.0" or h_lower == "[::1]":
        raise_url_extraction_error(
            status_code=400,
            error_type="SSRF_BLOCKED",
            reason="Accessing local server addresses is prohibited.",
            suggestions=[
                "Use a public website URL instead of a local address."
            ],
            stage="validation"
        )
        
    # Resolve hostname to check IPs
    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise_url_extraction_error(
            status_code=400,
            error_type="WEBSITE_UNAVAILABLE",
            reason="Could not resolve the specified hostname.",
            suggestions=[
                "Verify that the URL is typed correctly.",
                "Try another URL."
            ],
            stage="validation"
        )
        
    for info in addr_info:
        ip_str = info[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
            
        # Check for loopback, private, link-local, or unspecified ranges
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_unspecified:
            logger.warning(f"Prevented SSRF attempt: host '{hostname}' resolved to private range IP '{ip_str}'")
            raise_url_extraction_error(
                status_code=400,
                error_type="SSRF_BLOCKED",
                reason="Access to private or internal network resources is blocked.",
                suggestions=[
                    "Use a public website URL instead of a local address."
                ],
                stage="validation"
            )

    # Normalize back into URL string
    normalized_path = parsed.path or "/"
    normalized = urlunparse((
        parsed.scheme,
        parsed.netloc,
        normalized_path,
        parsed.params,
        parsed.query,
        parsed.fragment
    ))
    return normalized


def decompress_content(content: bytes, content_encoding: str) -> bytes:
    """
    Decompresses HTTP payload if content-encoding is gzip, deflate, brotli (br), or zstd.
    """
    if not content:
        return content

    # Check if content is already decompressed text/HTML
    stripped = content.strip()
    if stripped.startswith((b"<", b"<!", b"html", b"{", b"[", b"/*", b"//")):
        return content
        
    encoding = (content_encoding or "").lower().strip()
    if not encoding or encoding == "identity":
        return content
        
    if "gzip" in encoding or "x-gzip" in encoding:
        import gzip
        try:
            logger.info("Decompressing gzip content.")
            return gzip.decompress(content)
        except Exception as e:
            logger.error(f"Gzip decompression failed: {e}")
            
    elif "deflate" in encoding:
        import zlib
        try:
            logger.info("Decompressing deflate content.")
            return zlib.decompress(content, -zlib.MAX_WBITS)
        except zlib.error:
            try:
                return zlib.decompress(content)
            except Exception as e:
                logger.error(f"Deflate decompression failed: {e}")
                
    elif "br" in encoding or "brotli" in encoding:
        try:
            import brotli
            logger.info("Decompressing brotli (br) content.")
            return brotli.decompress(content)
        except ImportError:
            logger.error("Brotli decompression requested but 'brotli' package is not installed.")
        except Exception as e:
            logger.error(f"Brotli decompression failed: {e}")
            
    elif "zstd" in encoding:
        try:
            import zstandard
            logger.info("Decompressing zstd content.")
            dctx = zstandard.ZstdDecompressor()
            return dctx.decompress(content)
        except ImportError:
            logger.error("Zstandard decompression requested but 'zstandard' package is not installed.")
        except Exception as e:
            logger.error(f"Zstd decompression failed: {e}")
            
    return content


def calculate_quality_score(text: str) -> float:
    """
    Calculates a quality score for extracted text.
    Higher score means better quality for legal documents.
    """
    if not text:
        return 0.0
    text = text.strip()
    text_len = len(text)
    if text_len < 100:
        return 0.0
        
    paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]
    paragraph_count = len(paragraphs)
    
    words = text.split()
    word_count = len(words)
    if word_count < 20:
        return 0.0
        
    avg_words_per_para = word_count / paragraph_count if paragraph_count > 0 else 0
    
    # Legal keywords density: terms and conditions documents are full of these
    legal_keywords = [
        "terms", "conditions", "privacy", "policy", "liability", "governing law", "arbitration",
        "agreement", "user", "we", "us", "our", "you", "your", "intellectual property",
        "warranty", "disclaimer", "termination", "limitation", "indemnification", "cookies",
        "refund", "cancellation", "license", "dispute", "opt-out", "gdpr", "ccpa", "personal data"
    ]
    keyword_matches = sum(1 for kw in legal_keywords if kw in text.lower())
    
    # 1. Length score: up to 35 points
    length_score = min(35.0, text_len / 500)
    
    # 2. Paragraph density: up to 20 points
    para_score = min(20.0, paragraph_count * 2)
    
    # 3. Keyword richness: up to 40 points
    keyword_score = min(40.0, keyword_matches * 3)
    
    # 4. Text density (words per paragraph): up to 5 points
    density_score = 0.0
    if 10 <= avg_words_per_para <= 80:
        density_score = 5.0
    elif avg_words_per_para > 80:
        density_score = 2.0
        
    # Readability/Corrupted symbols check
    special_chars = sum(1 for char in text if not char.isalnum() and not char.isspace())
    symbol_ratio = special_chars / text_len if text_len > 0 else 1.0
    
    # Penalty for excessive non-alphanumeric chars (potential HTML tags leak or corrupted binary data)
    readability_penalty = 0.0
    if symbol_ratio > 0.15:
        readability_penalty = -40.0
    elif symbol_ratio > 0.08:
        readability_penalty = -15.0
        
    total_score = length_score + para_score + keyword_score + density_score + readability_penalty
    return max(0.0, total_score)


class URLExtractorService:
    @staticmethod
    async def fetch_and_clean_url(
        url: str,
        timeout_seconds: float = None,
        max_retries: int = None,
        min_threshold: int = None
    ) -> str:
        """
        SSRF-validated webpage scraping and plain text extraction.
        Multi-stage pipeline: Readability-lxml -> Trafilatura -> BeautifulSoup fallback -> Playwright.
        Automatically checks quality scores and chooses the highest-quality text.
        """
        start_time = time.time()
        timeout_sec = timeout_seconds if timeout_seconds is not None else URL_INGESTION_TIMEOUT
        retries = max_retries if max_retries is not None else URL_INGESTION_RETRIES
        threshold = min_threshold if min_threshold is not None else URL_INGESTION_MIN_THRESHOLD

        # Validate and sanitize URL
        validated_url = validate_and_sanitize_url(url)
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
            
        timeout = httpx.Timeout(timeout_sec)
        html_content = ""
        response_status = None
        content_type = ""
        encoding = "utf-8"
        redirects = []

        logger.info(f"URL Ingestion pipeline started for: '{validated_url}'")
        extraction_pool = []  # List to store successfully extracted texts: dict(method=..., text=..., score=...)

        # 1. Attempt Static HTTP Fetch (with HTTPX)
        static_fetch_success = False
        last_exception = None
        for attempt in range(retries):
            try:
                logger.info(f"Fetch attempt {attempt + 1}/{retries} for URL: '{validated_url}'")
                
                async def log_redirect(request):
                    redirects.append(str(request.url))
                
                async with httpx.AsyncClient(follow_redirects=True, timeout=timeout, event_hooks={'request': [log_redirect]}) as client:
                    response = await client.get(validated_url, headers=headers)
                    response_status = response.status_code
                    content_type = response.headers.get("Content-Type", "")
                    content_encoding = response.headers.get("Content-Encoding", "")
                    resp_encoding = response.encoding
                    raw_content_len = len(response.content) if response.content else 0
                    raw_text_len = len(response.text) if response.text else 0

                    if response.status_code == 404:
                        raise_url_extraction_error(
                            status_code=404,
                            error_type="NOT_FOUND",
                            reason="The webpage was not found (404 Not Found).",
                            suggestions=[
                                "Verify that the URL exists and is active.",
                                "Try the direct Terms & Conditions or Privacy Policy page instead of the homepage."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=404,
                            stage="fetch"
                        )
                    elif response.status_code == 403:
                        raise_url_extraction_error(
                            status_code=403,
                            error_type="FORBIDDEN",
                            reason="This website blocks automated access (403 Forbidden).",
                            suggestions=[
                                "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                                "Upload the Terms & Conditions as a PDF for analysis."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=403,
                            stage="fetch"
                        )
                    elif response.status_code == 429:
                        raise_url_extraction_error(
                            status_code=429,
                            error_type="RATE_LIMITED",
                            reason="Too many requests sent (429 Rate Limited).",
                            suggestions=[
                                "Try again after some time if the website is temporarily unavailable.",
                                "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=429,
                            stage="fetch"
                        )
                    elif response.status_code >= 500:
                        raise_url_extraction_error(
                            status_code=502,
                            error_type="SERVER_ERROR",
                            reason=f"The website server encountered an internal error ({response.status_code} Server Error).",
                            suggestions=[
                                "Try again after some time if the website is temporarily unavailable.",
                                "Upload the document as a PDF for analysis."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=response.status_code,
                            stage="fetch"
                        )
                    elif response.status_code >= 400:
                        raise_url_extraction_error(
                            status_code=400,
                            error_type="WEBSITE_UNAVAILABLE",
                            reason=f"The website returned an unexpected response status: {response.status_code}.",
                            suggestions=[
                                "Verify that the URL exists and is active.",
                                "Try another URL."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=response.status_code,
                            stage="fetch"
                        )

                    # Validate Content-Type
                    if content_type and not any(t in content_type.lower() for t in ["text/html", "application/xhtml+xml", "text/plain", "application/xml"]):
                        raise_url_extraction_error(
                            status_code=400,
                            error_type="UNSUPPORTED_CONTENT_TYPE",
                            reason="The webpage content type is unsupported (e.g. video, binary, audio).",
                            suggestions=[
                                "Ensure you are targeting a text-based webpage.",
                                "Upload the document as a PDF for analysis."
                            ],
                            time_taken=time.time() - start_time,
                            http_status=response.status_code,
                            stage="fetch"
                        )

                    safe_print(f"Content-Type: {content_type}")
                    safe_print(f"Content-Encoding: {content_encoding}")
                    safe_print(f"response.encoding: {resp_encoding}")
                    safe_print(f"len(response.content): {raw_content_len}")
                    safe_print(f"len(response.text): {raw_text_len}")

                    # Decompress response content if encoded
                    decompressed_bytes = decompress_content(response.content, content_encoding)

                    # Extract charset for decoding
                    charset = "utf-8"
                    if "charset=" in content_type:
                        try:
                            charset = content_type.split("charset=")[-1].split(";")[0].strip()
                        except Exception:
                            charset = "utf-8"
                    elif resp_encoding:
                        charset = resp_encoding

                    encoding = charset

                    # Decode HTML properly
                    try:
                        html_content = decompressed_bytes.decode(charset, errors="replace")
                    except Exception:
                        html_content = decompressed_bytes.decode("utf-8", errors="replace")
                        
                    logger.info(f"Webpage fetch succeeded on attempt {attempt + 1}. Content size: {len(html_content)} characters.")
                    static_fetch_success = True
                    break
            except httpx.TimeoutException as e:
                logger.warning(f"Webpage timeout on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except httpx.TooManyRedirects as e:
                logger.warning(f"Too many redirects on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except httpx.ConnectError as e:
                logger.warning(f"Connection/SSL error on attempt {attempt + 1}: {str(e)}")
                last_exception = e
            except HTTPException as e:
                raise e
            except Exception as e:
                logger.warning(f"Unexpected URL fetch exception on attempt {attempt + 1}: {str(e)}")
                last_exception = e
                
            if attempt < retries - 1:
                backoff_time = 1.5 * (attempt + 1)
                logger.info(f"Waiting {backoff_time}s before next attempt...")
                await asyncio.sleep(backoff_time)

        # Handle static fetch failures
        if not static_fetch_success:
            time_spent = time.time() - start_time
            if isinstance(last_exception, httpx.TimeoutException):
                raise_url_extraction_error(
                    status_code=400,
                    error_type="TIMEOUT",
                    reason="The connection timed out while loading the webpage.",
                    suggestions=[
                        "Try again after some time if the website is temporarily unavailable.",
                        "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section."
                    ],
                    time_taken=time_spent,
                    stage="fetch"
                )
            elif isinstance(last_exception, httpx.TooManyRedirects):
                raise_url_extraction_error(
                    status_code=400,
                    error_type="TOO_MANY_REDIRECTS",
                    reason="The website has too many redirects (redirect loop).",
                    suggestions=[
                        "Try using the direct, final URL of the page instead of a redirect link."
                    ],
                    time_taken=time_spent,
                    stage="fetch"
                )
            elif isinstance(last_exception, httpx.ConnectError) and "ssl" in str(last_exception).lower():
                raise_url_extraction_error(
                    status_code=400,
                    error_type="SSL_ERROR",
                    reason="SSL certificate verification failed.",
                    suggestions=[
                        "Check if the website's SSL certificate is expired or invalid.",
                        "Upload the Terms & Conditions as a PDF for analysis."
                    ],
                    time_taken=time_spent,
                    stage="fetch"
                )
            else:
                raise_url_extraction_error(
                    status_code=400,
                    error_type="WEBSITE_UNAVAILABLE",
                    reason="The website is unavailable or DNS resolution failed.",
                    suggestions=[
                        "Try the direct Terms & Conditions or Privacy Policy page instead of the homepage.",
                        "Try again after some time if the website is temporarily unavailable."
                    ],
                    time_taken=time_spent,
                    stage="fetch"
                )

        # Cloudflare / CAPTCHA detection in static HTML
        lower_html = html_content.lower() if html_content else ""
        if "cloudflare" in lower_html and ("attention required" in lower_html or "captcha" in lower_html or "cf-browser-verification" in lower_html or "enable javascript and cookies" in lower_html):
            raise_url_extraction_error(
                status_code=403,
                error_type="CLOUDFLARE_BLOCKED",
                reason="This website blocks automated access using Cloudflare protection.",
                suggestions=[
                    "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                    "Upload the Terms & Conditions as a PDF for analysis."
                ],
                time_taken=time.time() - start_time,
                stage="post-process"
            )
        elif "captcha" in lower_html and ("security check" in lower_html or "robot" in lower_html or "recaptcha" in lower_html):
            raise_url_extraction_error(
                status_code=403,
                error_type="CAPTCHA_BLOCKED",
                reason="This website blocks automated access using a CAPTCHA challenge.",
                suggestions=[
                    "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                    "Upload the Terms & Conditions as a PDF for analysis."
                ],
                time_taken=time.time() - start_time,
                stage="post-process"
            )

        # 2. Extract content from static HTML if fetched successfully
        requires_browser = False
        
        soup_check = BeautifulSoup(html_content, "html.parser")
        body = soup_check.body
        body_text_len = len(body.get_text().strip()) if body else 0
        
        # Framework skeletons detection
        is_js_skeleton = False
        if body:
            has_root_div = body.find(id=["app", "root", "react-root", "__next"])
            if has_root_div and body_text_len < 1200 and len(html_content) > 10000:
                is_js_skeleton = True
                logger.info("JS-rendered framework skeleton detected in static HTML. Playwright browser will be invoked.")
        
        if is_js_skeleton:
            requires_browser = True
        else:
            # Stage 1: Readability-lxml
            try:
                doc = ReadabilityDocument(html_content)
                summary_html = doc.summary()
                readability_txt = URLExtractorService.clean_html(summary_html)
                score = calculate_quality_score(readability_txt)
                if readability_txt and len(readability_txt.strip()) >= threshold:
                    extraction_pool.append({
                        'method': 'readability-lxml',
                        'text': readability_txt,
                        'score': score
                    })
            except Exception as e:
                logger.warning(f"Readability-lxml static extraction failed: {e}")

            # Stage 2: Trafilatura
            try:
                trafilatura_txt = trafilatura.extract(html_content)
                if trafilatura_txt:
                    trafilatura_txt = trafilatura_txt.strip()
                    score = calculate_quality_score(trafilatura_txt)
                    if len(trafilatura_txt) >= threshold:
                        extraction_pool.append({
                            'method': 'trafilatura',
                            'text': trafilatura_txt,
                            'score': score
                        })
            except Exception as e:
                logger.warning(f"Trafilatura static extraction failed: {e}")

            # Stage 3: BeautifulSoup Fallback
            try:
                bs4_txt = URLExtractorService.clean_html(html_content)
                score = calculate_quality_score(bs4_txt)
                if bs4_txt and len(bs4_txt.strip()) >= threshold:
                    extraction_pool.append({
                        'method': 'beautifulsoup-fallback',
                        'text': bs4_txt,
                        'score': score
                    })
            except Exception as e:
                logger.warning(f"BeautifulSoup static fallback failed: {e}")

        # Check if the highest score from static stages is sufficient, otherwise trigger Playwright
        best_static_score = max([item['score'] for item in extraction_pool]) if extraction_pool else 0.0
        
        if requires_browser or best_static_score < 15.0 or not extraction_pool:
            logger.info("Static extraction insufficient or failed. Initiating Playwright Headless Browser extraction.")
            # Stage 4: Playwright Headless Browser
            browser_html = ""
            playwright_exception = None
            try:
                async with async_playwright() as p:
                    logger.info("Launching Playwright Chromium browser...")
                    browser = await p.chromium.launch(headless=True)
                    try:
                        page = await browser.new_page(
                            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        )
                        await page.set_extra_http_headers({
                            "Accept-Language": "en-US,en;q=0.9",
                        })
                        await page.goto(validated_url, timeout=20000, wait_until="networkidle")
                        await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                        await page.wait_for_timeout(1500)
                        
                        browser_html = await page.content()
                    finally:
                        await browser.close()
            except Exception as e:
                logger.error(f"Playwright browser execution failed: {e}")
                playwright_exception = e

            # If Playwright fails and we have no static results, raise JS render error
            if not browser_html and not extraction_pool:
                raise_url_extraction_error(
                    status_code=400,
                    error_type="JS_RENDER_FAILURE",
                    reason=f"The JavaScript rendering failed or timed out: {str(playwright_exception or 'browser crash')}.",
                    suggestions=[
                        "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                        "Upload the document as a PDF for analysis."
                    ],
                    time_taken=time.time() - start_time,
                    stage="playwright"
                )

            if browser_html:
                # Cloudflare / CAPTCHA checks in browser rendered HTML
                lower_browser_html = browser_html.lower()
                if "cloudflare" in lower_browser_html and ("attention required" in lower_browser_html or "captcha" in lower_browser_html or "cf-browser-verification" in lower_browser_html):
                    raise_url_extraction_error(
                        status_code=403,
                        error_type="CLOUDFLARE_BLOCKED",
                        reason="This website blocks automated access using Cloudflare protection.",
                        suggestions=[
                            "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                            "Upload the Terms & Conditions as a PDF for analysis."
                        ],
                        time_taken=time.time() - start_time,
                        stage="playwright"
                    )

                # Stage 4.1: Readability-lxml on Browser HTML
                try:
                    doc = ReadabilityDocument(browser_html)
                    summary_html = doc.summary()
                    readability_txt = URLExtractorService.clean_html(summary_html)
                    score = calculate_quality_score(readability_txt)
                    if readability_txt and len(readability_txt.strip()) >= threshold:
                        extraction_pool.append({
                            'method': 'playwright-readability',
                            'text': readability_txt,
                            'score': score
                        })
                except Exception as e:
                    logger.warning(f"Playwright Readability extraction failed: {e}")

                # Stage 4.2: Trafilatura on Browser HTML
                try:
                    trafilatura_txt = trafilatura.extract(browser_html)
                    if trafilatura_txt:
                        trafilatura_txt = trafilatura_txt.strip()
                        score = calculate_quality_score(trafilatura_txt)
                        if len(trafilatura_txt) >= threshold:
                            extraction_pool.append({
                                'method': 'playwright-trafilatura',
                                'text': trafilatura_txt,
                                'score': score
                            })
                except Exception as e:
                    logger.warning(f"Playwright Trafilatura extraction failed: {e}")

                # Stage 4.3: BeautifulSoup fallback on Browser HTML
                try:
                    bs4_txt = URLExtractorService.clean_html(browser_html)
                    score = calculate_quality_score(bs4_txt)
                    if bs4_txt and len(bs4_txt.strip()) >= threshold:
                        extraction_pool.append({
                            'method': 'playwright-beautifulsoup',
                            'text': bs4_txt,
                            'score': score
                        })
                except Exception as e:
                    logger.warning(f"Playwright BeautifulSoup extraction failed: {e}")

        # Choose the best text based on quality score
        final_text = ""
        best_method = "none"
        best_score = 0.0

        valid_pool = [item for item in extraction_pool if len(item['text'].strip()) >= threshold]
        
        if valid_pool:
            valid_pool.sort(key=lambda x: x['score'], reverse=True)
            final_text = valid_pool[0]['text']
            best_method = valid_pool[0]['method']
            best_score = valid_pool[0]['score']

        time_taken = time.time() - start_time
        final_len = len(final_text.strip())

        # Final logs printing
        logger.info("[URL INGESTION LOG]")
        safe_print(f"URL: {url}")
        safe_print(f"Final URL: {validated_url}")
        safe_print(f"Redirects: {redirects}")
        safe_print(f"Response Status: {response_status}")
        safe_print(f"Content Type: {content_type}")
        safe_print(f"Encoding: {encoding}")
        safe_print(f"Extraction Method Used: {best_method}")
        safe_print(f"Text Length: {final_len}")
        safe_print(f"Quality Score: {best_score:.2f}")
        safe_print(f"Time Taken: {time_taken:.2f}s")
        if final_len > 0:
            safe_print(f"First 500 characters: {final_text[:500]}")

        # Stop before AI Analysis if extracted text length is less than the threshold
        if final_len < threshold:
            logger.warning(f"Extracted text length {final_len} is less than threshold {threshold}.")
            raise_url_extraction_error(
                status_code=400,
                error_type="NO_READABLE_CONTENT",
                reason="No readable legal content or policy clauses found on this page.",
                suggestions=[
                    "Try the direct Terms & Conditions or Privacy Policy page instead of the homepage.",
                    "Copy and paste the Terms & Conditions or Privacy Policy text into the Text Analysis section.",
                    "Upload the Terms & Conditions as a PDF for analysis."
                ],
                time_taken=time_taken,
                stage="post-process"
            )
            
        return final_text

    @staticmethod
    def clean_html(html: str) -> str:
        """
        Extracts clean plain text from HTML, removing headers, footers, scripts/styles,
        cookie banners, popups, and tracking selectors.
        """
        soup = BeautifulSoup(html, "html.parser")
        
        # 1. Eliminate boilerplate scripts and interactive/layout components
        undesired_tags = [
            "script", "style", "noscript", "iframe", "svg", "form", 
            "button", "input", "select", "textarea", "nav", 
            "header", "footer", "aside", "dialog", "embed", "object",
            "link", "meta"
        ]
        for tag in soup(undesired_tags):
            tag.decompose()
            
        # 2. Identify and decompose cookie banners, newsletters, popups, and ads
        undesired_patterns = [
            "cookie", "consent", "banner", "privacy-prompt", "newsletter-signup", 
            "social-share", "modal", "popup", "widget", "promo", "ad-", "ads-",
            "footer", "nav", "menu", "header", "sidebar", "tracking", "telemetry"
        ]
        
        for element in soup.find_all(True):
            if element.attrs is None:
                continue
            # Inspect classes
            classes = element.get("class", [])
            if isinstance(classes, str):
                classes = [classes]
            classes_str = " ".join(classes).lower()
            
            # Inspect id
            element_id = (element.get("id") or "").lower()
            
            # Check pattern match
            if any(pattern in classes_str or pattern in element_id for pattern in undesired_patterns):
                # Ensure we are not purging main legal text divs (e.g. 'terms-container' or 'privacy-policy')
                keep_words = ["terms", "policy", "agreement", "legal", "privacy-policy", "main", "content"]
                if not any(word in classes_str or word in element_id for word in keep_words):
                    element.decompose()
                    
        # 3. Pull formatted clean text with clear spacing
        text = soup.get_text(separator="\n\n")
        
        cleaned_lines = []
        for line in text.split("\n"):
            line_str = line.strip()
            if line_str:
                cleaned_lines.append(line_str)
                
        return "\n".join(cleaned_lines)
