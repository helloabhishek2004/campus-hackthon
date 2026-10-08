import { z } from "zod";

// ==============================================================================
// Enums & Literals
// ==============================================================================

export const LostFoundItemTypeSchema = z.enum(["lost", "found"]);
export type LostFoundItemType = z.infer<typeof LostFoundItemTypeSchema>;

export const LostFoundItemStatusSchema = z.enum([
  "processing",
  "open",
  "in_claim",
  "handover",
  "resolved",
  "expired",
  "withdrawn",
]);
export type LostFoundItemStatus = z.infer<typeof LostFoundItemStatusSchema>;

export const LostFoundCategorySchema = z.enum([
  "electronics",
  "id_cards_docs",
  "keys",
  "wallets_purses",
  "bags_backpacks",
  "clothing_accessories",
  "books_stationery",
  "water_bottles",
  "sports_equipment",
  "other",
]);
export type LostFoundCategory = z.infer<typeof LostFoundCategorySchema>;

export const MatchBandSchema = z.enum(["high", "medium", "low"]);
export type MatchBand = z.infer<typeof MatchBandSchema>;

export const ClaimStatusSchema = z.enum([
  "pending",
  "questions_pending",
  "approved",
  "handover",
  "rejected",
  "withdrawn",
]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const HandoverModeSchema = z.enum([
  "in_person",
  "campus_security",
  "department_office",
]);
export type HandoverMode = z.infer<typeof HandoverModeSchema>;

// ==============================================================================
// Item Models & Schemas
// ==============================================================================

export const ItemImageSchema = z.object({
  id: z.string().optional(),
  storage_path: z.string(),
  public_url: z.string().url(),
  is_sensitive: z.boolean().default(false),
  is_primary: z.boolean().default(false),
  detected_objects: z.array(z.string()).default([]),
});
export type ItemImage = z.infer<typeof ItemImageSchema>;

export const LostFoundItemSchema = z.object({
  id: z.string(),
  type: LostFoundItemTypeSchema,
  reporter_id: z.string(),
  category: LostFoundCategorySchema,
  subcategory: z.string().nullable().optional(),
  title: z.string().min(3),
  public_description: z.string().min(5),
  private_description: z.string().nullable().optional(),
  identifying_marks: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_description: z.string().nullable().optional(),
  event_date: z.string(), // ISO date string
  status: LostFoundItemStatusSchema,
  is_sensitive: z.boolean().default(false),
  images: z.array(ItemImageSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LostFoundItem = z.infer<typeof LostFoundItemSchema>;

// ==============================================================================
// Create Requests & Responses
// ==============================================================================

export const CreateLostItemRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: LostFoundCategorySchema,
  subcategory: z.string().optional(),
  public_description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
  private_description: z.string().optional(),
  identifying_marks: z.string().optional(),
  location_id: z.string().optional(),
  location_description: z.string().optional(),
  event_date: z.string(),
  is_sensitive: z.boolean().optional().default(false),
  images: z.array(ItemImageSchema).optional().default([]),
});
export type CreateLostItemRequest = z.infer<typeof CreateLostItemRequestSchema>;

export const CreateFoundItemRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: LostFoundCategorySchema,
  subcategory: z.string().optional(),
  public_description: z
    .string()
    .min(5, "Description must be at least 5 characters"),
  private_description: z
    .string()
    .optional()
    .describe("Private verification details"),
  identifying_marks: z.string().optional(),
  location_id: z.string().optional(),
  location_description: z.string().optional(),
  event_date: z.string(),
  is_sensitive: z.boolean().optional().default(false),
  images: z.array(ItemImageSchema).optional().default([]),
});
export type CreateFoundItemRequest = z.infer<
  typeof CreateFoundItemRequestSchema
>;

export const LostFoundItemResponseSchema = z.object({
  success: z.boolean(),
  item: LostFoundItemSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});
export type LostFoundItemResponse = z.infer<typeof LostFoundItemResponseSchema>;

// ==============================================================================
// Matching Contracts
// ==============================================================================

export const ScoreBreakdownSchema = z.object({
  image: z.number().min(0).max(1),
  text: z.number().min(0).max(1),
  category: z.number().min(0).max(1),
  location: z.number().min(0).max(1),
  time: z.number().min(0).max(1),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const MatchResultSchema = z.object({
  id: z.string().optional(),
  lost_item_id: z.string(),
  found_item_id: z.string(),
  overall_score: z.number().min(0).max(1),
  match_band: MatchBandSchema,
  score_breakdown: ScoreBreakdownSchema,
  is_dismissed: z.boolean().default(false),
  created_at: z.string().optional(),
});
export type MatchResult = z.infer<typeof MatchResultSchema>;

// ==============================================================================
// Claim & Handover Contracts
// ==============================================================================

export const ClaimSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  claimant_id: z.string(),
  match_id: z.string().nullable().optional(),
  status: ClaimStatusSchema,
  claim_text: z.string().min(5),
  verification_answers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .default([]),
  decision_notes: z.string().nullable().optional(),
  decided_by: z.string().nullable().optional(),
  decided_at: z.string().nullable().optional(),
  handover_mode: HandoverModeSchema.nullable().optional(),
  created_at: z.string(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const ClaimDecisionSchema = z.object({
  claim_id: z.string(),
  decision: z.enum(["approved", "rejected", "questions_requested"]),
  notes: z.string().optional(),
  questions: z.array(z.string()).optional(),
  handover_mode: HandoverModeSchema.optional(),
});
export type ClaimDecision = z.infer<typeof ClaimDecisionSchema>;

export const HandoverSchema = z.object({
  claim_id: z.string(),
  mode: HandoverModeSchema,
  designated_location: z.string().optional(),
  security_custody_notes: z.string().optional(),
  scheduled_at: z.string().optional(),
});
export type Handover = z.infer<typeof HandoverSchema>;

export const LostFoundProcessingStatusSchema = z.object({
  item_id: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  embedding_generated: z.boolean(),
  matches_found: z.number().int().nonnegative(),
  error: z.string().optional(),
});
export type LostFoundProcessingStatus = z.infer<
  typeof LostFoundProcessingStatusSchema
>;
