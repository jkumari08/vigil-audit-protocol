// components/AgentLogs.tsx
import { useEffect, useRef } from "react";
import { AgentLog } from "@/lib/kite-x402";

interface AgentLogsProps {
  logs: AgentLog[];
  maxHeight?: string;
}

const typeStyles: Record<AgentLog["type"], string> = {
  info: "text-dim",
  success: "text-green-400",
  warning: "text-amber-400",
  error: "text-red-400",
  x402: "text-violet-400",
  payment: "text-blue-400",
};

const typePrefixes: Record<AgentLog["type"], string> = {
  info: "  ",
  success: "✓ ",
  warning: "⚠ ",
  error: "✗ ",
  x402: "⬡ ",
  payment: "$ ",
};

export default function AgentLogs({ logs, maxHeight = "280px" }: AgentLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-dim">AGENT LOGS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
        <span className="text-xs font-mono text-dim">{logs.length} entries</span>
      </div>
      <div
        ref={scrollRef}
        className="p-4 font-mono text-xs space-y-1 overflow-y-auto"
        style={{ maxHeight, backgroundColor: "#080809" }}
      >
        {logs.length === 0 ? (
          <div className="text-dim text-center py-8">
            <span className="animate-blink">_</span>
            <span className="text-dim ml-2">Waiting for audit request...</span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`flex gap-3 log-line-in leading-relaxed ${typeStyles[log.type]}`}>
              <span className="text-muted shrink-0">{log.timestamp}</span>
              <span className="shrink-0">{typePrefixes[log.type]}</span>
              <span>
                {log.message}
                {log.data && (
                  <span className="text-dim ml-2">({log.data})</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
