import { CreateFoundItemRequestSchema, CreateLostItemRequestSchema } from "@smart-campus/contracts";

export const DEMO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEMO_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DEMO_IMAGE_MAX_COUNT = 3;
// Three 5MB images expand to about 20MB in base64. Leave room for the report text.
export const DEMO_REPORT_MAX_BYTES = 21 * 1024 * 1024;

type ImageFile = Pick<File, "name" | "size" | "type">;

export function validateDemoImageFiles(files: readonly ImageFile[]) {
  if (files.length > DEMO_IMAGE_MAX_COUNT) throw new Error("Attach no more than 3 photos.");
  for (const file of files) {
    if (!(DEMO_IMAGE_TYPES as readonly string[]).includes(file.type)) throw new Error("Only JPG, PNG, and WebP photos are supported in demo storage.");
    if (!file.size || file.size > DEMO_IMAGE_MAX_BYTES) throw new Error(`Image "${file.name}" must be non-empty and no larger than 5MB.`);
  }
}

export function readDemoImage(file: File): Promise<string> {
  validateDemoImageFiles([file]);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read this photo."));
    reader.onerror = () => reject(new Error("Unable to read this photo. Please select it again."));
    reader.onabort = () => reject(new Error("Photo reading was cancelled."));
    reader.readAsDataURL(file);
  });
}

export function serializeDemoReport(type: "lost" | "found", fields: Record<string, unknown>, dataUrls: readonly string[]) {
  if (dataUrls.length > DEMO_IMAGE_MAX_COUNT) throw new Error("Attach no more than 3 photos.");
  const images = dataUrls.map((url) => {
    const parsed = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
    if (!parsed || parsed[2].length % 4 !== 0) throw new Error("A photo has an invalid demo image payload. Please select it again.");
    const padding = parsed[2].endsWith("==") ? 2 : parsed[2].endsWith("=") ? 1 : 0;
    const bytes = parsed[2].length * 3 / 4 - padding;
    if (!bytes || bytes > DEMO_IMAGE_MAX_BYTES) throw new Error("A photo exceeds the 5MB demo storage limit.");
    return { public_url: url, storage_path: "base64" };
  });
  const input = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ""));
  const schema = type === "lost" ? CreateLostItemRequestSchema : CreateFoundItemRequestSchema;
  const result = schema.safeParse({ ...input, images });
  if (!result.success) throw new Error(result.error.issues.map((issue) => issue.message).join(" "));
  const body = JSON.stringify({ type, ...result.data });
  if (new TextEncoder().encode(body).byteLength > DEMO_REPORT_MAX_BYTES) throw new Error("This report is too large for demo storage. Remove a photo or shorten the description.");
  return body;
}
