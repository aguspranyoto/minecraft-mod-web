import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { getUploadPresignedUrl } from "@/lib/r2";
import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  if ((session.user as { role?: string }).role !== "admin") return null;
  return session;
}

// GET all media files
export async function GET() {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allMedia = await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt));

  return Response.json(allMedia);
}

// POST - Get presigned upload URL and register media
export async function POST(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, contentType, bucket: bucketType } = body;

  if (!filename || !contentType) {
    return Response.json(
      { error: "Filename and content type are required" },
      { status: 400 }
    );
  }

  const isPublic = bucketType === "public";
  const bucket = isPublic
    ? process.env.R2_PUBLIC_BUCKET_NAME!
    : process.env.R2_PRIVATE_BUCKET_NAME!;

  const timestamp = Date.now();
  const key = `${timestamp}-${filename}`;

  try {
    const uploadUrl = await getUploadPresignedUrl(bucket, key, contentType);

    // Construct the file URL
    const fileUrl = isPublic
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`
      : key; // For private files, just store the key

    // Register in database
    const [newMedia] = await db
      .insert(media)
      .values({
        filename,
        url: fileUrl,
        bucket: isPublic ? "public" : "private",
        contentType,
      })
      .returning();

    return Response.json({
      uploadUrl,
      media: newMedia,
      key,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// DELETE media file
export async function DELETE(request: NextRequest) {
  const session = await verifyAdmin();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Media ID required" }, { status: 400 });
  }

  await db.delete(media).where(eq(media.id, parseInt(id)));

  return Response.json({ success: true });
}
