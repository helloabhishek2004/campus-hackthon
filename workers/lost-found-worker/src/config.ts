export interface WorkerConfig {
  aiServiceUrl: string;
  pollIntervalMs: number;
  concurrency: number;
}

export const config: WorkerConfig = {
  aiServiceUrl:
    process.env.LOST_FOUND_AI_SERVICE_URL || "http://localhost:8000",
  pollIntervalMs: Number(process.env.LOST_FOUND_WORKER_POLL_MS) || 5000,
  concurrency: Number(process.env.LOST_FOUND_WORKER_CONCURRENCY) || 2,
};
