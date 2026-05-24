import type { StandardLevel } from "./schemas";

interface LevelResult {
  level: StandardLevel;
  confidence: number;
}

interface Rule {
  pattern: RegExp;
  level: StandardLevel;
  confidence: number;
}

// Order matters: more specific patterns first.
const RULES: Rule[] = [
  { pattern: /\b(intern|trainee|apprentice)\b/i, level: "Intern", confidence: 0.95 },
  { pattern: /\bdistinguished\b/i, level: "Distinguished", confidence: 0.95 },
  { pattern: /\bprincipal\b/i, level: "Principal", confidence: 0.9 },
  { pattern: /\bstaff\b/i, level: "Staff", confidence: 0.9 },
  { pattern: /\bdirector\b/i, level: "Director", confidence: 0.9 },
  { pattern: /\bsenior\s+manager\b/i, level: "Senior Manager", confidence: 0.9 },
  { pattern: /\bmanager\b/i, level: "Manager", confidence: 0.85 },
  { pattern: /\bsde[\s\-]?(iii|3)\b/i, level: "SDE-III", confidence: 0.95 },
  { pattern: /\bsde[\s\-]?(ii|2)\b/i, level: "SDE-II", confidence: 0.95 },
  { pattern: /\bsde[\s\-]?(i|1)\b/i, level: "SDE-I", confidence: 0.95 },
  { pattern: /\b(l|level)\s*([1-8])\b/i, level: "L1", confidence: 0.9 }, // captured below
  { pattern: /\bsenior\b/i, level: "Senior", confidence: 0.8 },
];

/** Map experience years to a guessed L-level when no other signal exists. */
function experienceToLevel(years: number): StandardLevel {
  if (years < 1) return "L2";
  if (years < 3) return "L3";
  if (years < 6) return "L4";
  if (years < 9) return "L5";
  if (years < 13) return "L6";
  return "L7";
}

/**
 * Standardize a free-text title into a canonical level.
 * `years` is used as a fallback signal when the title is ambiguous.
 */
export function standardizeLevel(
  rawTitle: string | null | undefined,
  years: number,
): LevelResult {
  const title = (rawTitle ?? "").trim();
  if (!title) {
    return { level: experienceToLevel(years), confidence: 0.4 };
  }

  // L1..L8 capture
  const lMatch = title.match(/\b(?:l|level)\s*([1-8])\b/i);
  if (lMatch) {
    return { level: `L${lMatch[1]}` as StandardLevel, confidence: 0.95 };
  }

  for (const rule of RULES) {
    if (rule.pattern.test(title)) {
      return { level: rule.level, confidence: rule.confidence };
    }
  }

  return { level: experienceToLevel(years), confidence: 0.45 };
}
