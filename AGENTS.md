# HalluciCheck: Autonomous AI Hallucination Verification System
## Developer & Agent Interface Guidelines (`AGENTS.md`)

Concise, authoritative rules for building an accessible, high-performance, and delightful verification workspace interface for **HalluciCheck** (Autonomous AI Hallucination & Citation Verification System).

Decisions in this codebase are governed strictly by **MUST**, **SHOULD**, and **NEVER** directives. Every agent and contributor modifying frontend, backend, or full-stack contracts must strictly adhere to these standards.

---

## 1. Project Context & Architectural Vibe

- **Product:** HalluciCheck Web LLM & Fact-Auditing Workspace (ChatGPT / Claude web UI aesthetic).
- **Core Stack:** React 18, Vite, TypeScript, Tailwind CSS, FastAPI, SQLite.
- **Palette & Theme:** Deep obsidian/midnight background (`#090d16`), accompanied by neon cyan (`#06b6d4`) and emerald (`#10b981`) glowing accents, amber (`#f59e0b`) caution states, and rose (`#ef4444`) contradiction alerts.
- **Layout Architecture:** Sidebar-driven multi-view workspace (`#hub`, `#console`, `#results`, `#history`).
- **Zero Auth Wall:** NEVER reintroduce a login requirement or blocker modal. Access to the verification workspace and diagnostic tools must remain direct and friction-free.

---

## 2. Interactions & Keyboard Navigation

### Keyboard
- **MUST:** Full keyboard accessibility per [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) across all interactive components (sidebar tabs, preset cards, claim accordions, sentence highlights, source buttons).
- **MUST:** Global shortcut support:
  - `⌘N` / `Ctrl+N`: Instantly initialize a new verification session (`#console`).
  - `⌘+Enter` / `Ctrl+Enter` inside prompt `<textarea>`: Trigger autonomous verification immediately.
  - `Esc`: Dismiss highlighted sentence inspect cards, popovers, and mobile drawers.
- **MUST:** Visible, high-contrast focus rings using `:focus-visible` (e.g., `focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none`).
- **MUST:** Group focus within container components using `:focus-within` to maintain cohesive card context.
- **NEVER:** Use `outline: none` without providing an explicit, high-contrast visible focus replacement.
- **MUST:** Ensure sticky headers, mobile action bars, and overlays never obscure focused elements.

### Targets & Input
- **MUST:** Interactive hit targets ≥24px (mobile ≥44px). When visual icon/button size is smaller (e.g. 16px copy icon), expand the hit area via padding (`p-2.5` or `p-3`).
- **MUST:** Set `<textarea>` and `<input>` font size ≥16px on mobile viewports to prevent iOS Safari auto-zoom.
- **NEVER:** Disable viewport scaling (`user-scalable=no`, `maximum-scale=1`).
- **MUST:** Apply `touch-action: manipulation` across all buttons and interactive sentence spans to eliminate 300ms double-tap delay.
- **SHOULD:** Style `-webkit-tap-highlight-color: transparent` and use native Tailwind state transitions instead.

---

## 3. Analysis Console & Verification Forms

### Prompts & Textareas
- **NEVER:** Block paste in `<textarea>` or `<input>`. Pasting multi-paragraph AI outputs from ChatGPT, Claude, or research papers is HalluciCheck's primary user journey.
- **MUST:** Accept raw input and validate asynchronously—never block typing or truncate without user warning.
- **MUST:** Keep the submit button ("Run Autonomous Audit") enabled until the network request starts, then disable and display an active spinner while retaining the button label ("Verifying Assertions…").
- **MUST:** Automatically trim leading/trailing whitespace before dispatching claims to the NLP extraction pipeline.
- **MUST:** Provide live word count and character count indicators beneath the input console.
- **SHOULD:** Include quick "Clear", "Paste from Clipboard", and "Sample Presets" chips directly accessible within or adjacent to the console.
- **SHOULD:** Placeholders must end with an ellipsis character (`…`) and exhibit realistic AI output syntax.

