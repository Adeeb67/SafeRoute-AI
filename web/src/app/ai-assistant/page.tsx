"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { Send, Bot, User, Loader2, LifeBuoy, HeartHandshake } from "lucide-react";

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Fetch conversation logs from server
    fetch("http://localhost:3002/api/ai/history", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const token = localStorage.getItem("token");
    const userMessageText = input;
    setInput("");
    setLoading(true);

    // Optimistically update UI
    setMessages((prev) => [...prev, { message: userMessageText, isBot: false }]);

    try {
      const res = await fetch("http://localhost:3002/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessageText })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col h-[calc(100vh-96px)]">
        <div className="flex-1 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex flex-col overflow-hidden relative">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center justify-center">
                <Bot className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">SafeRoute Emergency Assistant</h2>
                <p className="text-[10px] text-gray-400">Instructing on medical aid, shelters, and natural hazards.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-950 text-green-400 text-[10px] px-2 py-0.5 rounded font-extrabold border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" /> Online
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <LifeBuoy className="h-12 w-12 text-red-500/40 animate-spin" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Emergency Response Helper</h3>
                  <p className="text-xs text-gray-400 max-w-sm">
                    Ask for immediate first-aid instructions, flood safety rules, or general emergency assistance.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m: any, idx: number) => (
              <div key={idx} className={`flex gap-3 ${m.isBot ? "justify-start" : "justify-end"}`}>
                {m.isBot && (
                  <div className="h-7 w-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-red-500" />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${m.isBot ? "bg-gray-950/80 border border-gray-900 text-gray-200" : "bg-red-600 text-white font-medium"}`}>
                  {m.message}
                </div>
                {!m.isBot && (
                  <div className="h-7 w-7 rounded-lg bg-red-900/40 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-red-500" />
                </div>
                <div className="p-4 bg-gray-950/80 border border-gray-900 rounded-2xl flex items-center gap-2 text-xs text-gray-450">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" /> Generating response...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="flex gap-3 flex-shrink-0">
            <input
              type="text"
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your situation or ask for safety guidelines..."
              className="flex-1 bg-gray-950 border border-gray-850 rounded-xl px-4 outline-none text-xs text-white focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-10 w-10 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-red-950"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      </main>
    </>
  );
}
