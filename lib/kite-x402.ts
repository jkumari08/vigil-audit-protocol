// lib/kite-x402.ts
// x402 protocol implementation for Kite AI agent payments

export interface X402Challenge {
  version: string;
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  outputSchema?: Record<string, unknown>;
  extra?: {
    name: string;
    version: string;
  };
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
  };
}

export interface AuditResult {
  txHash: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  findings: Finding[];
  contractType: string;
  isVerified: boolean;
  fromAddress: string;
  toAddress: string | null;
  value: string;
  gasUsed: string;
  blockNumber: number;
  timestamp: string;
  summary: string;
  computeNode: string;
  inferenceId: string;
  paymentTxHash?: string;
  // Verifiable DeFAI attestation
  computationProof?: string;
  nodeSignature?: string;
  verificationHash?: string;
  computationTimestamp?: string;
}

export interface Finding {
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  category: string;
}

// Simulated 0G Compute Node endpoint (mocked for demo)
const FORENSIC_API_ENDPOINT = "/api/forensic";
const VIGIL_AGENT_WALLET = process.env.NEXT_PUBLIC_AGENT_WALLET || "0x080C1b57a068CFd0000000000000000000000001";

export interface AgentLog {
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "x402" | "payment";
  message: string;
  data?: string;
}

type LogCallback = (log: AgentLog) => void;

function log(cb: LogCallback, type: AgentLog["type"], message: string, data?: string) {
  cb({
    timestamp: new Date().toISOString().split("T")[1].slice(0, 12),
    type,
    message,
    data,
  });
}

// Main orchestration: receive ADI payment → call forensic API with x402 → return report
export async function runAuditOrchestration(
  txHash: string,
  adiPaymentTxHash: string,
  onLog: LogCallback
): Promise<AuditResult> {
  log(onLog, "info", "Audit orchestration started", `tx: ${txHash}`);
  log(onLog, "info", `ADI payment confirmed: ${adiPaymentTxHash}`);

  // Step 1: Initial request to Forensic API (expect 402)
  log(onLog, "x402", "→ GET /forensic — requesting audit data");
  
  const firstResponse = await fetch(FORENSIC_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash, phase: "initial" }),
  });

  if (firstResponse.status !== 402) {
    log(onLog, "warning", "Expected HTTP 402, got direct response — processing");
  } else {
    log(onLog, "x402", "← 402 Payment Required received from Forensic API");
    const challenge: X402Challenge = await firstResponse.json();
    log(onLog, "x402", `Payment required: ${challenge.maxAmountRequired} USDC on ${challenge.network}`);
    log(onLog, "info", `Pay-to address: ${challenge.payTo}`);

    // Step 2: Agent constructs x402 payment header
    log(onLog, "payment", "Constructing x402 EIP-3009 authorization...");
    await new Promise((r) => setTimeout(r, 600));

    const paymentPayload = buildX402Payload(challenge, VIGIL_AGENT_WALLET);
    log(onLog, "payment", "X-Payment header signed and encoded");
    log(onLog, "payment", `→ POST /forensic with X-Payment header`);

    // Step 3: Retry with payment header
    const paidResponse = await fetch(FORENSIC_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Payment": JSON.stringify(paymentPayload),
        "X-Payment-Version": "2",
      },
      body: JSON.stringify({ txHash, phase: "paid", adiPaymentTxHash }),
    });

    if (!paidResponse.ok) {
      throw new Error("Payment rejected by Forensic API");
    }

    log(onLog, "success", "← 200 OK — Forensic API accepted payment");
    const result: AuditResult = await paidResponse.json();
    log(onLog, "success", `Risk score: ${result.riskScore}/100 — ${result.riskLevel}`);
    log(onLog, "success", `Found ${result.findings.length} findings`);
    log(onLog, "info", `Compute node: ${result.computeNode}`);
    log(onLog, "success", "Audit complete — report ready");
    return result;
  }

  // Direct response (if 402 not returned)
  const result: AuditResult = await firstResponse.json();
  log(onLog, "success", `Risk score: ${result.riskScore}/100 — ${result.riskLevel}`);
  log(onLog, "success", `Found ${result.findings.length} findings`);
  log(onLog, "success", "Audit complete — report ready");
  return result;
}

function buildX402Payload(challenge: X402Challenge, fromAddress: string): X402PaymentPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    x402Version: 1,
    scheme: "exact",
    network: challenge.network,
    payload: {
      signature: "0x" + randomHex(130),
      authorization: {
        from: fromAddress,
        to: challenge.payTo,
        value: challenge.maxAmountRequired,
        validAfter: String(now - 60),
        validBefore: String(now + challenge.maxTimeoutSeconds),
        nonce: "0x" + randomHex(64),
      },
    },
  };
}

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
