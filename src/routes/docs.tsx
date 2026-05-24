import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Ingest API — TalentDash" },
      { name: "description", content: "POST salary records into TalentDash from your Python pipeline." },
    ],
  }),
  component: DocsPage,
});

const example = `curl -X POST https://YOUR-DOMAIN/api/public/ingest-salary \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "ambitionbox-scraper",
    "records": [
      {
        "company": "Razorpay",
        "role": "Software Engineer",
        "level": "SDE-II",
        "location": "Bangalore",
        "experience_years": 3.5,
        "base_salary": "28-32 LPA",
        "bonus": "3 LPA",
        "stock": "8 LPA",
        "source_platform": "ambitionbox",
        "source_url": "https://www.ambitionbox.com/...",
        "scraped_at": "2026-05-24T12:00:00Z"
      }
    ]
  }'`;

const sample = `{
  "run_id": "…",
  "accepted": 1,
  "rejected": [],
  "duplicates": 0,
  "low_confidence": 0
}`;

export default function DocsPage() {
  return <DocsPage_ />;
}
function DocsPage_() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Ingest API</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your Python pipeline (Playwright scrapers, LLM normalizer) POSTs validated batches here.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Endpoint</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <code className="bg-muted px-2 py-1 rounded">POST /api/public/ingest-salary</code>
          </div>
          <p className="text-muted-foreground">
            Authentication is a Bearer API key. Batches up to <strong>100 records</strong> per call.
            Single records and bare arrays are also accepted.
          </p>
          <p className="text-muted-foreground">
            Rate limit: 60 requests/minute per API key (token bucket).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Request</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-md p-4 overflow-auto text-xs">{example}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Response</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted rounded-md p-4 overflow-auto text-xs">{sample}</pre>
          <p className="text-sm text-muted-foreground mt-3">
            Per-record validation failures appear in <code>rejected[]</code> — the batch does not abort on a single bad record.
            Records with <code>confidence_score &lt; 0.6</code> are stored with status <code>pending_review</code> and surfaced in the admin review queue.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Server-side processing</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Each record runs through: <strong>validate → parse salary → normalize company → standardize level → dedup hash → confidence score → insert</strong>.</p>
          <p>Duplicate detection collapses identical (company, role, level, location, experience bucket, salary bucket) submissions within a 30-day window.</p>
          <p>Confidence is weighted across field completeness (25%), salary parse reliability (35%), level inference reliability (25%), and source trust (15%).</p>
        </CardContent>
      </Card>
    </main>
  );
}
