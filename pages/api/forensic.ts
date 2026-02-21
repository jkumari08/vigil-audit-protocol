// pages/api/forensic.ts
// Simulates the 0G Compute Node forensic API with x402 payment gating

import type { NextApiRequest, NextApiResponse } from "next";
import { recordX402Payment } from "@/lib/treasury-store";
import { createHash } from "crypto";
import type { AuditResult } from "@/lib/kite-x402";

const COMPUTE_NODE_WALLET = "0x0g-compute-node-vigil-audit";
const X402_AMOUNT = "0.01"; // USDC per audit

// Simulate blockchain TX lookup
async function fetchTxData(txHash: string): Promise<Partial<AuditResult>> {
  // In production, query Base/ETH RPC or Etherscan API
  // For demo: generate realistic mock data based on hash
  const seed = parseInt(txHash.slice(2, 10), 16);
  const rng = (max: number) => Math.abs((seed * 1664525 + 1013904223) % max);

  const riskScore = rng(100);
  const findings = generateFindings(riskScore, seed);

  const contractTypes = [
    "ERC-20 Token Transfer",
    "Uniswap V3 Swap",
    "ERC-721 NFT Mint",
    "Contract Deployment",
    "DeFi Vault Deposit",
    "Cross-chain Bridge",
    "DEX Aggregator",
    "Staking Contract",
    "DAO Vote",
    "Multisig Execution",
  ];

  const blockBase = 22000000 + rng(1000000);
  
  // Generate verifiable computation attestation
  const computationTimestamp = new Date().toISOString();
  const computationData = JSON.stringify({ txHash, riskScore, findings, timestamp: computationTimestamp });
  const verificationHash = "0x" + createHash("sha256").update(computationData).digest("hex");
  const computationProof = "0g-proof:" + txHash.slice(2, 20) + "-" + riskScore.toString(16).padStart(4, "0");
  const nodeSignature = "0x" + createHash("sha256").update(computationProof + COMPUTE_NODE_WALLET).digest("hex").slice(0, 128);

  return {
    txHash,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    findings,
    contractType: contractTypes[rng(contractTypes.length)],
    isVerified: rng(2) === 1,
    fromAddress: "0x" + txHash.slice(2, 42),
    toAddress: rng(10) > 1 ? "0x" + txHash.slice(20, 60) : null,
    value: (rng(1000) / 100).toFixed(4) + " ETH",
    gasUsed: (21000 + rng(200000)).toString(),
    blockNumber: blockBase,
    timestamp: new Date(Date.now() - rng(86400000)).toISOString(),
    summary: generateSummary(riskScore, findings),
    computeNode: "0g-compute-node-vigil-audit",
    inferenceId: "inf_" + txHash.slice(2, 18),
    // Verifiable DeFAI attestation
    computationProof,
    nodeSignature,
    verificationHash,
    computationTimestamp,
  };
}

function getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score < 25) return "LOW";
  if (score < 50) return "MEDIUM";
  if (score < 75) return "HIGH";
  return "CRITICAL";
}

function generateFindings(riskScore: number, seed: number) {
  const allFindings = [
    {
      severity: "INFO" as const,
      title: "Standard ERC-20 Transfer",
      description: "Transaction follows standard token transfer patterns with no anomalies.",
      category: "Token Movement",
    },
    {
      severity: "LOW" as const,
      title: "High Gas Price",
      description: "Transaction paid above-average gas, possibly front-running attempt.",
      category: "MEV",
    },
    {
      severity: "LOW" as const,
      title: "New Contract Interaction",
      description: "Contract was deployed less than 30 days ago with limited transaction history.",
      category: "Contract Age",
    },
    {
      severity: "MEDIUM" as const,
      title: "Unusual Value Transfer Pattern",
      description: "Value split across multiple hops suggesting potential mixer usage.",
      category: "Money Flow",
    },
    {
      severity: "MEDIUM" as const,
      title: "Unverified Contract",
      description: "Target contract source code not verified on Etherscan.",
      category: "Contract Verification",
    },
    {
      severity: "HIGH" as const,
      title: "Flash Loan Origin",
      description: "Funds originated from a flash loan, increasing manipulation risk.",
      category: "Flash Loan",
    },
    {
      severity: "HIGH" as const,
      title: "Tornado Cash Interaction",
      description: "Address has prior interaction with Tornado Cash within 90 days.",
      category: "Sanctions",
    },
    {
      severity: "CRITICAL" as const,
      title: "Known Exploit Pattern",
      description: "Transaction pattern matches signatures from previously exploited protocols.",
      category: "Exploit Pattern",
    },
    {
      severity: "CRITICAL" as const,
      title: "Reentrancy Attack Signature",
      description: "Call stack depth and callback patterns match known reentrancy exploits.",
      category: "Smart Contract Exploit",
    },
  ];

  const count = riskScore < 25 ? 1 : riskScore < 50 ? 2 : riskScore < 75 ? 3 : 4;
  const shuffled = allFindings.sort(() => ((seed * 16807) % 100) / 100 - 0.5);
  return shuffled.slice(0, count);
}

