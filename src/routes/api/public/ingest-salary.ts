import { createFileRoute } from "@tanstack/react-router";
import { verifyApiKey } from "@/lib/ingest/auth.server";
import { rateLimit } from "@/lib/ingest/rate-limit.server";
import { ingestBatch } from "@/lib/ingest/ingest.server";

export const Route = createFileRoute("/api/public/ingest-salary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const apiKeyId = await verifyApiKey(auth);
        if (!apiKeyId) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const rl = rateLimit(`ingest:${apiKeyId}`, 1, { capacity: 60, refillPerSecond: 1 });
        if (!rl.allowed) {
          return new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(rl.retryAfterSeconds),
            },
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        // Accept single record or {source, records}
        if (Array.isArray(body)) {
          body = { source: "api", records: body };
        } else if (body && typeof body === "object" && !("records" in body)) {
          body = { source: "api", records: [body] };
        }

        try {
          const result = await ingestBatch(body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ingest failure";
          return new Response(JSON.stringify({ error: message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization",
          },
        }),
    },
  },
});
