# HalluciCheck: Autonomous AI Hallucination Verification System
## Developer & Agent Interface Guidelines (`AGENTS.md`)

Concise, authoritative rules for building an accessible, high-performance, production-grade verification workspace interface for **HalluciCheck v2.0** (AI Hallucination Verification).

Decisions in this codebase are governed strictly by **MUST**, **SHOULD**, and **NEVER** directives. Every agent and contributor modifying frontend, backend, or full-stack contracts must strictly adhere to these standards.

---

## 1. Project Context & Visual Theme (Production Light Mode)

- **Product:** HalluciCheck v2.0 · AI Hallucination Verification (single-view LLM verification workspace).
- **Core Stack:** React 18, Vite, TypeScript, Tailwind CSS, FastAPI, SQLite.
- **Visual Theme & Palette (Light Mode):**
  - **Background:** Clean off-white/light gray minimalist background (`#f8fafc` or `#ffffff`).
  - **Text & Typography:** Deep charcoal/black headings (`#0f172a`) for maximum contrast and readability, paired with muted gray secondary text (`#64748b`).
  - **Accents & Buttons:** Sleek dark/black pill-shaped buttons with white text, minimalist borders (`border-slate-200`), and soft shadows (`shadow-sm`, `rounded-full` or `rounded-xl`).
  - **Status Accents:** Soft emerald (`#10b981` / `bg-emerald-50 text-emerald-800 border-emerald-200`) for verified assertions, light amber (`#f59e0b` / `bg-amber-50 text-amber-800 border-amber-200`) for suspicious assertions, and soft red (`#ef4444` / `bg-rose-50 text-rose-800 border-rose-200`) for contradicted claims.
- **Layout Architecture:** Focused **Single-View LLM Verification Workspace** (completely avoid heavy landing page structures).
- **Zero Auth Wall:** NEVER introduce a login requirement, auth wall, or blocker modal. Access to the verification workspace and diagnostic tools must remain direct and friction-free.

---

## 2. Header & Branding (Workspace Navigation)

- **MUST:** Display exact Brand Title **"HalluciCheck v2.0"** with exact subtitle/tagline **"AI Hallucination Verification"**.
- **MUST:** Include a clean top navigation bar with subtle links (Presets, API Docs, GitHub) and a professional live engine status pill ("Live Multi-Source v2.0").
- **MUST:** Keep the layout focused on the single-view workspace—never clutter with multi-page marketing landing sections or slide carousels.

---

## 3. Analysis Input Console

- **MUST:** Sleek, rounded light-themed text input card (`glass-card-light rounded-2xl`) with a dark pill-shaped submit button (`btn-pill-dark rounded-full`).
- **NEVER:** Block paste in `<textarea>` or `<input>`. Pasting multi-paragraph AI outputs from ChatGPT, Claude, or research papers is HalluciCheck's primary user journey.
- **MUST:** Keep the submit button ("Run Autonomous Audit") enabled until the network request starts, then disable and display an active spinner while retaining the button label ("Verifying Assertions…").
- **MUST:** Automatically trim leading/trailing whitespace before dispatching claims to the NLP extraction pipeline.
- **MUST:** Provide live word count and character count indicators beneath the input console.
- **SHOULD:** Include quick "Clear", "Paste", and "Sample Presets" chips directly accessible within the console card.
- **SHOULD:** Placeholders must end with an ellipsis character (`…`) and exhibit realistic AI output syntax.
- **MUST:** Ensure toggle switches (e.g. "Aggressive Mode", "Source Depth", "CrossRef & DOI Audit") have zero dead zones: the label and checkbox must share a single clickable wrapper.

---

## 4. Dynamic Results Dashboard & Factual Highlighting

### Overall Certainty Ring
- **MUST:** Display an Overall Certainty Ring with quantitative percentage and categorical risk tiers:
  - `HIGH CERTAINTY` (Soft Green, Low Hallucination Risk)
  - `MODERATE RISK` (Light Amber, Partial Fact Discrepancies)
  - `HIGH HALLUCINATION RISK` (Soft Red, Contradicted Claims or Fabrications)
- **MUST:** Progress bars for confidence tiers (High 80–100%, Moderate 50–79%, Low <50%) must use `font-variant-numeric: tabular-nums` for rock-solid visual alignment.

### Metrics Cards Grid
- **MUST:** Compact light stat blocks displaying:
  1. Total Claims Checked
  2. Verified Count (Soft Green)
  3. Suspicious Count (Light Amber)
  4. Hallucinated Count (Soft Red)

### Interactive Highlighted Text Viewer
- **MUST:** Render original text sentence-by-sentence with clear semantic background tint and bottom border highlight:
  - Soft Green for verified assertions
  - Light Amber for suspicious assertions
  - Soft Red for hallucinated assertions
