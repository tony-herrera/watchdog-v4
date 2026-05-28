"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. Add user's message to the chat window immediately
    const userMessage = { role: "user" as const, text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Send the message to our Fargate/Next.js API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.text }),
      });

      const data = await response.json();

      // 3. Add Bedrock's response to the chat window
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 font-mono p-8 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-6 tracking-tight">
          Watchdog V4: Institutional Research Desk
        </h1>

        {/* Chat Window */}
        <div className="h-96 overflow-y-auto border border-zinc-800 bg-black rounded p-4 mb-4 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center mt-10">
              System Online. Awaiting command...
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-emerald-900/30 text-emerald-300 self-end border border-emerald-800/50"
                    : "bg-zinc-800 text-zinc-300 self-start border border-zinc-700"
                }`}
              >
                <span className="text-xs opacity-50 block mb-1">
                  {msg.role === "user" ? "YOU" : "AGENT"}
                </span>
                {msg.text}
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-emerald-500 text-sm animate-pulse self-start">
              Analyzing...
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
            placeholder="E.g., 'Check NVDA and send an alert'"
            className="flex-1 bg-black border border-zinc-700 rounded px-4 py-2 text-zinc-300 focus:outline-none focus:border-emerald-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-6 py-2 rounded transition-colors disabled:opacity-50"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
}