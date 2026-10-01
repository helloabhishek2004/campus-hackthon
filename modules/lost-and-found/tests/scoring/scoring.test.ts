import { describe, it, expect } from "vitest";
import {
  calculateMatchScore,
  getMatchingConfig,
} from "../../src/scoring/scoring";

describe("Module 3: Multimodal Matching & Scoring", () => {
  it("loads baseline config correctly", () => {
    const config = getMatchingConfig();
    expect(config.weights.image).toBe(0.45);
    expect(config.weights.text).toBe(0.25);
    expect(config.bands.high).toBe(0.8);
    expect(config.bands.medium).toBe(0.65);
  });

  it("calculates high match band for strong signals", () => {
    const result = calculateMatchScore({
      image: 0.9,
      text: 0.85,
      category: 1.0,
      location: 0.8,
      time: 0.9,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0.8);
    expect(result.band).toBe("high");
    expect(result.label).toBe("Strong match");
  });

  it("calculates medium match band for moderate signals", () => {
    const result = calculateMatchScore({
      image: 0.7,
      text: 0.65,
      category: 1.0,
      location: 0.5,
      time: 0.6,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(0.65);
    expect(result.overallScore).toBeLessThan(0.8);
    expect(result.band).toBe("medium");
    expect(result.label).toBe("Possible match");
  });

  it("calculates low match band for weak signals", () => {
    const result = calculateMatchScore({
      image: 0.2,
      text: 0.3,
      category: 0.0,
      location: 0.1,
      time: 0.1,
    });

    expect(result.overallScore).toBeLessThan(0.65);
    expect(result.band).toBe("low");
  });
});
