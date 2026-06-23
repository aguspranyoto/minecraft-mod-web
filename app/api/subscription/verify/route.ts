import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId || typeof orderId !== "string") {
    return Response.json({ error: "orderId is required" }, { status: 400 });
  }

  if (!orderId.startsWith(`sub-${session.user.id}-`)) {
    return Response.json({ error: "Invalid orderId" }, { status: 403 });
  }

  // Check if already active
  const existing = await db
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

  if (existing.length > 0) {
    return Response.json({ hasActiveSubscription: true, subscription: existing[0] });
  }

  // Ask Midtrans for transaction status
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const isSandbox = serverKey.startsWith("SB-");
  const baseUrl = isSandbox
    ? "https://api.sandbox.midtrans.com"
    : "https://api.midtrans.com";
  const midtransUrl = `${baseUrl}/v2/${orderId}/status`;

  try {
    const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`;
    const res = await fetch(midtransUrl, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      return Response.json(
        { error: "Failed to verify with Midtrans" },
        { status: 502 }
      );
    }

    const tx = await res.json();
    const txStatus = tx.transaction_status;
    const fraudStatus = tx.fraud_status;

    const isPaid =
      txStatus === "settlement" ||
      txStatus === "capture" ||
      txStatus === "pending";

    const isFraudOk = fraudStatus === "accept" || !fraudStatus;

    if (!isPaid || !isFraudOk) {
      return Response.json({
        hasActiveSubscription: false,
        transactionStatus: txStatus,
        fraudStatus,
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(subscriptions).values({
      userId: session.user.id,
      status: "active",
      orderId,
      expiresAt,
    });

    return Response.json({
      hasActiveSubscription: true,
      subscription: {
        userId: session.user.id,
        status: "active",
        orderId,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return Response.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
