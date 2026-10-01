import { computeJaccardSimilarity } from "./similarity";
import { SimilarIssueMatch, IssueClusterMatch } from "@smart-campus/contracts";

export interface CandidateIssue {
  complaint_id: string;
  title: string;
  text: string;
  status?:
    "submitted" | "under_review" | "in_progress" | "resolved" | "rejected";
}

const DEFAULT_CANDIDATES: CandidateIssue[] = [
  {
    complaint_id: "CMP-DEMO-001",
    title: "Wi-Fi disconnecting continuously in Library 2nd Floor",
    text: "Wi-Fi keeps dropping in the central library reading hall 2nd floor every 5 minutes.",
    status: "in_progress",
  },
  {
    complaint_id: "CMP-DEMO-002",
    title: "Projector not powering on in Room 304 Block B",
    text: "The ceiling projector in classroom 304 Block B has no power light and won't turn on.",
    status: "submitted",
  },
  {
    complaint_id: "CMP-DEMO-003",
    title: "Water cooler leaking on Ground Floor Block A",
    text: "Water leakage from the drinking water filter unit near ground floor lobby.",
    status: "under_review",
  },
];

export function findSimilarCandidates(
  text: string,
  candidates: CandidateIssue[] = DEFAULT_CANDIDATES,
  threshold: number = 0.25,
): IssueClusterMatch {
  const matches: SimilarIssueMatch[] = [];

  for (const candidate of candidates) {
    const score = computeJaccardSimilarity(
      text,
      `${candidate.title} ${candidate.text}`,
    );
    if (score >= threshold) {
      matches.push({
        complaint_id: candidate.complaint_id,
        title: candidate.title,
        similarity_score: score,
        status: candidate.status,
        summary: candidate.text,
      });
    }
  }

  matches.sort((a, b) => b.similarity_score - a.similarity_score);

  const bestMatch = matches[0];
  const isDuplicate = Boolean(bestMatch && bestMatch.similarity_score >= 0.5);

  return {
    is_potential_duplicate: isDuplicate,
    cluster_id: isDuplicate ? `CLUSTER-${bestMatch.complaint_id}` : null,
    confidence: bestMatch ? bestMatch.similarity_score : 0,
    similar_issues: matches,
  };
}
