
# TalentDash — Web App + Ingest API (V1)

A compensation intelligence dashboard (India-first, Levels.fyi style) plus a production-grade ingestion endpoint that external Python scrapers POST to.

## Scope

In scope (this project):
- React + TanStack Start dashboard to explore salaries
- `POST /api/public/ingest-salary` — Zod-validated, auth-protected, dedup-aware ingest endpoint
- Postgres schema (Lovable Cloud) with proper indexes + RLS
- Server-side normalization helpers: level standardization, salary parsing, dedup hash, confidence scoring
- API key auth + rate limiting for the ingest endpoint
- Quality metrics page (rejected/duplicate/low-confidence counts)

Out of scope (you'll run separately, as agreed):
- Python Playwright scrapers, GPT-4o-mini normalization, async batching workers — these live in your own repo and POST to the ingest URL.

## Pages

1. `/` — Landing/explorer: search bar, role + company filters, salary distribution chart, recent submissions table
2. `/companies/$slug` — Per-company breakdown by level, with min/median/max base, bonus, stock, total comp
3. `/roles/$role` — Per-role breakdown across companies and levels
4. `/submit` — Manual salary submission form (Zod-validated, same pipeline as ingest API)
5. `/admin/quality` — Ingestion quality dashboard (auth-gated): totals, rejection reasons, confidence distribution, null-rate per field, duplicates skipped
6. `/admin/review` — Human-review queue for `confidence_score < 0.6` records

## Database (Lovable Cloud / Postgres)

```text
companies(id, name, slug, normalized_name, created_at)
  unique(slug), index(normalized_name)

salary_records(
  id, company_id, role, level_standardized, location, experience_years,
  base_salary, bonus, stock, total_compensation,
  source_platform, source_url, scraped_at, submitted_at,
  confidence_score, status [approved|pending_review|rejected],
  dedup_hash, raw_payload jsonb
)
  unique(dedup_hash),
  index(company_id, role, level_standardized),
  index(status, confidence_score)

ingestion_runs(id, source, started_at, finished_at, scraped, accepted,
  rejected, duplicates, low_confidence, error_summary jsonb)

api_keys(id, key_hash, label, created_at, revoked_at, last_used_at)
```

RLS: `salary_records` readable by anyone where `status = 'approved'`; writes only via server functions / API key. `ingestion_runs` + `api_keys` admin-only.

## Ingest API

`POST /api/public/ingest-salary`

- Auth: `Authorization: Bearer <api_key>` checked against `api_keys.key_hash` (sha256, timing-safe compare)
- Body: array of records (batch up to 100) OR single record
- Per record: Zod validation → company normalization → level standardization → dedup-hash lookup → confidence scoring → insert
- Response: `{ run_id, accepted, rejected: [{index, reason}], duplicates, low_confidence }`
- Partial-batch success: one bad record never fails the batch

Validation rules (Zod):
- `company`: trimmed, 1–200 chars
- `role`: 1–200 chars
- `experience_years`: 0–50
- `base_salary` > 0, currency INR assumed, accepts ranges like `"10-15 LPA"` (parser → numeric)
- `confidence_score` server-computed, ignored if client-sent
- `total_compensation` server-computed (base + bonus + stock)
- Reject malformed → recorded in `ingestion_runs.error_summary`

## Server modules (TypeScript, all `.server.ts` or `.functions.ts`)

```text
src/lib/ingest/
  schemas.ts          # Zod models + enums (Level, Status, SourcePlatform)
  salary-parser.ts    # "₹10-15 LPA" → {min, max, avg} in absolute INR
  company-normalize.ts# trim/lowercase + slug + fuzzy match (existing companies)
  level-standardize.ts# rules: "SDE II" → SDE-II, exp-aware fallbacks
  dedup.ts            # sha256(company+role+level+location+window)
  confidence.ts       # weighted score: completeness, parse, dedup, level
  ingest.server.ts    # orchestration: validate→normalize→dedup→score→insert
  auth.server.ts      # API key verification (timing-safe)
  rate-limit.server.ts# in-memory token bucket per api_key (per-instance)
```

## Tech details

- TanStack Start file routes, `createServerFn` for app reads, `createFileRoute` server handler under `src/routes/api/public/ingest-salary.ts` for the external endpoint
- TanStack Query for dashboard data
- shadcn/ui + Recharts for charts
- Drizzle-style raw SQL through the Lovable Cloud Postgres client (project uses Supabase under the hood — surfaced as Lovable Cloud)
- Migrations created via the managed DB tooling

## Build order

1. Enable Lovable Cloud, create schema + RLS, seed 1 API key
2. Implement `src/lib/ingest/*` modules with unit-test-friendly pure functions
3. Build `/api/public/ingest-salary` route, test with `invoke-server-function`
4. Build read server fns (list companies, company detail, role detail, quality metrics)
5. Build pages: `/`, `/companies/$slug`, `/roles/$role`, `/submit`
6. Build admin pages `/admin/quality`, `/admin/review` behind auth
7. Seed sample data, QA each page, document API in README route or `/docs`

## Known limitations (called out up front)

- Rate limiting is per-instance in-memory (not global) — acceptable for V1, swap to Postgres-backed counter if you scale horizontally
- Fuzzy company matching uses Levenshtein on normalized names only; no LLM disambiguation in the web tier (your Python pipeline handles that before POSTing)
- No auth for end-users in V1 — admin pages use a single password / single admin role via Lovable Cloud auth

Reply "approve" (or tweak any step) and I'll switch to build mode and ship it.
