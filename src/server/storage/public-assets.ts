import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

const imageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

function s3Client() {
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
      : undefined,
  });
}

export async function savePublicProductImage(file: File) {
  const extension = imageTypes.get(file.type);
  if (!extension) throw new Error("Product media must be a PNG, JPEG, or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Product media must be 5 MB or smaller.");

  const filename = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (env.FILE_STORAGE_PROVIDER === "s3") {
    if (!env.S3_BUCKET || !env.PUBLIC_ASSET_BASE_URL) {
      throw new Error("S3_BUCKET and PUBLIC_ASSET_BASE_URL are required for public product media.");
    }
    const storageKey = `public/products/${filename}`;
    await s3Client().send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return `${env.PUBLIC_ASSET_BASE_URL.replace(/\/$/, "")}/${storageKey}`;
  }

  const directory = path.resolve("public", "uploads", "products");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);
  return `/uploads/products/${filename}`;
}

export async function deletePublicProductImage(url: string | null) {
  if (!url) return;
  if (url.startsWith("/uploads/products/")) {
    const directory = path.resolve("public", "uploads", "products");
    const target = path.resolve("public", url.slice(1));
    if (!target.startsWith(`${directory}${path.sep}`)) return;
    await unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return;
  }
  const baseUrl = env.PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl || !env.S3_BUCKET || !url.startsWith(`${baseUrl}/public/products/`)) return;
  const key = url.slice(baseUrl.length + 1);
  await s3Client().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
