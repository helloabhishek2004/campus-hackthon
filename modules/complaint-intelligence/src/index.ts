import {
  ComplaintAnalysisRequest,
  ComplaintAnalysisResponse,
  ComplaintAnalysisResponseSchema,
} from "@smart-campus/contracts";
import { validateComplaintInput } from "./validation/input";
import { generateMockAnalysis, runGeminiAnalysis } from "./ai/gemini";
import { IntelligenceOptions } from "./types/index";

export * from "./types/index";

/**
 * Public entry point for Module 2: Complaint Intelligence Processing.
 * Analyzes grievance text, extracts entities/location, calculates severity,
 * suggests responsible departments, and checks for potential duplicate issues.
 *
 * Supports deterministic mock mode when GEMINI_API_KEY is not set or AI_PROVIDER=mock.
 */
export async function analyzeComplaint(
  request: ComplaintAnalysisRequest,
  options?: IntelligenceOptions,
): Promise<ComplaintAnalysisResponse> {
  const startTime = Date.now();

  // 1. Validate Input Contract
  const validation = validateComplaintInput(request);
  if (!validation.isValid) {
    const errorResponse: ComplaintAnalysisResponse = {
      success: false,
      complaint_id: request.complaint_id || "unknown",
      processing: {
        status: "failed",
        processed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      error: {
        code: "INVALID_REQUEST_PAYLOAD",
        message:
          "Request validation failed against ComplaintAnalysisRequest schema",
        details: validation.errors,
      },
    };
    return ComplaintAnalysisResponseSchema.parse(errorResponse);
  }

  const validRequest = validation.data;

  // 2. Determine Provider
  const envProvider = process.env.AI_PROVIDER;
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  const provider =
    options?.provider ||
    (envProvider === "gemini" && apiKey ? "gemini" : "mock");

  try {
    let analysis;
    let modelUsed: string | undefined;

    if (provider === "gemini" && apiKey) {
      modelUsed = options?.modelName || "gemini-2.5-flash";
      analysis = await runGeminiAnalysis(
        validRequest,
        apiKey,
        modelUsed,
        options?.historicalCandidates,
      );
    } else {
      modelUsed = "mock-deterministic-v1";
      analysis = generateMockAnalysis(
        validRequest,
        options?.historicalCandidates,
      );
    }

    const response: ComplaintAnalysisResponse = {
      success: true,
      complaint_id: validRequest.complaint_id,
      processing: {
        status: "completed",
        provider,
        model: modelUsed,
        processed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      analysis,
    };

    return ComplaintAnalysisResponseSchema.parse(response);
  } catch (error) {
    const errorResponse: ComplaintAnalysisResponse = {
      success: false,
      complaint_id: validRequest.complaint_id,
      processing: {
        status: "failed",
        provider,
        processed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      error: {
        code: "PROCESSING_FAILED",
        message:
          error instanceof Error ? error.message : "Internal analysis error",
      },
    };

    return ComplaintAnalysisResponseSchema.parse(errorResponse);
  }
}
