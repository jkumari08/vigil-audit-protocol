// components/AuditReport.tsx
import { AuditResult } from "@/lib/kite-x402";
import { Shield, AlertTriangle, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface AuditReportProps {
  result: AuditResult;
}

const riskColors = {
  LOW: "text-green-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-red-400",
  CRITICAL: "text-red-500",
};

const riskBg = {
  LOW: "bg-green-400/10 border-green-400/20",
  MEDIUM: "bg-amber-400/10 border-amber-400/20",
  HIGH: "bg-red-400/10 border-red-400/20",
  CRITICAL: "bg-red-500/10 border-red-500/20",
};

const severityColors = {
  INFO: "text-dim",
  LOW: "text-blue-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-red-400",
  CRITICAL: "text-red-500",
};

export default function AuditReport({ result }: AuditReportProps) {
  const riskColor = riskColors[result.riskLevel];
  const riskBgClass = riskBg[result.riskLevel];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Risk Score Header */}
      <div className={`card p-5 border ${riskBgClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono text-dim mb-1">RISK ASSESSMENT</div>
            <div className={`text-3xl font-display font-700 ${riskColor}`}>
              {result.riskLevel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-display font-800 text-text">{result.riskScore}</div>
            <div className="text-xs text-dim">/100</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full bg-surface rounded-full h-2 mb-4">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              result.riskScore < 25
                ? "bg-green-400"
                : result.riskScore < 50
                ? "bg-amber-400"
                : result.riskScore < 75
                ? "bg-red-400"
                : "bg-red-500"
            }`}
            style={{ width: `${result.riskScore}%` }}
          />
        </div>

        <p className="text-sm text-dim leading-relaxed">{result.summary}</p>
      </div>

      {/* TX Details */}
      <div className="card p-4">
        <div className="text-xs font-mono text-dim mb-3 uppercase tracking-wider">Transaction Details</div>
        <div className="space-y-2 text-xs">
          {[
            { label: "Hash", value: result.txHash, mono: true, truncate: true },
            { label: "Contract Type", value: result.contractType },
            { label: "From", value: result.fromAddress, mono: true, truncate: true },
            { label: "To", value: result.toAddress || "Contract Creation", mono: true, truncate: true },
            { label: "Value", value: result.value },
            { label: "Gas Used", value: parseInt(result.gasUsed).toLocaleString() },
            { label: "Block", value: result.blockNumber.toLocaleString() },
            { label: "Verified", value: result.isVerified ? "Yes ✓" : "No" },
            { label: "Timestamp", value: new Date(result.timestamp).toLocaleString() },
          ].map(({ label, value, mono, truncate }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-dim shrink-0">{label}</span>
              <span
                className={`${mono ? "font-mono" : ""} ${
                  label === "Verified"
                    ? result.isVerified
                      ? "text-green-400"
                      : "text-amber-400"
                    : "text-text"
                } ${truncate ? "truncate max-w-xs" : ""}`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Findings */}
      <div className="card p-4">
        <div className="text-xs font-mono text-dim mb-3 uppercase tracking-wider">
          Findings ({result.findings.length})
        </div>
        <div className="space-y-3">
          {result.findings.map((finding, i) => (
            <div key={i} className="flex gap-3 p-3 bg-bg rounded-lg">
              <div className="mt-0.5">
                {finding.severity === "INFO" || finding.severity === "LOW" ? (
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                ) : finding.severity === "MEDIUM" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text">{finding.title}</span>
                  <span className={`text-[10px] font-mono ${severityColors[finding.severity]}`}>
                    {finding.severity}
                  </span>
                </div>
                <p className="text-xs text-dim leading-relaxed">{finding.description}</p>
                <span className="text-[10px] text-muted mt-1 inline-block">{finding.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compute Attribution */}
      <div className="card p-4">
        <div className="text-xs font-mono text-dim mb-3 uppercase tracking-wider">0G Compute Attribution</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-dim">Compute Node</span>
            <span className="font-mono text-violet-400">{result.computeNode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-dim">Inference ID</span>
            <span className="font-mono text-text">{result.inferenceId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-dim">Verification</span>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-400" />
              <span className="text-green-400">Decentralized & Verifiable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verifiable DeFAI Attestation */}
      {result.verificationHash && (
        <div className="card p-4 border border-green-400/20 bg-green-400/5">
          <div className="text-xs font-mono text-dim mb-3 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            Verifiable DeFAI Attestation
          </div>
          <div className="space-y-2 text-xs">
            {result.computationProof && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-dim shrink-0">Computation Proof</span>
                <span className="font-mono text-green-400 text-right truncate max-w-xs">{result.computationProof}</span>
              </div>
            )}
            {result.verificationHash && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-dim shrink-0">Verification Hash</span>
                <span className="font-mono text-green-400 text-right truncate max-w-xs">{result.verificationHash}</span>
              </div>
            )}
            {result.nodeSignature && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-dim shrink-0">Node Signature</span>
                <span className="font-mono text-green-400 text-right truncate max-w-xs">{result.nodeSignature.slice(0, 32)}...</span>
              </div>
            )}
            {result.computationTimestamp && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-dim shrink-0">Computed At</span>
                <span className="font-mono text-text">{new Date(result.computationTimestamp).toLocaleTimeString()}</span>
              </div>
            )}
            <p className="text-[10px] text-dim mt-2">
              This audit was computed on a decentralized 0G Compute Node and cryptographically attested. Results cannot be tampered with without invalidating the verification hash.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
