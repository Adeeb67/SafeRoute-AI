"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import { AlertCircle, Landmark, ShieldAlert, Crosshair, Map as MapIcon, Loader2 } from "lucide-react";

export default function DisasterMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [disasters, setDisasters] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [rescueRequests, setRescueRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Fetch user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Default location: SF Downtown
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }

    // Fetch resources
    const token = localStorage.getItem("token");
    Promise.all([
      fetch("http://localhost:3002/api/disasters").then((res) => res.json()),
      fetch("http://localhost:3002/api/shelters").then((res) => res.json()),
      fetch("http://localhost:3002/api/hospitals").then((res) => res.json()),
      token
        ? fetch("http://localhost:3002/api/rescue", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json())
        : Promise.resolve([]),
    ])
      .then(([d, s, h, r]) => {
        setDisasters(Array.isArray(d) ? d : []);
        setShelters(Array.isArray(s) ? s : []);
        setHospitals(Array.isArray(h) ? h : []);
        setRescueRequests(Array.isArray(r) ? r : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !userLocation || !mapContainerRef.current) return;

    // Load Leaflet dynamically client-side
    import("leaflet").then((L) => {
      if (mapRef.current) return; // Prevent double initialization

      const map = L.map(mapContainerRef.current).setView(
        [userLocation.lat, userLocation.lng],
        12
      );
      mapRef.current = map;

      // Dark Mode map tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20,
        }
      ).addTo(map);

      // Create Custom icons
      const createHtmlIcon = (color: string, label: string) => {
        return L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      };

      // Add user location marker
      L.marker([userLocation.lat, userLocation.lng], {
        icon: createHtmlIcon("#3b82f6", "Me"),
      })
        .addTo(map)
        .bindPopup("Your Location")
        .openPopup();

      // Add Disasters & Affected Zones (Circles)
      disasters.forEach((d) => {
        L.marker([d.latitude, d.longitude], {
          icon: createHtmlIcon("#ef4444", "🚨"),
        })
          .addTo(map)
          .bindPopup(`<b>${d.title}</b><br/>Severity: ${d.severity}<br/>${d.description}`);

        L.circle([d.latitude, d.longitude], {
          color: "#dc2626",
          fillColor: "#f87171",
          fillOpacity: 0.25,
          radius: d.radius * 1000, // Convert km to meters
        }).addTo(map);
      });

      // Add Shelters
      shelters.forEach((s) => {
        L.marker([s.latitude, s.longitude], {
          icon: createHtmlIcon("#22c55e", "🏠"),
        })
          .addTo(map)
          .bindPopup(`<b>Shelter: ${s.name}</b><br/>Capacity: ${s.occupancy}/${s.capacity}<br/>Resources: ${s.resourcesAvailable.join(", ")}`);
      });

      // Add Hospitals
      hospitals.forEach((h) => {
        L.marker([h.latitude, h.longitude], {
          icon: createHtmlIcon("#06b6d4", "🏥"),
        })
          .addTo(map)
          .bindPopup(`<b>Hospital: ${h.name}</b><br/>Available Beds: ${h.bedsAvailable}`);
      });

      // Add Rescue Requests (Active user requests)
      rescueRequests.forEach((r) => {
        if (r.status !== "RESCUED") {
          L.marker([r.latitude, r.longitude], {
            icon: createHtmlIcon("#f59e0b", "🆘"),
          })
            .addTo(map)
            .bindPopup(`<b>SOS Request</b><br/>Status: ${r.status}<br/>Victims: ${r.numberOfPeople}`);
        }
      });
    });
  }, [loading, userLocation, disasters, shelters, hospitals, rescueRequests]);

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col min-h-[calc(100vh-64px)] relative bg-[#0b0f19]">
        {loading && (
          <div className="absolute inset-0 bg-gray-950/80 z-50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 text-red-500 animate-spin" />
            <div className="text-sm font-semibold text-white">Rendering Dynamic Hazard Map...</div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map Section */}
          <div className="flex-1 h-[60vh] lg:h-auto" ref={mapContainerRef} />

          {/* Interactive Legend sidebar */}
          <div className="w-full lg:w-96 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 p-6 space-y-6 overflow-y-auto max-h-[40vh] lg:max-h-none">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-red-500" /> Map Control Panel
              </h2>
              <p className="text-xs text-gray-400 mt-1">Real-time geospatial overlay representing disaster sectors.</p>
            </div>

            <div className="h-[1px] bg-gray-800" />

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Map Legend</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span className="h-3.5 w-3.5 rounded-full bg-blue-500 border border-white flex-shrink-0" />
                  <span>Your GPS Location (Me)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span className="h-3.5 w-3.5 rounded-full bg-red-500 border border-white flex-shrink-0 flex items-center justify-center text-[7px] text-white">🚨</span>
                  <span>Disaster Incident / Affected Danger Zones</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span className="h-3.5 w-3.5 rounded-full bg-green-500 border border-white flex-shrink-0 flex items-center justify-center text-[7px] text-white">🏠</span>
                  <span>Active Shelter Location</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span className="h-3.5 w-3.5 rounded-full bg-cyan-500 border border-white flex-shrink-0 flex items-center justify-center text-[7px] text-white">🏥</span>
                  <span>Hospital Emergency Aid Centers</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span className="h-3.5 w-3.5 rounded-full bg-yellow-500 border border-white flex-shrink-0 flex items-center justify-center text-[7px] text-white">🆘</span>
                  <span>Pending SOS Rescues</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-gray-800" />

            {/* General Advice banner */}
            <div className="p-4 bg-gray-950/60 border border-gray-850 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-blue-400" /> Safe Route Instructions
              </h4>
              <p className="text-[10px] text-gray-400 leading-normal">
                To evacuate safely, plan a path heading away from red-shaded circular hazard zones. Aim for the closest green shelter icon.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
