"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md calm-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 rounded-calm-sm bg-calm-primary-tint text-calm-primary mb-1">
            <UserPlus className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-calm-text">
            Create an account
          </h1>
          <p className="text-xs text-calm-text-muted">
            Join Study Companion for quiet, focused learning
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-calm-sm bg-calm-danger-tint border border-calm-danger/30 text-calm-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-calm-text">
              Full name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Smith"
              className="w-full px-3.5 py-2 rounded-calm-sm bg-calm-surface border border-calm-border text-sm text-calm-text placeholder-calm-text-subtle focus:outline-none focus:border-calm-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-calm-text">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className="w-full px-3.5 py-2 rounded-calm-sm bg-calm-surface border border-calm-border text-sm text-calm-text placeholder-calm-text-subtle focus:outline-none focus:border-calm-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-calm-text">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2 rounded-calm-sm bg-calm-surface border border-calm-border text-sm text-calm-text placeholder-calm-text-subtle focus:outline-none focus:border-calm-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-calm-sm bg-calm-primary hover:bg-calm-primary-hover text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
                Create account
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-calm-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-calm-primary hover:underline font-medium">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
