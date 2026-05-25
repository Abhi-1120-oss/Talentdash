/** Company name cleanup + slug generation. */

const SUFFIX_RE =
  /\b(pvt|private|ltd|limited|inc|incorporated|llp|llc|technologies|tech|services|india)\b\.?/gi;

export function normalizeCompanyName(input: string): string {
  return input
    .toLowerCase()
    .replace(SUFFIX_RE, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyCompany(input: string): string {
  const normalized = normalizeCompanyName(input);
  return normalized.replace(/\s+/g, "-").slice(0, 80) || "unknown";
}

/** Pretty display name: title case from the original input, sans corporate suffixes. */
export function prettyCompanyName(input: string): string {
  const cleaned = input.replace(SUFFIX_RE, "").replace(/\s+/g, " ").trim();
  return cleaned
    .split(" ")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Levenshtein distance, capped for performance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

/** Find an existing normalized name within edit-distance threshold. */
export function fuzzyMatch(candidate: string, existing: string[], maxDistance = 2): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const e of existing) {
    const d = levenshtein(candidate, e);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best && bestDist <= maxDistance ? best : null;
}
