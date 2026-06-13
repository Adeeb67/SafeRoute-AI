"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import {
  ShieldAlert, AlertTriangle, Plus, Landmark, RefreshCw, Hospital, Radio,
  Activity, Users, CheckCircle2, Clock, Megaphone, TrendingUp, Map as MapIcon, Trash2
} from "lucide-react";

type Tab = "overview" | "disasters" | "shelters" | "broadcast" | "teams" | "incidents";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [disasters, setDisasters] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Forms
  const [title, setTitle] = useState(""); const [disasterType, setDisasterType] = useState("FLOOD");
  const [description, setDescription] = useState(""); const [lat, setLat] = useState("");
  const [lng, setLng] = useState(""); const [radius, setRadius] = useState(""); const [severity, setSeverity] = useState("HIGH");
  const [shelterName, setShelterName] = useState(""); const [shelterLat, setShelterLat] = useState("");
  const [shelterLng, setShelterLng] = useState(""); const [capacity, setCapacity] = useState(""); const [contactNumber, setContactNumber] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState(""); const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastResult, setBroadcastResult] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [dRes, sRes, hRes, rRes, stRes, tRes] = await Promise.all([
        fetch("http://localhost:3002/api/disasters"),
        fetch("http://localhost:3002/api/shelters"),
        fetch("http://localhost:3002/api/hospitals"),
        fetch("http://localhost:3002/api/rescue", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3002/api/stats"),
        fetch("http://localhost:3002/api/teams", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [d, s, h, r, st, t] = await Promise.all([dRes.json(), sRes.json(), hRes.json(), rRes.json(), stRes.json(), tRes.json()]);
      setDisasters(Array.isArray(d) ? d : []);
      setShelters(Array.isArray(s) ? s : []);
      setHospitals(Array.isArray(h) ? h : []);
      setRequests(Array.isArray(r) ? r : []);
      setStats(st);
      setTeams(Array.isArray(t) ? t : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const user = JSON.parse(stored);
    if (user.role !== "ADMIN") { window.location.href = "/login"; return; }
    fetchAll();
  }, []);

  const handleDisaster = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3002/api/disasters", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title, type: disasterType, description, latitude: parseFloat(lat), longitude: parseFloat(lng), radius: parseFloat(radius), severity })
    });
    if (res.ok) { setMessage("✅ Disaster broadcasted!"); setTitle(""); setDescription(""); setLat(""); setLng(""); setRadius(""); fetchAll(); }
    else { const err = await res.json(); setMessage("❌ " + err.error); }
  };

  const handleShelter = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3002/api/shelters", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name: shelterName, latitude: parseFloat(shelterLat), longitude: parseFloat(shelterLng), capacity: parseInt(capacity), resourcesAvailable: ["Water", "Rations", "First Aid", "Blankets"], contactNumber })
    });
    if (res.ok) { setMessage("✅ Shelter deployed!"); setShelterName(""); setShelterLat(""); setShelterLng(""); setCapacity(""); setContactNumber(""); fetchAll(); }
    else { const err = await res.json(); setMessage("❌ " + err.error); }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault(); setBroadcastResult("");
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3002/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
    });
    if (res.ok) {
      const data = await res.json();
      setBroadcastResult(`✅ Broadcast sent to ${data.recipients} citizens!`);
      setBroadcastTitle(""); setBroadcastMessage("");
    } else { setBroadcastResult("❌ Broadcast failed."); }
  };

  const deactivateDisaster = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3002/api/disasters/${id}/deactivate`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    });
    fetchAll();
  };

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
    { id: "disasters", label: "Disasters", icon: <AlertTriangle className="h-4 w-4" /> },
    { id: "shelters", label: "Shelters", icon: <Landmark className="h-4 w-4" /> },
    { id: "broadcast", label: "Broadcast", icon: <Megaphone className="h-4 w-4" /> },
    { id: "teams", label: "Teams", icon: <Users className="h-4 w-4" /> },
    { id: "incidents", label: "Incidents", icon: <Clock className="h-4 w-4" /> },
  ];

  const inputClass = "w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl focus:border-red-500 outline-none text-sm text-gray-100";

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Header />

      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-widest uppercase">Admin Command Portal</h1>
            <p className="text-[10px] text-gray-500 font-mono">SYSTEM-WIDE OPERATIONS CONTROL</p>
          </div>
        </div>
        <button onClick={fetchAll} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Sync
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-950/50 px-6 flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex-shrink-0 ${activeTab === tab.id ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-gray-900 border border-gray-700 text-sm font-semibold text-white">{message}</div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total SOS Calls", value: stats?.totalSOS, icon: <Radio className="h-5 w-5" />, color: "text-red-400", bg: "bg-red-950/20 border-red-800/40" },
                { label: "Active Pending", value: stats?.pendingSOS, icon: <Clock className="h-5 w-5" />, color: "text-orange-400", bg: "bg-orange-950/20 border-orange-800/40" },
                { label: "People Rescued", value: stats?.rescued, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-400", bg: "bg-green-950/20 border-green-800/40" },
                { label: "Rescue Teams", value: stats?.rescueTeams, icon: <Users className="h-5 w-5" />, color: "text-blue-400", bg: "bg-blue-950/20 border-blue-800/40" },
                { label: "Active Disasters", value: stats?.activeDisasters, icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-500", bg: "bg-red-950/20 border-red-800/40" },
                { label: "Shelters Online", value: stats?.shelterCount, icon: <Landmark className="h-5 w-5" />, color: "text-cyan-400", bg: "bg-cyan-950/20 border-cyan-800/40" },
                { label: "Hospitals Ready", value: stats?.hospitalCount, icon: <Hospital className="h-5 w-5" />, color: "text-purple-400", bg: "bg-purple-950/20 border-purple-800/40" },
                { label: "Success Rate", value: stats?.totalSOS ? `${Math.round((stats.rescued / stats.totalSOS) * 100)}%` : "—", icon: <TrendingUp className="h-5 w-5" />, color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-800/40" },
              ].map(s => (
                <div key={s.label} className={`p-5 rounded-2xl border ${s.bg} flex flex-col gap-3`}>
                  <div className={s.color}>{s.icon}</div>
                  <div>
                    <div className={`text-2xl font-black ${s.color}`}>{loading ? "—" : s.value ?? "0"}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resource Inventory */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-5">
                <Landmark className="h-4 w-4 text-cyan-400" /> Shelter Resource Inventory
              </h3>
              <div className="space-y-3">
                {shelters.map(s => {
                  const pct = Math.round((s.occupancy / s.capacity) * 100);
                  const barColor = pct > 85 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-green-500";
                  return (
                    <div key={s.id} className="flex items-center gap-4">
                      <div className="w-36 text-xs text-gray-300 font-semibold truncate flex-shrink-0">{s.name}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-28 text-right text-xs text-gray-400 flex-shrink-0 font-mono">
                        {s.occupancy}/{s.capacity} ({pct}%)
                      </div>
                    </div>
                  );
                })}
                {shelters.length === 0 && <p className="text-xs text-gray-600">No shelters configured.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── DISASTERS ── */}
        {activeTab === "disasters" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleDisaster} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Broadcast New Disaster
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-xs">Title</label><input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Flash Flood Zone A" className={inputClass} /></div>
                  <div><label className="label-xs">Type</label>
                    <select value={disasterType} onChange={e => setDisasterType(e.target.value)} className={inputClass}>
                      {["FLOOD","EARTHQUAKE","CYCLONE","WILDFIRE","LANDSLIDE"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label-xs">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} required className={`${inputClass} resize-none`} placeholder="Describe the hazard..." /></div>
                <div className="grid grid-cols-4 gap-3">
                  <div><label className="label-xs">Latitude</label><input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} required placeholder="12.9716" className={inputClass} /></div>
                  <div><label className="label-xs">Longitude</label><input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} required placeholder="77.5946" className={inputClass} /></div>
                  <div><label className="label-xs">Radius (km)</label><input type="number" value={radius} onChange={e => setRadius(e.target.value)} required placeholder="5" className={inputClass} /></div>
                  <div><label className="label-xs">Severity</label>
                    <select value={severity} onChange={e => setSeverity(e.target.value)} className={inputClass}>
                      {["LOW","MEDIUM","HIGH","CRITICAL"].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Broadcast Disaster
                </button>
              </form>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Active Events ({disasters.length})</h3>
              {disasters.map(d => (
                <div key={d.id} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">{d.title}</p>
                    <p className="text-[10px] text-gray-500">{d.type} • {d.severity} • {d.radius}km</p>
                  </div>
                  <button onClick={() => deactivateDisaster(d.id)} className="p-1.5 bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-500 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {disasters.length === 0 && <p className="text-xs text-gray-600">No active disasters.</p>}
            </div>
          </div>
        )}

        {/* ── SHELTERS ── */}
        {activeTab === "shelters" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <form onSubmit={handleShelter} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-green-500" /> Deploy New Shelter
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-xs">Shelter Name</label><input value={shelterName} onChange={e => setShelterName(e.target.value)} required placeholder="e.g. City Hall Relief Point" className={inputClass} /></div>
                  <div><label className="label-xs">Capacity</label><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required placeholder="200" className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label-xs">Latitude</label><input type="number" step="any" value={shelterLat} onChange={e => setShelterLat(e.target.value)} required placeholder="12.9716" className={inputClass} /></div>
                  <div><label className="label-xs">Longitude</label><input type="number" step="any" value={shelterLng} onChange={e => setShelterLng(e.target.value)} required placeholder="77.5946" className={inputClass} /></div>
                  <div><label className="label-xs">Contact Number</label><input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required placeholder="+91-000-0000" className={inputClass} /></div>
                </div>
                <button type="submit" className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Deploy Shelter
                </button>
              </form>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">All Shelters ({shelters.length})</h3>
              <div className="space-y-2">
                {shelters.map(s => {
                  const pct = Math.round((s.occupancy / s.capacity) * 100);
                  return (
                    <div key={s.id} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                      <p className="text-xs font-bold text-white">{s.name}</p>
                      <div className="mt-1.5 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : "bg-green-500"} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{s.occupancy}/{s.capacity} occupied • {s.contactNumber}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── BROADCAST ── */}
        {activeTab === "broadcast" && (
          <div className="max-w-xl">
            <form onSubmit={handleBroadcast} className="bg-gray-900/40 border border-yellow-900/40 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-yellow-400" /> Emergency Broadcast
              </h3>
              <p className="text-xs text-gray-500">Send an immediate alert to all registered citizens. This will appear as a push notification and be saved to their notification history.</p>
              <div>
                <label className="label-xs">Broadcast Title</label>
                <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} required placeholder="e.g. ⚠️ Mandatory Evacuation Order" className={inputClass} />
              </div>
              <div>
                <label className="label-xs">Message Body</label>
                <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} required rows={4} placeholder="All residents in Zone 4 must evacuate immediately. Proceed to the nearest shelter on the SafeRoute map." className={`${inputClass} resize-none`} />
              </div>
              <button type="submit" className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-gray-950 font-black rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                <Megaphone className="h-4 w-4" /> Send to All Citizens
              </button>
              {broadcastResult && <p className="text-sm font-bold text-center text-white">{broadcastResult}</p>}
            </form>
          </div>
        )}

        {/* ── TEAMS ── */}
        {activeTab === "teams" && (
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" /> Rescue Team Roster ({teams.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(t => {
                const active = t.assignedTeams?.filter((r: any) => r.status !== "RESCUED").length || 0;
                const rescued = t.assignedTeams?.filter((r: any) => r.status === "RESCUED").length || 0;
                return (
                  <div key={t.id} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-white">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.email}</p>
                        {t.phone && <p className="text-xs text-gray-500">{t.phone}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${active > 0 ? "bg-red-950/60 border border-red-700/40 text-red-400" : "bg-green-950/60 border border-green-700/40 text-green-400"}`}>
                        {active > 0 ? `${active} Active` : "Available"}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <div className="flex-1 bg-gray-950 rounded-lg p-2 text-center">
                        <div className="font-black text-orange-400">{active}</div>
                        <div className="text-gray-600">Active Ops</div>
                      </div>
                      <div className="flex-1 bg-gray-950 rounded-lg p-2 text-center">
                        <div className="font-black text-green-400">{rescued}</div>
                        <div className="text-gray-600">Rescued</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {teams.length === 0 && <p className="text-xs text-gray-600 col-span-3">No rescue teams registered.</p>}
            </div>
          </div>
        )}

        {/* ── INCIDENTS (Timeline) ── */}
        {activeTab === "incidents" && (
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" /> Incident Timeline ({requests.length})
            </h3>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-800" />
              <div className="space-y-4 pl-12">
                {requests.map(req => {
                  const statusColor: Record<string, string> = { PENDING: "text-red-400 bg-red-950/60 border-red-700/40", ASSIGNED: "text-yellow-400 bg-yellow-950/60 border-yellow-700/40", IN_PROGRESS: "text-blue-400 bg-blue-950/60 border-blue-700/40", RESCUED: "text-green-400 bg-green-950/60 border-green-700/40" };
                  const dotColor: Record<string, string> = { PENDING: "bg-red-500", ASSIGNED: "bg-yellow-500", IN_PROGRESS: "bg-blue-500", RESCUED: "bg-green-500" };
                  return (
                    <div key={req.id} className="relative">
                      <div className={`absolute -left-7 top-3 h-3 w-3 rounded-full border-2 border-gray-950 ${dotColor[req.status] || "bg-gray-500"}`} />
                      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{req.citizen.name}</span>
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${statusColor[req.status]}`}>{req.status}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">{new Date(req.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400">{req.description || "No description."}</p>
                        <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
                          <span>Type: <b className="text-gray-400">{req.emergencyType || "GENERAL"}</b></span>
                          <span>Severity: <b className="text-gray-400">{req.severity}</b></span>
                          <span>People: <b className="text-gray-400">{req.numberOfPeople}</b></span>
                          {req.rescueTeam && <span>Team: <b className="text-gray-400">{req.rescueTeam.name}</b></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {requests.length === 0 && <p className="text-xs text-gray-600">No incidents logged.</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .label-xs { display: block; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
      `}</style>
    </div>
  );
}
