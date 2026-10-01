import { GoogleGenAI } from "@google/genai";
import {
  ComplaintAnalysisRequest,
  ComplaintAnalysis,
  ComplaintAnalysisSchema,
} from "@smart-campus/contracts";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./prompts";
import { RawGeminiAnalysisSchema } from "./schemas";
import { ruleBasedClassify } from "../analysis/classify";
import { ruleBasedSeverity } from "../analysis/severity";
import { ruleBasedLocation } from "../analysis/location";
import { ruleBasedEntities } from "../analysis/entities";
import { findSimilarCandidates, CandidateIssue } from "../clustering/match";

export function generateMockAnalysis(
  request: ComplaintAnalysisRequest,
  candidates?: CandidateIssue[],
): ComplaintAnalysis {
  const classification = ruleBasedClassify(request.text);
  const severity = ruleBasedSeverity(request.text);
  const location = ruleBasedLocation(request.text);
  const entities = ruleBasedEntities(request.text);
  const clusterMatch = findSimilarCandidates(request.text, candidates);

  // Recipient mapping based on category
  const departmentMap: Record<string, { dept: string; role: string }> = {
    it_services: {
      dept: "Campus IT & Network Operations",
      role: "Network Administrator",
    },
    hostel: { dept: "Hostel Administration & Welfare", role: "Hostel Warden" },
    sanitation: {
      dept: "Estate & Housekeeping",
      role: "Sanitation Supervisor",
    },
    infrastructure: {
      dept: "Campus Maintenance & Civil Works",
      role: "Electrical / Civil Engineer",
    },
    academic: {
      dept: "Academic Affairs & Dean Office",
      role: "Academic Coordinator",
    },
    security: {
      dept: "Campus Security & Safety",
      role: "Chief Security Officer",
    },
    administration: {
      dept: "Registrar Office",
      role: "Administrative Officer",
    },
    other: { dept: "Student Grievance Cell", role: "Grievance Officer" },
  };

  const recipient =
    departmentMap[classification.category] || departmentMap.other;

  // Title summary
  const firstSentence = request.text.split(/[.\n]/)[0].trim();
  const titleSummary =
    firstSentence.length > 80
      ? `${firstSentence.substring(0, 77)}...`
      : firstSentence;

  return {
    category: classification.category,
    subcategory: classification.subcategory,
    title_summary: titleSummary,
    summary: `Reported grievance regarding ${classification.category} (${classification.subcategory}): "${request.text}".`,
    severity,
    location,
    entities,
    suggested_recipient: {
      department: recipient.dept,
      role: recipient.role,
      confidence: 0.88,
      reasoning: `Categorized under ${classification.category}; routed to ${recipient.dept} for primary action.`,
    },
    cluster_match: clusterMatch,
    overall_confidence: 0.85,
    tags: [classification.category, classification.subcategory, severity.level],
  };
}

export async function runGeminiAnalysis(
  request: ComplaintAnalysisRequest,
  apiKey: string,
  modelName: string = "gemini-2.5-flash",
  candidates?: CandidateIssue[],
): Promise<ComplaintAnalysis> {
  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = buildAnalysisSystemPrompt();
  const userPrompt = buildAnalysisUserPrompt(request);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nAnalyze this grievance request:\n${userPrompt}`,
          },
        ],
      },
    ],
  });

  const responseText = response.text?.trim() || "";

  // Extract JSON in case model wrapped it in markdown fences
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
    null,
    responseText,
  ];
  const cleanJson = jsonMatch[1] ? jsonMatch[1].trim() : responseText;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${err instanceof Error ? err.message : String(err)}. Raw output: ${responseText.slice(0, 200)}`,
    );
  }

  // Validate with Zod
  const validation = RawGeminiAnalysisSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      `Gemini output did not conform to ComplaintAnalysis schema: ${validation.error.message}`,
    );
  }

  const analysis = validation.data;

  // Augment with cluster match if not already evaluated
  if (!analysis.cluster_match) {
    analysis.cluster_match = findSimilarCandidates(request.text, candidates);
  }

  // Return fully validated schema
  return ComplaintAnalysisSchema.parse(analysis);
}
