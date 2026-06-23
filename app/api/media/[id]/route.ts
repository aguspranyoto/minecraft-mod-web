import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDownloadPresignedUrl, getUploadPresignedUrl } from "@/lib/r2";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [file] = await db
    .select()
    .from(media)
    .where(eq(media.id, parseInt(id)))
    .limit(1);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bucket =
    file.bucket === "public"
      ? process.env.R2_PUBLIC_BUCKET_NAME!
      : process.env.R2_PRIVATE_BUCKET_NAME!;

  // file.url is the key for both public and private
  const key = file.url;

  if (file.bucket === "public") {
    // Public: redirect to R2 direct URL
    const publicUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`;
    return NextResponse.redirect(publicUrl);
  }

  // Private: generate presigned URL and redirect
  try {
    const presignedUrl = await getDownloadPresignedUrl(bucket, key);
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json({ error: "Failed to access file" }, { status: 500 });
  }
}
