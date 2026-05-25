import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseSalaryToINR } from "@/lib/ingest/salary-parser";

const entryInput = z.object({
  company_name: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  level: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  experience_years: z.number().min(0).max(60),
  base_salary: z.union([z.string().min(1), z.number().positive()]),
  bonus: z.union([z.string(), z.number().nonnegative()]).optional().nullable(),
  stock: z.union([z.string(), z.number().nonnegative()]).optional().nullable(),
  start_date: z.string().min(1),
  end_date: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

function toINR(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Math.round(v);
  const parsed = parseSalaryToINR(v);
  return parsed ?? 0;
}

export const listMyEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_career_entries")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertMyEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; entry: z.infer<typeof entryInput> }) =>
    z.object({ id: z.string().uuid().optional(), entry: entryInput }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const base = toINR(data.entry.base_salary);
    if (base <= 0) throw new Error("Base salary is required");
    const row = {
      user_id: userId,
      company_name: data.entry.company_name.trim(),
      role: data.entry.role.trim(),
      level: data.entry.level?.trim() || null,
      location: data.entry.location?.trim() || null,
      experience_years: data.entry.experience_years,
      base_salary: base,
      bonus: toINR(data.entry.bonus ?? 0),
      stock: toINR(data.entry.stock ?? 0),
      start_date: data.entry.start_date,
      end_date: data.entry.end_date || null,
      notes: data.entry.notes?.trim() || null,
    };
    if (data.id) {
      const { error } = await supabase
        .from("user_career_entries")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await supabase
      .from("user_career_entries")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteMyEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_career_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * For each of the user's entries, fetch market benchmarks (median + p25/p75 of
 * total comp) from approved salary_records matching the role (ilike) and
 * experience window of ±2 years.
 */
export const getMyBenchmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: entries, error } = await context.supabase
      .from("user_career_entries")
      .select("id, role, experience_years, total_compensation, start_date")
      .order("start_date", { ascending: true });
    if (error) throw new Error(error.message);

    const out: Array<{
      id: string;
      role: string;
      start_date: string;
      experience_years: number;
      user_tc: number;
      median: number | null;
      p25: number | null;
      p75: number | null;
      sample_size: number;
    }> = [];

    for (const e of entries ?? []) {
      const expMin = Math.max(0, Number(e.experience_years) - 2);
      const expMax = Number(e.experience_years) + 2;
      const { data: rows } = await supabaseAdmin
        .from("salary_records")
        .select("total_compensation")
        .eq("status", "approved")
        .ilike("role", `%${e.role}%`)
        .gte("experience_years", expMin)
        .lte("experience_years", expMax)
        .limit(1000);
      const tcs = (rows ?? [])
        .map((r) => Number(r.total_compensation))
        .filter((n) => isFinite(n) && n > 0)
        .sort((a, b) => a - b);
      const pct = (p: number) =>
        tcs.length ? tcs[Math.min(tcs.length - 1, Math.floor((tcs.length - 1) * p))] : null;
      out.push({
        id: e.id,
        role: e.role,
        start_date: e.start_date,
        experience_years: Number(e.experience_years),
        user_tc: Number(e.total_compensation ?? 0),
        median: pct(0.5),
        p25: pct(0.25),
        p75: pct(0.75),
        sample_size: tcs.length,
      });
    }
    return out;
  });
