"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, LogOut, User, Sparkles } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-calm-surface border-b border-calm-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-calm-sm bg-calm-primary-tint text-calm-primary transition-colors">
            <BookOpen className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-calm-text tracking-tight">
              Study Companion
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-calm-surface-muted border border-calm-border text-calm-text-muted font-normal">
              v0.1
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm text-calm-text-muted hover:text-calm-text px-3 py-1.5 rounded-calm-sm hover:bg-calm-surface-muted transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-calm-primary stroke-[1.75]" />
                Dashboard
              </Link>

              <div className="h-4 w-px bg-calm-border" />

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-calm-sm bg-calm-surface-muted border border-calm-border text-xs text-calm-text font-medium">
                <User className="w-3.5 h-3.5 text-calm-text-muted stroke-[1.75]" />
                <span>{session.user?.name || session.user?.email?.split("@")[0]}</span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-calm-sm text-calm-text-muted hover:text-calm-danger hover:bg-calm-danger-tint transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-calm-text-muted hover:text-calm-text px-3.5 py-1.5 rounded-calm-sm hover:bg-calm-surface-muted transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-4 py-1.5 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white transition-colors shadow-none"
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
