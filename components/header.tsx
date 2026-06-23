"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModal } from "@/components/auth-modal";
import { Crown, LogOut, Shield, Pickaxe, Menu, X } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const { data: session, isPending } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const isLoggedIn = !!session;
  const isAdmin = session && (session.user as { role?: string }).role === "admin";

  useEffect(() => {
    if (session?.user) {
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => setIsPremium(data.hasActiveSubscription))
        .catch(() => {});
    }
  }, [session]);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-neutral-800/60 bg-neutral-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left — Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
              <Pickaxe className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-100">
              Aguud<span className="text-orange-400">Mods</span>
            </span>
          </Link>

          {/* Center — Tagline (hidden on mobile) */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="h-1 w-1 rounded-full bg-orange-500/50" />
            <span className="text-xs text-neutral-500">
              Premium Minecraft Mods
            </span>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
            ) : isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* Premium badge */}
                {isPremium && (
                  <div className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 sm:flex">
                    <Crown className="h-3 w-3" />
                    Premium
                  </div>
                )}

                {/* Admin badge (hidden on mobile) */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20 sm:flex"
                  >
                    <Shield className="h-3 w-3" />
                    Admin
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 px-2 py-1.5 h-auto"
                      id="user-profile-button"
                    >
                      {session.user.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || ""}
                          className="h-7 w-7 rounded-full object-cover ring-2 ring-neutral-700 transition-all hover:ring-orange-500/50"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-xs font-bold text-white">
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="hidden text-sm text-neutral-300 sm:inline-block">
                        {session.user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-neutral-200">
                        {session.user.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {session.user.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer gap-2">
                            <Shield className="h-4 w-4 text-orange-400" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="cursor-pointer gap-2">
                        <Crown className="h-4 w-4 text-orange-400" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-red-400 focus:text-red-300"
                      onClick={async () => {
                        await signOut();
                        toast.success("Signed out successfully");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setAuthModalOpen(true)}
                className="gap-1.5 bg-orange-600 text-white hover:bg-orange-500"
                id="login-button"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-neutral-800/60 bg-neutral-950/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-1 w-1 rounded-full bg-orange-500/50" />
                <span className="text-xs text-neutral-500">
                  Premium Minecraft Mods
                </span>
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-4 w-4 text-orange-400" />
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
