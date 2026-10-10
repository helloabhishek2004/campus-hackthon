import {
  CreateLostItemRequest,
  CreateLostItemRequestSchema,
  CreateFoundItemRequest,
  CreateFoundItemRequestSchema,
  ClaimDecision,
  ClaimDecisionSchema,
  ClaimSchema,
  type Claim,
} from "@smart-campus/contracts";

export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
}

export interface ValidationFailure {
  isValid: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateCreateLostItem(
  input: unknown,
): ValidationResult<CreateLostItemRequest> {
  const result = CreateLostItemRequestSchema.safeParse(input);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(
        (err) => `${err.path.join(".") || "root"}: ${err.message}`,
      ),
    };
  }
  return { isValid: true, data: result.data };
}

export function validateCreateFoundItem(
  input: unknown,
): ValidationResult<CreateFoundItemRequest> {
  const result = CreateFoundItemRequestSchema.safeParse(input);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(
        (err) => `${err.path.join(".") || "root"}: ${err.message}`,
      ),
    };
  }
  return { isValid: true, data: result.data };
}

export function validateClaimDecision(
  input: unknown,
): ValidationResult<ClaimDecision> {
  const result = ClaimDecisionSchema.safeParse(input);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(
        (err) => `${err.path.join(".") || "root"}: ${err.message}`,
      ),
    };
  }
  return { isValid: true, data: result.data };
}

/** Uses the shared answer contract, with non-empty evidence required for review. */
export function validateClaimAnswers(
  input: unknown,
): ValidationResult<Claim["verification_answers"]> {
  const result = ClaimSchema.shape.verification_answers.safeParse(input);
  if (!result.success) {
    return { isValid: false, errors: result.error.errors.map((err) => `${err.path.join(".") || "root"}: ${err.message}`) };
  }
  const answers = result.data.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
  if (!answers.length || answers.some(({ question, answer }) => !question || !answer)) {
    return { isValid: false, errors: ["Complete verification questions and answers are required before approval."] };
  }
  return { isValid: true, data: answers };
}

export function isClaimReviewable(status: string): boolean {
  return status === "pending" || status === "questions_pending";
}

export class ClaimWorkflowError extends Error {
  constructor(message: string, public readonly status: 400 | 403 | 409) {
    super(message);
    this.name = "ClaimWorkflowError";
  }
}

/** Inline image storage is a bounded demo path, not a production upload service. */
export const DEMO_REPORT_MAX_BYTES = 21 * 1024 * 1024;
export function validateReportImages(images: { public_url: string }[]): ValidationResult<typeof images> {
  if (images.length > 3) return { isValid: false, errors: ["Attach no more than 3 photos."] };
  for (const image of images) {
    if (!image.public_url.startsWith("data:")) {
      if (!/^https?:\/\//i.test(image.public_url)) return { isValid: false, errors: ["Photos must use an HTTP(S) URL or a supported demo image."] };
      continue;
    }
    const data = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.public_url);
    if (!data || data[1].length % 4 !== 0) return { isValid: false, errors: ["Only valid JPG, PNG, or WebP base64 photos are supported."] };
    const padding = data[1].endsWith("==") ? 2 : data[1].endsWith("=") ? 1 : 0;
    const bytes = data[1].length * 3 / 4 - padding;
    if (!bytes || bytes > 5 * 1024 * 1024) return { isValid: false, errors: ["Each demo photo must be non-empty and no larger than 5MB."] };
  }
  return { isValid: true, data: images };
}
