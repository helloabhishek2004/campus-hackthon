import { describe, it, expect } from "vitest";
import {
  sanitizeItemForViewer,
  canReleaseContactInfo,
} from "../../src/privacy/privacy";
import { LostFoundItem } from "@smart-campus/contracts";

const mockItem: LostFoundItem = {
  id: "item-001",
  type: "found",
  reporter_id: "finder-123",
  category: "wallets_purses",
  subcategory: "leather_wallet",
  title: "Brown Leather Wallet",
  public_description: "Found brown leather wallet near Library benches.",
  private_description: "Contains student ID card #987654 and $40 cash.",
  identifying_marks: "Initials 'J.D.' embossed on lower corner.",
  location_id: null,
  location_description: "Library Hall",
  event_date: new Date().toISOString(),
  status: "open",
  is_sensitive: true,
  images: [
    {
      storage_path: "/uploads/img1.jpg",
      public_url: "https://example.com/img1.jpg",
      is_sensitive: false,
      is_primary: true,
      detected_objects: ["wallet"],
    },
    {
      storage_path: "/uploads/secret-id.jpg",
      public_url: "https://example.com/secret-id.jpg",
      is_sensitive: true,
      is_primary: false,
      detected_objects: ["id_card"],
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("Module 3: Privacy & Redaction Rules", () => {
  it("redacts private description, marks, and sensitive images for public viewers", () => {
    const sanitized = sanitizeItemForViewer(mockItem, null);

    expect(sanitized.private_description).toBeNull();
    expect(sanitized.identifying_marks).toBeNull();
    expect(sanitized.images.length).toBe(1);
    expect(sanitized.images[0].public_url).toBe("https://example.com/img1.jpg");
    // Verify storage_path is not leaked
    expect((sanitized.images[0] as any).storage_path).toBeUndefined();
  });

  it("permits item reporter to see full item details", () => {
    const viewer = { userId: "finder-123", role: "student" as const };
    const sanitized = sanitizeItemForViewer(mockItem, viewer);

    expect(sanitized.private_description).toContain("student ID card");
    expect(sanitized.identifying_marks).toContain("Initials 'J.D.'");
    expect(sanitized.images.length).toBe(2);
  });

  it("never releases contact info if claim is unapproved, even if matched", () => {
    const viewer = { userId: "owner-789", role: "student" as const };
    const claim = {
      status: "pending",
      claimant_id: "owner-789",
      finder_id: "finder-123",
      handover_mode: "in_person",
    };

    const auth = canReleaseContactInfo(viewer, claim);
    expect(auth.isAuthorized).toBe(false);
    expect(auth.reason).toContain(
      "restricted until the claim is officially approved",
    );
  });

  it("releases contact info to authorized parties when claim is approved for in-person handover", () => {
    const viewer = { userId: "owner-789", role: "student" as const };
    const claim = {
      status: "approved",
      claimant_id: "owner-789",
      finder_id: "finder-123",
      handover_mode: "in_person",
    };
    const activeExpiry = new Date(Date.now() + 3600 * 1000);

    const auth = canReleaseContactInfo(viewer, claim, activeExpiry);
    expect(auth.isAuthorized).toBe(true);
  });

  it("restricts direct contact exchange when handover mode is campus_security", () => {
    const viewer = { userId: "owner-789", role: "student" as const };
    const claim = {
      status: "approved",
      claimant_id: "owner-789",
      finder_id: "finder-123",
      handover_mode: "campus_security",
    };

    const auth = canReleaseContactInfo(viewer, claim);
    expect(auth.isAuthorized).toBe(false);
    expect(auth.reason).toContain("Campus Security");
  });
});
