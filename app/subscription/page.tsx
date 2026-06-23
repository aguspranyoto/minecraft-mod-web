"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Crown,
  Clock,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  XCircle,
} from "lucide-react";

type SubStatus = "loading" | "verifying" | "active" | "expired" | "none" | "failed";

interface Subscription {
  status: string;
  expiresAt: string;
  orderId: string;
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { data: session, isPending } = useSession();
  const [status, setStatus] = useState<SubStatus>("loading");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const checkSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (!res.ok) return false;
      const data = await res.json();
      if (data.hasActiveSubscription) {
        setSubscription(data.subscription);
        setStatus("active");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // If orderId present, call verify endpoint
  useEffect(() => {
    if (isPending || !session || !orderId) return;

    let cancelled = false;

    async function verify() {
      setStatus("verifying");
      try {
        const res = await fetch("/api/subscription/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.hasActiveSubscription) {
          setSubscription(data.subscription);
          setStatus("active");
        } else if (data.error) {
          setErrorMsg(data.error);
          setStatus("failed");
        } else {
          // Not yet settled — poll
          for (let i = 0; i < 6; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            if (cancelled) return;
            const found = await checkSubscription();
            if (found) return;
            try {
              const r2 = await fetch("/api/subscription/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
              });
              const d2 = await r2.json();
              if (cancelled) return;
              if (d2.hasActiveSubscription) {
                setSubscription(d2.subscription);
                setStatus("active");
                return;
              }
            } catch {}
          }
          if (!cancelled) {
            setErrorMsg("Payment is still being processed. Check back in a few minutes.");
            setStatus("failed");
          }
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [session, isPending, orderId, checkSubscription]);

  // No orderId — just check existing subscription
  useEffect(() => {
    if (isPending || !session || orderId) return;
    checkSubscription().then((found) => {
      if (!found) setStatus("none");
    });
  }, [session, isPending, orderId, checkSubscription]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-14">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 pt-14">
        <div className="text-6xl">🔒</div>
        <h1 className="text-xl font-bold text-white">Sign In Required</h1>
        <p className="text-sm text-neutral-500">
          Please sign in to view your subscription.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-14">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to mods
        </Link>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          {/* Icon */}
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            status === "active" ? "bg-green-500/10"
              : status === "verifying" ? "bg-orange-500/10"
              : status === "failed" ? "bg-red-500/10"
              : status === "expired" ? "bg-yellow-500/10"
              : "bg-neutral-500/10"
          }`}>
            {status === "active" ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : status === "verifying" ? (
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            ) : status === "failed" ? (
              <XCircle className="h-8 w-8 text-red-500" />
            ) : status === "expired" ? (
              <Clock className="h-8 w-8 text-yellow-500" />
            ) : status === "none" ? (
              <ShoppingBag className="h-8 w-8 text-neutral-400" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            )}
          </div>

          {/* Title */}
          <h1 className="mt-6 text-xl font-bold text-neutral-100">
            {status === "active" && "You're a Member!"}
            {status === "verifying" && "Verifying Payment..."}
            {status === "failed" && "Payment Not Confirmed"}
            {status === "expired" && "Subscription Expired"}
            {status === "none" && "No Active Subscription"}
            {status === "loading" && "Loading..."}
          </h1>

          {/* Description */}
          <p className="mt-2 text-sm text-neutral-500">
            {status === "active" && "You have full access to all premium mods."}
            {status === "verifying" && "Checking payment status with Midtrans..."}
            {status === "failed" && errorMsg}
            {status === "expired" && subscription
              ? "Expired on " + new Date(subscription.expiresAt).toLocaleDateString()
              : ""}
            {status === "none" && "You don't have an active subscription yet."}
          </p>

          {/* Subscription details */}
          {subscription && status === "active" && (
            <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-800/30 p-4">
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-4 w-4 text-orange-400" />
                <Badge variant="premium">Premium User</Badge>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Active until{" "}
                {new Date(subscription.expiresAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            {status === "active" && (
              <Link href="/">
                <Button className="w-full gap-2 bg-orange-600 text-white hover:bg-orange-500">
                  Browse Mods
                </Button>
              </Link>
            )}
            {(status === "none" || status === "expired" || status === "failed") && (
              <Link href="/">
                <Button className="w-full gap-2 bg-orange-600 text-white hover:bg-orange-500">
                  <Crown className="h-4 w-4" />
                  {status === "expired" ? "Renew Subscription" : "Become a Member"}
                </Button>
              </Link>
            )}
            {status !== "active" && (
              <Link href="/">
                <Button variant="ghost" className="w-full text-neutral-500">
                  Skip for now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center pt-14">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
