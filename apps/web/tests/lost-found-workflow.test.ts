import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { ServerIdentity } from "../lib/auth/server-identity";

const state = vi.hoisted(() => ({ identity: null as ServerIdentity | null, db: {} as any }));
vi.mock("../lib/auth/server-identity", () => ({ resolveServerIdentity: async () => state.identity }));
vi.mock("../lib/queue", () => ({ getQueue: async () => ({ send: vi.fn() }) }));
vi.mock("@smart-campus/lost-and-found", async (importOriginal) => ({
  ...await importOriginal<typeof import("@smart-campus/lost-and-found")>(),
  readDb: () => structuredClone(state.db),
  writeDb: (db: any) => { state.db = structuredClone(db); },
}));

import { GET as itemDetail } from "../app/api/lost-found/items/[id]/route";
import { GET as itemMatches } from "../app/api/lost-found/items/[id]/matches/route";
import { GET as claimDetail } from "../app/api/lost-found/claims/single/[id]/route";
import { POST as answerClaim } from "../app/api/lost-found/claims/[id]/answer/route";
import { POST as decideClaim } from "../app/api/lost-found/claims/[id]/decide/route";
import { GET as matchDetail } from "../app/api/lost-found/matches/single/[id]/route";
import { POST as createMatchedClaim } from "../app/api/lost-found/matches/[id]/claim/route";
import { POST as confirmHandover } from "../app/api/lost-found/claims/[id]/handover/route";
import { GET as listReports, POST as reportItem } from "../app/api/lost-found/items/route";
import { WorkflowClaimSchema } from "../app/lost-and-found/_lib/workflow-client";

