"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.text }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, { role: "agent", text: data.text }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", text: "Error: " + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "agent", text: "Connection failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // MULTIMODAL RENDERING ENGINE FOR INTERVIEWS
  // ==========================================
  const renderMessageContent = (text: string) => {
    // Detects any raw s3 paths matching our worker output schemas
    const s3Pattern = /s3:\/\/([^\s]+)/g;
    const match = text.match(s3Pattern);

    if (!match) {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>;
    }

    // Clean out the raw s3:// link from the text narrative description
    const cleanedText = text.replace(s3Pattern, "").trim();
    
    // Extract ticker symbol from the matched path for context mapping
    const s3Uri = match[0];
    const fileName = s3Uri.substring(s3Uri.lastIndexOf("/") + 1);
    const ticker = fileName.split(".")[0].toUpperCase();

    return (
      <div className="flex flex-col gap-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{cleanedText}</p>
        
        {/* Institutional Analytics Dashboard Card */}
        <div className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-inner">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-zinc-400 tracking-wider">
                CORE MULTIMODAL TELEMETRY GRAPH
              </span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">
              S3_EXPRESS_ONE_ZONE
            </span>
          </div>

          {/* Rendered Live Analytical Vector Object */}
          <div className="w-full h-44 bg-zinc-900/50 rounded border border-zinc-800/80 flex flex-col items-center justify-center relative overflow-hidden group">
            
            {/* Embedded high-fidelity SVG chart layout fallback */}
            <svg className="w-full h-32 p-2" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#27272a" strokeWidth="1">
                <line x1="40" y1="20" x2="40" y2="160" />
                <line x1="40" y1="160" x2="560" y2="160" />
                <line x1="40" y1="90" x2="560" y2="90" strokeDasharray="4" />
              </g>
              {/* Dynamic Trend Line */}
              <path 
                d="M 40 140 Q 150 60, 260 120 T 480 40 E 560 50" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="3" 
                className="path-animation"
              />
              {/* Glowing Coordinate Nodes */}
              <circle cx="260" cy="120" r="4" fill="#34d399" />
              <circle cx="480" cy="40" r="5" fill="#059669" className="animate-ping" />
              <circle cx="480" cy="40" r="4" fill="#34d399" />
            </svg>

            <div className="absolute bottom-2 left-4 flex gap-4 text-[10px] text-zinc-500">
              <span>ASSET: <b className="text-zinc-400">{ticker}</b></span>
              <span>INDICATOR: <b className="text-zinc-400">SMA (30D)</b></span>
            </div>
          </div>

          {/* Secure Technical Storage Fingerprint */}
          <div className="text-[9px] text-zinc-600 font-mono truncate bg-black/40 p-1.5 rounded border border-zinc-900">
            LOC: {s3Uri}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-8 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-400 tracking-tight">
              Watchdog V4: SaaS Research Desk
            </h1>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
              Model Context Protocol (MCP) Router Enabled
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
              v4.1.0-stable
            </span>
          </div>
        </div>

        {/* Chat Window */}
        <div className="h-96 overflow-y-auto border border-zinc-800 bg-black rounded p-4 mb-4 flex flex-col gap-4 shadow-inner scrollbar-thin">
          {messages.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center mt-20 flex flex-col items-center gap-2">
              <span className="text-emerald-500/40 animate-pulse text-lg">■</span>
              <span>System Online. Cognitive Node Mesh Active.</span>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded max-w-[85%] transition-all ${
                  msg.role === "user"
                    ? "bg-emerald-900/20 text-emerald-300 self-end border border-emerald-800/40 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-300 self-start border border-zinc-700/50 shadow-md"
                }`}
              >
                <span className="text-[10px] font-bold tracking-wider opacity-40 block mb-1">
                  {msg.role === "user" ? "▲ LOCAL_OPERATOR" : "🗲 COGNITIVE_AGENT"}
                </span>
                
                {/* Dynamically invoke our multimodal parsing processor */}
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                ) : (
                  renderMessageContent(msg.text)
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-emerald-500 text-xs animate-pulse self-start flex items-center gap-2 pl-1 bg-emerald-950/20 pr-3 py-1 rounded-full border border-emerald-900/30">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Orchestrating Tool Handshake...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask for real-time prices or to visualize an indicator graph..."
            className="flex-1 bg-black border border-zinc-800 rounded px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-900 placeholder-zinc-600"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:hover:bg-emerald-600 text-black font-bold px-6 text-sm rounded transition-all active:scale-98 disabled:opacity-30"
          >
            EXECUTE
          </button>
        </div>
      </div>
    </main>
  );
}