import { LostFoundItemStatus } from "@smart-campus/contracts";

export type ItemState = LostFoundItemStatus;

export const ITEM_STATES: Record<string, ItemState> = {
  PROCESSING: "processing",
  OPEN: "open",
  IN_CLAIM: "in_claim",
  HANDOVER: "handover",
  RESOLVED: "resolved",
  EXPIRED: "expired",
  WITHDRAWN: "withdrawn",
};

export const ALLOWED_TRANSITIONS: Record<ItemState, ItemState[]> = {
  processing: ["open", "withdrawn"],
  open: ["in_claim", "expired", "withdrawn"],
  in_claim: ["handover", "open", "withdrawn"],
  handover: ["resolved", "open", "in_claim"],
  resolved: [],
  expired: ["open", "withdrawn"],
  withdrawn: [],
};
