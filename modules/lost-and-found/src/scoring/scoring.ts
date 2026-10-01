import { MatchBand, ScoreBreakdown } from "@smart-campus/contracts";
import matchingConfig from "./matching-config.json";

export interface MatchingWeights {
  image: number;
  text: number;
  category: number;
  location: number;
  time: number;
}

export interface ScoreComputationResult {
  overallScore: number;
  band: MatchBand;
  breakdown: ScoreBreakdown;
  label: string;
}

export function getMatchingConfig() {
  return matchingConfig;
}

/**
 * Calculates a multi-signal match score between a lost item and a found item.
 * NOTE: The returned score is an empirical similarity index, NOT a mathematical probability.
 */
export function calculateMatchScore(
  signals: ScoreBreakdown,
  customWeights?: Partial<MatchingWeights>,
): ScoreComputationResult {
  const weights: MatchingWeights = {
    ...matchingConfig.weights,
    ...customWeights,
  };

  // Clamp signals between 0 and 1
  const clamped: ScoreBreakdown = {
    image: Math.max(0, Math.min(1, signals.image)),
    text: Math.max(0, Math.min(1, signals.text)),
    category: Math.max(0, Math.min(1, signals.category)),
    location: Math.max(0, Math.min(1, signals.location)),
    time: Math.max(0, Math.min(1, signals.time)),
  };

  const rawScore =
    clamped.image * weights.image +
    clamped.text * weights.text +
    clamped.category * weights.category +
    clamped.location * weights.location +
    clamped.time * weights.time;

  const overallScore = Number(Math.max(0, Math.min(1, rawScore)).toFixed(4));

  let band: MatchBand = "low";
  if (overallScore >= matchingConfig.bands.high) {
    band = "high";
  } else if (overallScore >= matchingConfig.bands.medium) {
    band = "medium";
  }

  const label = matchingConfig.labels[band];

  return {
    overallScore,
    band,
    breakdown: clamped,
    label,
  };
}
