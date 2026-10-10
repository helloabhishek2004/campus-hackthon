import { z } from "zod";
import { ClaimSchema, LostFoundItemSchema, InstitutionalLookupResponseSchema } from "@smart-campus/contracts";

// A workflow response is deliberately not the raw persistence model: identities
// are omitted and authorization is conveyed separately through capabilities.
export const WorkflowClaimSchema = ClaimSchema.omit({ claimant_id: true, decided_by: true }).extend({
  item: LostFoundItemSchema.pick({ id: true, type: true, title: true, public_description: true, category: true, status: true }).optional(),
});
export type WorkflowClaim = z.infer<typeof WorkflowClaimSchema>;

export function sessionUserId(value: unknown): string | null {
  const session = z.object({ authenticated: z.boolean(), profile: z.unknown() }).safeParse(value);
  if (!session.success) throw new Error("Unable to verify your campus session.");
  if (!session.data.authenticated) return null;
  const profile = InstitutionalLookupResponseSchema.safeParse(session.data.profile);
  if (!profile.success) throw new Error("Unable to verify your campus session.");
  return profile.data.id;
}

export function normalizeVerificationAnswers(value: unknown) {
  const parsed = ClaimSchema.shape.verification_answers.safeParse(value);
  if (!parsed.success) throw new Error("Verification answers must contain a question and answer.");
  const answers = parsed.data.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
  if (!answers.length || answers.some(({ question, answer }) => !question || !answer)) {
    throw new Error("Answer every verification question before submitting.");
  }
  return answers;
}

const ReportSummarySchema = LostFoundItemSchema.pick({
  id: true, type: true, title: true, category: true, status: true,
  public_description: true, location_description: true, created_at: true,
}).extend({ event_date: z.string().nullable().optional() });

export const MyReportsResponseSchema = z.object({
  success: z.literal(true),
  scope: z.literal("mine"),
  items: z.array(ReportSummarySchema),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
  }),
});
export type ReportSummary = z.infer<typeof ReportSummarySchema>;
const ClaimSummariesSchema = z.array(ClaimSchema.pick({ id: true, status: true }));
export type ClaimSummary = z.infer<typeof ClaimSummariesSchema>[number];

export function readClaimSummaries(value: unknown): ClaimSummary[] {
  const parsed = ClaimSummariesSchema.safeParse(value ?? []);
  if (!parsed.success) throw new Error("The server did not return valid claim summaries.");
  return parsed.data;
}

/** The server derives ownership from its session; no reporter id is sent. */
export function myReportsUrl(page: number) {
  return `/api/lost-found/items?mine=true&status=all&page=${page}&limit=20`;
}

export function readMyReports(value: unknown) {
  const parsed = MyReportsResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error("Your personal report listing is unavailable. Please try again.");
  return parsed.data;
}

/** Server-supplied permissions only; identity comparisons are never permissions. */
export const WorkflowCapabilitiesSchema = z.object({
  canViewMatches: z.boolean().optional(),
  canClaim: z.boolean().optional(),
  canAnswer: z.boolean().optional(),
  canDecide: z.boolean().optional(),
  canApprove: z.boolean().optional(),
  canHandover: z.boolean().optional(),
  canRevealContact: z.boolean().optional(),
  isReporter: z.boolean().optional(),
  isClaimant: z.boolean().optional(),
  isFinder: z.boolean().optional(),
});
export type WorkflowCapabilities = z.infer<typeof WorkflowCapabilitiesSchema>;

export function workflowCapabilities(value: unknown): WorkflowCapabilities {
  const parsed = WorkflowCapabilitiesSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

export function workflowError(value: unknown, fallback = "The request could not be completed."): string {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "message" in value && typeof value.message === "string") {
    return value.message;
  }
  return fallback;
}

export class WorkflowRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function readWorkflowResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success === false) {
    const fallback = response.status === 401 ? "Sign in to continue with Lost & Found."
      : response.status === 403 ? "You do not have access to this action."
      : "Lost & Found could not complete this request. Please try again.";
    throw new WorkflowRequestError(workflowError(data?.error, fallback), response.status);
  }
  const envelope = z.object({ success: z.literal(true) }).passthrough().safeParse(data);
  if (!envelope.success) throw new Error("Lost & Found returned an unexpected response. Please try again.");
  return data;
}

export function matchCheckStatus(data: { status?: string; found?: boolean; match?: unknown }) {
  if (data.status === "failed") return "failed";
  if (data.status === "processing" || data.status === "pending") return "processing";
  if (data.found === true && data.match) return "match_found";
  if (data.status === "no_match" || (data.status === "completed" && data.found === false)) return "no_match";
  return "unknown";
}
