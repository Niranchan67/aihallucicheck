import os
import re
import subprocess
from markdown_it import MarkdownIt

# Paths
BASE_DIR = r"c:\Users\NIJNIR2008\Downloads\hallucicheck-dark-ui"
REPO_DIR = os.path.join(BASE_DIR, "hallucicheck")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

COMMON_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@page {
    size: A4;
    margin: 12mm 15mm 13mm 15mm;
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.45;
    font-size: 9.2pt;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    font-weight: 700;
    line-height: 1.2;
    margin-top: 1.1em;
    margin-bottom: 0.4em;
    break-after: avoid;
    page-break-after: avoid;
}

h1 {
    font-size: 18pt;
    font-weight: 800;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 0.3em;
    color: #0f172a;
}

h2 {
    font-size: 13pt;
    font-weight: 700;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 4px;
    margin-top: 1.3em;
    color: #1e293b;
}

h3 {
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
    margin-top: 1em;
}

h4 {
    font-size: 10pt;
    font-weight: 600;
    color: #475569;
}

p {
    margin-top: 0;
    margin-bottom: 0.65em;
    color: #334155;
}

/* Header & Cover Banner */
.doc-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    padding: 20px 24px;
    border-radius: 10px;
    margin-bottom: 18px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.doc-header h1 {
    color: #ffffff;
    border-bottom: none;
    padding-bottom: 0;
    margin: 0 0 4px 0;
    font-size: 20pt;
    letter-spacing: -0.02em;
}

.doc-header .subtitle {
    color: #94a3b8;
    font-size: 10.5pt;
    font-weight: 500;
    margin-bottom: 12px;
}

.meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    background: rgba(255, 255, 255, 0.08);
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 10px;
}

.meta-item {
    font-size: 8pt;
}

.meta-label {
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 6.5pt;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.meta-val {
    color: #f8fafc;
    font-weight: 600;
    margin-top: 1px;
}

.meta-val a {
    color: #60a5fa;
    text-decoration: none;
}

/* Status Badges */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1.5px 7px;
    border-radius: 9999px;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    font-family: 'Plus Jakarta Sans', sans-serif;
    vertical-align: middle;
}

.badge-verified {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.badge-suspicious {
    background-color: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
}

.badge-hallucinated {
    background-color: #fff1f2;
    color: #9f1239;
    border: 1px solid #fecdd3;
}

.badge-tier {
    background-color: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    font-family: 'JetBrains Mono', monospace;
    font-size: 7pt;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 8pt;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
}

thead tr {
    break-inside: avoid;
    page-break-inside: avoid;
}

thead th {
    background-color: #f8fafc;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 2px solid #e2e8f0;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

tbody tr {
    break-inside: avoid;
    page-break-inside: avoid;
}

tbody td {
    padding: 5px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: top;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:nth-child(even) {
    background-color: #fcfcfd;
}

/* Blockquotes / Callout Boxes */
blockquote {
    margin: 10px 0;
    padding: 8px 14px;
    background-color: #f8fafc;
    border-left: 3.5px solid #3b82f6;
    border-radius: 0 6px 6px 0;
    color: #334155;
    font-style: normal;
    font-size: 8.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
}

blockquote p {
    margin: 0;
}

blockquote p + p {
    margin-top: 4px;
}

/* Code & Pre */
code {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 7.8pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    white-space: pre-wrap;
    word-break: break-word;
}

pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 10px 14px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 7.5pt;
    line-height: 1.4;
    margin: 10px 0;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
}

pre code {
    background-color: transparent;
    color: #f8fafc;
    padding: 0;
    border: none;
    font-size: inherit;
    white-space: pre-wrap;
    word-break: break-word;
}

/* Lists */
ul, ol {
    margin-top: 0;
    margin-bottom: 0.65em;
    padding-left: 18px;
    color: #334155;
}

li {
    margin-bottom: 0.25em;
}

/* Formula Boxes */
.formula-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #6366f1;
    border-radius: 6px;
    padding: 10px 16px;
    margin: 12px 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
}

.fraction-container {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.fraction {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    vertical-align: middle;
    padding: 0 4px;
}

.fraction .num {
    border-bottom: 1.5px solid #334155;
    padding-bottom: 2px;
    width: 100%;
}

.fraction .den {
    padding-top: 2px;
    width: 100%;
}

/* Architecture Flowchart Diagram */
.diagram-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    margin: 16px 0;
    break-inside: avoid;
    page-break-inside: avoid;
}

.diagram-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 9pt;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
    text-align: center;
}

