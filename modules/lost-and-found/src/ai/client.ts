export interface AIAnalysisRequest {
  itemId: string;
  title: string;
  description: string;
  imageUrls?: string[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  box?: [number, number, number, number];
}

export interface AIAnalysisResult {
  textEmbedding: number[]; // 384-dimensional vector (all-MiniLM-L6-v2)
  imageEmbedding?: number[]; // 512-dimensional vector (clip-ViT-B-32)
  detectedObjects: DetectedObject[];
  suggestedCategory?: string;
  isMock: boolean;
}

export class LostFoundAIServiceClient {
  private baseUrl: string;
  private token?: string;

  constructor(
    baseUrl: string = process.env.LOST_FOUND_AI_SERVICE_URL ||
      "http://localhost:8000",
    token?: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token || process.env.LOST_FOUND_AI_SERVICE_TOKEN;
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return (await res.json()) as { status: string; service: string };
    } catch {
      return { status: "unreachable", service: "lost-found-ai" };
    }
  }

  async analyzeItem(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    try {
      const res = await fetch(`${this.baseUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        throw new Error(`AI service responded with HTTP ${res.status}`);
      }

      const data = (await res.json()) as Partial<AIAnalysisResult>;
      return {
        textEmbedding: data.textEmbedding || [],
        imageEmbedding: data.imageEmbedding,
        detectedObjects: data.detectedObjects || [],
        suggestedCategory: data.suggestedCategory,
        isMock: false,
      };
    } catch {
      // Deterministic fallback stub if the Python ML service is offline
      return this.generateDeterministicMock(request);
    }
  }

  private generateDeterministicMock(
    request: AIAnalysisRequest,
  ): AIAnalysisResult {
    // Generate pseudo-deterministic 384-dim text embedding vector
    const textEmb = new Array(384)
      .fill(0)
      .map((_, i) =>
        Number((Math.sin(request.title.length + i) * 0.1).toFixed(4)),
      );

    // Optional 512-dim image embedding vector
    const imageEmb = request.imageUrls?.length
      ? new Array(512)
          .fill(0)
          .map((_, i) =>
            Number((Math.cos(request.title.length + i) * 0.1).toFixed(4)),
          )
      : undefined;

    return {
      textEmbedding: textEmb,
      imageEmbedding: imageEmb,
      detectedObjects: request.imageUrls?.length
        ? [{ label: "detected_item", confidence: 0.92 }]
        : [],
      isMock: true,
    };
  }
}
