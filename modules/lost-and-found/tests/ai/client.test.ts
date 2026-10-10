import { afterEach, describe, expect, it, vi } from "vitest";
import { LostFoundAIServiceClient } from "../../src/ai/client";

const request = {
  itemId: "item-123",
  title: "Blue backpack",
  description: "Found near the library entrance",
};

function serviceResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LostFoundAIServiceClient", () => {
  it("preserves an explicitly returned mock flag", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      serviceResponse({
        textEmbedding: [0.1],
        detectedObjects: [],
        isMock: true,
      }),
    );

    const result = await new LostFoundAIServiceClient("http://ai.test").analyzeItem(request);

    expect(result.isMock).toBe(true);
    expect(result.textEmbedding).toEqual([0.1]);
  });

  it("preserves an explicitly returned live flag", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      serviceResponse({
        textEmbedding: [0.2],
        detectedObjects: [],
        isMock: false,
      }),
    );

    const result = await new LostFoundAIServiceClient("http://ai.test").analyzeItem(request);

    expect(result.isMock).toBe(false);
    expect(result.textEmbedding).toEqual([0.2]);
  });

  it("defaults an absent mock flag to live conservatively", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      serviceResponse({
        textEmbedding: [0.3],
        detectedObjects: [],
      }),
    );

    const result = await new LostFoundAIServiceClient("http://ai.test").analyzeItem(request);

    expect(result.isMock).toBe(false);
  });

  it("uses the deterministic mock fallback when the service is offline", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("service offline"));

    const result = await new LostFoundAIServiceClient("http://ai.test").analyzeItem(request);

    expect(result.isMock).toBe(true);
    expect(result.textEmbedding).toHaveLength(384);
    expect(result.detectedObjects).toEqual([]);
  });
});
