import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@smart-campus/lost-and-found";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();

    const item = db.lost_found_items.find((i: any) => i.id === id);
    if (!item) {
      return NextResponse.json({ success: false, found: false, status: "not_found" }, { status: 404 });
    }

    // Still processing — worker hasn't finished yet
    if (item.status === "processing") {
      return NextResponse.json({ success: true, found: false, status: "processing" });
    }

    // Find matches for this item
    const matches = (db.lost_found_matches || []).filter(
      (m: any) => m.lost_item_id === id || m.found_item_id === id
    );

    if (matches.length === 0) {
      return NextResponse.json({ success: true, found: false, status: "no_match" });
    }

    // Get the best match by score
    const bestMatch = [...matches].sort((a: any, b: any) => b.overall_score - a.overall_score)[0];

    // Get the matched item (the counterpart)
    const matchedItemId = item.type === "lost" ? bestMatch.found_item_id : bestMatch.lost_item_id;
    const matchedItem = db.lost_found_items.find((i: any) => i.id === matchedItemId);

    // Attach images from the matched item
    const matchedImages = (db.lost_found_item_images || []).filter(
      (img: any) => img.item_id === matchedItemId
    );

    return NextResponse.json({
      success: true,
      found: true,
      status: "match_found",
      match: {
        id: bestMatch.id,
        score: Math.round(bestMatch.overall_score * 100),
        band: bestMatch.match_band,
        matchedItem: {
          id: matchedItem?.id,
          title: matchedItem?.title,
          category: matchedItem?.category,
          public_description: matchedItem?.public_description,
          location_description: matchedItem?.location_description,
          event_date: matchedItem?.event_date,
          images: matchedImages,
        },
        // Contact of the found-item reporter
        contact: {
          name: "Campus User (Finder)",
          phone: "+91 98765 43210",
          email: "finder@campus.edu",
          note: `Item was found at: ${matchedItem?.location_description || "Campus area"}`,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: "Internal error" } }, { status: 500 });
  }
}
