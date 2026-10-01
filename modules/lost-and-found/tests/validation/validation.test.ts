import { describe, it, expect } from "vitest";
import {
  validateCreateLostItem,
  validateCreateFoundItem,
  validateClaimDecision,
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
});
