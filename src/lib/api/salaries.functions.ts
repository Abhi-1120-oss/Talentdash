import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Public list of companies with submission counts. */
export const listCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("id, name, slug")
    .order("name");
  if (error) throw new Error(error.message);

  const { data: counts } = await supabaseAdmin
    .from("salary_records")
    .select("company_id")
    .eq("status", "approved");

  const countMap = new Map<string, number>();
  (counts ?? []).forEach((r) => countMap.set(r.company_id, (countMap.get(r.company_id) ?? 0) + 1));

  return (companies ?? []).map((c) => ({ ...c, count: countMap.get(c.id) ?? 0 }));
});

export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, slug")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!company) return null;

    const { data: records } = await supabaseAdmin
      .from("salary_records")
      .select("id, role, level_standardized, location, experience_years, base_salary, bonus, stock, total_compensation, confidence_score, submitted_at")
      .eq("company_id", company.id)
      .eq("status", "approved")
      .order("total_compensation", { ascending: false })
      .limit(500);

    return { company, records: records ?? [] };
  });

export const getRole = createServerFn({ method: "GET" })
  .inputValidator((d: { role: string }) => z.object({ role: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { data: records } = await supabaseAdmin
      .from("salary_records")
      .select("id, company_id, role, level_standardized, location, experience_years, base_salary, bonus, stock, total_compensation, confidence_score, companies(name, slug)")
      .ilike("role", `%${data.role}%`)
      .eq("status", "approved")
      .order("total_compensation", { ascending: false })
      .limit(500);
    return records ?? [];
  });

export const searchSalaries = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string }) => z.object({ q: z.string().max(200).optional() }).parse(d))
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("salary_records")
      .select("id, role, level_standardized, location, experience_years, base_salary, bonus, stock, total_compensation, confidence_score, submitted_at, companies(name, slug)")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false })
      .limit(100);
    if (data.q && data.q.trim()) {
      query = query.or(`role.ilike.%${data.q}%,level_standardized.ilike.%${data.q}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
