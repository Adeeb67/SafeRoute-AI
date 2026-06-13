"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bell, X, ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: string;
}

export default function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const socket = io("http://localhost:3002");

    // Listen for system-wide broadcasts
    socket.on("system-broadcast", (data: { title: string; message: string; type?: string }) => {
      addToast(data.title, data.message, data.type);
    });

    // Listen for personal notifications
    socket.on("notification-" + user.id, (data: { title: string; message: string }) => {
      addToast(data.title, data.message, "personal");
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const addToast = (title: string, message: string, type?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [{ id, title, message, type }, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Bell;
        let borderColor = "border-gray-700";
        let iconColor = "text-gray-400";
        let glowColor = "";

        if (toast.type === "disaster") { Icon = AlertTriangle; borderColor = "border-red-500/60"; iconColor = "text-red-500"; glowColor = "shadow-[0_0_20px_rgba(239,68,68,0.25)]"; }
        if (toast.type === "personal") { Icon = ShieldAlert; borderColor = "border-blue-500/60"; iconColor = "text-blue-400"; glowColor = "shadow-[0_0_20px_rgba(59,130,246,0.25)]"; }
        if (toast.title.includes("Rescued")) { Icon = CheckCircle; borderColor = "border-green-500/60"; iconColor = "text-green-400"; glowColor = "shadow-[0_0_20px_rgba(34,197,94,0.25)]"; }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-gray-950/95 backdrop-blur-xl border ${borderColor} rounded-2xl shadow-2xl ${glowColor} animate-slide-in-right`}
            style={{ animation: "slideInRight 0.4s ease-out" }}
          >
            <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">{toast.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
