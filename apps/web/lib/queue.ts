import { readDb, writeDb } from "@smart-campus/lost-and-found";
import { LostFoundAIServiceClient, calculateMatchScore } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";
import { createServiceClient } from "./supabase/server";

function isSupabasePersistence() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Mock OTP/auth is compatible with hosted persistence. Select the worker
  // backend from the configured data store rather than the auth provider so a
  // Supabase-created item is never handed to the local JSON database.
  return Boolean(url && key && !url.includes("placeholder") && !key.includes("placeholder"));
}

function vectorArray(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    const values = value.map(Number);
    return values.every(Number.isFinite) ? values : undefined;
  }
  if (typeof value !== "string") return undefined;
  const raw = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!raw) return [];
  const values = raw.split(",").map((entry) => Number(entry.trim()));
  return values.every(Number.isFinite) ? values : undefined;
}

async function processItemInSupabase(payload: any) {
  const { itemId, title, description, imageUrls, type } = payload;
  const aiClient = new LostFoundAIServiceClient();
  const aiResult = await aiClient.analyzeItem({ itemId, title, description, imageUrls });
  const service = createServiceClient();
  const { data: item, error: itemError } = await service.from("lost_found_items").select("*").eq("id", itemId).single();
  if (itemError || !item) throw new Error(`Lost & Found processing read failed: ${itemError?.message || "item not found"}`);

  const textEmbedding = vectorArray(aiResult.textEmbedding)?.length ? vectorArray(aiResult.textEmbedding) : undefined;
  const imageEmbedding = vectorArray(aiResult.imageEmbedding)?.length ? vectorArray(aiResult.imageEmbedding) : undefined;
  const { error: updateError } = await service.from("lost_found_items").update({
    text_embedding: textEmbedding,
    primary_image_embedding: imageEmbedding,
    status: "open",
    updated_at: new Date().toISOString(),
  }).eq("id", itemId);
  if (updateError) throw new Error(`Lost & Found processing update failed: ${updateError.message}`);
  const { error: eventError } = await service.from("lost_found_item_events").insert({
    item_id: itemId,
    event_type: "processed_by_ai",
    actor_id: null,
    details: { provider: aiResult.isMock ? "mock" : "ai" },
  });
  if (eventError) throw new Error(`Lost & Found processing event failed: ${eventError.message}`);

  const targetType = type === "lost" ? "found" : "lost";
  const { data: candidates, error: candidateError } = await service.from("lost_found_items")
    .select("*").eq("type", targetType).eq("status", "open").not("text_embedding", "is", null);
  if (candidateError) throw new Error(`Lost & Found candidate read failed: ${candidateError.message}`);

  const cosine = (a: number[] | undefined, b: number[] | undefined) => {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0; let normA = 0; let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
      const left = Number.isFinite(a[i]) ? a[i] : 0;
      const right = Number.isFinite(b[i]) ? b[i] : 0;
      dot += left * right; normA += left * left; normB += right * right;
    }
    return normA && normB ? Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB)))) : 0;
  };

  for (const candidate of candidates || []) {
    const itemText = textEmbedding ? cosine(textEmbedding, vectorArray(candidate.text_embedding)) : 0;
    const itemImage = imageEmbedding ? cosine(imageEmbedding, vectorArray(candidate.primary_image_embedding)) : 0;
    const candidateTime = Date.parse(candidate.event_date);
    const itemTime = Date.parse(item.event_date);
    const days = Number.isFinite(candidateTime) && Number.isFinite(itemTime)
      ? Math.abs(candidateTime - itemTime) / 86_400_000 : Infinity;
    const score = calculateMatchScore({
      text: itemText,
      image: itemImage,
      category: candidate.category === item.category ? 1 : 0.2,
      location: item.location_id && candidate.location_id && item.location_id === candidate.location_id ? 1 : 0,
      time: days <= 1 ? 1 : days <= 7 ? 0.6 : days <= 30 ? 0.2 : 0,
    });
    if (score.overallScore <= 0.35) continue;
    const lost_item_id = type === "lost" ? itemId : candidate.id;
    const found_item_id = type === "found" ? itemId : candidate.id;
    const { error: matchError } = await service.from("lost_found_matches").upsert({
      lost_item_id, found_item_id, overall_score: score.overallScore,
      match_band: score.band, score_breakdown: score.breakdown,
    }, { onConflict: "lost_item_id,found_item_id" });
    if (matchError) throw new Error(`Lost & Found match persistence failed: ${matchError.message}`);
    const { error: matchEventError } = await service.from("lost_found_item_events").insert({
      item_id: itemId, event_type: "match_found", actor_id: null,
      details: { lost_item_id, found_item_id },
    });
    if (matchEventError) throw new Error(`Lost & Found match event failed: ${matchEventError.message}`);
  }
}

// Inline worker logic so it runs inside Next.js without needing a separate process
async function processItem(payload: any) {
  if (isSupabasePersistence()) {
    await processItemInSupabase(payload);
    return;
  }
  if (process.env.AUTH_MODE !== "mock") {
    throw new Error("Lost & Found processing requires Supabase configuration (or AUTH_MODE=mock).");
  }
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

  const cosine = (a: number[] | undefined, b: number[] | undefined) => {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
      const left = Number.isFinite(a[i]) ? a[i] : 0;
      const right = Number.isFinite(b[i]) ? b[i] : 0;
      dot += left * right;
      normA += left * left;
      normB += right * right;
    }
    return normA && normB ? Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB)))) : 0;
  };

  for (const candidate of candidates) {
    const sameCategory = candidate.category === item.category;

    const rawTextSim = cosine(aiResult.textEmbedding, candidate.text_embedding);
    const rawImageSim = cosine(aiResult.imageEmbedding, candidate.primary_image_embedding);

    // Never inflate mock/empty embeddings. Category is already an explicit,
    // explainable component in the configured score.
    const textSim = Math.max(0, Math.min(1, rawTextSim));
    const imageSim = Math.max(0, Math.min(1, rawImageSim));

    const score = calculateMatchScore({
      image:    imageSim,
      text:     textSim,
      category: sameCategory ? 1.0 : 0.2,
      location: item.location_id && candidate.location_id && item.location_id === candidate.location_id
        ? 1
        : item.location_description && candidate.location_description && item.location_description.trim().toLowerCase() === candidate.location_description.trim().toLowerCase()
          ? 0.8
          : 0,
      time: (() => {
        const itemTime = Date.parse(item.event_date);
        const candidateTime = Date.parse(candidate.event_date);
        if (!Number.isFinite(itemTime) || !Number.isFinite(candidateTime)) return 0;
        const days = Math.abs(itemTime - candidateTime) / 86_400_000;
        return days <= 1 ? 1 : days <= 7 ? 0.6 : days <= 30 ? 0.2 : 0;
      })(),
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
