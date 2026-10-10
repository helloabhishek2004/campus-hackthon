import { describe, expect, it } from "vitest";
import { DEMO_IMAGE_MAX_BYTES, DEMO_REPORT_MAX_BYTES, serializeDemoReport, validateDemoImageFiles } from "../app/lost-and-found/_lib/demo-images";

const fields = {
  title: "Campus backpack", category: "bags_backpacks", public_description: "A blue canvas backpack",
  location_description: "Library", event_date: "2026-10-08T10:00:00Z", identifying_marks: "Private mark", subcategory: "",
};
const png = "data:image/png;base64,iVBORw0KGgo=";

describe("Lost & Found inline demo image guards", () => {
  it("allows supported image types up to the existing 5MB limit", () => {
    expect(() => validateDemoImageFiles(["image/jpeg", "image/png", "image/webp"].map((type) => ({ type, size: DEMO_IMAGE_MAX_BYTES, name: "photo" })))).not.toThrow();
  });

  it("rejects unsupported types, empty files, oversized photos, and more than three selections", () => {
    for (const type of ["image/svg+xml", "image/gif", "text/plain", ""]) {
      expect(() => validateDemoImageFiles([{ name: "photo", type, size: 10 }])).toThrow("Only JPG, PNG, and WebP");
    }
    for (const size of [0, DEMO_IMAGE_MAX_BYTES + 1]) {
      expect(() => validateDemoImageFiles([{ name: "photo.png", type: "image/png", size }])).toThrow("5MB");
    }
    expect(() => validateDemoImageFiles(Array.from({ length: 4 }, () => ({ name: "photo.png", type: "image/png", size: 10 })))).toThrow("no more than 3");
  });

  it.each(["lost", "found"] as const)("validates %s report payloads and marks inline photos as base64 demo storage", (type) => {
    const body = JSON.parse(serializeDemoReport(type, fields, [png]));
    expect(body.type).toBe(type);
    expect(body.images).toEqual([{ public_url: png, storage_path: "base64", is_sensitive: false, is_primary: false, detected_objects: [] }]);
    expect(body.identifying_marks).toBe("Private mark");
    expect(body).not.toHaveProperty("subcategory");
    expect(() => serializeDemoReport(type, { ...fields, title: "x" }, [png])).toThrow();
    expect(() => serializeDemoReport(type, { ...fields, category: "invented" }, [png])).toThrow();
  });

  it("rejects malformed, non-image, and oversized encoded payloads before POST", () => {
    for (const url of ["https://example.com/photo.png", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,invalid!", "data:image/png;base64,"]) {
      expect(() => serializeDemoReport("lost", fields, [url])).toThrow("invalid demo image payload");
    }
    const oversized = `data:image/png;base64,${"A".repeat(4 * Math.ceil((DEMO_IMAGE_MAX_BYTES + 1) / 3))}`;
    expect(() => serializeDemoReport("found", fields, [oversized])).toThrow("5MB demo storage limit");
    expect(() => serializeDemoReport("lost", fields, [png, png, png, png])).toThrow("no more than 3");
  });

  it("guards the total serialized UTF-8 request size", () => {
    expect(() => serializeDemoReport("found", { ...fields, public_description: "a".repeat(DEMO_REPORT_MAX_BYTES) }, []))
      .toThrow("too large for demo storage");
  });
});
