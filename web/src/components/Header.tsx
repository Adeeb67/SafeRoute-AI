"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, LayoutDashboard, Map, Flame, HelpCircle, Home, ChevronLeft } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-gray-800 bg-[#0f172a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f172a]/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo + Back button */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
            title="Go Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-red-500 tracking-wider">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
            <span>SAFEROUTE AI</span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              {/* Home Button */}
              <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm" title="Home">
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Link>

              {user.role === "CITIZEN" && (
                <Link href="/dashboard" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              )}
              {user.role === "RESCUE_TEAM" && (
                <Link href="/rescue-dashboard" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
                  <LayoutDashboard className="h-4 w-4" /> Rescue Hub
                </Link>
              )}
              {user.role === "ADMIN" && (
                <Link href="/admin" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
                  <LayoutDashboard className="h-4 w-4" /> Admin Portal
                </Link>
              )}
              <Link href="/disaster-map" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
                <Map className="h-4 w-4" /> Live Map
              </Link>
              <Link href="/ai-assistant" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm">
                <HelpCircle className="h-4 w-4" /> AI Rescue
              </Link>
              {user.role === "CITIZEN" && (
                <Link href="/sos" className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-full text-xs transition-colors shadow-lg shadow-red-950 animate-bounce">
                  <Flame className="h-3.5 w-3.5" /> SEND SOS
                </Link>
              )}
              <div className="h-4 w-[1px] bg-gray-800" />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{user.name}</div>
                  <div className="text-[10px] text-gray-400 capitalize">{user.role.replace("_", " ").toLowerCase()}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Home button for unauthenticated users */}
              <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm" title="Home">
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Login
              </Link>
              <Link href="/register" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
