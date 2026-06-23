import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { s3Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { NextRequest } from "next/server";

async function verifyAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  if ((session.user as { role?: string }).role !== "admin") return null;
  return session;
}

// POST - Upload file directly through server (avoids CORS on private buckets)
export async function POST(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucketType = formData.get("bucket") as string;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const isPublic = bucketType === "public";
  const bucket = isPublic
    ? process.env.R2_PUBLIC_BUCKET_NAME!
    : process.env.R2_PRIVATE_BUCKET_NAME!;

  const timestamp = Date.now();
  const key = `${timestamp}-${file.name}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const fileUrl = key;

    const [newMedia] = await db
      .insert(media)
      .values({
        filename: file.name,
        url: fileUrl,
        bucket: isPublic ? "public" : "private",
        contentType: file.type || null,
      })
      .returning();

    return Response.json({ media: newMedia, key });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
