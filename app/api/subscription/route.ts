import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { NextRequest } from "next/server";

// GET - Check user subscription status
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
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

  return Response.json({
    hasActiveSubscription: activeSub.length > 0,
    subscription: activeSub[0] || null,
  });
}

// POST - Create Midtrans Snap token
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const subscriptionPrice = parseInt(process.env.SUBSCRIPTION_PRICE || "1000", 10);
  const orderId = `sub-${session.user.id}-${Date.now()}`;
  const isSandbox = serverKey.startsWith("SB-");
  try {
    const midtransUrl = isSandbox
      ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
      : "https://app.midtrans.com/snap/v1/transactions";

    const authHeader = `Basic ${Buffer.from(serverKey + ":").toString("base64")}`;
    const res = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: subscriptionPrice,
        },
        customer_details: {
          email: session.user.email,
          first_name: session.user.name,
        },
        item_details: [
          {
            id: "premium-30d",
            price: subscriptionPrice,
            quantity: 1,
            name: "Premium Access (30 Days)",
          },
        ],
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Midtrans error:", error);
      return Response.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    const data = await res.json();
    return Response.json({
      token: data.token,
      redirect_url: data.redirect_url,
      orderId,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return Response.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
