import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ServiceError } from "../errors";

let s3Client: S3Client | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = requireEnv("AWS_REGION");
  const accessKeyId = requireEnv("AWS_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("AWS_SECRET_ACCESS_KEY");

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(process.env.AWS_SESSION_TOKEN
        ? { sessionToken: process.env.AWS_SESSION_TOKEN }
        : {}),
    },
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
    ...(process.env.S3_FORCE_PATH_STYLE === "true"
      ? { forcePathStyle: true }
      : {}),
  });

  return s3Client;
}

function getBucket(): string {
  return requireEnv("S3_BUCKET");
}

function buildObjectKey(folder: "photos" | "proofs", originalName: string): string {
  const ext = path.extname(originalName) || "";
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `stalls/${folder}/${unique}${ext}`;
}

export function buildPublicUrl(key: string): string {
  const customBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (customBase) {
    return `${customBase}/${key}`;
  }

  const bucket = getBucket();
  const region = requireEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/** Extract S3 object key from a canonical or presigned URL stored in the database. */
export function getObjectKeyFromStoredUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("stalls/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    let key = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

    const bucket = process.env.S3_BUCKET;
    if (bucket && key.startsWith(`${bucket}/`)) {
      key = key.slice(bucket.length + 1);
    }

    if (key.startsWith("stalls/")) {
      return key;
    }

    return null;
  } catch {
    return null;
  }
}

function signedUrlExpiresIn(): number {
  const raw = process.env.S3_SIGNED_URL_EXPIRES_SECONDS;
  const parsed = raw ? Number(raw) : 86400;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 86400;
}

/** Temporary read URL for private S3 objects. */
export async function getSignedReadUrl(key: string): Promise<string> {
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: signedUrlExpiresIn() }
  );
}

function isPrivateStallObjectKey(key: string): boolean {
  return key.startsWith("stalls/photos/") || key.startsWith("stalls/proofs/");
}

/**
 * Returns a URL the browser can load for stall photos or proof documents.
 * Signs private S3 objects; leaves other URLs unchanged.
 */
export async function resolveStallFileUrlForClient(
  storedUrl: string
): Promise<string> {
  const trimmed = storedUrl.trim();
  if (!trimmed) return "";

  if (process.env.S3_USE_PRESIGNED_URLS === "false") {
    return trimmed;
  }

  const key = getObjectKeyFromStoredUrl(trimmed);
  if (!key || !isPrivateStallObjectKey(key)) {
    return trimmed;
  }

  try {
    return await getSignedReadUrl(key);
  } catch (err) {
    console.error(`Failed to sign S3 URL for key=${key}:`, err);
    return trimmed;
  }
}

/** @deprecated Use resolveStallFileUrlForClient — kept for existing imports. */
export async function resolveImageUrlForClient(storedUrl: string): Promise<string> {
  return resolveStallFileUrlForClient(storedUrl);
}

export async function uploadStallFileToS3(
  file: Express.Multer.File,
  folder: "photos" | "proofs"
): Promise<string> {
  if (!file.buffer) {
    throw new ServiceError("File upload failed. Please try again.");
  }

  const key = buildObjectKey(folder, file.originalname);
  const usePublicPhotos =
    folder === "photos" && process.env.S3_PHOTOS_PUBLIC === "true";

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ...(usePublicPhotos ? { ACL: "public-read" } : {}),
      })
    );

    const storedUrl = buildPublicUrl(key);
    // Store canonical S3 URLs in the database; presign when serving to clients.
    return storedUrl;
  } catch (err) {
    console.error(`S3 upload failed for key=${key}:`, err);
    throw new ServiceError("Unable to upload file. Please try again later.");
  }
}
