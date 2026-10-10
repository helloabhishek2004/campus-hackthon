import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const persistence = vi.hoisted(() => ({
  results: [] as any[],
  operations: [] as { table: string; update?: any; insert?: any; filters: [string, unknown][] }[],
}));
vi.mock("../lib/supabase/server", () => ({
  createApplicationClient: async () => ({
    from(table: string) {
      const operation = { table, filters: [] as [string, unknown][], update: undefined as any, insert: undefined as any };
      persistence.operations.push(operation);
      const query = {
        select() { return query; },
        update(value: any) { operation.update = value; return query; },
        insert(value: any) { operation.insert = value; return query; },
        eq(column: string, value: unknown) { operation.filters.push([column, value]); return query; },
        in(column: string, value: unknown) { operation.filters.push([column, value]); return query; },
        order() { return query; },
        limit() { return query; },
        maybeSingle: async () => persistence.results.shift(),
        single: async () => persistence.results.shift(),
        then(resolve: (result: any) => unknown, reject: (error: unknown) => unknown) {
          return Promise.resolve(persistence.results.shift()).then(resolve, reject);
        },
      };
      return query;
    },
  }),
}));

import { createClaim, decideClaim, getItemClaimSummaries, handoverClaim, saveClaimAnswers } from "../lib/lost-found/repository";

const answers = [{ question: "Private mark?", answer: "Blue initials" }];
const current = (status = "pending") => ({
  id: "claim", match_id: "match", claimant_id: "claimant", status, verification_answers: answers,
  item: { id: "item", reporter_id: "finder", status: "in_claim" },
  match: { id: "match", found_item_id: "item", lost_item_id: "lost", lost: { id: "lost", reporter_id: "claimant", status: "in_claim" } },
});
const result = (data: any) => ({ data, error: null });

beforeEach(() => {
  // Exercise the configured persistence branch with a local fake client, not the test store.
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
  persistence.results = [];
  persistence.operations = [];
});
afterEach(() => vi.unstubAllEnvs());

