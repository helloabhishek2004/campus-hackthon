import { ExtractedEntity } from "@smart-campus/contracts";

const ENTITY_PATTERNS: Array<{
  regex: RegExp;
  type: ExtractedEntity["type"];
  label: string;
}> = [
  {
    regex: /\b(projector|monitor|cpu|mouse|keyboard|hdmi|ups|printer)\b/gi,
    type: "equipment",
    label: "AV/IT Hardware",
  },
  {
    regex: /\b(fan|ac|air conditioner|switchboard|light|tube light|bulb)\b/gi,
    type: "facility",
    label: "Electrical Appliance",
  },
  {
    regex: /\b(tap|pipe|flush|basin|sink|drain)\b/gi,
    type: "facility",
    label: "Sanitary Fixture",
  },
  {
    regex: /\b(dr\.|prof\.|mr\.|mrs\.|ms\.)\s+[a-z]+/gi,
    type: "person",
    label: "Faculty / Staff",
  },
];

export function ruleBasedEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  for (const pattern of ENTITY_PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches) {
      for (const m of matches) {
        const clean = m.trim();
        const key = `${pattern.type}:${clean.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          entities.push({
            entity: clean,
            type: pattern.type,
            description: pattern.label,
          });
        }
      }
    }
  }

  return entities;
}
