import Fuse from "fuse.js";

// Mock data for demo purposes, as we don't have the real DB connection here
const aliases = [
  { locationId: 101, text: "Main Block" },
  { locationId: 101, text: "MB" },
  { locationId: 102, text: "CSE Block" },
  { locationId: 103, text: "Library" },
  { locationId: 104, text: "Room 204" },
];

const fuse = new Fuse(aliases, { keys: ["text"], threshold: 0.3, includeScore: true });

export function extractLocations(text: string) {
  if (!text) return [];
  const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const found = new Map<number, number>(); // locationId -> best score
  
  for (let n = 4; n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      const hit = fuse.search(phrase, { limit: 1 })[0];
      if (hit && (hit.score ?? 1) < 0.25) {
        const conf = 1 - (hit.score ?? 0);
        const existing = found.get(hit.item.locationId) || 0;
        if (conf > existing) {
            found.set(hit.item.locationId, conf);
        }
      }
    }
  }
  
  return [...found].map(([locationId, confidence]) => ({ locationId, confidence }))
                   .sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