- **MUST:** Every highlighted sentence span must be keyboard-focusable (`tabIndex={0}`) and triggerable via `Enter` or `Space`.
- **MUST:** Clicking or activating any sentence must pop up the deep inspection card displaying:
  1. The exact claim assertion.
  2. Verification status and confidence score (e.g. `94% Certainty`).
  3. Deep factual rationale explaining why the claim was confirmed or flagged.
  4. Clickable direct links to corroborated ground-truth sources (Wikipedia, CrossRef, DuckDuckGo).
- **MUST:** Include an explicit `✕ Close` button on inspection popups to allow clean dismissal.

### Redundant Status Cues (Color-Blind Accessibility)
- **MUST:** NEVER rely on color alone to communicate factual certainty. Every status indication must combine **color + icon + text label**:
  - **Verified:** Soft Green + `CheckCircle2` icon + `VERIFIED` label.
  - **Suspicious:** Light Amber + `AlertTriangle` icon + `SUSPICIOUS` label.
  - **Hallucinated:** Soft Red + `XCircle` icon + `HALLUCINATED` label.

---

## 5. LocalStorage Data Bridge & History

- **MUST:** Read and write active payload via `hallucicheck_last_result` inside guarded `try/catch` blocks.
- **MUST:** Persist historical scans in `hallucicheck_history`.
- **MUST:** Gracefully handle missing, empty, or corrupted localStorage data without throwing unhandled runtime exceptions.
- **MUST:** When a historical item is selected from the History drawer, load it into the active report state and smoothly scroll to the Results Dashboard.

---

## 6. Interactions & Keyboard Navigation

### Keyboard
- **MUST:** Global shortcut support:
  - `⌘N` / `Ctrl+N`: Instantly initialize a new verification session.
  - `⌘+Enter` / `Ctrl+Enter` inside prompt `<textarea>`: Trigger autonomous verification immediately.
  - `Esc`: Dismiss highlighted sentence inspect cards, popovers, and mobile drawers.
- **MUST:** Visible focus rings using `:focus-visible` (e.g., `focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none`).
- **NEVER:** Use `outline: none` without providing an explicit visible focus replacement.

### Targets & Input
- **MUST:** Interactive hit targets ≥24px (mobile ≥44px).
- **MUST:** Set `<textarea>` and `<input>` font size ≥16px on mobile viewports to prevent iOS Safari auto-zoom.
- **NEVER:** Disable viewport scaling (`user-scalable=no`, `maximum-scale=1`).
- **MUST:** Apply `touch-action: manipulation` across all buttons and interactive sentence spans to eliminate 300ms double-tap delay.

---

## 7. Motion & Animation Choreography

- **MUST:** Honor `prefers-reduced-motion: reduce`. Provide reduced variants or disable atmospheric animations when requested by system preferences.
- **MUST:** Animate compositor-friendly CSS properties only (`transform`, `opacity`).
- **NEVER:** Animate layout-triggering properties (`top`, `left`, `width`, `height`, `margin`, `padding`).
- **NEVER:** Use raw `transition: all`. Explicitly enumerate targeted properties (`transition: transform 0.2s ease, opacity 0.2s ease`).
- **MUST:** The SVG Certainty Ring animation must set `transform-box: fill-box` and animate `stroke-dashoffset` smoothly.

---

## 8. Typography, Content & Layout

- **MUST:** Typography hierarchy:
  - Headings: `Plus Jakarta Sans`, font weights `700` and `800`.
  - Body & UI: `Inter`, weights `400`, `500`, `600`.
  - Scores, IDs, DOIs & JSON: `JetBrains Mono`.
- **MUST:** Numeric values and tables must enforce `tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent jitter.
- **MUST:** Text containers handling user-generated AI responses must feature overflow containment (`min-w-0`, `break-words`, `truncate`, or `line-clamp-*`).
- **MUST:** Prevent Cumulative Layout Shift (CLS)—allocate explicit dimension containers or skeleton cards for certainty gauges and charts.
- **MUST:** Non-breaking spaces on key combinations: `⌘&nbsp;N`, `Ctrl&nbsp;Enter`, `4.184&nbsp;J/g·°C`.
- **SHOULD:** Use curly quotes (“ ”) in rationale quotes and typography blocks.

---

## 9. Performance & Network Standards

- **MUST:** Mutations and verification dispatches must target responsiveness in <500ms before displaying pipeline progress.
- **MUST:** Export actions (JSON, TXT, Print) must execute client-side instantaneously without requiring server re-computation.
- **SHOULD:** Preconnect to official external knowledge APIs:
  - `<link rel="preconnect" href="https://en.wikipedia.org">`
  - `<link rel="preconnect" href="https://api.crossref.org">`
