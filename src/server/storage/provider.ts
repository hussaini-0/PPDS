import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

export type SaveFileInput = {
  buffer: Buffer;
  originalName: string;
};

export interface StorageProvider {
  save(input: SaveFileInput): Promise<{
    storageKey: string;
    storageProvider: string;
  }>;
  read(storageKey: string): Promise<Buffer>;
}

class LocalStorageProvider implements StorageProvider {
  async save({ buffer, originalName }: SaveFileInput) {
    const extension = path.extname(originalName);
    const storageKey = `${randomUUID()}${extension}`;
    const absoluteDir = path.resolve(env.FILE_STORAGE_PATH);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, storageKey), buffer);

    return {
      storageKey,
      storageProvider: "local",
    };
  }

  async read(storageKey: string) {
    const absoluteDir = path.resolve(env.FILE_STORAGE_PATH);
    const absolutePath = path.resolve(absoluteDir, storageKey);
    if (!absolutePath.startsWith(`${absoluteDir}${path.sep}`)) throw new Error("Invalid storage key.");
    return readFile(absolutePath);
  }
}

class S3StorageProvider implements StorageProvider {
  private readonly client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials:
      env.S3_ACCESS_KEY && env.S3_SECRET_KEY
        ? {
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY,
          }
        : undefined,
  });

  async save({ buffer, originalName }: SaveFileInput) {
    if (!env.S3_BUCKET) {
      throw new Error("S3_BUCKET is required when FILE_STORAGE_PROVIDER=s3.");
    }

    const extension = path.extname(originalName).toLowerCase();
    const storageKey = `private/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey,
        Body: buffer,
        ContentType: "application/octet-stream",
        ServerSideEncryption: "AES256",
      }),
    );

    return { storageKey, storageProvider: "s3" };
  }

  async read(storageKey: string) {
    if (!env.S3_BUCKET) throw new Error("S3_BUCKET is required when FILE_STORAGE_PROVIDER=s3.");
    const result = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }));
    if (!result.Body) throw new Error("Stored file is empty.");
    return Buffer.from(await result.Body.transformToByteArray());
  }
}

export function getStorageProvider(): StorageProvider {
  return env.FILE_STORAGE_PROVIDER === "s3"
    ? new S3StorageProvider()
    : new LocalStorageProvider();
}
