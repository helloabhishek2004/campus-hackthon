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
});
