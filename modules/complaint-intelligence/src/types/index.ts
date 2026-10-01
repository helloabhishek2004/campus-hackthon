export type {
  ComplaintAnalysisRequest,
  ComplaintAnalysisResponse,
  ComplaintAnalysis,
  SeverityAnalysis,
  LocationExtraction,
  RecipientSuggestion,
  ExtractedEntity,
  SimilarIssueMatch,
  IssueClusterMatch,
  ComplaintCategory,
  ComplaintSeverityLevel,
  ComplaintStatus,
} from "@smart-campus/contracts";

export interface IntelligenceOptions {
  provider?: "gemini" | "mock";
  apiKey?: string;
  modelName?: string;
  historicalCandidates?: Array<{
    complaint_id: string;
    title: string;
    text: string;
    status?:
      "submitted" | "under_review" | "in_progress" | "resolved" | "rejected";
  }>;
}