const answers = [{ question: "Describe a concealed identifying mark", answer: "Blue initials on the inside" }];
const params = { params: Promise.resolve({ id: "claim" }) };
const matchParams = { params: Promise.resolve({ id: "match" }) };
const request = (body?: unknown) => new NextRequest("http://localhost/api/lost-found/claims/claim", body === undefined ? {} : {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const asUser = (userId: string) => { state.identity = { userId, institutionalId: userId, isDemo: true }; };

beforeEach(() => {
  asUser("claimant");
  state.db = {
    lost_found_items: [{
      id: "item", type: "found", reporter_id: "finder", category: "wallets_purses", title: "Black wallet",
      public_description: "Wallet found near the library", private_description: "Concealed details",
      identifying_marks: "Secret serial", status: "in_claim", created_at: "2026-10-01T00:00:00Z",
    }, {
      id: "lost", type: "lost", reporter_id: "claimant", category: "wallets_purses", title: "Lost wallet",
      public_description: "Wallet missing from the library", private_description: "Lost report private mark",
      status: "in_claim", created_at: "2026-10-01T00:00:00Z",
    }],
    lost_found_item_images: [
      { id: "safe-image", item_id: "item", storage_path: "private/path", public_url: "https://example.com/wallet.jpg" },
      { id: "secret-image", item_id: "item", storage_path: "secret/path", public_url: "https://example.com/secret.jpg", is_sensitive: true },
    ],
    lost_found_matches: [{ id: "match", lost_item_id: "lost", found_item_id: "item", is_dismissed: false, dismissed_by: "private-actor" }],
    lost_found_claims: [{
      id: "claim", item_id: "item", match_id: "match", claimant_id: "claimant", finder_id: "finder", status: "pending",
      claim_text: "I lost this wallet", verification_answers: [], handover_mode: "campus_security",
      created_at: "2026-10-01T00:00:00Z", match: { private_description: "Do not leak joins" },
    }],
    lost_found_item_events: [],
  };
});

describe("Lost & Found server verification workflow", () => {
  it("lists only session-owned lost and found reports, including closed states", async () => {
    state.db.lost_found_items.push({ ...state.db.lost_found_items[0], id: "my-found", reporter_id: "claimant", status: "resolved" });
    const url = "http://localhost/api/lost-found/items?mine=true&status=all&reporter_id=finder";
    const result = await (await listReports(new NextRequest(url))).json();
    expect(result.scope).toBe("mine");
    expect(result.items.map((i: any) => i.id).sort()).toEqual(["lost", "my-found"]);
    expect(result.pagination.total).toBe(2);
    expect(JSON.stringify(result.items)).not.toMatch(/reporter_id|private_description|identifying_marks|storage_path/);
    asUser("finder");
    expect((await (await listReports(new NextRequest(url))).json()).items.map((i: any) => i.id)).toEqual(["item"]);
    state.identity = null;
    expect((await listReports(new NextRequest(url))).status).toBe(401);
  });

  it("refuses invalid pagination rather than returning an invalid personal listing", async () => {
    expect((await listReports(new NextRequest("http://localhost/api/lost-found/items?mine=true&page=NaN"))).status).toBe(400);
  });

  it("enforces demo image limits on the server before persistence", async () => {
    const report = { type: "lost", title: "Campus bag", category: "bags_backpacks", public_description: "Blue backpack with a zip", event_date: "2026-10-08T10:00:00Z" };
    const image = { public_url: "data:image/png;base64,YWJj", storage_path: "base64" };
    const before = structuredClone(state.db);
    expect((await reportItem(request({ ...report, images: Array(4).fill(image) }))).status).toBe(400);
    expect((await reportItem(request({ ...report, images: [{ ...image, public_url: "data:image/svg+xml;base64,YWJj" }] }))).status).toBe(400);
    expect((await reportItem(request({ ...report, images: [{ ...image, public_url: "data:image/png;base64,not valid" }] }))).status).toBe(400);
    expect((await reportItem(new NextRequest("http://localhost/api/lost-found/items", { method: "POST", headers: { "content-length": String(22 * 1024 * 1024) }, body: "{}" }))).status).toBe(413);
    expect(state.db).toEqual(before);
  });

  it("derives item capabilities from the viewer without exposing reporter IDs or concealed details", async () => {
    asUser("finder");
    const owner = await itemDetail(request(), { params: Promise.resolve({ id: "item" }) });
    const result = await owner.json();
    expect(result.capabilities).toEqual({ isReporter: true, canManage: true, canViewMatches: true });
    expect(result.item).not.toHaveProperty("reporter_id");
    expect(result.item).not.toHaveProperty("private_description");
    expect(result.item).not.toHaveProperty("identifying_marks");
    expect(result.item.images).toHaveLength(1);
    expect(result.item.images[0]).not.toHaveProperty("storage_path");
    const candidateList = await (await itemMatches(request(), { params: Promise.resolve({ id: "item" }) })).json();
    expect(candidateList.matches).toHaveLength(1);
    expect(candidateList.matches[0]).not.toHaveProperty("dismissed_by");
    expect(JSON.stringify(candidateList.matches)).not.toMatch(/reporter_id|private_description|identifying_marks|storage_path/);
    asUser("other");
    const other = await itemDetail(request(), { params: Promise.resolve({ id: "item" }) });
    expect((await other.json()).capabilities).toEqual({ isReporter: false, canManage: false, canViewMatches: false });
    const unrelatedList = await (await itemMatches(request(), { params: Promise.resolve({ id: "item" }) })).json();
    expect(unrelatedList).toMatchObject({ matches: [] });
  });

  it("saves validated answers, lets the finder review them safely, then approves", async () => {
    const saved = await answerClaim(request({ answers: answers.map((a) => ({ ...a, answer: ` ${a.answer} `, private_extra: "discard" })) }), params);
    expect(saved.status).toBe(200);
    expect(state.db.lost_found_claims[0].verification_answers).toEqual(answers);
    asUser("finder");
    const detail = await claimDetail(request(), params);
    const result = await detail.json();
    expect(result.claim.verification_answers).toEqual(answers);
    expect(WorkflowClaimSchema.safeParse(result.claim).success).toBe(true);
    expect(result.capabilities).toEqual({ isClaimant: false, isFinder: true, canAnswer: false, canDecide: true, canApprove: true, canHandover: false, canRevealContact: false });
    expect(result.claim).not.toHaveProperty("match");
    expect(result.claim).not.toHaveProperty("claimant_id");
    expect(result.claim).not.toHaveProperty("finder_id");
    expect(result.claim).not.toHaveProperty("decided_by");
    expect(result.claim.item).not.toHaveProperty("private_description");
    expect(result.claim.item).not.toHaveProperty("reporter_id");
    expect(result.claim.item.images).toHaveLength(1);
    expect(result.claim.item.images[0]).not.toHaveProperty("storage_path");
    const approved = await decideClaim(request({ decision: "approved" }), params);
    expect(approved.status).toBe(200);
    expect(state.db.lost_found_claims[0].status).toBe("approved");
    expect(state.db.lost_found_items[0].status).toBe("handover");
    expect(state.db.lost_found_items[1].status).toBe("handover");
    expect(state.db.lost_found_item_events.filter((e: any) => e.event_type === "claim_approved")).toHaveLength(2);
    asUser("claimant");
    expect((await answerClaim(request({ answers }), params)).status).toBe(409);
    expect((await (await claimDetail(request(), params)).json()).capabilities.canAnswer).toBe(false);
  });

  it.each([[], [{ question: "Mark?", answer: "   " }], [{ question: "", answer: "Blue mark" }], "not an answer array", [{ question: "Mark?", answer: 42 }]])(
    "rejects invalid answer evidence (%j) and prevents approval", async (invalidAnswers) => {
      expect((await answerClaim(request({ answers: invalidAnswers }), params)).status).toBe(400);
      // A legacy invalid persisted answer must not bypass the approval guard either.
      state.db.lost_found_claims[0].verification_answers = invalidAnswers;
      asUser("finder");
      const detail = await claimDetail(request(), params);
      expect((await detail.json()).capabilities.canApprove).toBe(false);
      expect((await decideClaim(request({ decision: "approved" }), params)).status).toBe(409);
      expect(state.db.lost_found_claims[0].status).toBe("pending");
      expect(state.db.lost_found_items[0].status).toBe("in_claim");
    },
  );

  it("keeps claim access, answer mutation and decisions authorized", async () => {
    expect((await decideClaim(request({ decision: "approved" }), params)).status).toBe(403);
    asUser("finder");
    expect((await answerClaim(request({ answers }), params)).status).toBe(403);
    asUser("other");
    expect((await claimDetail(request(), params)).status).toBe(403);
    expect((await answerClaim(request({ answers }), params)).status).toBe(403);
    expect((await decideClaim(request({ decision: "rejected" }), params)).status).toBe(403);
    state.identity = null;
    expect((await claimDetail(request(), params)).status).toBe(401);
  });

  it.each(["approved", "handover", "rejected", "withdrawn"])("does not permit answer changes or decisions for %s claims", async (status) => {
    state.db.lost_found_claims[0].status = status;
    expect((await answerClaim(request({ answers }), params)).status).toBe(409);
    asUser("finder");
    expect((await decideClaim(request({ decision: "rejected" }), params)).status).toBe(409);
  });

  it("accepts answers and approval while requested questions await review", async () => {
    state.db.lost_found_claims[0].status = "questions_pending";
    expect((await answerClaim(request({ answers }), params)).status).toBe(200);
    asUser("finder");
    expect((await decideClaim(request({ decision: "approved" }), params)).status).toBe(200);
  });

  it("allows rejection without evidence, but refuses mutations after item withdrawal", async () => {
    state.db.lost_found_items[0].status = "withdrawn";
    expect((await answerClaim(request({ answers }), params)).status).toBe(409);
    asUser("finder");
    expect((await decideClaim(request({ decision: "rejected" }), params)).status).toBe(409);
    state.db.lost_found_items[0].status = "in_claim";
    expect((await decideClaim(request({ decision: "rejected" }), params)).status).toBe(200);
    expect(state.db.lost_found_items.map((i: any) => i.status)).toEqual(["open", "open"]);
    expect(state.db.lost_found_item_events.filter((e: any) => e.event_type === "claim_rejected")).toHaveLength(2);
  });

  it("discovers safe claim summaries for the finder and the lost-item reporter, but not other viewers", async () => {
    const read = async (id: string) => (await itemDetail(request(), { params: Promise.resolve({ id }) })).json();
    asUser("finder");
    const found = await read("item");
    expect(found.claims).toEqual([{ id: "claim", item_id: "item", match_id: "match", status: "pending", created_at: "2026-10-01T00:00:00Z" }]);
    expect(JSON.stringify(found.claims)).not.toMatch(/claimant_id|finder_id|verification_answers|claim_text|private_description/);
    asUser("claimant");
    state.db.lost_found_claims.push({ ...state.db.lost_found_claims[0], id: "unrelated-claimant", claimant_id: "other" });
    expect((await read("lost")).claims.map((c: any) => c.id)).toEqual(["claim"]);
    asUser("other");
    expect((await read("item")).claims).toEqual([]);
    expect((await read("lost")).claims).toEqual([]);
  });

  it("exposes the active claim continuation and never adds identity fields to match detail", async () => {
    const detail = await matchDetail(request(), matchParams);
    const body = await detail.json();
    expect(body.capabilities.canClaim).toBe(false);
    expect(body.existingClaimId).toBe("claim");
    expect(body.match).not.toHaveProperty("dismissed_by");
    expect(body.match.lost_item).not.toHaveProperty("reporter_id");
    expect(body.match.found_item).not.toHaveProperty("private_description");
    asUser("finder");
    expect((await (await matchDetail(request(), matchParams)).json()).existingClaimId).toBe("claim");
    asUser("other");
    expect((await matchDetail(request(), matchParams)).status).toBe(403);
  });

  it("allows only an eligible lost reporter to claim an open, undismissed match", async () => {
    state.db.lost_found_claims = [];
    for (const item of state.db.lost_found_items) item.status = "open";
    expect((await (await matchDetail(request(), matchParams)).json()).capabilities.canClaim).toBe(true);
    asUser("finder");
    expect((await (await matchDetail(request(), matchParams)).json()).capabilities.canClaim).toBe(false);
    expect((await createMatchedClaim(request({ claimText: "I own this wallet" }), matchParams)).status).toBe(403);
    asUser("claimant");
    const created = await createMatchedClaim(request({ claimText: "I own this wallet", claimant_id: "spoofed" }), matchParams);
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.claim).not.toHaveProperty("claimant_id");
    expect(body.claim).not.toHaveProperty("finder_id");
    expect(body.claim).not.toHaveProperty("decided_by");
    expect(body.claim.item).not.toHaveProperty("reporter_id");
    expect(state.db.lost_found_items.map((i: any) => i.status)).toEqual(["in_claim", "in_claim"]);
    expect(state.db.lost_found_claims[0].claimant_id).toBe("claimant");
    expect(state.db.lost_found_item_events).toHaveLength(2);
    expect((await createMatchedClaim(request({ claimText: "Duplicate attempt" }), matchParams)).status).toBe(409);
    expect(state.db.lost_found_claims).toHaveLength(1);
  });

  it.each(["processing", "in_claim", "handover", "resolved", "expired", "withdrawn"])("does not create a claim when either item is %s", async (status) => {
    state.db.lost_found_claims = [];
    for (const index of [0, 1]) {
      for (const item of state.db.lost_found_items) item.status = "open";
      state.db.lost_found_items[index].status = status;
      const before = structuredClone(state.db);
      expect((await (await matchDetail(request(), matchParams)).json()).capabilities.canClaim).toBe(false);
      expect((await createMatchedClaim(request({ claimText: "I own this wallet" }), matchParams)).status).toBe(409);
      expect(state.db).toEqual(before);
    }
  });

  it("prevents claims for dismissed matches and treats questions_pending as an active claim", async () => {
    for (const item of state.db.lost_found_items) item.status = "open";
    state.db.lost_found_claims[0].status = "questions_pending";
    expect((await (await matchDetail(request(), matchParams)).json()).existingClaimId).toBe("claim");
    expect((await createMatchedClaim(request({ claimText: "Duplicate claim" }), matchParams)).status).toBe(409);
    state.db.lost_found_claims = [];
    state.db.lost_found_matches[0].is_dismissed = true;
    expect((await (await matchDetail(request(), matchParams)).json()).capabilities.canClaim).toBe(false);
    expect((await createMatchedClaim(request({ claimText: "I own this wallet" }), matchParams)).status).toBe(409);
    expect(state.db.lost_found_claims).toHaveLength(0);
  });

  it("lets only the claimant confirm approved handover once and resolves both reports with events", async () => {
    state.db.lost_found_claims[0].verification_answers = answers;
    asUser("finder");
    expect((await decideClaim(request({ decision: "approved" }), params)).status).toBe(200);
    expect((await confirmHandover(request({ mode: "campus_security" }), params)).status).toBe(403);
    asUser("other");
    expect((await confirmHandover(request({ mode: "campus_security" }), params)).status).toBe(403);
    asUser("claimant");
    expect((await (await claimDetail(request(), params)).json()).capabilities.canHandover).toBe(true);
    expect((await confirmHandover(request({ mode: "campus_security", claim_id: "spoofed-id" }), params)).status).toBe(200);
    expect(state.db.lost_found_claims[0].status).toBe("handover");
    expect(state.db.lost_found_items.map((i: any) => i.status)).toEqual(["resolved", "resolved"]);
    expect(state.db.lost_found_item_events.filter((e: any) => e.event_type === "handover_completed").map((e: any) => e.item_id).sort()).toEqual(["item", "lost"]);
    expect((await confirmHandover(request({ mode: "campus_security" }), params)).status).toBe(409);
    expect((await (await claimDetail(request(), params)).json()).capabilities.canHandover).toBe(false);
  });

  it.each(["pending", "questions_pending", "rejected", "withdrawn", "handover"])("returns a handover state conflict for %s claims", async (status) => {
    state.db.lost_found_claims[0].status = status;
    const before = structuredClone(state.db);
    expect((await confirmHandover(request({ mode: "campus_security" }), params)).status).toBe(409);
    expect(state.db).toEqual(before);
  });

  it("rejects invalid handover modes and incomplete linked item states without mutation", async () => {
    state.db.lost_found_claims[0].status = "approved";
    for (const item of state.db.lost_found_items) item.status = "handover";
    expect((await confirmHandover(request({ mode: "teleport" }), params)).status).toBe(400);
    state.db.lost_found_items[1].status = "withdrawn";
    const before = structuredClone(state.db);
    expect((await confirmHandover(request({ mode: "campus_security" }), params)).status).toBe(409);
    expect(state.db).toEqual(before);
  });
});
