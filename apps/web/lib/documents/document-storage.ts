import { createClient } from "../supabase/server";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export interface UploadFileOptions {
  ownerId: string;
  documentId: string;
  version: number;
  fileName: string;
  fileBuffer: ArrayBuffer | Buffer;
  mimeType: string;
}

export interface StorageUploadResult {
  storagePath: string;
  fileSize: number;
  mimeType: string;
  isMock: boolean;
}

export interface SignedUrlResult {
  signedUrl: string;
  expiresInSeconds: number;
  isMock: boolean;
}

/**
 * Validates file MIME type and file size.
 */
export function validateDocumentFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: '${mimeType}'. Allowed formats: PDF, JPEG, PNG, WEBP.`,
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds 10MB maximum limit.`,
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a file name for secure storage paths.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Uploads a document to private Supabase Storage or mock storage.
 */
export async function uploadDocumentToStorage(
  options: UploadFileOptions
): Promise<StorageUploadResult> {
  const { ownerId, documentId, version, fileName, fileBuffer, mimeType } = options;
  const cleanName = sanitizeFileName(fileName);
  const storagePath = `documents/${ownerId}/${documentId}/v${version}/${cleanName}`;

  try {
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error) {
      return {
        storagePath,
        fileSize: fileBuffer.byteLength,
        mimeType,
        isMock: false,
      };
    }
  } catch (_err) {
    // Supabase offline or storage bucket missing; proceed with mock storage path
  }

  return {
    storagePath,
    fileSize: fileBuffer.byteLength,
    mimeType,
    isMock: true,
  };
}

/**
 * Generates a temporary signed URL for viewing or downloading a private document.
 */
export async function createDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<SignedUrlResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      return {
        signedUrl: data.signedUrl,
        expiresInSeconds,
        isMock: false,
      };
    }
  } catch (_err) {
    // Supabase offline or storage not reachable
  }

  // Deterministic mock certified preview/download URL
  const mockUrl = `/api/documents/mock-preview?ref=${encodeURIComponent(storagePath)}`;
  return {
    signedUrl: mockUrl,
    expiresInSeconds,
    isMock: true,
  };
}
