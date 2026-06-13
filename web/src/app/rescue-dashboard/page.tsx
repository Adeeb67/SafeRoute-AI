"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import {
  Shield, Clock, Users, Navigation, AlertTriangle, Radio, Activity,
  Crosshair, MessageCircle, Send, CheckCircle2, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { io } from "socket.io-client";

export default function RescueDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rescueTeam, setRescueTeam] = useState<any>(null);
  const [liveLocations, setLiveLocations] = useState<{ [key: string]: { lat: number; lng: number } }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [chatInputs, setChatInputs] = useState<{ [id: string]: string }>({});
  const [chatMessages, setChatMessages] = useState<{ [id: string]: any[] }>({});
  const socketRef = useRef<any>(null);
  const trackingInterval = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

  const fetchAll = async () => {
    const token = localStorage.getItem("token");
    const [rRes, sRes] = await Promise.all([
      fetch("http://localhost:3002/api/rescue", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:3002/api/stats"),
    ]);
    const rData = await rRes.json();
    const sData = await sRes.json();
    if (Array.isArray(rData)) setRequests(rData);
    if (sData) setStats(sData);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const user = JSON.parse(stored);
    if (user.role !== "RESCUE_TEAM") { window.location.href = "/login"; return; }
    setRescueTeam(user);
    fetchAll();

    const socket = io("http://localhost:3002");
    socketRef.current = socket;

    socket.on("new-rescue-request", () => fetchAll());
    socket.on("update-rescue-request", () => fetchAll());
    socket.on("live-location-update", (data: any) => {
      if (data.role !== "RESCUER") {
        setLiveLocations(prev => ({ ...prev, [data.requestId]: { lat: data.latitude, lng: data.longitude } }));
      }
    });

    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      socket.disconnect();
    };
  }, []);

  // Subscribe to chat for all requests
  useEffect(() => {
    if (!socketRef.current) return;
    requests.forEach(req => {
      socketRef.current.on("rescue-chat-" + req.id, (msg: any) => {
        setChatMessages(prev => ({ ...prev, [req.id]: [...(prev[req.id] || []), msg] }));
      });
    });
  }, [requests]);

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    import("leaflet").then(L => {
      const map = L.map(mapContainerRef.current!, { zoomControl: false }).setView([12.9716, 77.5946], 12);
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "&copy; CARTO" }).addTo(map);
      setMapLoaded(true);
    });
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    import("leaflet").then(L => {
      const map = mapRef.current;
      Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m));
      markersRef.current = {};

      const makeIcon = (color: string, emoji: string) => L.divIcon({
        className: "",
        html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 15px ${color};">${emoji}</div>`,
        iconSize: [30, 30], iconAnchor: [15, 15]
      });

      requests.forEach(req => {
        if (req.status === "RESCUED") return;
        const lat = liveLocations[req.id]?.lat || req.latitude;
        const lng = liveLocations[req.id]?.lng || req.longitude;
        const color = req.status === "PENDING" ? "#ef4444" : req.status === "ASSIGNED" ? "#eab308" : "#3b82f6";

        const marker = L.marker([lat, lng], { icon: makeIcon(color, "🆘") })
          .addTo(map)
          .bindPopup(`<b>${req.citizen.name}</b><br/>Type: ${req.emergencyType || "GENERAL"}<br/>Status: ${req.status}<br/>People: ${req.numberOfPeople}`);
        markersRef.current[req.id] = marker;
      });

      if (requests.length > 0) {
        const active = requests.filter(r => r.status !== "RESCUED");
        if (active.length > 0) {
          const lat = liveLocations[active[0].id]?.lat || active[0].latitude;
          const lng = liveLocations[active[0].id]?.lng || active[0].longitude;
          map.setView([lat, lng], 13);
        }
      }
    });
  }, [requests, liveLocations, mapLoaded]);

  const handleStatus = async (id: string, status: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3002/api/rescue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ status, rescueTeamId: rescueTeam?.id })
    });
    if (res.ok) {
      fetchAll();
      if (status === "ASSIGNED") {
        trackingInterval.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(pos => {
            socketRef.current?.emit("share-location", {
              requestId: id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, role: "RESCUER"
            });
          });
        }, 10000);
      } else if (status === "RESCUED" && trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    }
  };

  const loadChatMessages = async (reqId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3002/api/rescue/${reqId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) setChatMessages(prev => ({ ...prev, [reqId]: data }));
  };

  const sendMessage = async (reqId: string) => {
    const content = chatInputs[reqId]?.trim();
    if (!content) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3002/api/rescue/${reqId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ content })
    });
    setChatInputs(prev => ({ ...prev, [reqId]: "" }));
  };

  const toggleChat = (reqId: string) => {
    if (expandedChat === reqId) {
      setExpandedChat(null);
    } else {
      setExpandedChat(reqId);
      if (!chatMessages[reqId]) loadChatMessages(reqId);
    }
  };

  const activeRequests = requests.filter(r => r.status !== "RESCUED");

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col overflow-hidden">
      <Header />

      {/* Stats Bar */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-3 flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Command Center</span>
        </div>
        <div className="h-5 w-px bg-gray-800" />
        {[
          { label: "Active Incidents", value: stats?.pendingSOS ?? "—", color: "text-red-400" },
          { label: "Rescued Today", value: stats?.rescued ?? "—", color: "text-green-400" },
          { label: "Total SOS", value: stats?.totalSOS ?? "—", color: "text-white" },
          { label: "Active Disasters", value: stats?.activeDisasters ?? "—", color: "text-orange-400" },
          { label: "Shelters Online", value: stats?.shelterCount ?? "—", color: "text-blue-400" },
          { label: "Rescue Teams", value: stats?.rescueTeams ?? "—", color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="flex flex-col flex-shrink-0">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{s.label}</span>
            <span className={`text-lg font-black leading-none ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ height: "calc(100vh - 130px)" }}>
        {/* Map */}
        <div className="flex-1 relative bg-gray-900">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="absolute top-3 left-3 z-[400] bg-gray-950/90 backdrop-blur p-3 rounded-xl border border-gray-800 shadow-xl pointer-events-none">
            <p className="text-[9px] font-black text-white uppercase tracking-widest mb-2">Asset Map</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" /> Pending SOS</div>
              <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_6px_#eab308]" /> Dispatched</div>
              <div className="flex items-center gap-2 text-[11px] text-gray-300"><span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" /> In Extraction</div>
            </div>
          </div>
        </div>

        {/* Triage Queue */}
        <div className="w-full lg:w-[460px] bg-gray-950 border-l border-gray-800 flex flex-col overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              <h2 className="text-xs font-black text-white uppercase tracking-widest">Triage Queue</h2>
            </div>
            <span className="px-2 py-0.5 bg-red-950/60 border border-red-500/30 text-red-400 text-[10px] font-black rounded-lg">{activeRequests.length} ACTIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeRequests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                <Shield className="h-14 w-14 text-gray-800" />
                <p className="text-sm font-bold tracking-wider">ALL CLEAR — NO INCIDENTS</p>
              </div>
            ) : (
              activeRequests.map(req => {
                const hasLive = !!liveLocations[req.id];
                const lat = hasLive ? liveLocations[req.id].lat : req.latitude;
                const lng = hasLive ? liveLocations[req.id].lng : req.longitude;
                const isChat = expandedChat === req.id;

                const statusStyles: Record<string, string> = {
                  PENDING: "border-red-500/50 bg-red-950/20",
                  ASSIGNED: "border-yellow-500/50 bg-yellow-950/10",
                  IN_PROGRESS: "border-blue-500/50 bg-blue-950/10",
                };
                const badgeStyles: Record<string, string> = {
                  PENDING: "bg-red-500 text-white",
                  ASSIGNED: "bg-yellow-500 text-gray-950",
                  IN_PROGRESS: "bg-blue-500 text-white",
                };

                return (
                  <div key={req.id} className={`border rounded-2xl overflow-hidden transition-all ${statusStyles[req.status] || "border-gray-700"}`}>
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-black text-white">{req.citizen.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badgeStyles[req.status]}`}>{req.status}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full font-bold">{req.emergencyType || "GENERAL"}</span>
                            <span className={`text-[10px] font-black ${req.severity === "CRITICAL" ? "text-red-500 animate-pulse" : req.severity === "HIGH" ? "text-orange-400" : "text-yellow-400"}`}>{req.severity}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 bg-gray-900/60 px-2 py-1 rounded-lg">
                          <Users className="h-3 w-3" /> {req.numberOfPeople}
                        </div>
                      </div>

                      {req.description && (
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed border-l-2 border-gray-700 pl-2">{req.description}</p>
                      )}

                      {/* Coordinates */}
                      <div className="flex items-center gap-2 p-2 bg-gray-900/70 rounded-xl border border-gray-800/50 mb-3">
                        <Crosshair className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-[10px] font-mono text-gray-300 truncate">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                        {hasLive && <span className="text-[9px] font-black text-green-500 ml-auto flex-shrink-0">● LIVE</span>}
                      </div>

                      {/* Photo */}
                      {req.photoData && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-gray-800 h-28 relative group">
                          <img src={req.photoData} alt="SOS" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                          <span className="absolute bottom-1.5 left-2 text-[9px] font-black text-white uppercase tracking-wider">Tactical Photo</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {req.status === "PENDING" && (
                          <button onClick={() => handleStatus(req.id, "ASSIGNED")}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(239,68,68,0.25)] active:scale-95">
                            🚁 Dispatch
                          </button>
                        )}
                        {req.status === "ASSIGNED" && (
                          <button onClick={() => handleStatus(req.id, "IN_PROGRESS")}
                            className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-950 rounded-xl text-xs font-black uppercase tracking-wider transition-colors active:scale-95">
                            ⚡ Begin Extraction
                          </button>
                        )}
                        {req.status === "IN_PROGRESS" && (
                          <button onClick={() => handleStatus(req.id, "RESCUED")}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Rescued
                          </button>
                        )}
                        <button
                          onClick={() => toggleChat(req.id)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1 ${isChat ? "bg-blue-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {isChat ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Chat Panel */}
                    {isChat && (
                      <div className="border-t border-gray-800 bg-gray-950/80">
                        <div className="h-36 overflow-y-auto p-3 flex flex-col gap-2">
                          {(chatMessages[req.id] || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[11px] text-gray-600">No messages yet.</div>
                          ) : (
                            (chatMessages[req.id] || []).map((msg: any, i: number) => {
                              const isRescuer = msg.sender?.role === "RESCUE_TEAM";
                              return (
                                <div key={i} className={`flex ${isRescuer ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-xs ${isRescuer ? "bg-blue-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"}`}>
                                    {!isRescuer && <div className="text-[9px] text-gray-400 font-bold mb-0.5">{msg.sender?.name}</div>}
                                    {msg.content}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-800 flex gap-2">
                          <input
                            value={chatInputs[req.id] || ""}
                            onChange={e => setChatInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && sendMessage(req.id)}
                            placeholder="Message citizen..."
                            className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-100 placeholder-gray-600 focus:border-blue-500 outline-none"
                          />
                          <button onClick={() => sendMessage(req.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
