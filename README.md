# HalluciCheck

**AI-generated content verification and hallucination detection system.**

Paste text produced by ChatGPT, Claude, Gemini, or any other model. HalluciCheck
breaks it into individual claims, checks each one against evidence, validates
any citations, and gives you a clinical confidence score instead of a blind
"trust me."

> **Status:** this is the first vertical slice of a larger rebuild — the
> Verify → Results flow, backed by real SQLite persistence and a React +
> TypeScript frontend. Dashboard, history, and settings pages are the next
> slice; see "What's not built yet" below.

---

## How it works

```
Paste AI output
      |
      v
POST /api/verify
      |
      v
Claim extraction (sentence splitting + classification)
      |
      v
Fact-checking (live search -> LLM judge -> demo heuristics, in that order
of preference, depending on what API keys are configured)
      |
      v
Citation / DOI validation
      |
      v
Confidence scoring + verified/suspicious/hallucinated distribution
      |
      v
Persisted to SQLite -> JSON response -> rendered in the React app
```

The app **never crashes because a key is missing**. If no search or LLM
provider is configured, it runs in **DEMO MODE**: a deterministic, rule-based
engine with a small curated knowledge base (Chennai, Paris, the Eiffel Tower,
Marie Curie's Nobel Prizes, the Moon, quantum entanglement, etc.) plus
generic heuristics for anything else. This is clearly flagged in the UI and
in the API response (`"demo_mode": true`).

---

## Tech stack

- **Backend:** Python 3.11+, FastAPI, httpx (async HTTP), Pydantic v2,
  SQLAlchemy 2.0 + SQLite for persistence
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Recharts (donut
  chart), lucide-react (icons)

---

## Project structure

```
hallucicheck/
├── backend/
│   ├── config.py                     # env-based settings, demo-mode detection
│   ├── db.py                         # SQLAlchemy engine/session (SQLite)
│   ├── models.py                     # ORM models: reports, claims, citations
│   ├── schemas.py                    # Pydantic request/response models
│   ├── main.py                       # FastAPI app + routes
│   └── services/
│       ├── claim_extractor.py        # text -> atomic, classified claims
│       ├── fact_checker.py           # per-claim verification (search / LLM / demo)
│       ├── citation_validator.py     # DOI / URL / academic citation checks
│       └── confidence_scorer.py      # aggregate scoring + distribution
├── frontend/
│   ├── src/
│   │   ├── api/client.ts             # fetch wrapper for /api/verify, /api/health
│   │   ├── components/               # InputEditor, VerifyView, ResultsView, etc.
│   │   ├── types.ts                  # TS mirror of schemas.py
│   │   └── App.tsx
│   ├── index.html, vite.config.ts, tailwind.config.js
│   └── package.json
├── requirements.txt
├── .env.example
└── README.md
```

---

## Local development

### 1. Backend

```bash
cd hallucicheck
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env             # leave keys blank to run in fallback mode
cd backend
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`. A `hallucicheck.db` SQLite
file is created automatically on first run in `backend/`. Check the API with:

```bash
curl http://localhost:8000/api/health
```

### 2. Frontend

```bash
cd hallucicheck/frontend
npm install
cp .env.example .env             # optional — defaults to http://localhost:8000
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). The app calls
the backend at `VITE_API_BASE` (see `.env` / `src/api/client.ts`).

> This slice has no build-tool network access baked into the sandbox where
> it was written, so `npm install` has not been run here — install and run
> it locally to actually launch the app.

---

## Environment variables

### Backend (`.env` at project root)

| Variable | Required? | Purpose |
|---|---|---|
| `PORT` | No (default 8000) | Backend port |
| `FRONTEND_URL` | No | Used for CORS in production |
| `DATABASE_URL` | No (default `sqlite:///./hallucicheck.db`) | SQLAlchemy connection string |
| `OPENAI_API_KEY` | No | Enables LLM-judge fact-checking fallback |
| `ANTHROPIC_API_KEY` | No | Same, alternative provider |
| `TAVILY_API_KEY` | No | Enables live web search evidence retrieval (preferred) |
| `SERPAPI_API_KEY` | No | Alternative live search provider |
| `MAX_INPUT_CHARS` | No (default 5000) | Input size limit |
| `MAX_CLAIMS_PER_REQUEST` | No (default 40) | Caps claims processed per request |
| `REQUEST_TIMEOUT_SECONDS` | No (default 8) | Timeout for outbound HTTP calls |

**Leave every provider key blank to run entirely offline in fallback mode.**

### Frontend (`frontend/.env`)

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_API_BASE` | No (default `http://localhost:8000`) | Backend base URL |

---

## API reference

### `GET /api/health`
```json
{
  "status": "online",
  "demo_mode": true,
  "providers": { "openai": "not_configured", "anthropic": "not_configured", "tavily": "not_configured", "serpapi": "not_configured", "demo_mode": true },
  "version": "1.0.0"
}
```

### `POST /api/verify`
Same request/response contract as before — see `schemas.py`. Every call now
also persists a row (with its claims and citations) to SQLite.

### `GET /api/verifications/{id}`
Fetches a previously computed report from SQLite (now durable across
restarts — previously this was an in-memory dict that was cleared on
restart).

---

## What's not built yet

This slice is deliberately scoped to Verify → Results. Not yet implemented
(tracked for the next slice):

- Dashboard, Verification History, Saved Reports, Settings, How It Works pages
- Sidebar navigation / multi-page routing
- `GET /api/verifications` (list), `DELETE /api/verifications/{id}`, `GET /api/stats`
- PDF export / share
- Light/dark theme toggle

The React app currently renders a single flow: paste content → analyze →
view the full report → verify again.

---

## Testing checklist

- [ ] `GET /api/health` returns `200` and reflects the correct `demo_mode`
- [ ] Empty input to `/api/verify` returns `400`
- [ ] Input over `MAX_INPUT_CHARS` returns `413`
- [ ] A known-true claim (e.g. "Paris is the capital of France.") comes back `verified`
- [ ] A known-false claim (e.g. "The Moon is a planet.") comes back `hallucinated`
- [ ] An opinion sentence ("I think this is great.") is shown but not scored as a hallucination
- [ ] A fabricated citation is flagged in the citation table
- [ ] Restarting the backend still serves previously created reports via `GET /api/verifications/{id}`
- [ ] The gauge, KPI cards, distribution donut, and claim list all update after a real verification
- [ ] Stopping the backend and clicking "Analyze content" shows a friendly error, not a crash
- [ ] The app works with a completely empty `.env` (pure fallback mode)

---

## Disclaimer

HalluciCheck reduces hallucination risk — it does not eliminate uncertainty.
Confidence scores are evidence-based estimates, not guarantees. Always apply
human judgment for high-stakes decisions.

Built by: Niranchan NS, Hemesh BL, Kiran B Nambiyar, Thanesh.
