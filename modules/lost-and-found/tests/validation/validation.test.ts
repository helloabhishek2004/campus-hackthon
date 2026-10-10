import { describe, it, expect } from "vitest";
import {
  validateCreateLostItem,
  validateCreateFoundItem,
  validateClaimDecision,
  validateClaimAnswers,
  isClaimReviewable,
} from "../../src/validation/index";

describe("Module 3: Zod Contract Validations", () => {
  it("validates valid lost item creation payload", () => {
    const payload = {
      title: "MacBook Pro M2 Silver",
      category: "electronics",
      public_description: "Left on table 4 in the 3rd floor CS Lab.",
      event_date: new Date().toISOString(),
    };

    const result = validateCreateLostItem(payload);
    expect(result.isValid).toBe(true);
  });

  it("rejects invalid category or too short description", () => {
    const payload = {
      title: "Bag",
      category: "spaceship", // invalid category
      public_description: "lost", // too short
      event_date: new Date().toISOString(),
    };

    const result = validateCreateLostItem(payload);
    expect(result.isValid).toBe(false);
  });

  it("validates claim decision payload", () => {
    const decision = {
      claim_id: "claim-101",
      decision: "approved",
      handover_mode: "campus_security",
      notes: "Serial number matched.",
    };

    const result = validateClaimDecision(decision);
    expect(result.isValid).toBe(true);
  });

  it("normalizes verification evidence and removes untrusted extra fields", () => {
    const result = validateClaimAnswers([{ question: " Describe the mark ", answer: " Blue initials ", contact: "private" }]);
    expect(result).toEqual({ isValid: true, data: [{ question: "Describe the mark", answer: "Blue initials" }] });
  });

  it.each([undefined, null, [], {}, "evidence", [{ question: "Mark?", answer: " " }], [{ question: " ", answer: "Blue initials" }], [{ question: "Mark?", answer: 4 }]])(
    "requires complete verification answers (%j)", (input) => {
      expect(validateClaimAnswers(input).isValid).toBe(false);
    },
  );

  it("only permits review of pending and questions-pending claims", () => {
    expect(isClaimReviewable("pending")).toBe(true);
    expect(isClaimReviewable("questions_pending")).toBe(true);
    for (const status of ["approved", "handover", "rejected", "withdrawn", "unknown"]) {
      expect(isClaimReviewable(status)).toBe(false);
    }
  });
});
