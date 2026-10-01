import crypto from "crypto";

export interface StoredFile {
  storagePath: string;
  publicUrl: string;
  isSensitive: boolean;
  filename: string;
}

export interface StorageProvider {
  uploadImage(
    buffer: Buffer | Uint8Array,
    filename: string,
    mimeType: string,
    isSensitive?: boolean,
  ): Promise<StoredFile>;

  getSecureUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;

  deleteImage(storagePath: string): Promise<boolean>;
}

/**
 * Local development storage adapter (stores metadata/virtual paths).
 * Uploaded paths use non-guessable random UUIDs.
 */
export class LocalStorageAdapter implements StorageProvider {
  private basePath: string;

  constructor(basePath: string = "/uploads/lost-and-found") {
    this.basePath = basePath;
  }

  async uploadImage(
    _buffer: Buffer | Uint8Array,
    filename: string,
    _mimeType: string,
    isSensitive: boolean = false,
  ): Promise<StoredFile> {
    const fileId = crypto.randomUUID();
    const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
    const storagePath = `${this.basePath}/${fileId}.${ext}`;

    // For sensitive items, publicUrl is masked; client must request signed URL
    const publicUrl = isSensitive
      ? `/api/lost-found/media/secure/${fileId}`
      : `${this.basePath}/${fileId}.${ext}`;

    return {
      storagePath,
      publicUrl,
      isSensitive,
      filename,
    };
  }

  async getSecureUrl(
    storagePath: string,
    expiresInSeconds: number = 300,
  ): Promise<string> {
    const token = crypto.randomBytes(16).toString("hex");
    return `${storagePath}?token=${token}&expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  async deleteImage(_storagePath: string): Promise<boolean> {
    return true;
  }
}
