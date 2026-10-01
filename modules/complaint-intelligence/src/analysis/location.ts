import { LocationExtraction } from "@smart-campus/contracts";

export function ruleBasedLocation(text: string): LocationExtraction {
  // Simple heuristic regex patterns for campus locations
  const roomMatch = text.match(
    /\b(?:room|lab|hall|cabin|lh|cr)\s*[:#-]?\s*([a-z0-9\-]+)/i,
  );
  const floorMatch = text.match(
    /\b([1-9]|ground|first|second|third|fourth|fifth|top)\s*(?:st|nd|rd|th)?\s*floor/i,
  );
  const blockMatch = text.match(
    /\b(?:block|tower|wing|building)\s*[:#-]?\s*([a-z0-9\-]+)/i,
  );

  const room = roomMatch ? roomMatch[1].toUpperCase() : null;
  const floor = floorMatch ? floorMatch[0] : null;
  const building = blockMatch ? `Block ${blockMatch[1].toUpperCase()}` : null;

  return {
    building,
    floor,
    room,
    area: null,
    raw_mention:
      [building, floor, room ? `Room ${room}` : null]
        .filter(Boolean)
        .join(", ") || null,
  };
}
