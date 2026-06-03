"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<"simple" | "expert">("simple");
  
  const [activeTicker, setActiveTicker] = useState("---");
  const [activePrice, setActivePrice] = useState("0.00");

  const sendMessage = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || input;
    if (!promptToSend.trim()) return;

    const userMessage = { role: "user" as const, text: promptToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!overridePrompt) setInput("");
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
        
        // DYNAMIC EXTRACTION: Parse the agent's text for live data!
        const priceMatch = data.text.match(/\$([0-9,]+\.\d{2})/);
        const tickerMatch = data.text.match(/\b([A-Z]{2,5})\b/);

        if (tickerMatch && tickerMatch[1] !== "LOC" && tickerMatch[1] !== "SMA") {
          setActiveTicker(tickerMatch[1]);
        }
        if (priceMatch) {
          setActivePrice(priceMatch[1]);
        }

      } else {
        setMessages((prev) => [...prev, { role: "agent", text: "Error: " + data.error }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "agent", text: "Connection failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const s3Pattern = /s3:\/\/([^\s]+)/g;
    const match = text.match(s3Pattern);

    if (!match) {
      return <p className="text-sm text-[#F3F4F6] whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    const cleanedText = text.replace(s3Pattern, "").trim();
    const s3Uri = match[0];

    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[#F3F4F6] whitespace-pre-wrap leading-relaxed">{cleanedText}</p>
        <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded font-mono truncate mt-1">
          📊 Visual asset streamed cleanly to Directory Target Bucket. Ref index: {s3Uri}
        </div>
      </div>
    );
  };

  return (
    <main className="w-screen h-screen bg-[#0B0F19] text-[#9CA3AF] font-mono flex flex-col overflow-hidden antialiased">
      
      <header className="w-full h-14 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold tracking-wider text-base">WATCHDOG // V4</span>
          <span className="text-[10px] border border-[#1F2937] px-1.5 py-0.5 rounded text-[#4B5563]">SaaS_DESK</span>
        </div>

        <div className="bg-[#0B0F19] border border-[#1F2937] rounded-md p-1 flex items-center gap-1">
          <button 
            onClick={() => setViewMode("simple")}
            className={`px-4 py-1 text-xs rounded transition-all font-semibold uppercase ${viewMode === 'simple' ? 'bg-[#1F2937] text-emerald-400 shadow-sm' : 'text-[#4B5563] hover:text-[#9CA3AF]'}`}
          >
            Simple Mode
          </button>
          <button 
            onClick={() => setViewMode("expert")}
            className={`px-4 py-1 text-xs rounded transition-all font-semibold uppercase ${viewMode === 'expert' ? 'bg-[#1F2937] text-[#F59E0B] shadow-sm' : 'text-[#4B5563] hover:text-[#9CA3AF]'}`}
          >
            Expert Mode
          </button>
        </div>

        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            Agent Live: us-west-2
          </span>
        </div>
      </header>

      <div className="flex-1 w-full flex overflow-hidden">
        
        <aside className="w-[20%] h-full bg-[#111827]/40 border-r border-[#1F2937] p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <span className="text-[10px] font-bold text-[#4B5563] tracking-widest uppercase block mb-2">Target Registry</span>
            <div className="flex flex-col gap-1">
              {[
                { symbol: "NVDA", name: "NVIDIA Corp.", active: activeTicker === "NVDA" },
                { symbol: "CELH", name: "Celsius Holdings", active: activeTicker === "CELH" },
                { symbol: "TSLA", name: "Tesla Inc.", active: activeTicker === "TSLA" }
              ].map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setInput(`Check price for ${stock.symbol}`)}
                  className={`w-full text-left p-2 rounded transition-all border flex items-center justify-between ${stock.active ? 'bg-[#111827] border-[#374151] text-[#F3F4F6]' : 'border-transparent hover:bg-[#111827]/60 hover:text-[#F3F4F6]'}`}
                >
                  <div>
                    <div className="text-xs font-bold">{stock.symbol}</div>
                    <div className="text-[10px] opacity-50 mt-0.5">{stock.name}</div>
                  </div>
                  {stock.active && <span className="h-1.5 w-1.5 bg-[#10B981] rounded-full"></span>}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-[#1F2937] pt-4">
            <div className="bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
              <span className="text-[9px] font-bold text-[#4B5563] uppercase tracking-wider block mb-1">SESSION CONTROL</span>
              <div className="text-[10px] truncate text-[#9CA3AF]">ENGINE: <span className="text-emerald-400 font-bold">Valkey Serverless</span></div>
              <div className="text-[10px] truncate text-[#9CA3AF] mt-1">CAPACITY: <span className="text-zinc-500">100 MB Allocation</span></div>
            </div>
          </div>
        </aside>

        <section className="w-[45%] h-full bg-[#0B0F19] p-4 flex flex-col justify-between overflow-hidden">
          
          <div className="flex-1 w-full overflow-y-auto space-y-4 pr-1 mb-4 border border-[#1F2937]/50 bg-black/30 p-4 rounded-lg shadow-inner scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center gap-2 text-[#4B5563] text-xs">
                <span className="text-emerald-500/20 text-xl font-bold animate-pulse">■</span>
                <span>SYSTEM CONSOLE INITIALIZED</span>
                <span>Awaiting command macro vectors inside terminal console inputs...</span>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border flex flex-col gap-1 transition-all ${
                    msg.role === "user"
                      ? "bg-emerald-950/10 text-emerald-400 self-end border-emerald-900/30 ml-12 shadow-sm"
                      : "bg-[#111827]/70 text-[#F3F4F6] self-start border-[#1F2937] mr-12 shadow-md"
                  }`}
                >
                  <span className="text-[9px] font-bold tracking-widest opacity-40 uppercase">
                    {msg.role === "user" ? "▲ Operator_Terminal" : "🗲 Cognitive_Agent_Node"}
                  </span>
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderMessageContent(msg.text)
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-[#10B981] text-xs animate-pulse flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded border border-[#1F2937] w-max">
                <span className="h-1.5 w-1.5 bg-[#10B981] rounded-full animate-ping"></span>
                Orchestrating Model Context Protocol (MCP) Router Turn Handshake...
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 bg-[#111827] border border-[#1F2937] focus-within:border-[#374151] rounded-lg p-2 transition-all duration-200 shadow-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask for pricing matrix formulas or execute technical visualizations..."
                className="flex-1 bg-transparent px-2 py-1 text-sm text-[#F3F4F6] focus:outline-none placeholder-[#4B5563]"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading}
                className="bg-[#10B981] hover:bg-emerald-400 text-[#0B0F19] font-bold text-xs px-5 rounded transition-all uppercase disabled:opacity-30"
              >
                Execute
              </button>
            </div>

            <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#1F2937] flex-wrap">
              <button 
                onClick={() => sendMessage(`Check price for NVDA`)}
                className="bg-[#0B0F19] border border-[#1F2937] hover:border-[#374151] text-[10px] text-[#9CA3AF] px-2 py-1 rounded transition-all"
              >
                🔍 Query Live Market Spot: NVDA
              </button>
              <button 
                onClick={() => sendMessage(`Can I see a simple moving average chart for it?`)}
                className="bg-[#0B0F19] border border-[#1F2937] hover:border-[#374151] text-[10px] text-[#9CA3AF] px-2 py-1 rounded transition-all"
              >
                📊 Render Multi-Turn Graph Card
              </button>
            </div>
          </div>
        </section>

        <section className="w-[35%] h-full bg-[#111827]/20 border-l border-[#1F2937] p-4 flex flex-col gap-4 overflow-y-auto">
          
          <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4 shadow-xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xl font-black text-[#F3F4F6] tracking-tight">{activeTicker}</span>
                <span className="text-[10px] text-[#9CA3AF] block mt-0.5 uppercase tracking-wider">
                  Active Monitored Asset
                </span>
              </div>
              <div className="text-right">
                <span 
                  className={`text-xl font-bold font-mono block ${activePrice !== "0.00" ? "text-[#10B981]" : "text-[#4B5563]"}`}
                  style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}
                >
                  ${activePrice}
                </span>
                <span className="text-[10px] text-[#10B981] font-bold">
                  {activePrice !== "0.00" ? "▲ Core Pipeline Active" : "⏸ Awaiting Telemetry"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#1F2937] pt-2.5 grid grid-cols-2 gap-2 text-[10px]">
              <div><span className="text-[#4B5563]">SMA 50 Cross:</span> <span className="text-emerald-400 font-bold">PENDING</span></div>
              <div><span className="text-[#4B5563]">Region:</span> <span className="text-[#9CA3AF]">us-west-2</span></div>
              <div><span className="text-[#4B5563]">Latency Tier:</span> <span className="text-emerald-400">Low (Warm)</span></div>
              <div><span className="text-[#4B5563]">Storage Core:</span> <span className="text-amber-400">S3 Express</span></div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4 shadow-xl flex flex-col gap-2">
            <div className="flex justify-between items-center border-b border-[#1F2937] pb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#9CA3AF]">VISUALIZATION CONSOLE CAPTURES</span>
              <span className="text-[9px] text-[#4B5563] font-mono">LIVE VECTOR ENGINE</span>
            </div>

            <div className="w-full h-36 bg-black/40 rounded border border-[#1F2937]/80 flex items-center justify-center p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
                <g stroke="#1F2937" strokeWidth="1">
                  <line x1="40" y1="20" x2="40" y2="170" />
                  <line x1="40" y1="170" x2="560" y2="170" />
                  <line x1="40" y1="95" x2="560" y2="95" strokeDasharray="3" />
                </g>
                <path 
                  d="M 40 150 Q 140 30, 240 130 T 460 50 E 560 70" 
                  fill="none" 
                  stroke={activePrice !== "0.00" ? '#10B981' : '#374151'} 
                  strokeWidth="2.5" 
                />
                {activePrice !== "0.00" && (
                  <>
                    <circle cx="240" cy="130" r="3.5" fill="#9CA3AF" />
                    <circle cx="460" cy="50" r="3.5" fill="#10B981" className="animate-ping" />
                  </>
                )}
              </svg>
              <div className="absolute bottom-1 right-2 text-[9px] text-[#4B5563]">ACTIVE_VIEWPORT: {activeTicker}</div>
            </div>
          </div>

          {viewMode === "expert" && (
            <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4 shadow-xl flex flex-col gap-2 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-[#1F2937] pb-2">
                <span className="text-[10px] font-bold text-[#F59E0B] tracking-wider">AMAZON BEDROCK ORCHESTRATION TRACE</span>
                <span className="text-[9px] bg-amber-950/40 border border-amber-900/30 text-amber-400 px-1 rounded font-mono">DEBUG</span>
              </div>
              
              <div className="flex-1 font-mono text-[11px] bg-[#030712] p-3 rounded border border-[#1F2937] space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span>⚡</span>
                    <span className="font-bold text-[#F3F4F6]">[Pre-Processing Node]</span>
                  </div>
                  <p className="text-[#9CA3AF] pl-4 text-[10px]">Intent mapped successfully to domain class rule: <code className="text-emerald-400">MarketData_ActionGroup</code></p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <span>🔄</span>
                    <span className="font-bold text-[#F3F4F6]">[Orchestration Handoff]</span>
                  </div>
                  <p className="text-[#9CA3AF] pl-4 text-[10px]">Intercepted <code className="text-amber-400">returnControl</code> token request signature.</p>
                  
                  <div className="pl-4 border-l border-[#1F2937] ml-1.5 py-1 text-[#4B5563] flex flex-col gap-0.5 text-[10px]">
                    <div>↳ Dispatch Target: <code className="text-[#9CA3AF]">/api/mcp</code> loopback link</div>
                    <div>↳ Active Param: <code className="text-emerald-400">{activeTicker}</code></div>
                    <div>↳ Telemetry status: <code className="text-emerald-400">200 OK Connection Clear</code></div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-[#1F2937]/60">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span>✅</span>
                    <span className="font-bold text-[#F3F4F6]">[Observation Feedback]</span>
                  </div>
                  <p className="text-[#9CA3AF] pl-4 text-[10px]">Context variables injected directly into <code className="text-[#9CA3AF]">sessionAttributes</code> tracker loops.</p>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}