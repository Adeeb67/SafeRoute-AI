"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  ShieldAlert, MapPin, Bell, Loader2, Navigation, HeartPulse, History,
  Radio, Clock, CheckCircle2, AlertTriangle, MessageCircle
} from "lucide-react";

type Tab = "home" | "history";

export default function CitizenPortal() {
  const [disasters, setDisasters] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 12.9716, lng: 77.5946 })
      );
    } else {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    }

    Promise.all([
      fetch("http://localhost:3002/api/disasters").then(r => r.json()),
      fetch("http://localhost:3002/api/shelters").then(r => r.json()),
      fetch("http://localhost:3002/api/stats").then(r => r.json()),
      fetch("http://localhost:3002/api/rescue/history", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([d, s, st, h]) => {
      setDisasters(Array.isArray(d) ? d : []);
      setShelters(Array.isArray(s) ? s : []);
      setStats(st);
      setHistory(Array.isArray(h) ? h : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Init map
  useEffect(() => {
    if (loading || !userLocation || !mapContainerRef.current || mapRef.current) return;
    import("leaflet").then((L) => {
      const map = L.map(mapContainerRef.current!, { zoomControl: false }).setView([userLocation.lat, userLocation.lng], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "&copy; CARTO" }).addTo(map);

      const icon = (color: string, label: string) => L.divIcon({
        className: "",
        html: `<div style="background:${color};width:26px;height:26px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;box-shadow:0 0 12px ${color};">${label}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: icon("#3b82f6", "Me") }).addTo(map).bindPopup("Your Location").openPopup();

      shelters.forEach(s => {
        L.marker([s.latitude, s.longitude], { icon: icon("#22c55e", "S") }).addTo(map)
          .bindPopup(`<b>${s.name}</b><br/>Capacity: ${s.occupancy}/${s.capacity}<br/>Resources: ${(s.resourcesAvailable || []).join(", ")}<br/>📞 ${s.contactNumber || "N/A"}`);
      });

      disasters.forEach(d => {
        L.marker([d.latitude, d.longitude], { icon: icon("#ef4444", "!") }).addTo(map)
          .bindPopup(`<b>${d.title}</b><br/>Severity: ${d.severity}<br/>${d.description}`);
        L.circle([d.latitude, d.longitude], {
          color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.12, radius: d.radius * 1000
        }).addTo(map);
      });
    });
  }, [loading, userLocation, shelters, disasters]);

  const statusColor: Record<string, string> = {
    PENDING: "text-yellow-400 bg-yellow-950/50 border-yellow-700/40",
    ASSIGNED: "text-blue-400 bg-blue-950/50 border-blue-700/40",
    IN_PROGRESS: "text-orange-400 bg-orange-950/50 border-orange-700/40",
    RESCUED: "text-green-400 bg-green-950/50 border-green-700/40",
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Header />

      {/* Live Stats Bar */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-3 flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Status</span>
        </div>
        <div className="h-5 w-px bg-gray-800" />
        {[
          { label: "Active Disasters", value: stats?.activeDisasters, color: "text-red-400" },
          { label: "Pending SOS", value: stats?.pendingSOS, color: "text-orange-400" },
          { label: "People Rescued", value: stats?.rescued, color: "text-green-400" },
          { label: "Shelters Online", value: stats?.shelterCount, color: "text-cyan-400" },
          { label: "Hospitals Ready", value: stats?.hospitalCount, color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="flex flex-col flex-shrink-0">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{s.label}</span>
            <span className={`text-lg font-black leading-none ${s.color}`}>{loading ? "—" : s.value ?? "0"}</span>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="border-b border-gray-800 bg-gray-950/50 px-6 flex gap-1">
        {([
          { id: "home", label: "Emergency Portal", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
          { id: "history", label: "My History", icon: <History className="h-3.5 w-3.5" /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 md:p-8">
        {activeTab === "home" && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Massive SOS */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 md:p-12 text-center backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[320px]">
                <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 to-transparent pointer-events-none" />
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3 z-10">EMERGENCY ASSISTANCE</h1>
                <p className="text-gray-400 mb-10 max-w-lg z-10 text-sm leading-relaxed">Broadcasting your exact live GPS coordinates to all active rescue teams in your vicinity.</p>
                <Link href="/sos" className="group relative z-10">
                  <div className="absolute inset-0 bg-red-600 rounded-full animate-sos-pulse blur-md" />
                  <button className="relative h-36 w-36 md:h-44 md:w-44 bg-gradient-to-b from-red-500 to-red-700 rounded-full border-4 border-red-400/50 flex flex-col items-center justify-center text-white shadow-[0_0_50px_rgba(239,68,68,0.5)] transition-transform transform active:scale-95 group-hover:scale-105">
                    <ShieldAlert className="h-12 w-12 md:h-16 md:w-16 mb-1 drop-shadow-lg" />
                    <span className="font-black text-2xl md:text-3xl tracking-widest uppercase drop-shadow-md">SOS</span>
                  </button>
                </Link>
              </div>

              {/* Map */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative h-[420px]">
                <div className="absolute top-4 left-4 z-[400] bg-gray-950/90 backdrop-blur px-3 py-3 border border-gray-800 rounded-xl flex flex-col gap-2 pointer-events-none shadow-xl">
                  <h3 className="text-[9px] font-black text-white tracking-widest uppercase">Local Safe Routes</h3>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" /> Your Location</div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]" /> Shelter (click for info)</div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" /> Hazard Zone</div>
                  </div>
                </div>
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center bg-gray-900/80">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div ref={mapContainerRef} className="h-full w-full" />
                )}
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Emergency Broadcasts */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-5 backdrop-blur-xl flex-1 flex flex-col min-h-[350px]">
                <h3 className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2 mb-5 border-b border-gray-800 pb-3">
                  <Bell className="h-3.5 w-3.5 text-red-500" /> Active Hazard Alerts
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {loading ? <div className="text-xs text-gray-500 text-center py-8">Syncing...</div> :
                    disasters.length === 0 ? <div className="text-xs text-gray-500 text-center py-8">No active hazards</div> :
                    disasters.map((d: any) => (
                      <div key={d.id} className="p-3.5 bg-gray-950/60 border-l-4 border-l-red-500 border border-gray-800 rounded-xl group hover:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xs font-bold text-white leading-tight">{d.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-950/80 text-red-400 uppercase border border-red-900/50 ml-2 flex-shrink-0">{d.severity}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{d.description}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-gray-600">
                          <Navigation className="h-3 w-3" />
                          {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)} • {d.radius}km
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Safety Procedures */}
              <div className="bg-gradient-to-br from-blue-950/40 to-gray-900/60 border border-blue-900/40 rounded-3xl p-5 backdrop-blur-xl">
                <h3 className="text-[10px] font-black text-white tracking-widest uppercase flex items-center gap-2 mb-4">
                  <HeartPulse className="h-3.5 w-3.5 text-blue-400" /> Vital Safety Procedures
                </h3>
                <div className="space-y-2.5">
                  {[
                    { type: "Earthquake", tip: "Drop, Cover, Hold On. Move away from windows and heavy furniture." },
                    { type: "Flood", tip: "Never walk through floodwater. Move immediately to high ground." },
                    { type: "Wildfire", tip: "Evacuate early. Close all vents and doors before leaving." },
                  ].map(t => (
                    <div key={t.type} className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl">
                      <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider block mb-1">{t.type}</span>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{t.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
              <History className="h-4 w-4 text-purple-400" /> My Rescue Request History
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-800" />
                <p className="text-sm font-bold">No SOS requests sent yet.</p>
                <p className="text-xs mt-1">You're safe! Requests will appear here once submitted.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(req => (
                  <div key={req.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{req.emergencyType || "GENERAL"} Emergency</span>
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${statusColor[req.status] || "text-gray-400 bg-gray-900 border-gray-700"}`}>{req.status}</span>
                        </div>
                        <p className="text-xs text-gray-400">{req.description || "No description provided."}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600 flex-shrink-0 ml-4">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500 mb-3">
                      <span>Severity: <b className="text-gray-400">{req.severity}</b></span>
                      <span>People: <b className="text-gray-400">{req.numberOfPeople}</b></span>
                      {req.rescueTeam && <span>Rescuer: <b className="text-gray-400">{req.rescueTeam.name}</b></span>}
                    </div>
                    {req.messages?.length > 0 && (
                      <div className="mt-3 border-t border-gray-800 pt-3">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                          <MessageCircle className="h-3 w-3" /> Chat History ({req.messages.length} messages)
                        </p>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {req.messages.map((msg: any, i: number) => (
                            <div key={i} className={`flex ${msg.sender?.role === "CITIZEN" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-[11px] ${msg.sender?.role === "CITIZEN" ? "bg-red-700/50 text-white" : "bg-gray-800 text-gray-300"}`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {req.photoData && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-gray-800 h-24 relative">
                        <img src={req.photoData} alt="SOS" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