### Toggles & Controls
- **MUST:** Ensure toggle switches (e.g. "Aggressive Mode", "Source Depth", "CrossRef & DOI Audit") have zero dead zones: the label and checkbox must share a single clickable wrapper.
- **MUST:** Surface inline error notifications immediately if backend services or fallback client engines fail.

---

## 4. State Management, Routing & LocalStorage Bridge

### Deep Linking & Navigation
- **MUST:** Reflect active workspace state in the URL hash (`#hub`, `#console`, `#results`, `#history`) to enable browser back/forward navigation and bookmarking.
- **MUST:** Support browser history restoration: hitting "Back" from `#results` must return to `#console` or `#hub` with previous text intact.
- **MUST:** Use semantic `<a>` tags for outbound documentation or source references (with `target="_blank"` and `rel="noopener noreferrer"`).
- **NEVER:** Use a `<div onClick>` where a semantic `<button>` or `<a href>` is required.

### LocalStorage Data Bridge
- **MUST:** Read and write payloads via `hallucicheck_last_result` and `hallucicheck_history` inside guarded `try/catch` blocks.
- **MUST:** Gracefully handle missing, empty, or corrupted localStorage data without throwing unhandled runtime exceptions.
- **MUST:** Keep the recent scans list synchronized between the sidebar, hub, and history table.
- **MUST:** When a historical item is selected from `#history`, load it into the active report state and navigate directly to `#results` without requiring a re-run.

---

## 5. System Feedback & Multi-Stage Pipeline States

- **MUST:** Multi-stage verification progress pipeline must visually communicate each step:
  1. `Stage 01: Claim Extraction & Segmentation`
  2. `Stage 02: Neutral Verification Probe`
  3. `Stage 03: Multi-Source Ground Truth Query`
  4. `Stage 04: Calibrated Certainty & DOI Resolution`
- **MUST:** Announce status changes and live audit completions to assistive tech using polite `aria-live="polite"` regions.
- **SHOULD:** Provide optimistic UI feedback when copying report summaries, exporting JSON/TXT, or deleting history items.
- **MUST:** Require explicit confirmation before executing destructive data operations (e.g., "Purge All Verification Logs").
- **SHOULD:** Use real unicode ellipsis (`…`), never triple periods (`...`), for loading and pending states ("Extracting claims…").

---

## 6. Motion & Animation Choreography

- **MUST:** Honor `prefers-reduced-motion: reduce`. Provide reduced variants or disable atmospheric animations when requested by system preferences.
- **MUST:** Animate compositor-friendly CSS properties only (`transform`, `opacity`).
- **NEVER:** Animate layout-triggering properties (`top`, `left`, `width`, `height`, `margin`, `padding`).
- **NEVER:** Use raw `transition: all`. Explicitly enumerate targeted properties (`transition: transform 0.2s ease, opacity 0.2s ease`).
- **MUST:** Ensure all verification and loading animations are interruptible.
- **MUST:** The SVG Certainty Ring animation must set `transform-box: fill-box` and animate `stroke-dashoffset` smoothly.
- **SHOULD:** Atmospheric background glows (`.ambient-glow-mesh`) must remain low-cost, muted, and non-blocking (`pointer-events-none`).

---

## 7. Results Dashboard & Factual Highlighting

### Redundant Status Cues (Color-Blind Accessibility)
- **MUST:** NEVER rely on color alone to communicate factual certainty. Every status indication must combine **color + icon + text label**:
  - **Verified:** Emerald (`#10b981`) + `CheckCircle2` icon + `VERIFIED` label.
  - **Suspicious:** Amber (`#f59e0b`) + `AlertTriangle` icon + `SUSPICIOUS` label.
  - **Hallucinated:** Rose (`#ef4444`) + `XCircle` icon + `HALLUCINATED` label.
- **MUST:** Ensure high text-to-background contrast ratios against dark surfaces, meeting APCA standards.

