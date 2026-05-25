import { z } from "zod";

export const SOURCE_PLATFORMS = ["ambitionbox", "glassdoor", "manual", "other"] as const;
export type SourcePlatform = (typeof SOURCE_PLATFORMS)[number];

export const STANDARD_LEVELS = [
  "Intern",
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
  "L7",
  "L8",
  "SDE-I",
  "SDE-II",
  "SDE-III",
  "Senior",
  "Staff",
  "Principal",
  "Distinguished",
  "Manager",
  "Senior Manager",
  "Director",
  "Unknown",
] as const;
export type StandardLevel = (typeof STANDARD_LEVELS)[number];

/**
 * Input schema for /api/public/ingest-salary.
 * Permissive on inputs (accept salary as number OR string range), strict on shape.
 * confidence_score and total_compensation from clients are ignored — computed server-side.
 */
export const ingestRecordSchema = z.object({
  company: z.string().trim().min(1).max(200),
  role: z.string().trim().min(1).max(200),
  level: z.string().trim().max(100).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  experience_years: z.number().min(0).max(50),
  // Accept "₹10-15 LPA" or a number in absolute INR (rupees)
  base_salary: z.union([z.string().min(1), z.number().positive()]),
  bonus: z.union([z.string(), z.number().nonnegative()]).optional().nullable(),
  stock: z.union([z.string(), z.number().nonnegative()]).optional().nullable(),
  source_platform: z.enum(SOURCE_PLATFORMS).default("manual"),
  source_url: z.string().url().max(2000).optional().nullable(),
  scraped_at: z.string().datetime().optional().nullable(),
});

export type IngestRecordInput = z.infer<typeof ingestRecordSchema>;

export const ingestRequestSchema = z.object({
  source: z.string().trim().min(1).max(100).default("manual"),
  records: z.array(ingestRecordSchema).min(1).max(100),
});

export type IngestRequest = z.infer<typeof ingestRequestSchema>;

/** Internal normalized form, post-processing, ready for DB insert. */
export interface NormalizedRecord {
  company_name: string;
  company_slug: string;
  normalized_company: string;
  role: string;
  level_standardized: StandardLevel;
  location: string | null;
  experience_years: number;
  base_salary: number;
  bonus: number;
  stock: number;
  total_compensation: number;
  source_platform: SourcePlatform;
  source_url: string | null;
  scraped_at: string | null;
  confidence_score: number;
  dedup_hash: string;
  raw_payload: unknown;
}

export interface IngestRejection {
  index: number;
  reason: string;
}

export interface IngestResponse {
  run_id: string;
  accepted: number;
  rejected: IngestRejection[];
  duplicates: number;
  low_confidence: number;
}
