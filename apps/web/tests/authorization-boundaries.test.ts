import { describe, expect, it } from "vitest";
import { canAccessClaim, canAccessMatch, canOperate, publicItem } from "../app/api/lost-found/_auth";
import type { ServerIdentity } from "../lib/auth/server-identity";

const userA: ServerIdentity = { userId: "user-a", institutionalId: "A", isDemo: true };
const userB: ServerIdentity = { userId: "user-b", institutionalId: "B", isDemo: true };

const itemA = {
  id: "item-a",
  reporter_id: "user-a",
  title: "Wallet",
  public_description: "Black wallet",
  private_description: "Hidden serial 42",
  identifying_marks: "Hidden mark",
  status: "open",
  is_sensitive: true,
};

describe("cross-user authorization boundaries", () => {
  it("allows the owner and rejects a different student for item operations", () => {
    expect(canOperate(userA, itemA)).toBe(true);
    expect(canOperate(userB, itemA)).toBe(false);
  });

  it("does not expose private item fields or storage paths", () => {
    const safe = publicItem(itemA, [{ id: "image-1", storage_path: "private/path", public_url: "/safe.jpg" }]);
    expect(safe).not.toHaveProperty("private_description");
    expect(safe).not.toHaveProperty("identifying_marks");
    expect(safe.images[0]).not.toHaveProperty("storage_path");
  });

  it("limits match and claim access to a related party", () => {
    const itemB = { ...itemA, id: "item-b", reporter_id: "user-b" };
    const db = { lost_found_items: [itemA, itemB] };
    const match = { id: "match-1", lost_item_id: "item-a", found_item_id: "item-b" };
    const claim = { item_id: "item-a", claimant_id: "user-a", finder_id: "user-b" };

    expect(canAccessMatch(userA, match, db)).toBe(true);
    expect(canAccessMatch(userB, match, db)).toBe(true);
    expect(canAccessMatch({ ...userB, userId: "user-c" }, match, db)).toBe(false);
    expect(canAccessClaim(userA, claim, db)).toBe(true);
    expect(canAccessClaim(userB, claim, db)).toBe(true);
    expect(canAccessClaim({ ...userB, userId: "user-c" }, claim, db)).toBe(false);
  });
});
