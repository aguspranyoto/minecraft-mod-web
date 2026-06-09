import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import crypto from "crypto";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Parse order_id format: "sub-{userId}-{timestamp}"
    const parts = order_id.split("-");
    if (parts.length < 3 || parts[0] !== "sub") {
      return Response.json(
        { error: "Invalid order format" },
        { status: 400 }
      );
    }
    const userId = parts.slice(1, -1).join("-");

    // Handle transaction status
    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (fraud_status === "accept" || !fraud_status) {
        // Grant 30-day subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await db.insert(subscriptions).values({
          userId,
          status: "active",
          orderId: order_id,
          expiresAt,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
