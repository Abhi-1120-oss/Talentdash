import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  ingestRequestSchema,
  type IngestRequest,
  type IngestResponse,
  type IngestRejection,
  type NormalizedRecord,
} from "./schemas";
import { parseSalary } from "./salary-parser";
import { normalizeCompanyName, slugifyCompany, prettyCompanyName } from "./company-normalize";
import { standardizeLevel } from "./level-standardize";
import { dedupHash } from "./dedup";
import { computeConfidence, sourceTrust, REVIEW_THRESHOLD } from "./confidence";

/** Resolve company by normalized name; insert if new. Returns company id. */
async function upsertCompany(rawName: string): Promise<string> {
  const normalized = normalizeCompanyName(rawName);
  const slug = slugifyCompany(rawName);

  const { data: existing } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("normalized_name", normalized)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: inserted, error } = await supabaseAdmin
    .from("companies")
    .insert({
      name: prettyCompanyName(rawName),
      slug,
      normalized_name: normalized,
    })
    .select("id")
    .single();

  if (error) {
    // Race: another worker inserted; re-read
    const { data: again } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("normalized_name", normalized)
      .maybeSingle();
    if (again) return again.id;
    throw new Error(`Failed to upsert company: ${error.message}`);
  }
  return inserted.id;
}

/** Validate -> normalize -> dedup -> score -> insert. */
export async function ingestBatch(payload: unknown): Promise<IngestResponse> {
  const parsed = ingestRequestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid request body: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  const req: IngestRequest = parsed.data;

  // Create ingestion run
  const { data: run, error: runErr } = await supabaseAdmin
    .from("ingestion_runs")
    .insert({ source: req.source, scraped: req.records.length })
    .select("id")
    .single();
  if (runErr || !run) throw new Error(`Failed to create ingestion run: ${runErr?.message}`);

  const rejected: IngestRejection[] = [];
  const normalizedQueue: NormalizedRecord[] = [];
  let duplicates = 0;
  let lowConfidence = 0;

  for (let i = 0; i < req.records.length; i++) {
    const r = req.records[i];
    try {
      const baseParsed = parseSalary(r.base_salary);
      if (!baseParsed) {
        rejected.push({ index: i, reason: "Could not parse base_salary" });
        continue;
      }
      const bonusParsed = parseSalary(r.bonus ?? null);
      const stockParsed = parseSalary(r.stock ?? null);

      const lvl = standardizeLevel(r.level ?? r.role, r.experience_years);

      const company_slug = slugifyCompany(r.company);
      const location = r.location?.trim() || null;

      const hash = dedupHash({
        company_slug,
        role: r.role,
        level: lvl.level,
        location,
        experience_years: r.experience_years,
        base_salary: baseParsed.avg,
      });

      // Field completeness: count of meaningful optional fields filled
      const optionals = [r.location, r.bonus, r.stock, r.level, r.source_url];
      const completeness = optionals.filter((v) => v != null && `${v}`.length > 0).length / optionals.length;

      const confidence = computeConfidence({
        fieldCompleteness: completeness,
        salaryParseConfidence: baseParsed.confidence,
        levelInferenceConfidence: lvl.confidence,
        sourceTrust: sourceTrust(r.source_platform),
      });

      const base = baseParsed.avg;
      const bonus = bonusParsed?.avg ?? 0;
      const stock = stockParsed?.avg ?? 0;

      normalizedQueue.push({
        company_name: prettyCompanyName(r.company),
        company_slug,
        normalized_company: normalizeCompanyName(r.company),
        role: r.role,
        level_standardized: lvl.level,
        location,
        experience_years: r.experience_years,
        base_salary: base,
        bonus,
        stock,
        total_compensation: base + bonus + stock,
        source_platform: r.source_platform,
        source_url: r.source_url ?? null,
        scraped_at: r.scraped_at ?? null,
        confidence_score: confidence,
        dedup_hash: hash,
        raw_payload: r,
      });

      if (confidence < REVIEW_THRESHOLD) lowConfidence++;
    } catch (err) {
      rejected.push({ index: i, reason: err instanceof Error ? err.message : "unknown error" });
    }
  }

  // Insert one by one to handle dedup conflicts and per-record errors gracefully
  let accepted = 0;
  for (let i = 0; i < normalizedQueue.length; i++) {
    const n = normalizedQueue[i];
    try {
      const company_id = await upsertCompany(n.company_name);
      const status = n.confidence_score < REVIEW_THRESHOLD ? "pending_review" : "approved";

      const { error } = await supabaseAdmin.from("salary_records").insert({
        company_id,
        role: n.role,
        level_standardized: n.level_standardized,
        location: n.location,
        experience_years: n.experience_years,
        base_salary: n.base_salary,
        bonus: n.bonus,
        stock: n.stock,
        total_compensation: n.total_compensation,
        source_platform: n.source_platform,
        source_url: n.source_url,
        scraped_at: n.scraped_at,
        confidence_score: n.confidence_score,
        status,
        dedup_hash: n.dedup_hash,
        raw_payload: n.raw_payload as never,
      });

      if (error) {
        if (error.code === "23505") {
          duplicates++;
        } else {
          rejected.push({ index: i, reason: `DB insert: ${error.message}` });
        }
      } else {
        accepted++;
      }
    } catch (err) {
      rejected.push({ index: i, reason: err instanceof Error ? err.message : "insert failure" });
    }
  }

  await supabaseAdmin
    .from("ingestion_runs")
    .update({
      finished_at: new Date().toISOString(),
      accepted,
      rejected: rejected.length,
      duplicates,
      low_confidence: lowConfidence,
      error_summary: rejected.length ? { rejections: rejected.slice(0, 50) } : null,
    })
    .eq("id", run.id);

  return {
    run_id: run.id,
    accepted,
    rejected,
    duplicates,
    low_confidence: lowConfidence,
  };
}
