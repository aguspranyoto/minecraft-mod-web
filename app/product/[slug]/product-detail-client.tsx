"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Lock, Crown, FileIcon } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  isPremium: boolean;
  files: string[];
  createdAt: string;
}

interface ProductDetailClientProps {
  product: Product;
  hasActiveSubscription?: boolean;
}

export default function ProductDetailClient({
  product,
  hasActiveSubscription = false,
}: ProductDetailClientProps) {
  const { data: session } = useSession();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const isLoggedIn = !!session;

  const canDownload =
    !product.isPremium || (isLoggedIn && hasActiveSubscription);

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to subscribe.");
      return;
    }

    try {
      setSubscribing(true);
      const res = await fetch("/api/subscription", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create transaction");
      }

      // Open Midtrans Snap UI
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            window.location.href = "/subscription?orderId=" + encodeURIComponent(data.orderId);
          },
          onPending: function (result: any) {
            toast.info("Waiting for your payment.");
          },
          onError: function (result: any) {
            toast.error("Payment failed.");
            setSubscribing(false);
          },
          onClose: function () {
            toast.info("You closed the payment window.");
            setSubscribing(false);
          },
        });
      } else {
        toast.error("Payment system is not ready yet.");
        setSubscribing(false);
      }
    } catch (error: any) {
      toast.error(error.message);
      setSubscribing(false);
    }
  };

  const handleDownload = async (fileUrl: string) => {
    if (product.isPremium && !isLoggedIn) {
      toast.error("Please sign in to subscribe.");
      return;
    }

    if (product.isPremium && !hasActiveSubscription) {
      // Trigger subscribe instead of just erroring
      handleSubscribe();
      return;
    }

    setDownloading(fileUrl);
    try {
      const res = await fetch(
        `/api/download?file=${encodeURIComponent(fileUrl)}`,
      );
      if (res.ok) {
        const data = await res.json();
        window.open(data.url, "_blank");
        toast.success("Download started!");
      } else {
        toast.error("Failed to generate download link.");
      }
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const getFileName = (url: string) => {
    return url.split("/").pop() || url;
  };

  return (
    <div className="min-h-screen">
      {/* ─── Product Content ─── */}
      <main className="mx-auto max-w-4xl px-4 pt-20 pb-8 sm:px-6">
        {/* Title & badge */}
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            {product.title}
          </h1>
          <Badge
            variant={product.isPremium ? "premium" : "free"}
            className="mt-1"
          >
            {product.isPremium ? (
              <>
                <Crown className="mr-1 h-3 w-3" />
                Premium
              </>
            ) : (
              "Free"
            )}
          </Badge>
        </div>

        {product.description && (
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">{product.description}</p>
        )}

        <div className="mt-1 text-xs text-neutral-600">
          Published on{" "}
          {new Date(product.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        {/* ─── Content (TipTap HTML rendered with Typography) ─── */}
        {product.content && (
          <article
            className="prose dark:prose-invert prose-orange mt-8 max-w-none prose-headings:text-neutral-900 dark:prose-headings:text-white prose-p:text-neutral-700 dark:prose-p:text-neutral-300 prose-a:text-orange-400 prose-strong:text-neutral-900 dark:prose-strong:text-white prose-img:rounded-xl prose-img:border prose-img:border-neutral-200 dark:prose-img:border-neutral-800"
            dangerouslySetInnerHTML={{ __html: product.content }}
          />
        )}

        {/* ─── Download Section ─── */}
        {product.files && product.files.length > 0 && (
          <section className="mt-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white">
              <Download className="h-5 w-5 text-orange-400" />
              Downloads
              {product.isPremium && !hasActiveSubscription && (
                <Lock className="h-4 w-4 text-neutral-500" />
              )}
            </h2>

            {product.isPremium && !hasActiveSubscription && (
              <p className="mt-2 text-sm text-neutral-500">
                This is a premium mod. Subscribe to get 30-day download access.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {product.files.map((fileUrl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/30 px-4 py-3 transition-colors hover:bg-neutral-800/60"
                >
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-5 w-5 text-neutral-500" />
                    <span className="text-sm text-neutral-300 truncate max-w-[200px] sm:max-w-none">
                      {getFileName(fileUrl)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={canDownload ? "default" : "outline"}
                    onClick={() => handleDownload(fileUrl)}
                    disabled={downloading === fileUrl || subscribing}
                    className="shrink-0"
                  >
                    {downloading === fileUrl ? (
                      <span className="animate-spin">⏳</span>
                    ) : subscribing && product.isPremium && !hasActiveSubscription ? (
                      <span className="animate-spin">⏳</span>
                    ) : product.isPremium && !isLoggedIn ? (
                      <>
                        <Lock className="mr-1 h-3 w-3" />
                        Sign in
                      </>
                    ) : product.isPremium && !hasActiveSubscription ? (
                      <>
                        <Lock className="mr-1 h-3 w-3" />
                        Subscribe
                      </>
                    ) : (
                      <>
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 py-6">
        <div className="mx-auto max-w-4xl px-4 text-center text-xs text-neutral-600 sm:px-6">
          © {new Date().getFullYear()} Aguud. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
