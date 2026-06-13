"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import {
  ShieldAlert, Flame, Loader2, CheckCircle, Droplets, Zap, Mountain, Wind,
  Crosshair, MessageCircle, Send, Clock, Navigation2, Radio
} from "lucide-react";
import { io, Socket } from "socket.io-client";

const EMERGENCY_TYPES = [
  { id: "MEDICAL", label: "Medical", icon: <ShieldAlert className="h-5 w-5" />, color: "red", desc: "Injury / health emergency" },
  { id: "FLOOD", label: "Flood", icon: <Droplets className="h-5 w-5" />, color: "blue", desc: "Trapped by rising water" },
  { id: "FIRE", label: "Fire", icon: <Flame className="h-5 w-5" />, color: "orange", desc: "Building / wildfire" },
  { id: "EARTHQUAKE", label: "Quake", icon: <Zap className="h-5 w-5" />, color: "yellow", desc: "Trapped under rubble" },
  { id: "LANDSLIDE", label: "Landslide", icon: <Mountain className="h-5 w-5" />, color: "stone", desc: "Debris blockage" },
  { id: "GENERAL", label: "General", icon: <Wind className="h-5 w-5" />, color: "gray", desc: "Other emergency" },
];

const SEVERITY_KEYWORDS: Record<string, string> = {
  "trapped": "CRITICAL", "unconscious": "CRITICAL", "bleeding": "CRITICAL",
  "drowning": "CRITICAL", "fire": "CRITICAL", "collapsed": "CRITICAL",
  "injured": "HIGH", "flood": "HIGH", "smoke": "HIGH", "stuck": "HIGH",
  "help": "MEDIUM", "stranded": "MEDIUM", "lost": "MEDIUM",
};

