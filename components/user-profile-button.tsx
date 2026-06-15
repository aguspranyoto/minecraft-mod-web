"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
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
import { User, LogOut, Shield, Crown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function UserProfileButton() {
  const { data: session, isPending } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/subscription")
        .then((res) => res.json())
        .then((data) => {
          if (data.hasActiveSubscription) {
            setSubscription(data.subscription);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  if (isPending) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-800" />
    );
  }

  if (!session) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setAuthModalOpen(true)}
          className="gap-2 hover:bg-transparent! hover:text-foreground"
          id="login-button"
        >
          <User className="h-4 w-4" />
          Sign In
        </Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    );
  }

  const user = session.user;
  const isAdmin = (user as { role?: string }).role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" id="user-profile-button">
          {subscription && (
            <div title={`You are a member until ${new Date(subscription.expiresAt).toLocaleDateString()}`}>
              <Crown className="h-5 w-5 text-orange-400" />
            </div>
          )}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-neutral-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-bold text-white">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <span className="hidden text-sm font-medium text-neutral-200 sm:inline-block">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-200">{user.name}</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
          {subscription && (
            <Badge variant="premium" className="w-fit mt-1">
              <Crown className="mr-1 h-3 w-3" />
              Premium User
            </Badge>
          )}
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
  );
}
