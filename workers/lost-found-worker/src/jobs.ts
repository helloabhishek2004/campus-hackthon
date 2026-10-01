export type JobType =
  | "process-item"
  | "explain-match"
  | "send-notification"
  | "claim-nudge"
  | "handover-nudge"
  | "expire-items"
  | "close-contact-windows";

export interface BaseJob<T = unknown> {
  id: string;
  type: JobType;
  payload: T;
  createdAt: string;
  attempts?: number;
}

export interface ProcessItemPayload {
  itemId: string;
  type: "lost" | "found";
  title: string;
  description: string;
  imageUrls?: string[];
}

export interface ExplainMatchPayload {
  lostItemId: string;
  foundItemId: string;
  matchId: string;
}

export interface SendNotificationPayload {
  recipientId: string;
  title: string;
  message: string;
  type: string;
}
