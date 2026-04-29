import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type MediaType = "headshot" | "video" | "document" | "temp";

export interface StorageConfig {
  endpoint: string;
  publicUrl: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  buckets: {
    headshots: string;
    videos: string;
    documents: string;
    temp: string;
  };
}

function getConfig(): StorageConfig {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing required S3 configuration. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY"
    );
  }

  return {
    endpoint,
    publicUrl: process.env.S3_PUBLIC_URL ?? endpoint,
    region: process.env.S3_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
    buckets: {
      headshots: process.env.S3_BUCKET_HEADSHOTS ?? "headshots",
      videos: process.env.S3_BUCKET_VIDEOS ?? "videos",
      documents: process.env.S3_BUCKET_DOCUMENTS ?? "documents",
      temp: process.env.S3_BUCKET_TEMP ?? "temp",
    },
  };
}

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getConfig();
    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO and R2
    });
  }
  return s3Client;
}

export function getBucket(type: MediaType): string {
  const config = getConfig();
  const bucketMap: Record<MediaType, string> = {
    headshot: config.buckets.headshots,
    video: config.buckets.videos,
    document: config.buckets.documents,
    temp: config.buckets.temp,
  };
  return bucketMap[type];
}

export function generateKey(userId: string, filename: string, _type: MediaType): string {
  const timestamp = String(Date.now());
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${userId}/${timestamp}-${sanitizedFilename}`;
}

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

export interface UploadFileOptions {
  buffer: Buffer;
  key: string;
  type: MediaType;
  contentType: string;
  metadata?: Record<string, string>;
}

export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  const { buffer, key, type, contentType, metadata } = options;
  const client = getS3Client();
  const bucket = getBucket(type);

  const params: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  };

  await client.send(new PutObjectCommand(params));

  return {
    key,
    bucket,
    url: `${getConfig().publicUrl}/${bucket}/${key}`,
  };
}

export async function deleteFile(key: string, type: MediaType): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket(type);

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function fileExists(key: string, type: MediaType): Promise<boolean> {
  const client = getS3Client();
  const bucket = getBucket(type);

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function getSignedDownloadUrl(
  key: string,
  type: MediaType,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket(type);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function getSignedUploadUrl(
  key: string,
  type: MediaType,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket(type);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export function getPublicUrl(key: string, type: MediaType): string {
  const config = getConfig();
  const bucket = getBucket(type);
  return `${config.publicUrl}/${bucket}/${key}`;
}

// Document-specific storage functions
export {
  uploadDocument,
  downloadDocument,
  deleteDocument,
  generateDocumentKey,
} from "./document-storage";
