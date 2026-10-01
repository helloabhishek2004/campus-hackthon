import {
  CreateLostItemRequest,
  CreateLostItemRequestSchema,
  CreateFoundItemRequest,
  CreateFoundItemRequestSchema,
  ClaimDecision,
  ClaimDecisionSchema,
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
