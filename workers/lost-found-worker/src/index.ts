import { logger } from "./logger";
import { config } from "./config";
import {
  handleProcessItem,
  handleExplainMatch,
  handleSendNotification,
  handleExpireItems,
  handleCloseContactWindows,
} from "./handlers";
import {
  BaseJob,
  ProcessItemPayload,
  ExplainMatchPayload,
  SendNotificationPayload,
} from "./jobs";

let isRunning = true;

async function processNextJob(job: BaseJob): Promise<void> {
  switch (job.type) {
    case "process-item":
      await handleProcessItem(job as BaseJob<ProcessItemPayload>);
      break;
    case "explain-match":
      await handleExplainMatch(job as BaseJob<ExplainMatchPayload>);
      break;
    case "send-notification":
      await handleSendNotification(job as BaseJob<SendNotificationPayload>);
      break;
    case "expire-items":
      await handleExpireItems();
      break;
    case "close-contact-windows":
      await handleCloseContactWindows();
      break;
    default:
      logger.warn(`Unknown job type: ${job.type}`);
  }
}

async function startWorker(): Promise<void> {
  logger.info("Lost & Found background worker starting up...");
  logger.info(`AI Service configured at: ${config.aiServiceUrl}`);
  logger.info(`Poll interval: ${config.pollIntervalMs}ms`);

  // Handle graceful shutdown signals
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down worker gracefully...`);
    isRunning = false;
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  logger.info("Worker loop initialized. Awaiting jobs...");

  // Keep alive or poll when running standalone
  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
    // Periodic background tick
    if (isRunning) {
      await handleExpireItems();
      await handleCloseContactWindows();
    }
  }
}

// Start if run directly
if (require.main === module || !process.env.TEST_MODE) {
  startWorker().catch((err) => {
    logger.error("Fatal error in worker:", err);
    process.exit(1);
  });
}

export { startWorker, processNextJob };
