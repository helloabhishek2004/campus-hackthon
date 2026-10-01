import { LostFoundItemStatus } from "@smart-campus/contracts";
import { ALLOWED_TRANSITIONS, ItemState } from "./state";

export class IllegalStateTransitionError extends Error {
  constructor(
    public readonly current: LostFoundItemStatus,
    public readonly next: LostFoundItemStatus,
  ) {
    super(`Illegal state transition from '${current}' to '${next}'`);
    this.name = "IllegalStateTransitionError";
  }
}

export interface TransitionContext {
  actorId: string;
  reason?: string;
  timestamp?: string;
}

export interface TransitionResult {
  previousState: LostFoundItemStatus;
  newState: LostFoundItemStatus;
  timestamp: string;
  actorId: string;
  reason?: string;
}

/**
 * Validates whether a state transition is legal according to the item lifecycle.
 */
export function canTransition(
  current: LostFoundItemStatus,
  next: LostFoundItemStatus,
): boolean {
  const allowed = ALLOWED_TRANSITIONS[current as ItemState];
  return Array.isArray(allowed) && allowed.includes(next as ItemState);
}

/**
 * Performs a validated state transition. Throws IllegalStateTransitionError if invalid.
 */
export function transitionItemState(
  current: LostFoundItemStatus,
  next: LostFoundItemStatus,
  context: TransitionContext,
): TransitionResult {
  if (!canTransition(current, next)) {
    throw new IllegalStateTransitionError(current, next);
  }

  return {
    previousState: current,
    newState: next,
    timestamp: context.timestamp || new Date().toISOString(),
    actorId: context.actorId,
    reason: context.reason,
  };
}
