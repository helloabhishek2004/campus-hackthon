import { describe, it, expect } from "vitest";
import { computeJaccardSimilarity } from "../src/clustering/similarity";
import { findSimilarCandidates } from "../src/clustering/match";

describe("Module 2: Similarity and Clustering", () => {
  it("calculates positive similarity for overlapping vocabulary", () => {
    const textA = "projector not working in room 304";
    const textB = "projector is broken and not powering on in room 304";

    const sim = computeJaccardSimilarity(textA, textB);
    expect(sim).toBeGreaterThan(0.3);
  });

  it("identifies potential duplicates from candidate issues", () => {
    const text =
      "Wi-Fi is dropping continuously in Library reading hall 2nd floor";
    const candidates = [
      {
        complaint_id: "CMP-EXISTING-01",
        title: "Wi-Fi disconnecting continuously in Library 2nd Floor",
        text: "Wi-Fi keeps dropping in the central library reading hall 2nd floor",
        status: "in_progress" as const,
      },
      {
        complaint_id: "CMP-EXISTING-02",
        title: "Broken window in hostel B",
        text: "Glass window pane shattered in room 12",
        status: "submitted" as const,
      },
    ];

    const match = findSimilarCandidates(text, candidates);
    expect(match.similar_issues.length).toBeGreaterThanOrEqual(1);
    expect(match.similar_issues[0].complaint_id).toBe("CMP-EXISTING-01");
    expect(match.is_potential_duplicate).toBe(true);
  });
});
