"use client";

import { useState } from "react";
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

interface UserProfileButtonProps {
  hasActiveSubscription?: boolean;
}

export function UserProfileButton({
  hasActiveSubscription,
}: UserProfileButtonProps) {
  const { data: session, isPending } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
          {hasActiveSubscription && (
            <Badge variant="premium" className="hidden sm:inline-flex">
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium text-white">{user.name}</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
          {hasActiveSubscription && (
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
