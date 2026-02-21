// pages/terminal.tsx
import { useState, useCallback } from "react";
import { Search, AlertCircle } from "lucide-react";
import ADIPayment from "@/components/ADIPayment";
import AgentLogs from "@/components/AgentLogs";
import AuditReport from "@/components/AuditReport";
import { runAuditOrchestration, AuditResult, AgentLog } from "@/lib/kite-x402";

type Phase = "input" | "payment" | "auditing" | "done" | "error";

// Example tx hashes to help users test
const EXAMPLE_TXS = [
  "0xd5ef5ba9fcba03c55d35cf7b02d0bfba4a37ea1c3d2e8f19a7b6c8d4e5f21a3b",
  "0xa1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  "0x7f8e9d0c1b2a3456789012345678901234567890123456789012345678901234cd",
];

export default function TerminalPage() {
  const [txHash, setTxHash] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [adiPaymentTx, setAdiPaymentTx] = useState("");
  const [fromAddr, setFromAddr] = useState("");

  const addLog = useCallback((log: AgentLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const validateHash = (h: string) => /^0x[a-fA-F0-9]{64}$/.test(h);

  const handleSubmit = () => {
    if (!validateHash(txHash.trim())) {
      setError("Invalid transaction hash. Must be 0x followed by 64 hex characters.");
      return;
    }
    setError("");
    setPhase("payment");
    setLogs([]);
    setResult(null);
  };

  const handlePaymentSuccess = async (adiTx: string, from: string) => {
    setAdiPaymentTx(adiTx);
    setFromAddr(from);
    setPhase("auditing");

    // Notify backend to record ADI income
    try {
      const auditResponse = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: txHash.trim(),
          adiPaymentTxHash: adiTx,
          fromAddress: from,
        }),
      });
      if (!auditResponse.ok) {
        addLog({ timestamp: new Date().toLocaleTimeString(), type: "error", message: `ADI recording failed: ${auditResponse.status}` });
      }
    } catch (err) {
      addLog({ timestamp: new Date().toLocaleTimeString(), type: "error", message: `Failed to record ADI payment: ${(err as Error).message}` });
    }

    // Run the x402 orchestration
    try {
      const auditResult = await runAuditOrchestration(
        txHash.trim(),
        adiTx,
        addLog
      );
      setResult(auditResult);
      setPhase("done");
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Audit failed");
      addLog({ timestamp: new Date().toLocaleTimeString(), type: "error", message: `Orchestration error: ${err.message}` });
      setPhase("error");
    }
  };

  const reset = () => {
    setPhase("input");
    setTxHash("");
    setLogs([]);
    setResult(null);
    setError("");
    setAdiPaymentTx("");
    setFromAddr("");
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-700 text-3xl text-text mb-2">Audit Terminal</h1>
        <p className="text-dim text-sm">
          Submit a transaction hash. Pay 1 ADI to unlock AI forensic analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Input + Payment */}
        <div className="lg:col-span-2 space-y-4">
          {/* TX Hash input */}
          <div className="card p-5">
            <label className="block text-xs font-mono text-dim mb-2 uppercase tracking-wider">
              Transaction Hash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                disabled={phase !== "input"}
                className="flex-1 px-3 py-2.5 rounded-lg bg-bg border border-border text-text text-xs font-mono placeholder:text-muted focus:border-green-400 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && phase === "input" && handleSubmit()}
              />
              {phase === "input" && (
                <button
                  onClick={handleSubmit}
                  className="px-3 py-2.5 rounded-lg bg-green-400 text-bg hover:bg-green-300 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {error && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {phase === "input" && (
              <div className="mt-3">
                <div className="text-[10px] text-dim mb-1.5">Example hashes for testing:</div>
                <div className="space-y-1">
                  {EXAMPLE_TXS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTxHash(ex)}
                      className="block w-full text-left text-[10px] font-mono text-muted hover:text-text truncate transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment widget */}
          {(phase === "payment" || phase === "auditing" || phase === "done" || phase === "error") && (
            <ADIPayment
              txHashToAudit={txHash.trim()}
              onSuccess={handlePaymentSuccess}
              onError={(e) => {
                setError(e);
                setPhase("error");
              }}
              disabled={phase !== "payment"}
            />
          )}

          {/* Workflow status */}
          {phase !== "input" && (
            <div className="card p-4">
              <div className="text-xs font-mono text-dim mb-3 uppercase tracking-wider">Workflow</div>
              <div className="space-y-2">
                {[
                  { label: "TX Submitted", done: true },
                  { label: "ADI Payment", done: phase !== "payment" },
                  { label: "x402 Handshake", done: phase === "done" },
                  { label: "AI Inference", done: phase === "done" },
                  { label: "Report Generated", done: phase === "done" },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        done
                          ? "bg-green-400 border-green-400"
                          : phase === "auditing" && label !== "TX Submitted" && label !== "ADI Payment"
                          ? "border-green-400/50 animate-pulse"
                          : "border-muted"
                      }`}
                    >
                      {done && (
                        <svg className="w-2 h-2 text-bg" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7z" />
                        </svg>
                      )}
                    </div>
                    <span className={done ? "text-text" : "text-dim"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset button */}
          {(phase === "done" || phase === "error") && (
            <button
              onClick={reset}
              className="w-full py-2.5 rounded-lg border border-border text-dim hover:text-text hover:border-muted transition-colors text-sm font-medium"
            >
              New Audit
            </button>
          )}
        </div>

        {/* Right column: Logs + Report */}
        <div className="lg:col-span-3 space-y-4">
          <AgentLogs logs={logs} maxHeight="320px" />
          {result && <AuditReport result={result} />}
        </div>
      </div>
    </div>
  );
}