function autoTriageSeverity(desc: string): string {
  const lower = desc.toLowerCase();
  for (const [kw, sev] of Object.entries(SEVERITY_KEYWORDS)) {
    if (lower.includes(kw)) return sev;
  }
  return "MEDIUM";
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SOSPage() {
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [numPeople, setNumPeople] = useState(1);
  const [desc, setDesc] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [emergencyType, setEmergencyType] = useState("GENERAL");
  const [autoSeverity, setAutoSeverity] = useState("MEDIUM");
  const [rescuerLocation, setRescuerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const trackingInterval = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGps({ lat: 12.9716, lng: 77.5946 })
      );
    }
    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Auto-triage on description change
  useEffect(() => {
    if (desc.length > 5) setAutoSeverity(autoTriageSeverity(desc));
  }, [desc]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Compute ETA when rescuer location arrives
  useEffect(() => {
    if (rescuerLocation && gps) {
      const dist = calcDistance(rescuerLocation.lat, rescuerLocation.lng, gps.lat, gps.lng);
      const etaMins = Math.ceil((dist / 40) * 60); // ~40 km/h in emergency
      setEta(`${etaMins} min (${dist.toFixed(1)} km away)`);
    }
  }, [rescuerLocation, gps]);

  const triggerSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    const submit = async (lat: number, lng: number) => {
      try {
        const res = await fetch("http://localhost:3002/api/rescue/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({
            latitude: lat, longitude: lng,
            severity: autoSeverity,
            emergencyType,
            numberOfPeople: numPeople,
            description: desc,
            photoData
          })
        });
        const data = await res.json();
        if (res.ok) {
          setRequest(data);
          setSosActive(true);

          const socket = io("http://localhost:3002");
          socketRef.current = socket;

          socket.on("live-location-update", (update: any) => {
            if (update.requestId === data.id && update.role === "RESCUER") {
              setRescuerLocation({ lat: update.latitude, lng: update.longitude });
            }
          });

          socket.on("rescue-chat-" + data.id, (msg: any) => {
            setMessages(prev => [...prev, msg]);
          });

          trackingInterval.current = setInterval(() => {
            navigator.geolocation.getCurrentPosition((pos) => {
              setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              socket.emit("share-location", {
                requestId: data.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                role: "CITIZEN"
              });
            });
          }, 15000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (gps) {
      submit(gps.lat, gps.lng);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => submit(pos.coords.latitude, pos.coords.longitude),
        () => { alert("GPS access is required for SOS."); setLoading(false); }
      );
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !request) return;
    setChatLoading(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:3002/api/rescue/${request.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: chatInput })
      });
      setChatInput("");
    } catch (err) { console.error(err); }
    finally { setChatLoading(false); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
    CRITICAL: { color: "text-red-400", bg: "bg-red-950/60 border-red-500/50", label: "CRITICAL" },
    HIGH: { color: "text-orange-400", bg: "bg-orange-950/60 border-orange-500/50", label: "HIGH" },
    MEDIUM: { color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-500/50", label: "MEDIUM" },
  };
  const sevStyle = severityConfig[autoSeverity] || severityConfig.MEDIUM;

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center p-4 md:p-8 bg-gradient-to-br from-[#0b0f19] via-[#7f1d1d]/10 to-[#0b0f19]">
        <div className="w-full max-w-2xl space-y-5">
          {!sosActive ? (
            /* ─── SOS FORM ─── */
            <form onSubmit={triggerSOS} className="bg-gray-900/60 border border-red-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-16 w-16 bg-red-950/60 border border-red-500/40 rounded-full flex items-center justify-center mb-1 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">SOS Beacon</h1>
                <p className="text-xs text-gray-400 max-w-sm">Your live GPS coordinates will be transmitted to all active rescue teams immediately.</p>
              </div>

              {/* Emergency Type Selector */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Emergency Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {EMERGENCY_TYPES.map(et => (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => setEmergencyType(et.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${emergencyType === et.id
                        ? "bg-red-950/50 border-red-500/60 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        : "bg-gray-950/40 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"}`}
                    >
                      {et.icon}
                      <span className="text-[11px] font-bold">{et.label}</span>
                      <span className="text-[9px] text-gray-500 leading-tight">{et.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description + AI triage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Situation Report</label>
                  {desc.length > 5 && (
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${sevStyle.bg} ${sevStyle.color}`}>
                      AI Triage: {sevStyle.label}
                    </span>
                  )}
                </div>
                <textarea
                  required
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Trapped on 2nd floor, water rising, 3 people including elderly woman, need urgent extraction..."
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-xl focus:border-red-500 outline-none text-sm resize-none transition-colors text-gray-100 placeholder-gray-600"
                />
                <p className="text-[10px] text-gray-600 mt-1">AI auto-detects severity from your description in real-time.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">People in Danger</label>
                  <input
                    type="number" min={1} required value={numPeople}
                    onChange={(e) => setNumPeople(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-red-500 outline-none text-sm text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">GPS Status</label>
                  <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${gps ? "bg-green-950/30 border-green-700/40 text-green-400" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
                    <Crosshair className="h-3.5 w-3.5" />
                    {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Acquiring..."}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Context Photo (Optional)</label>
                <input
                  type="file" accept="image/*" onChange={handlePhotoUpload}
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 cursor-pointer"
                />
                {photoData && <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Photo attached</div>}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-900 disabled:to-red-900 text-white font-black rounded-2xl text-sm transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] flex items-center justify-center gap-3 uppercase tracking-widest animate-sos-pulse"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Radio className="h-5 w-5" /> Broadcast Emergency Signal</>}
              </button>
            </form>
          ) : (
            /* ─── ACTIVE SOS STATE ─── */
            <div className="space-y-4">
              {/* Status Card */}
              <div className="bg-gray-900/80 border border-red-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-red-950/60 border-2 border-red-500 flex items-center justify-center animate-pulse">
                    <Flame className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">SOS Beacon Active</h2>
                    <p className="text-xs text-red-400 font-semibold">Broadcasting every 15 seconds</p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-2 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-black uppercase rounded-lg tracking-widest animate-pulse">LIVE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Request ID</span>
                    <span className="text-xs font-mono text-white">{request?.id?.slice(0, 12)}...</span>
                  </div>
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">AI Triage</span>
                    <span className={`text-xs font-black uppercase ${sevStyle.color}`}>{autoSeverity}</span>
                  </div>
                  <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Your Coordinates</span>
                    <span className="text-xs font-mono text-white">{gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : "Acquiring..."}</span>
                  </div>
                  {rescuerLocation ? (
                    <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block mb-1 flex items-center gap-1"><Navigation2 className="h-3 w-3" /> Rescuer ETA</span>
                      <span className="text-xs font-bold text-blue-300">{eta || "Calculating..."}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-1">Rescuer Status</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Awaiting dispatch...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Rescue Chat */}
              <div className="bg-gray-900/80 border border-gray-800 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Rescue Comms Channel</h3>
                </div>
                <div className="p-4 h-52 overflow-y-auto flex flex-col gap-2">
                  {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs text-gray-600 text-center">
                      Secure channel open. Your rescue team will communicate here.
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.sender?.role === "CITIZEN";
                    return (
                      <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${isMe ? "bg-red-700 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"}`}>
                          {!isMe && <div className="text-[10px] text-gray-400 font-bold mb-0.5">{msg.sender?.name}</div>}
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="Message your rescuer..."
                    className="flex-1 px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center px-4">
                Stay where you are if safe. Rescue teams are tracking your live location. Emergency contacts: 112 (India) | 911 (US)
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