### Interactive Highlighted Text Viewer
- **MUST:** Render original text sentence-by-sentence with clear semantic background tint and bottom border highlight.
- **MUST:** Every highlighted sentence span must be keyboard-focusable (`tabIndex={0}`) and triggerable via `Enter` or `Space`.
- **MUST:** Clicking or activating any sentence must pop up the deep inspection card displaying:
  1. The exact claim assertion.
  2. Verification status and confidence score (e.g. `94% Certainty`).
  3. Deep factual rationale explaining why the claim was confirmed or flagged.
  4. Clickable direct links to corroborated ground-truth sources.
- **MUST:** Include an explicit `✕ Close` button on inspection popups to allow clean dismissal.

### Certainty Ring & Metrics Breakdown
- **MUST:** Display an Overall Certainty Ring with quantitative percentage and categorical risk tiers:
  - `HIGH CERTAINTY` (Low Hallucination Risk)
  - `MODERATE RISK` (Partial Fact Discrepancies)
  - `HIGH HALLUCINATION RISK` (Contradicted Claims or Fabrications)
- **MUST:** Progress bars for confidence tiers (High 80–100%, Moderate 50–79%, Low <50%) must use `font-variant-numeric: tabular-nums` for rock-solid visual alignment.
- **MUST:** Display indicators confirming the count of independent ground-truth sources queried (Wikipedia REST, CrossRef, DuckDuckGo, EuropePMC).

---

## 8. Typography, Content & Layout

- **MUST:** Typography hierarchy:
  - Headings: `Plus Jakarta Sans`, font weights `700` and `800`.
  - Body & UI: `Inter`, weights `400`, `500`, `600`.
  - Scores, IDs, DOIs & JSON: `JetBrains Mono`.
- **MUST:** Numeric values and tables must enforce `tabular-nums` (`font-variant-numeric: tabular-nums`) to prevent jitter.
- **MUST:** Text containers handling user-generated AI responses must feature overflow containment (`min-w-0`, `break-words`, `truncate`, or `line-clamp-*`).
- **MUST:** Prevent Cumulative Layout Shift (CLS)—allocate explicit dimension containers or skeleton cards for certainty gauges and charts.
- **MUST:** Maintain optical alignment across icon-text lockups; adjust ±1px when visual perception beats strict geometry.
- **MUST:** Non-breaking spaces on key combinations: `⌘&nbsp;N`, `Ctrl&nbsp;Enter`, `4.184&nbsp;J/g·°C`.
- **SHOULD:** Use curly quotes (“ ”) in rationale quotes and typography blocks.
- **SHOULD:** Apply `translate="no"` to technical identifiers, DOIs, model names (`GPT-4o`, `Claude 3.5`), and brand tokens.

---

## 9. Performance & Network Standards

- **MUST:** Mutations and verification dispatches must target responsiveness in <500ms before displaying pipeline progress.
- **MUST:** Virtualize or paginate claim lists if an analyzed response contains >50 atomic claims.
- **MUST:** Export actions (JSON, TXT, Print) must execute client-side instantaneously without requiring server re-computation.
- **SHOULD:** Preconnect to official external knowledge APIs:
  - `<link rel="preconnect" href="https://en.wikipedia.org">`
  - `<link rel="preconnect" href="https://api.crossref.org">`
- **MUST:** Profile with CPU/network throttling to ensure smooth 60fps animations even on mobile devices.

---

## 10. Dark Mode & Surface Engineering

- **MUST:** Explicitly enforce `color-scheme: dark` on `<html>`.
- **MUST:** Maintain the deep obsidian surface structure:
  - Base canvas: `#090d16`
  - Glass panels: `rgba(14, 21, 38, 0.75)` with `backdrop-filter: blur(20px)`
  - Fine borders: `1px solid rgba(255, 255, 255, 0.08)`
  - Glowing accents: `rgba(6, 182, 212, 0.25)` and `rgba(16, 185, 129, 0.25)`
- **NEVER:** Introduce harsh solid gray borders or default white backgrounds.
- **SHOULD:** Maintain concentric nested radii: inner content card radius must strictly be smaller than outer shell wrapper radius (`rounded-2xl` wrapping `rounded-xl`).
