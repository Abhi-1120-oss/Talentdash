/**
 * Parse messy Indian salary strings into absolute INR rupees.
 *
 * Examples:
 *   "₹10-15 LPA"  -> { min: 1000000, max: 1500000, avg: 1250000 }
 *   "12 LPA"      -> { min: 1200000, max: 1200000, avg: 1200000 }
 *   "8L"          -> { min: 800000, max: 800000, avg: 800000 }
 *   "50000/month" -> { min: 600000, max: 600000, avg: 600000 }
 *   2200000       -> { min: 2200000, max: 2200000, avg: 2200000 }
 */
export interface ParsedSalary {
  min: number;
  max: number;
  avg: number;
  /** 0–1 confidence that the parse is sound */
  confidence: number;
}

const LAKH = 100_000;
const CRORE = 10_000_000;

export function parseSalary(input: string | number | null | undefined): ParsedSalary | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    if (!isFinite(input) || input <= 0) return null;
    return {
      min: Math.round(input),
      max: Math.round(input),
      avg: Math.round(input),
      confidence: 1,
    };
  }
  const raw = input.trim().toLowerCase().replace(/[₹,]/g, "");
  if (!raw) return null;

  // Detect unit
  let multiplier = 1;
  let unitConfidence = 0.7;
  if (/\b(lpa|lakh|lac|lakhs|l)\b/.test(raw) || /\dl(?:\b|p)/.test(raw)) {
    multiplier = LAKH;
    unitConfidence = 0.95;
  } else if (/\b(cr|crore|crores)\b/.test(raw)) {
    multiplier = CRORE;
    unitConfidence = 0.95;
  } else if (/\/?\s*(month|mo|pm)\b/.test(raw)) {
    multiplier = 12;
    unitConfidence = 0.9;
  }

  // Extract one or two numbers
  const nums = raw.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;

  const a = parseFloat(nums[0]);
  const b = nums.length >= 2 ? parseFloat(nums[1]) : a;
  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) return null;

  const min = Math.round(Math.min(a, b) * multiplier);
  const max = Math.round(Math.max(a, b) * multiplier);
  const avg = Math.round((min + max) / 2);

  // Sanity check: an Indian salary should be between ₹1L and ₹50Cr
  if (avg < 50_000 || avg > 500_000_000) {
    return { min, max, avg, confidence: 0.3 };
  }

  return { min, max, avg, confidence: unitConfidence };
}

export function parseSalaryToAvg(input: string | number | null | undefined): number | null {
  const p = parseSalary(input);
  return p ? p.avg : null;
}
