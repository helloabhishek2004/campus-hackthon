import { z } from "zod";
import { ComplaintAnalysisSchema } from "@smart-campus/contracts";

export const RawGeminiAnalysisSchema = ComplaintAnalysisSchema.omit({
  cluster_match: true,
});

export type RawGeminiAnalysis = z.infer<typeof RawGeminiAnalysisSchema>;
