import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ingestBatch } from "@/lib/ingest/ingest.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public manual-submission server function (no API key required). */
export const submitSalary = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        company: z.string().min(1).max(200),
        role: z.string().min(1).max(200),
        level: z.string().max(100).optional(),
        location: z.string().max(200).optional(),
        experience_years: z.number().min(0).max(50),
        base_salary: z.union([z.string(), z.number()]),
        bonus: z.union([z.string(), z.number()]).optional(),
        stock: z.union([z.string(), z.number()]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const res = await ingestBatch({
      source: "web-submit",
      records: [{ ...data, source_platform: "manual" as const }],
    });
    return res;
  });

/** Admin-only: ingestion quality metrics. */
export const getQualityMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden: admin only");

    const { data: runs } = await supabaseAdmin
      .from("ingestion_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    const { count: totalApproved } = await supabaseAdmin
      .from("salary_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");
    const { count: totalPending } = await supabaseAdmin
      .from("salary_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_review");
    const { count: totalRejected } = await supabaseAdmin
      .from("salary_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected");

    const { data: confidenceSample } = await supabaseAdmin
      .from("salary_records")
      .select("confidence_score")
      .limit(1000);

    const buckets = { low: 0, mid: 0, high: 0 };
    (confidenceSample ?? []).forEach((r) => {
      const c = Number(r.confidence_score);
      if (c < 0.6) buckets.low++;
      else if (c < 0.85) buckets.mid++;
      else buckets.high++;
    });

    return {
      runs: runs ?? [],
      totals: {
        approved: totalApproved ?? 0,
        pending: totalPending ?? 0,
        rejected: totalRejected ?? 0,
      },
      confidenceBuckets: buckets,
    };
  });

export const getReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden: admin only");

    const { data } = await supabaseAdmin
      .from("salary_records")
      .select(
        "id, role, level_standardized, location, experience_years, base_salary, bonus, stock, total_compensation, confidence_score, status, raw_payload, companies(name, slug)",
      )
      .in("status", ["pending_review", "rejected"])
      .order("confidence_score", { ascending: true })
      .limit(100);

    return data ?? [];
  });

export const reviewRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approve" | "reject" }) =>
    z.object({ id: z.string().uuid(), decision: z.enum(["approve", "reject"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("Forbidden: admin only");

    const newStatus = data.decision === "approve" ? "approved" : "rejected";
    const { error } = await supabaseAdmin
      .from("salary_records")
      .update({ status: newStatus })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { admin: !!data };
  });
