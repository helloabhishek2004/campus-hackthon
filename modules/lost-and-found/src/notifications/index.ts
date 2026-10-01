export type NotificationType =
  | "match_found"
  | "claim_filed"
  | "claim_approved"
  | "claim_rejected"
  | "questions_requested"
  | "handover_scheduled"
  | "contact_released";

export interface LostFoundNotification {
  recipientId: string;
  itemId: string;
  matchId?: string;
  claimId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationDispatcher {
  dispatch(notification: LostFoundNotification): Promise<boolean>;
}

export class InAppNotificationDispatcher implements NotificationDispatcher {
  async dispatch(notification: LostFoundNotification): Promise<boolean> {
    // In actual implementation, writes to public.lost_found_notifications table
    console.log(
      `[Lost & Found Notification] -> ${notification.recipientId}: ${notification.title}`,
    );
    return true;
  }
}