function generateSummary(score: number, findings: ReturnType<typeof generateFindings>): string {
  if (score < 25) {
    return "Transaction appears normal. No significant risk indicators detected. Standard blockchain activity with expected patterns.";
  }
  if (score < 50) {
    return `Transaction shows ${findings.length} minor concern(s). Exercise standard due diligence before interacting with involved addresses.`;
  }
  if (score < 75) {
    return `Transaction exhibits elevated risk patterns. ${findings.length} issues identified including suspicious fund flows. Recommend caution.`;
  }
  return `HIGH ALERT: Transaction matches known exploit/attack patterns. ${findings.length} critical issues. Do NOT interact with involved addresses.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { txHash, phase } = req.body;

  if (!txHash) {
    return res.status(400).json({ error: "txHash required" });
  }

  // Validate tx hash format
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(400).json({ error: "Invalid transaction hash format. Must be 0x + 64 hex chars." });
  }

  console.log(`[Forensic API] Phase: ${phase}, TxHash: ${txHash}`);

  // Phase 1: Return 402 Payment Required
  if (phase === "initial") {
    console.log("[Forensic API] Returning 402 challenge");
    const challenge = {
      version: "2",
      scheme: "exact",
      network: "base-mainnet",
      maxAmountRequired: X402_AMOUNT,
      resource: `${req.headers.host}/api/forensic`,
      description: "AI forensic analysis of on-chain transaction — powered by 0G Compute Network",
      mimeType: "application/json",
      payTo: "0x0g-compute-node-vigil-audit-protocol",
      maxTimeoutSeconds: 300,
      asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      extra: {
        name: "Vigil Forensic API",
        version: "1.0.0",
      },
    };
    return res.status(402).json(challenge);
  }

  // Phase 2: Verify X-Payment header and return result
  if (phase === "paid") {
    console.log("[Forensic API] Handling paid phase");
    const paymentHeader = req.headers["x-payment"];
    console.log("[Forensic API] X-Payment header present:", !!paymentHeader);
    
    if (!paymentHeader) {
      console.log("[Forensic API] Missing X-Payment header, returning 402");
      return res.status(402).json({ error: "X-Payment header required" });
    }

    let payment;
    try {
      payment = JSON.parse(paymentHeader as string);
      console.log("[Forensic API] X-Payment header parsed successfully");
    } catch (e) {
      console.log("[Forensic API] Failed to parse X-Payment header:", (e as Error).message);
      return res.status(400).json({ error: "Invalid X-Payment header" });
    }

    // Validate payment structure
    if (!payment.payload?.authorization?.from) {
      console.log("[Forensic API] Invalid payment authorization structure");
      return res.status(402).json({ error: "Invalid payment authorization" });
    }

    // Record the payment in treasury
    const paymentTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log("[Forensic API] Recording x402 payment:", paymentTxHash);
    recordX402Payment(
      parseFloat(X402_AMOUNT),
      COMPUTE_NODE_WALLET,
      paymentTxHash
    );
    console.log("[Forensic API] X402 payment recorded");

    // Run the forensic analysis
    const result = await fetchTxData(txHash);
    result.paymentTxHash = paymentTxHash;
    console.log("[Forensic API] Returning audit result");

    return res.status(200).json(result);
  }

  // Direct phase (no 402 flow)
  const result = await fetchTxData(txHash);
  return res.status(200).json(result);
}
