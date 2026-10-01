import {
  ComplaintAnalysisRequest,
  ComplaintAnalysisRequestSchema,
} from "@smart-campus/contracts";

export interface ValidationSuccess {
  isValid: true;
  data: ComplaintAnalysisRequest;
}

export interface ValidationFailure {
  isValid: false;
  errors: string[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function validateComplaintInput(input: unknown): ValidationResult {
  const result = ComplaintAnalysisRequestSchema.safeParse(input);

  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(
        (err) => `${err.path.join(".") || "root"}: ${err.message}`,
      ),
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}
