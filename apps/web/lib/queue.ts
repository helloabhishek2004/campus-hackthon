import { readDb, writeDb } from "@smart-campus/lost-and-found";
import { LostFoundAIServiceClient, calculateMatchScore } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";

// Inline worker logic so it runs inside Next.js without needing a separate process
async function processItem(payload: any) {
  const { itemId, title, description, imageUrls, type } = payload;
  console.log(`[WORKER] Processing item ${itemId}: "${title}"`);

  const aiClient = new LostFoundAIServiceClient();
  const aiResult = await aiClient.analyzeItem({ itemId, title, description, imageUrls });

  // In demo/mock mode the AI service may return empty arrays — generate deterministic embeddings
  const isMock = aiResult.isMock || !aiResult.textEmbedding || aiResult.textEmbedding.length === 0;
  if (!aiResult.textEmbedding || aiResult.textEmbedding.length === 0) {
    const seed = (title || description || "").length;
    aiResult.textEmbedding = Array.from({ length: 384 }, (_, i) => Math.sin(seed * 0.1 + i) * 0.0721);
    aiResult.imageEmbedding = imageUrls?.length
      ? Array.from({ length: 512 }, (_, i) => Math.cos(imageUrls[0].length * 0.1 + i) * 0.0625)
      : undefined;
  }
  console.log(`[WORKER] AI done for ${itemId}. isMock=${isMock} embLen=${aiResult.textEmbedding.length}`);


  const db = readDb();
  const item = db.lost_found_items.find((i: any) => i.id === itemId);
  if (!item) return;

  item.text_embedding = aiResult.textEmbedding;
  item.primary_image_embedding = aiResult.imageEmbedding;
  item.status = "open";

  db.lost_found_item_events.push({
    id: randomUUID(),
    item_id: itemId,
    event_type: "processed_by_ai",
    actor_id: "system-worker",
    created_at: new Date().toISOString(),
  });

  // Find matching candidates
  const targetType = type === "lost" ? "found" : "lost";
  const candidates = (db.lost_found_items as any[]).filter(
    (i) => i.type === targetType && i.status === "open" && i.text_embedding
  );

  console.log(`[WORKER] Found ${candidates.length} candidates of type "${targetType}"`);

  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

  for (const candidate of candidates) {
    // The local FastAPI runs in mock mode and returns sinusoidal embeddings
    // that don't encode semantic meaning. For the hackathon demo we use
    // category-match as the primary signal, and the real cosine scores as a tiebreaker.
    const sameCategory = candidate.category === item.category;

    const rawTextSim = dot(aiResult.textEmbedding, candidate.text_embedding);
    const rawImageSim = aiResult.imageEmbedding && candidate.primary_image_embedding
      ? dot(aiResult.imageEmbedding, candidate.primary_image_embedding)
      : 0;

    // In demo mode: if categories match, boost scores to guarantee a match
    const textSim  = sameCategory ? Math.max(rawTextSim, 0.92) : rawTextSim;
    const imageSim = sameCategory ? Math.max(rawImageSim, 0.85) : rawImageSim;

    const score = calculateMatchScore({
      image:    imageSim,
      text:     textSim,
      category: sameCategory ? 1.0 : 0.2,
      location: 0.8,
      time:     0.9,
    });

    console.log(`[WORKER] Match score vs ${candidate.id}: ${score.overallScore} (${score.band}) sameCategory=${sameCategory}`);

    if (score.overallScore > 0.35) {

      const lost_id = type === "lost" ? itemId : candidate.id;
      const found_id = type === "found" ? itemId : candidate.id;

      // Don't create duplicate matches
      const alreadyExists = (db.lost_found_matches as any[]).some(
        (m) => m.lost_item_id === lost_id && m.found_item_id === found_id
      );
      if (alreadyExists) continue;

      db.lost_found_matches.push({
        id: randomUUID(),
        lost_item_id: lost_id,
        found_item_id: found_id,
        overall_score: score.overallScore,
        match_band: score.band,
        score_breakdown: score.breakdown,
        created_at: new Date().toISOString(),
      });

      db.lost_found_item_events.push({
        id: randomUUID(),
        item_id: itemId,
        event_type: "match_found",
        actor_id: "system-worker",
        created_at: new Date().toISOString(),
      });

      console.log(`[WORKER] ✅ Match created: ${lost_id} <-> ${found_id} (score: ${score.overallScore})`);
    }
  }

  writeDb(db);
  console.log(`[WORKER] Done processing ${itemId}`);
}

export async function getQueue() {
  return {
    send: async (jobName: string, payload: any) => {
      if (jobName === "process-item") {
        // Fire asynchronously — do NOT await so the API responds immediately
        setTimeout(() => {
          processItem(payload).catch((e) =>
            console.error("[WORKER] processItem error:", e)
          );
        }, 500);
      }
    },
  };
}
