import { describe, it, expect } from "vitest";
import { validateComplaintInput } from "../src/validation/input";
import { analyzeComplaint } from "../src/index";

describe("Module 2: Input Validation", () => {
  it("accepts valid complaint analysis request", () => {
    const valid = {
      complaint_id: "CMP-1234",
      text: "The ceiling fan in Room 204 is making an alarming sparking noise.",
      complainant: {
        department: "Computer Science",
      },
    };

    const res = validateComplaintInput(valid);
    expect(res.isValid).toBe(true);
  });

  it("rejects complaints with insufficient text", () => {
    const invalid = {
      complaint_id: "CMP-1234",
      text: "Bad",
    };

    const res = validateComplaintInput(invalid);
    expect(res.isValid).toBe(false);
  });

  it("returns structured failed response when analyzeComplaint receives invalid payload", async () => {
    const invalid = {
      complaint_id: "",
      text: "No",
    } as any;

    const response = await analyzeComplaint(invalid, { provider: "mock" });
    expect(response.success).toBe(false);
    expect(response.processing.status).toBe("failed");
    expect(response.error?.code).toBe("INVALID_REQUEST_PAYLOAD");
  });

  it("handles nullish runtime input with a structured error", async () => {
    const response = await analyzeComplaint(null);

    expect(response).toMatchObject({
      success: false,
      complaint_id: "unknown",
      processing: { status: "failed" },
      error: { code: "INVALID_REQUEST_PAYLOAD" },
    });
  });

  it("rejects an empty complaint ID even when the shared schema accepts it", async () => {
    const response = await analyzeComplaint({
      complaint_id: "   ",
      text: "A valid amount of complaint text",
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("INVALID_REQUEST_PAYLOAD");
  });
});
