import {
  BaseJob,
  ProcessItemPayload,
  ExplainMatchPayload,
  SendNotificationPayload,
} from "./jobs";
import { logger } from "./logger";
import { LostFoundAIServiceClient } from "@smart-campus/lost-and-found";

const aiClient = new LostFoundAIServiceClient();

export async function handleProcessItem(
  job: BaseJob<ProcessItemPayload>,
): Promise<void> {
  const { itemId, title, description, imageUrls } = job.payload;
  logger.info(`Processing item ${itemId}: "${title}"`);

  // 1. Generate visual/text embeddings via AI service (or deterministic fallback)
  const aiResult = await aiClient.analyzeItem({
    itemId,
    title,
    description,
    imageUrls,
  });

  logger.info(
    `Embeddings generated for item ${itemId} (isMock: ${aiResult.isMock})`,
  );
  // 2. In full implementation: Update item record with embeddings & query nearest candidates via pgvector
}

export async function handleExplainMatch(
  job: BaseJob<ExplainMatchPayload>,
): Promise<void> {
  logger.info(
    `Explaining match ${job.payload.matchId} between ${job.payload.lostItemId} and ${job.payload.foundItemId}`,
  );
}

export async function handleSendNotification(
  job: BaseJob<SendNotificationPayload>,
): Promise<void> {
  logger.info(
    `Dispatching notification to ${job.payload.recipientId}: "${job.payload.title}"`,
  );
}

export async function handleExpireItems(): Promise<void> {
  logger.info("Checking for expired open items past retention threshold...");
}

export async function handleCloseContactWindows(): Promise<void> {
  logger.info("Checking for expired contact windows...");
}
