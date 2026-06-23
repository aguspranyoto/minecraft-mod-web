"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useSession } from "@/lib/auth-client";
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

const ITEMS_PER_PAGE = 8;

export default function HomePage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "premium" | "free">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const isLoggedIn = !!session;
  const isAdmin = session && (session.user as { role?: string }).role === "admin";

  useEffect(() => {
    fetchProducts();
    if (session?.user) {
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => setIsPremium(data.hasActiveSubscription))
        .catch(() => {});
    }
  }, [session]);

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to become a member.");
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

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (filterType === "premium") {
      result = result.filter((p) => p.isPremium);
    } else if (filterType === "free") {
      result = result.filter((p) => !p.isPremium);
    }

    return result;
  }, [products, searchQuery, filterType]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Extract first image from HTML content for cover
  const extractCoverImage = (content: string | null): string | null => {
    if (!content) return null;
    const match = content.match(/<img[^>]+src="([^"]+)"/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── Hero Section ─── */}
      <header className="relative pt-14">
        {/* Banner */}
        <div className="relative h-36 overflow-hidden sm:h-48 md:h-56">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600/10 via-amber-600/5 to-transparent" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          {/* Fade to background */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        {/* Profile section */}
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-xl shadow-orange-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-neutral-900 text-2xl font-bold text-orange-400">
                  A
                </div>
              </div>
            </div>

            {/* Creator info */}
            <h1 className="mt-4 text-xl font-bold text-neutral-100 sm:text-2xl">
              Aguud
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Premium Minecraft Mods &middot; Java Edition
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
              <span>{products.length} mods</span>
              <span className="h-0.5 w-0.5 rounded-full bg-neutral-700" />
              <span>Active since 2024</span>
            </div>

            {/* Become member CTA */}
            {!isAdmin && !isPremium && (
              <Button
                className="mt-4 gap-2 rounded-full px-6 bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-500/20"
                size="sm"
                id="become-member-button"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Crown className="h-3.5 w-3.5" />
                )}
                {subscribing ? "Processing..." : "Become a member"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Filter & Search Section ─── */}
      <section className="mx-auto mt-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            {(["all", "premium", "free"] as const).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="capitalize"
              >
                {type === "all" ? "All Mods" : type}
              </Button>
            ))}
          </div>

          {/* Sort icon */}
          <Button variant="outline" size="icon" className="h-8 w-8">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {/* Search */}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search mods"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-foreground placeholder-foreground"
              id="search-input"
            />
          </div>
        </div>
      </section>

      {/* ─── Product Grid ─── */}
      <section className="mx-auto mt-8 w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
              >
                <div className="aspect-[4/3] rounded-t-xl bg-neutral-200 dark:bg-neutral-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl">🎮</div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-300">
              No mods found
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {paginatedProducts.map((product) => {
                const coverImage = extractCoverImage(product.content);
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 transition-all duration-300 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1"
                  >
                    {/* Cover image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900">
                          <span className="text-4xl">🧊</span>
                        </div>
                      )}

                      {/* Premium/Free badge */}
                      <div className="absolute right-2 top-2">
                        <Badge variant={product.isPremium ? "premium" : "free"}>
                          {product.isPremium ? "Premium" : "Free"}
                        </Badge>
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-3">
                      <h3 className="line-clamp-1 text-sm font-semibold text-neutral-800 dark:text-neutral-100 transition-colors">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                        <span>
                          {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                        {product.files && product.files.length > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {product.files.length} file
                              {product.files.length > 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 pb-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-neutral-800 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-neutral-600 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Aguud. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