describe("Lost & Found configured persistence workflow guards", () => {
  it("filters answer updates by claimant and current reviewable state", async () => {
    persistence.results = [result(current("questions_pending")), result({ id: "claim", verification_answers: answers })];
    await saveClaimAnswers("claim", "claimant", answers);
    expect(persistence.operations[1].update.verification_answers).toEqual(answers);
    expect(persistence.operations[1].filters).toEqual([
      ["id", "claim"], ["claimant_id", "claimant"], ["status", "questions_pending"],
    ]);
  });

  it("refuses to update answers when the claim closes concurrently", async () => {
    persistence.results = [result(current()), result(null)];
    await expect(saveClaimAnswers("claim", "claimant", answers)).rejects.toMatchObject({ status: 409 });
  });

  it("checks answer ownership and final state before any configured persistence mutation", async () => {
    persistence.results = [result(current())];
    await expect(saveClaimAnswers("claim", "finder", answers)).rejects.toMatchObject({ status: 403 });
    expect(persistence.operations).toHaveLength(1);
    persistence.results = [result(current("approved"))];
    await expect(saveClaimAnswers("claim", "claimant", answers)).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(2);
  });

  it("compares validated evidence on approval and stops if it changes concurrently", async () => {
    persistence.results = [result(current()), result(null)];
    await expect(decideClaim("claim", "finder", "approved")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations[1].filters).toContainEqual(["status", "pending"]);
    expect(persistence.operations[1].filters).toContainEqual(["verification_answers", JSON.stringify(answers)]);
    // An unsuccessful conditional decision must not move the item or write an event.
    expect(persistence.operations).toHaveLength(2);
  });

  it("requires verification evidence before making a configured approval mutation", async () => {
    persistence.results = [result({ ...current(), verification_answers: [] })];
    await expect(decideClaim("claim", "finder", "approved")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(1);
  });

  it.each(["approved", "rejected"] as const)("synchronizes both linked items with audited checked updates for %s", async (decision) => {
    const next = decision === "approved" ? "handover" : "open";
    persistence.results = [result(current()), result({ id: "claim", status: decision }), result({ id: "lost", status: next }), result(null), result({ id: "item", status: next }), result(null)];
    await expect(decideClaim("claim", "finder", decision)).resolves.toMatchObject({ status: decision });
    const updates = persistence.operations.filter((o) => o.table === "lost_found_items");
    expect(updates).toHaveLength(2);
    expect(updates.map((o) => o.update.status)).toEqual([next, next]);
    expect(updates.map((o) => o.filters)).toEqual([[["id", "lost"], ["status", "in_claim"]], [["id", "item"], ["status", "in_claim"]]]);
    expect(persistence.operations.filter((o) => o.table === "lost_found_item_events").map((o) => o.insert.event_type)).toEqual([`claim_${decision}`, `claim_${decision}`]);
  });

  it("does not report successful approval when a linked item update affects zero rows", async () => {
    persistence.results = [result(current()), result({ id: "claim", status: "approved" }), result(null)];
    await expect(decideClaim("claim", "finder", "approved")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(3);
  });

  it("checks creation dismissal and item states before inserting a configured claim", async () => {
    const match = { id: "match", lost: { id: "lost", type: "lost", reporter_id: "claimant", status: "open" }, found: { id: "item", type: "found", reporter_id: "finder", status: "open" } };
    for (const invalid of [{ ...match, is_dismissed: true }, { ...match, found: { ...match.found, status: "withdrawn" } }]) {
      persistence.results = [result(invalid)];
      await expect(createClaim({ matchId: "match", claimantId: "claimant", claimText: "I own this wallet" })).rejects.toMatchObject({ status: 409 });
    }
    expect(persistence.operations.every((o) => !o.insert && !o.update)).toBe(true);
  });

  it("checks linked item creation updates rather than returning success on zero rows", async () => {
    const match = { id: "match", lost: { id: "lost", type: "lost", reporter_id: "claimant", status: "open" }, found: { id: "item", type: "found", reporter_id: "finder", status: "open" } };
    persistence.results = [result(match), result([]), result({ id: "claim" }), result(null)];
    await expect(createClaim({ matchId: "match", claimantId: "claimant", claimText: "I own this wallet" })).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations.filter((o) => o.table === "lost_found_item_events")).toHaveLength(0);
  });

  it("discovers lost-owner continuation through match IDs with identity-free summaries", async () => {
    persistence.results = [result([{ id: "match" }]), result([{ id: "claim", item_id: "item", match_id: "match", status: "approved", claimant_id: "claimant" }])];
    const summaries = await getItemClaimSummaries({ id: "lost", type: "lost", reporter_id: "claimant" }, "claimant");
    expect(summaries).toEqual([{ id: "claim", item_id: "item", match_id: "match", status: "approved", created_at: undefined }]);
    expect(persistence.operations.find((o) => o.table === "lost_found_matches")?.filters).toEqual([["lost_item_id", "lost"]]);
    expect(persistence.operations.find((o) => o.table === "lost_found_claims")?.filters).toEqual([["match_id", ["match"]], ["claimant_id", "claimant"]]);
  });

  const handoverCurrent = (status = "approved") => {
    const claim = current(status);
    claim.item.status = "handover";
    claim.match.lost.status = "handover";
    return claim;
  };

  it.each(["finder", "other"])("refuses configured handover by %s before mutation", async (actor) => {
    persistence.results = [result(handoverCurrent())];
    await expect(handoverClaim("claim", actor, "campus_security")).rejects.toMatchObject({ status: 403 });
    expect(persistence.operations).toHaveLength(1);
  });

  it.each(["pending", "rejected", "withdrawn", "handover"])("refuses configured handover for %s claims", async (status) => {
    persistence.results = [result(handoverCurrent(status))];
    await expect(handoverClaim("claim", "claimant", "campus_security")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(1);
  });

  it("conditionally completes configured handover and resolves both linked reports with audit events", async () => {
    persistence.results = [result(handoverCurrent()), result({ id: "claim", status: "handover" }), result({ id: "lost", status: "resolved" }), result(null), result({ id: "item", status: "resolved" }), result(null)];
    await expect(handoverClaim("claim", "claimant", "campus_security")).resolves.toMatchObject({ status: "handover" });
    expect(persistence.operations[1].filters).toEqual([["id", "claim"], ["claimant_id", "claimant"], ["status", "approved"]]);
    expect(persistence.operations.filter((o) => o.table === "lost_found_items").map((o) => o.update.status)).toEqual(["resolved", "resolved"]);
    expect(persistence.operations.filter((o) => o.table === "lost_found_item_events").map((o) => o.insert.item_id)).toEqual(["lost", "item"]);
  });

  it("returns a conflict for concurrently completed handover instead of false success", async () => {
    persistence.results = [result(handoverCurrent()), result(null)];
    await expect(handoverClaim("claim", "claimant", "campus_security")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(2);
  });

  it("does not return successful handover when a linked report update affects zero rows", async () => {
    persistence.results = [result(handoverCurrent()), result({ id: "claim", status: "handover" }), result(null)];
    await expect(handoverClaim("claim", "claimant", "campus_security")).rejects.toMatchObject({ status: 409 });
    expect(persistence.operations).toHaveLength(3);
  });
});
