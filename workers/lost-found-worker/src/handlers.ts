import { BaseJob, ProcessItemPayload, ExplainMatchPayload, SendNotificationPayload } from "./jobs";
import { logger } from "./logger";
import { LostFoundAIServiceClient, calculateMatchScore, readDb, writeDb } from "@smart-campus/lost-and-found";
import { randomUUID } from "crypto";

const aiClient = new LostFoundAIServiceClient();

export async function handleProcessItem(job: BaseJob<ProcessItemPayload>): Promise<void> {
  const { itemId, title, description, imageUrls, type } = job.payload;
  logger.info(`Processing item ${itemId}: "${title}"`);

  const aiResult = await aiClient.analyzeItem({ itemId, title, description, imageUrls });

  logger.info(`Embeddings generated for item ${itemId} (isMock: ${aiResult.isMock})`);

  const db = readDb();
  const item = db.lost_found_items.find((i: any) => i.id === itemId);
  
  if (item) {
      item.text_embedding = aiResult.textEmbedding;
      item.primary_image_embedding = aiResult.imageEmbedding;
      item.status = 'open';
      
      // Log the processing event
      db.lost_found_item_events.push({
          id: randomUUID(),
          item_id: itemId,
          event_type: "processed_by_ai",
          actor_id: "system-worker",
          created_at: new Date().toISOString()
      });
      logger.info(`Updated item ${itemId} with embeddings and marked as open.`);
  }

  // Find candidates (simple mock cosine distance calculation for local DB)
  const targetType = type === 'lost' ? 'found' : 'lost';
  const candidates = db.lost_found_items.filter((i: any) => i.type === targetType && i.status === 'open' && i.text_embedding);

  const dotProduct = (a: number[], b: number[]) => a.reduce((sum, val, i) => sum + val * b[i], 0);

  for (const candidate of candidates) {
      const textSim = aiResult.isMock ? 0.95 : dotProduct(aiResult.textEmbedding, candidate.text_embedding);
      let imageSim = 0;
      if (aiResult.imageEmbedding && candidate.primary_image_embedding) {
          imageSim = aiResult.isMock ? 0.88 : dotProduct(aiResult.imageEmbedding, candidate.primary_image_embedding);
      }

      const score = calculateMatchScore({
          image: imageSim,
          text: textSim,
          category: (aiResult.isMock || candidate.category === item?.category) ? 1.0 : 0.2, 
          location: 0.8, 
          time: 0.9,     
      });

      if (score.overallScore > 0.4) {
          const lost_id = type === 'lost' ? itemId : candidate.id;
          const found_id = type === 'found' ? itemId : candidate.id;
          
          db.lost_found_matches.push({
              id: randomUUID(),
              lost_item_id: lost_id,
              found_item_id: found_id,
              overall_score: score.overallScore,
              match_band: score.band,
              score_breakdown: score.breakdown,
              created_at: new Date().toISOString()
          });
          
          db.lost_found_item_events.push({
              id: randomUUID(),
              item_id: itemId,
              event_type: "match_found",
              actor_id: "system-worker",
              created_at: new Date().toISOString()
          });
          
          logger.info(`Created match between ${lost_id} and ${found_id} with score ${score.overallScore}`);
      }
  }

  writeDb(db);
}

export async function handleExplainMatch(job: BaseJob<ExplainMatchPayload>): Promise<void> {}
export async function handleSendNotification(job: BaseJob<SendNotificationPayload>): Promise<void> {}
export async function handleExpireItems(): Promise<void> {}
export async function handleCloseContactWindows(): Promise<void> {}
