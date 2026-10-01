import { findSimilarCandidates, CandidateIssue } from "./match";
import { IssueClusterMatch } from "@smart-campus/contracts";

export async function searchCandidates(
  text: string,
  candidates?: CandidateIssue[],
): Promise<IssueClusterMatch> {
  return findSimilarCandidates(text, candidates);
}
