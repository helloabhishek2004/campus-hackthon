import { SeverityAnalysis } from "@smart-campus/contracts";

const CRITICAL_KEYWORDS = [
  "fire",
  "spark",
  "electric shock",
  "danger",
  "smoke",
  "injury",
  "bleeding",
  "collapsed",
  "emergency",
];
const HIGH_KEYWORDS = [
  "flood",
  "overflow",
  "blackout",
  "no water",
  "server down",
  "exam cancelled",
  "gas leak",
];
const MEDIUM_KEYWORDS = [
  "broken",
  "not working",
  "malfunctioning",
  "slow",
  "noise",
  "smell",
  "ac not cooling",
];

export function ruleBasedSeverity(text: string): SeverityAnalysis {
  const lower = text.toLowerCase();

  for (const kw of CRITICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        level: "critical",
        score: 9.5,
        urgency_reasoning: `High hazard or emergency risk detected containing '${kw}'. Immediate intervention required.`,
      };
    }
  }

  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        level: "high",
        score: 7.8,
        urgency_reasoning: `Severe disruption to facility or academic schedule containing '${kw}'.`,
      };
    }
  }

  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        level: "medium",
        score: 5.0,
        urgency_reasoning: `Operational inconvenience or standard equipment breakdown containing '${kw}'.`,
      };
    }
  }

  return {
    level: "low",
    score: 2.5,
    urgency_reasoning:
      "Minor non-urgent issue without significant safety or operational impact.",
  };
}
