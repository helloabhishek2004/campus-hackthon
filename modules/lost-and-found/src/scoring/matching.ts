import { MatchResult, ScoreBreakdown } from "@smart-campus/contracts";
import { calculateMatchScore } from "./scoring";

export interface CandidatePair {
  lostItemId: string;
  foundItemId: string;
  signals: ScoreBreakdown;
}

/**
 * Evaluates candidate item pairs and returns structured match results.
 */
export function evaluateCandidateMatches(
  candidates: CandidatePair[],
): MatchResult[] {
  return candidates.map((candidate) => {
    const scoreResult = calculateMatchScore(candidate.signals);

    return {
      lost_item_id: candidate.lostItemId,
      found_item_id: candidate.foundItemId,
      overall_score: scoreResult.overallScore,
      match_band: scoreResult.band,
      score_breakdown: scoreResult.breakdown,
      is_dismissed: false,
    };
  });
}
