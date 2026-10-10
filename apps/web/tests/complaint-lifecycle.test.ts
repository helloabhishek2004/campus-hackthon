import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { MOCK_INSTITUTIONAL_DIRECTORY } from "../lib/auth/mock-identities";
import { createMockSessionToken } from "../lib/auth/identity-service";
import { createComplaint, _getStatusHistoryForTesting, _resetStoreForTesting } from "../lib/complaints/complaint-repository";
import { PATCH as updateComplaintRoute, GET as getComplaintRoute } from "../app/api/complaints/[id]/route";

const student = MOCK_INSTITUTIONAL_DIRECTORY[0];
const staff = MOCK_INSTITUTIONAL_DIRECTORY.find((profile) => profile.tags.includes("HOD"))!;
const studentCookie = `campusgram_mock_session=${createMockSessionToken(student, student.id)}`;
const staffCookie = `campusgram_mock_session=${createMockSessionToken(staff, staff.id)}`;

describe("complaint lifecycle authorization and transitions", () => {
  beforeEach(() => {
    _resetStoreForTesting([]);
  });

  it("rejects student lifecycle mutations even when the request names a staff-like status", async () => {
    const created = await createComplaint({
      text: "Broken water pump in hostel block",
      complainant_id: student.id,
    });

    const response = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: studentCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", response_note: "spoofed" }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );

    expect(response.status).toBe(403);
  });

  it("enforces transitions, requires resolution notes, records the actor, and exposes the result to the owner", async () => {
    const created = await createComplaint({
      text: "Broken water pump in hostel block",
      complainant_id: student.id,
    });

    const underReview = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "under_review", take_ownership: true }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(underReview.status).toBe(200);
    expect((await underReview.json()).complaint.status).toBe("under_review");

    const invalid = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(invalid.status).toBe(409);

    const inProgress = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(inProgress.status).toBe(200);

    const missingNote = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(missingNote.status).toBe(409);

    const resolved = await updateComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        method: "PATCH",
        headers: { Cookie: staffCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", response_note: "Pump replacement scheduled." }),
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(resolved.status).toBe(200);
    const resolvedJson = await resolved.json();
    expect(resolvedJson.complaint.status).toBe("resolved");
    expect(resolvedJson.complaint.response_note).toBe("Pump replacement scheduled.");
    expect(resolvedJson.complaint.complainant_id).toBeUndefined();
    expect(resolvedJson.complaint.last_updated_by).toBeUndefined();

    const ownerView = await getComplaintRoute(
      new NextRequest(`http://localhost/api/complaints/${created.complaint.id}`, {
        headers: { Cookie: studentCookie },
      }),
      { params: Promise.resolve({ id: created.complaint.id }) },
    );
    expect(ownerView.status).toBe(200);
    const ownerJson = await ownerView.json();
    expect(ownerJson.complaint.status).toBe("resolved");
    expect(ownerJson.complaint.response_note).toBe("Pump replacement scheduled.");
    expect(ownerJson.status_history.map((entry: { to_status: string }) => entry.to_status)).toEqual([
      "under_review",
      "in_progress",
      "resolved",
    ]);
    expect(_getStatusHistoryForTesting()).toHaveLength(3);
    expect(_getStatusHistoryForTesting().every((entry) => entry.actor_id === staff.id)).toBe(true);
  });
});
