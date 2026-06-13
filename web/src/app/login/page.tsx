"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3002/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "CITIZEN") {
        window.location.href = "/dashboard";
      } else if (data.user.role === "RESCUE_TEAM") {
        window.location.href = "/rescue-dashboard";
      } else if (data.user.role === "ADMIN") {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-[#0b0f19] via-[#0f172a] to-[#1e1b4b]">
        <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 self-start"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-1 text-center">
              Login to access real-time emergency updates & rescue hubs.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-850 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-850 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-red-950 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-red-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
