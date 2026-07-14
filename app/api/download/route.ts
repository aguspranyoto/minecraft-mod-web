import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDownloadPresignedUrl } from "@/lib/r2";
import { db } from "@/lib/db";
import { subscriptions, products } from "@/lib/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {

  const file = request.nextUrl.searchParams.get("file");
  if (!file) {
    return Response.json({ error: "File parameter required" }, { status: 400 });
  }

  // Find the product this file belongs to
  const matchingProducts = await db
    .select({ isPremium: products.isPremium })
    .from(products)
    .where(sql`${products.files} @> ${JSON.stringify([file])}::jsonb`);

  const isPremiumFile = matchingProducts.some((p) => p.isPremium);

  // If the file belongs to a premium product, check subscription
  if (isPremiumFile) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSub = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.status, "active"),
          gt(subscriptions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (activeSub.length === 0) {
      return Response.json(
        { error: "Active subscription required" },
        { status: 403 }
      );
    }
  }

  // Generate presigned URL for private bucket
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
