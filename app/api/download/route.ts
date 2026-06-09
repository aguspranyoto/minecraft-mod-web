import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = request.nextUrl.searchParams.get("file");
  if (!file) {
    return Response.json({ error: "File parameter required" }, { status: 400 });
  }

  // For private bucket files, check subscription
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME!;
  const key = file.startsWith("/") ? file.slice(1) : file;

  try {
    const url = await getDownloadPresignedUrl(bucket, key);
    return Response.json({ url });
  } catch (error) {
    console.error("Download error:", error);
    return Response.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
