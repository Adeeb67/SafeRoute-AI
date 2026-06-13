"use client";

import Link from "next/link";
import { ShieldAlert, Flame, Map, HelpCircle, ShieldCheck, HeartPulse, Radio } from "lucide-react";
import Header from "@/components/Header";

export default function LandingPage() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-[#0b0f19] via-[#0f172a] to-[#0b0f19] overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Radio className="h-3.5 w-3.5 animate-ping" /> Real-time Disaster Coordination Network
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none uppercase">
            AI-POWERED <span className="text-red-500">EMERGENCY</span> RESPONSE SYSTEM
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            SafeRoute AI connects citizens, rescue teams, and administrators during floods, wildfires, and earthquakes with geospatial maps and real-time SOS location sharing.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-950 text-center uppercase tracking-wide"
            >
              Get Started Now
            </Link>
            <Link
              href="/disaster-map"
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-gray-850 text-white border border-gray-800 font-bold rounded-xl text-sm transition-colors text-center uppercase tracking-wide flex items-center justify-center gap-2"
            >
              <Map className="h-4 w-4" /> Live Map Overlay
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-gray-900/40 border border-gray-850 rounded-2xl space-y-4">
          <div className="h-12 w-12 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center justify-center">
            <Flame className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Active SOS Signals</h3>
          <p className="text-gray-450 text-xs leading-relaxed">
            Instantly broadcast rescue calls with exact GPS tracking. Updates coordinates every 15 seconds to assist rescue operations.
          </p>
        </div>

        <div className="p-6 bg-gray-900/40 border border-gray-850 rounded-2xl space-y-4">
          <div className="h-12 w-12 bg-blue-950/50 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <Map className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Geospatial Overlay</h3>
          <p className="text-gray-450 text-xs leading-relaxed">
            Monitor real-time disaster hazard circles, discover nearby emergency hospitals, and locate emergency community shelters.
          </p>
        </div>

        <div className="p-6 bg-gray-900/40 border border-gray-850 rounded-2xl space-y-4">
          <div className="h-12 w-12 bg-green-950/50 border border-green-500/30 rounded-xl flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">AI Emergency Assistant</h3>
          <p className="text-gray-450 text-xs leading-relaxed">
            Receive first-aid instructions, flood guidance, and resource details dynamically utilizing Gemini AI models.
          </p>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-gray-950/50 border-t border-b border-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-around gap-6 text-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">Military-Grade Encryption</h4>
              <p className="text-[10px] text-gray-500">Secure storage & JWT authentication.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-red-500" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-white">24/7 Crew Despatches</h4>
              <p className="text-[10px] text-gray-500">Connected socket updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-500 border-t border-gray-900 bg-[#0b0f19]">
        &copy; 2026 SafeRoute AI. All rights reserved. Emergency Response Infrastructure.
      </footer>
    </>
  );
}