.pipeline-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pipe-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.pipe-box {
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 8pt;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.pipe-box.primary {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1e40af;
}

.pipe-box.success {
    background: #ecfdf5;
    border-color: #a7f3d0;
    color: #065f46;
}

.pipe-arrow {
    color: #94a3b8;
    font-size: 10pt;
    font-weight: bold;
}

.registries-box {
    background: #ffffff;
    border: 1.5px dashed #94a3b8;
    border-radius: 8px;
    padding: 10px 14px;
    width: 100%;
}

.registries-title {
    font-size: 7.5pt;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 6px;
    text-align: center;
}

.registries-chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}

.chip {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 7.5pt;
    font-weight: 600;
    color: #334155;
}

.page-break {
    break-before: page;
    page-break-before: always;
}

a {
    color: #2563eb;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

.footer-note {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
}
"""

def clean_markdown_and_replace_elements(md_content):
    # Format formula blocks
    md_content = md_content.replace(
        r"$$\text{Sentence} = C_1 \land C_2$$",
        '<div class="formula-box"><strong>Sentence Formulation:</strong> Sentence = C<sub>1</sub> ∧ C<sub>2</sub> (Coordinate Conjunction Decomposition)</div>'
    )
    
    overall_score_html = (
        '<div class="formula-box">'
        '<strong>Quantitative Session Score:</strong> '
        '<div class="fraction-container">'
        '<span>Overall Score = </span>'
        '<div class="fraction"><span class="num">∑<sub>i=1</sub><sup>N</sup> W(S<sub>i</sub>)</span><span class="den">N</span></div>'
        '<span>&times; 100</span>'
        '</div>'
        '</div>'
    )
    md_content = md_content.replace(
        r"$$\text{Overall Score} = \frac{\sum_{i=1}^N W(S_i)}{N} \times 100$$",
        overall_score_html
    )
    
    weights_formula_html = (
        '<div class="formula-box">'
        '<strong>Category Weights:</strong> '
        '<span>W(VERIFIED) = 1.0 &nbsp;|&nbsp; W(SUSPICIOUS) = 0.45 &nbsp;|&nbsp; W(UNVERIFIED) = 0.35 &nbsp;|&nbsp; W(HALLUCINATED) = 0.0</span>'
        '</div>'
    )
    md_content = md_content.replace(
        r"$$W(\text{VERIFIED}) = 1.0, \quad W(\text{SUSPICIOUS}) = 0.45, \quad W(\text{UNVERIFIED}) = 0.35, \quad W(\text{HALLUCINATED}) = 0.0$$",
        weights_formula_html
    )

    # Format inline math
    md_content = md_content.replace(r"$\rightarrow$", " &rarr; ")
    md_content = md_content.replace(r"$\ge$", " &ge; ")
    md_content = md_content.replace(r"$\le$", " &le; ")
    md_content = md_content.replace(r"$\ge 80\%$", " &ge; 80% ")
    md_content = md_content.replace(r"$50\% - 79\%$", " 50% &ndash; 79% ")
    md_content = md_content.replace(r"$< 50\%$", " &lt; 50% ")
    md_content = md_content.replace(r"$88.0\% - 92.0\%$", " 88.0% &ndash; 92.0% ")
    md_content = md_content.replace(r"$35.0\% - 65.0\%$", " 35.0% &ndash; 65.0% ")
    md_content = md_content.replace(r"$10.0\% - 15.0\%$", " 10.0% &ndash; 15.0% ")
    md_content = md_content.replace(r"$+3.5\%$", " +3.5% ")
    md_content = md_content.replace(r"$98.0\%$", " 98.0% ")
    md_content = md_content.replace(r"$50.0\%$", " 50.0% ")
    md_content = md_content.replace(r"$C_1$", "C<sub>1</sub>")
    md_content = md_content.replace(r"$C_2$", "C<sub>2</sub>")

    # Replace Mermaid block with beautiful HTML/SVG diagram
    mermaid_block = re.search(r"```mermaid[\s\S]*?```", md_content)
    if mermaid_block:
        diagram_html = """
<div class="diagram-container">
    <div class="diagram-title">Figure 1: HalluciCheck v2.0 Autonomous Verification Architecture</div>
    <div class="pipeline-grid">
        <div class="pipe-row">
            <div class="pipe-box primary">Raw AI Generation Input (Multi-Paragraph)</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 1 & 2: NLP Claim Extraction & Coordinate Clause Splitting</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 3 & 4: 11-Class Taxonomy & Atomic Proposition Deconstruction</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 5 & 6: Neutral Query Generation & Targeted Contradiction Probes</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="registries-box">
            <div class="registries-title">Federated Scholarly & Authoritative Knowledge Registries (Concurrent Async)</div>
            <div class="registries-chips">
                <span class="chip">OpenAlex (250M+ Papers)</span>
                <span class="chip">CrossRef DOI Registry</span>
                <span class="chip">Europe PMC / PubMed</span>
                <span class="chip">ArXiv Pre-prints</span>
                <span class="chip">Wikidata Triples</span>
                <span class="chip">DuckDuckGo Web Index</span>
                <span class="chip">Wikipedia REST API</span>
            </div>
        </div>
        <div class="pipe-row" style="margin-top: 4px;">
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 7: Live URL Validation, Anti-Syndication & Source Authority Tiering</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 8: Relational Entailment Engine & Economic Homonym Disambiguation</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box">Stage 9: Deterministic Consensus & Quantitative Certainty Scoring</div>
            <div class="pipe-arrow">&darr;</div>
        </div>
        <div class="pipe-row">
            <div class="pipe-box success">Stage 10: Deep Multi-Paragraph Factual Reasoning & Client Highlight Viewer</div>
        </div>
    </div>
</div>
"""
        md_content = md_content.replace(mermaid_block.group(0), diagram_html)

    # Replace ASCII Cloud Deployment diagram with styled architecture card
    cloud_ascii = re.search(r"```\s*\+--+[\s\S]*?\+--+\s*```", md_content)
    if cloud_ascii:
        cloud_html = """
<div class="diagram-container" style="max-width: 520px; margin: 14px auto;">
    <div class="diagram-title">Cloud Deployment & Edge Network Architecture</div>
    <div style="background: #ffffff; border: 2px solid #3b82f6; border-radius: 8px; padding: 10px 14px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-weight: 700; color: #1e40af; font-size: 9pt;">Vercel Global Edge CDN</div>
        <div style="font-size: 8pt; color: #2563eb; font-weight: 600;"><a href="https://aihallucicheck.vercel.app">https://aihallucicheck.vercel.app</a></div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 3px;">Static Vite React 18 App &bull; Instant SSL &bull; Sub-100ms Global Edge Latency &bull; SPA Fallback</div>
    </div>
    <div style="text-align: center; color: #64748b; font-weight: 600; margin: 6px 0; font-size: 7.5pt;">
        &darr; &nbsp; Bi-directional REST API Traffic &nbsp; &uarr;
    </div>
    <div style="background: #ffffff; border: 2px solid #10b981; border-radius: 8px; padding: 10px 14px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-weight: 700; color: #065f46; font-size: 9pt;">FastAPI Unified Verification Engine</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 3px;">Multi-Stage Docker on Port 8000 &bull; Render.com &bull; SQLite Persistence &bull; Localtunnel Remote Access</div>
    </div>
</div>
"""
        md_content = md_content.replace(cloud_ascii.group(0), cloud_html)

    # Format Status Badges
    md_content = re.sub(r"`VERIFIED`", '<span class="badge badge-verified">&#10003; VERIFIED</span>', md_content)
    md_content = re.sub(r"`SUSPICIOUS`", '<span class="badge badge-suspicious">&#9888; SUSPICIOUS</span>', md_content)
    md_content = re.sub(r"`HALLUCINATED`", '<span class="badge badge-hallucinated">&#10007; HALLUCINATED</span>', md_content)
    md_content = re.sub(r"`HIGH CERTAINTY`", '<span class="badge badge-verified">HIGH CERTAINTY</span>', md_content)
    md_content = re.sub(r"`MODERATE RISK`", '<span class="badge badge-suspicious">MODERATE RISK</span>', md_content)
    md_content = re.sub(r"`HIGH HALLUCINATION RISK`", '<span class="badge badge-hallucinated">HIGH HALLUCINATION RISK</span>', md_content)

    return md_content

def generate_pdf_from_html(html_content, output_pdf_path):
    temp_html_path = output_pdf_path.replace(".pdf", ".temp.html")
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--print-to-pdf=" + os.path.abspath(output_pdf_path),
        os.path.abspath(temp_html_path)
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(temp_html_path):
        os.remove(temp_html_path)

    if os.path.exists(output_pdf_path) and os.path.getsize(output_pdf_path) > 0:
        print(f"Successfully generated: {output_pdf_path} ({os.path.getsize(output_pdf_path):,} bytes)")
        return True
    else:
        print(f"Failed to generate {output_pdf_path}: {res.stderr}")
        return False

def build_all_pdfs():
    md = MarkdownIt('commonmark').enable('table')

    # 1. Generate Progress Report PDF
    progress_md_path = os.path.join(REPO_DIR, "PROGRESS.md")
    with open(progress_md_path, "r", encoding="utf-8") as f:
        progress_raw = f.read()

    progress_processed = clean_markdown_and_replace_elements(progress_raw)
    progress_body_html = md.render(progress_processed)

    progress_doc_header = """
<div class="doc-header">
    <h1>HalluciCheck v2.0</h1>
    <div class="subtitle">AI Hallucination Verification System &bull; Engineering Progress & Milestone Tracking</div>
    <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Author</div>
            <div class="meta-val">Niranchan NS</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Release Version</div>
            <div class="meta-val">v2.0.0 (Production)</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Live Deployment</div>
            <div class="meta-val"><a href="https://aihallucicheck.vercel.app">aihallucicheck.vercel.app</a></div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Date</div>
            <div class="meta-val">September 21, 2026</div>
        </div>
    </div>
</div>
"""
    full_progress_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HalluciCheck v2.0 - Engineering Progress Tracking</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{progress_doc_header}
{progress_body_html}
<div class="footer-note">HalluciCheck v2.0 Engineering Progress Tracking &bull; Generated for Presentation &bull; Confidential &amp; Proprietary</div>
</body>
</html>
"""

    progress_pdf_repo = os.path.join(REPO_DIR, "HalluciCheck_Engineering_Progress.pdf")
    progress_pdf_base = os.path.join(BASE_DIR, "HalluciCheck_Engineering_Progress.pdf")
    generate_pdf_from_html(full_progress_html, progress_pdf_repo)
    generate_pdf_from_html(full_progress_html, progress_pdf_base)

    # 2. Generate Technical Report PDF
    report_md_path = os.path.join(REPO_DIR, "REPORT.md")
    with open(report_md_path, "r", encoding="utf-8") as f:
        report_raw = f.read()

    report_processed = clean_markdown_and_replace_elements(report_raw)
    report_body_html = md.render(report_processed)

    report_doc_header = """
<div class="doc-header">
    <h1>HalluciCheck v2.0</h1>
    <div class="subtitle">Autonomous Multi-Source AI Hallucination Verification &bull; Comprehensive Technical Report</div>
    <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Author</div>
            <div class="meta-val">Niranchan NS</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">System Architecture</div>
            <div class="meta-val">18-Stage Verification Pipeline</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Live Production URL</div>
            <div class="meta-val"><a href="https://aihallucicheck.vercel.app">aihallucicheck.vercel.app</a></div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Evaluation Date</div>
            <div class="meta-val">September 21, 2026</div>
        </div>
    </div>
</div>
"""
    full_report_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HalluciCheck v2.0 - Technical Engineering Report</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{report_doc_header}
{report_body_html}
<div class="footer-note">HalluciCheck v2.0 Comprehensive Technical Report &bull; Generated for Presentation &bull; Niranchan NS</div>
</body>
</html>
"""

    report_pdf_repo = os.path.join(REPO_DIR, "HalluciCheck_Technical_Report.pdf")
    report_pdf_base = os.path.join(BASE_DIR, "HalluciCheck_Technical_Report.pdf")
    generate_pdf_from_html(full_report_html, report_pdf_repo)
    generate_pdf_from_html(full_report_html, report_pdf_base)

    # 3. Generate Complete Combined Dossier (Progress + Technical Report)
    combined_doc_header = """
<div class="doc-header">
    <h1>HalluciCheck v2.0</h1>
    <div class="subtitle">Autonomous AI Hallucination Verification System &bull; Project Dossier & Technical Portfolio</div>
    <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Author / Lead</div>
            <div class="meta-val">Niranchan NS</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Project Status</div>
            <div class="meta-val">Production Deployed (v2.0.0)</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Live Workstation</div>
            <div class="meta-val"><a href="https://aihallucicheck.vercel.app">aihallucicheck.vercel.app</a></div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Presentation Date</div>
            <div class="meta-val">September 21, 2026</div>
        </div>
    </div>
</div>
"""
    full_combined_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HalluciCheck v2.0 - Complete Project Dossier</title>
<style>
{COMMON_CSS}
</style>
</head>
<body>
{combined_doc_header}

<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
    <h3 style="margin-top: 0; color: #0f172a;">Executive Presentation Overview</h3>
    <p style="margin-bottom: 0;">This unified dossier comprises the complete documentation portfolio for <strong>HalluciCheck v2.0</strong>, including <strong>Part I: Engineering Progress & Milestone Tracking</strong> and <strong>Part II: Comprehensive Technical Engineering Report</strong>. The system represents an autonomous, evidence-aware fact verification platform that deconstructs multi-paragraph LLM responses, evaluates relational entailment across 7 authoritative registries (OpenAlex, CrossRef, Europe PMC, ArXiv, Wikidata, DuckDuckGo, Wikipedia), and provides explainable diagnostics with clickable source proofs.</p>
</div>

{progress_body_html}

<div class="page-break"></div>

<div class="doc-header" style="margin-top: 20px;">
    <h1>Part II: Technical Engineering Report</h1>
    <div class="subtitle">Theoretical Foundations, 18-Stage Verification Pipeline & Empirical Evaluations</div>
</div>

{report_body_html}

<div class="footer-note">HalluciCheck v2.0 Complete Engineering Dossier &bull; Prepared by Niranchan NS for Evaluation &amp; Presentation</div>
</body>
</html>
"""

    combined_pdf_repo = os.path.join(REPO_DIR, "HalluciCheck_Complete_Project_Dossier.pdf")
    combined_pdf_base = os.path.join(BASE_DIR, "HalluciCheck_Complete_Project_Dossier.pdf")
    generate_pdf_from_html(full_combined_html, combined_pdf_repo)
    generate_pdf_from_html(full_combined_html, combined_pdf_base)

if __name__ == "__main__":
    build_all_pdfs()
