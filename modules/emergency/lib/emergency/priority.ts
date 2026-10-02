import cfg from "./emergency-config.json";

export type Priority = 1 | 2 | 3 | 4; // 1 = most urgent

const BASE: Record<string, Priority> = {
  fire: 1, medical: 1, security_threat: 1, hazmat: 1, natural_disaster: 1,
  accident: 2, missing_person: 2, building_problem: 3, other: 3,
};

// Helper function to match keywords in text
function matchesAny(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}

/** 
 * Computes the initial priority based on the report type and keyword rules. 
 */
export function rulePriority(r: { type: string; text: string }): Priority {
  let p = BASE[r.type] ?? 3;
  
  if (matchesAny(r.text, cfg.p1Keywords)) {
    p = 1;
  } else if (p > 2 && matchesAny(r.text, cfg.p2Keywords)) {
    p = 2;
  }
  
  return p;
}

/** 
 * Lower number = more urgent. 
 * Every other source can only make this MORE urgent. 
 */
export function finalPriority(
  rule: Priority, 
  ml: Priority | null, 
  corroboration: Priority | null
): Priority {
  return Math.min(
    rule, 
    ml ?? rule, 
    corroboration ?? rule
  ) as Priority;
}
