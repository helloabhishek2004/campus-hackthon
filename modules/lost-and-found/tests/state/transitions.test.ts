import { describe, it, expect } from "vitest";
import {
  canTransition,
  transitionItemState,
  IllegalStateTransitionError,
} from "../../src/state/transitions";

describe("Module 3: State Machine Transitions", () => {
  it("allows legal progression: processing -> open -> in_claim -> handover -> resolved", () => {
    expect(canTransition("processing", "open")).toBe(true);
    expect(canTransition("open", "in_claim")).toBe(true);
    expect(canTransition("in_claim", "handover")).toBe(true);
    expect(canTransition("handover", "resolved")).toBe(true);
  });

  it("allows withdrawal from open and in_claim", () => {
    expect(canTransition("open", "withdrawn")).toBe(true);
    expect(canTransition("in_claim", "withdrawn")).toBe(true);
  });

  it("allows returning to open when a claim is dismissed or rejected", () => {
    expect(canTransition("in_claim", "open")).toBe(true);
  });

  it("blocks illegal state jumps like processing -> resolved", () => {
    expect(canTransition("processing", "resolved")).toBe(false);
    expect(() =>
      transitionItemState("processing", "resolved", { actorId: "user-123" }),
    ).toThrow(IllegalStateTransitionError);
  });

  it("records transition metadata on successful transition", () => {
    const result = transitionItemState("open", "in_claim", {
      actorId: "user-456",
      reason: "Claim filed by owner",
    });

    expect(result.previousState).toBe("open");
    expect(result.newState).toBe("in_claim");
    expect(result.actorId).toBe("user-456");
    expect(result.reason).toBe("Claim filed by owner");
  });
});
