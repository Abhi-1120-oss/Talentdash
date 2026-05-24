interface ConfidenceFactors {
  fieldCompleteness: number; // 0-1, share of optional fields present
  salaryParseConfidence: number; // 0-1, from parser
  levelInferenceConfidence: number; // 0-1, from level standardizer
  sourceTrust: number; // 0-1, per source platform
}

const WEIGHTS = {
  fieldCompleteness: 0.25,
  salaryParseConfidence: 0.35,
  levelInferenceConfidence: 0.25,
  sourceTrust: 0.15,
};

export function computeConfidence(f: ConfidenceFactors): number {
  const raw =
    f.fieldCompleteness * WEIGHTS.fieldCompleteness +
    f.salaryParseConfidence * WEIGHTS.salaryParseConfidence +
    f.levelInferenceConfidence * WEIGHTS.levelInferenceConfidence +
    f.sourceTrust * WEIGHTS.sourceTrust;
  return Math.round(Math.min(1, Math.max(0, raw)) * 100) / 100;
}

export function sourceTrust(source: string): number {
  switch (source) {
    case "manual":
      return 0.7;
    case "ambitionbox":
      return 0.75;
    case "glassdoor":
      return 0.8;
    default:
      return 0.5;
  }
}

export const REVIEW_THRESHOLD = 0.6;
