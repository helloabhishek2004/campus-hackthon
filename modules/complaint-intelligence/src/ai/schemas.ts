import { z } from "zod";
import { ComplaintAnalysisSchema } from "@smart-campus/contracts";

export const RawGeminiAnalysisSchema = ComplaintAnalysisSchema.omit({
  cluster_match: true,
}).extend({
  cluster_match: ComplaintAnalysisSchema.shape.cluster_match.optional(),
});

export type RawGeminiAnalysis = z.infer<typeof RawGeminiAnalysisSchema>;
