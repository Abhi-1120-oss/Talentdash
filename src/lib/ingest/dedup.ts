import { createHash } from "crypto";

/**
 * Stable dedup hash. Identical (company, role, level, location, experience bucket)
 * within the same 30-day window collapse to the same record.
 */
export function dedupHash(input: {
  company_slug: string;
  role: string;
  level: string;
  location: string | null;
  experience_years: number;
  base_salary: number;
  submitted_at?: Date;
}): string {
  const at = input.submitted_at ?? new Date();
  // 30-day bucket
  const bucket = Math.floor(at.getTime() / (1000 * 60 * 60 * 24 * 30));
  // Round experience to 0.5y bucket and salary to nearest 1L to absorb noise
  const expBucket = Math.round(input.experience_years * 2) / 2;
  const salBucket = Math.round(input.base_salary / 100_000) * 100_000;
  const key = [
    input.company_slug,
    input.role.toLowerCase().trim(),
    input.level,
    (input.location ?? "").toLowerCase().trim(),
    expBucket,
    salBucket,
    bucket,
  ].join("|");
  return createHash("sha256").update(key).digest("hex");
}
