import { describe, expect, it } from "vitest";
import { matchCheckStatus, myReportsUrl, normalizeVerificationAnswers, readClaimSummaries, readMyReports, readWorkflowResponse, workflowCapabilities, sessionUserId, WorkflowClaimSchema } from "../app/lost-and-found/_lib/workflow-client";

describe("Lost & Found client workflow boundaries", () => {
  it("reads only a validated authenticated session and fails closed for malformed sessions", () => {
    const id = "12345678-1234-4234-8234-123456789012";
    const profile = { id, institutionalId: "STUDENT-TEST", fullName: "Test Student", maskedPhone: "******0001", role: "student", isActive: true };
    expect(sessionUserId({ authenticated: true, profile })).toBe(id);
    expect(sessionUserId({ authenticated: false, profile: null })).toBeNull();
    expect(sessionUserId({ authenticated: false, profile })).toBeNull();
    expect(() => sessionUserId({ authenticated: "true", profile })).toThrow("verify your campus session");
    expect(() => sessionUserId({ authenticated: true, profile: { id } })).toThrow("verify your campus session");
  });

  it("validates identity-free workflow claims rather than requiring private ownership fields", () => {
    const parsed = WorkflowClaimSchema.parse({ id: "claim", item_id: "found", match_id: "match", status: "pending", claim_text: "I own this item", verification_answers: [], created_at: "2026-10-08T10:00:00Z", claimant_id: "must-not-use", decided_by: "must-not-use" });
    expect(parsed).not.toHaveProperty("claimant_id");
    expect(parsed).not.toHaveProperty("decided_by");
  });

  it("enables actions only from explicit server capability booleans", () => {
    expect(workflowCapabilities({ canClaim: true, canDecide: false })).toEqual({ canClaim: true, canDecide: false });
    expect(workflowCapabilities({ reporter_id: "current-user", role: "admin" })).toEqual({});
    expect(workflowCapabilities(undefined)).toEqual({});
    expect(workflowCapabilities({ canDecide: "true" })).toEqual({});
  });

  it("keeps queued and processing reports distinct from completed no-match reports", () => {
    expect(matchCheckStatus({ status: "pending", found: false })).toBe("processing");
    expect(matchCheckStatus({ status: "processing", found: false })).toBe("processing");
    expect(matchCheckStatus({ status: "no_match", found: false })).toBe("no_match");
    expect(matchCheckStatus({ status: "failed", found: false })).toBe("failed");
    expect(matchCheckStatus({ found: false })).toBe("unknown");
    expect(matchCheckStatus({ status: "match_found", found: true, match: { id: "candidate" } })).toBe("match_found");
  });

  it("preserves unavailable contact instructions when no contact record is returned", async () => {
    const result = await readWorkflowResponse(Response.json({
      success: true, contact: null, instructions: "Coordinate through Campus Security.",
    }));
    expect(result.contact).toBeNull();
    expect(result.instructions).toBe("Coordinate through Campus Security.");
  });

  it("surfaces API errors consistently instead of treating failures as successful actions", async () => {
    await expect(readWorkflowResponse(Response.json({ success: false, error: "Claim is no longer pending" }, { status: 409 })))
      .rejects.toThrow("Claim is no longer pending");
    await expect(readWorkflowResponse(Response.json({ success: false, error: { message: "Contact window expired" } }, { status: 403 })))
      .rejects.toThrow("Contact window expired");
    await expect(readWorkflowResponse(new Response("Unavailable", { status: 503 })))
      .rejects.toThrow("Please try again");
    await expect(readWorkflowResponse(Response.json({ success: false, error: { message: "Answers required" } })))
      .rejects.toThrow("Answers required");
    await expect(readWorkflowResponse(Response.json({ success: false, error: { message: "Complete verification answers are required before approval" } }, { status: 409 })))
      .rejects.toThrow("Complete verification answers are required before approval");
    await expect(readWorkflowResponse(Response.json({ success: false, error: { message: "Answers changed during review" } }, { status: 409 })))
      .rejects.toMatchObject({ status: 409, message: "Answers changed during review" });
  });

  it("requests personal lost and found reports across all states without sending a client user id", () => {
    const url = new URL(myReportsUrl(3), "https://campus.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({ mine: "true", status: "all", page: "3", limit: "20" });
  });

  it("accepts paginated server-scoped reports in every lifecycle state and strips private fields", () => {
    const statuses = ["processing", "open", "in_claim", "handover", "resolved", "expired", "withdrawn"];
    const items = ["lost", "found"].flatMap((type) => statuses.map((status) => ({
      id: `${type}-${status}`, type, status, title: "Campus item", category: "other",
      public_description: "Public item notes", event_date: "2026-10-08T10:00:00Z", created_at: "2026-10-08T10:00:00Z",
      private_description: "Do not display", reporter_id: "hidden-reporter", identifying_marks: "Hidden clue",
    })));
    const result = readMyReports({ success: true, scope: "mine", items, pagination: { page: 2, limit: 20, total: 34 } });
    expect(result.items).toHaveLength(14);
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 34 });
    expect(result.items[0]).not.toHaveProperty("private_description");
    expect(result.items[0]).not.toHaveProperty("reporter_id");
    expect(result.items[0]).not.toHaveProperty("identifying_marks");
  });

  it("refuses to label the general catalog as My Reports when the API ignores ownership scope", () => {
    const catalog = { success: true, items: [], pagination: { total: 0, page: 1, limit: 20 } };
    expect(() => readMyReports(catalog)).toThrow("personal report listing is unavailable");
    expect(() => readMyReports({ ...catalog, scope: "catalog" })).toThrow("personal report listing is unavailable");
  });

  it("normalizes both questions and answers and rejects blank verification evidence", () => {
    expect(normalizeVerificationAnswers([{ question: "  Describe a hidden mark  ", answer: "  Blue sticker underneath  " }]))
      .toEqual([{ question: "Describe a hidden mark", answer: "Blue sticker underneath" }]);
    expect(() => normalizeVerificationAnswers([])).toThrow("Answer every verification question");
    expect(() => normalizeVerificationAnswers([{ question: "  ", answer: "Blue sticker" }])).toThrow("Answer every verification question");
    expect(() => normalizeVerificationAnswers([{ question: "Hidden mark", answer: " \n " }])).toThrow("Answer every verification question");
  });

  it("accepts incoming claim summaries while keeping verification evidence out of list cards", () => {
    expect(readClaimSummaries([{ id: "incoming-claim", status: "pending", verification_answers: [{ question: "Private", answer: "Hidden" }] }]))
      .toEqual([{ id: "incoming-claim", status: "pending" }]);
    expect(readClaimSummaries(undefined)).toEqual([]);
    expect(() => readClaimSummaries([{ id: "bad", status: "unknown" }])).toThrow("valid claim summaries");
  });
});
