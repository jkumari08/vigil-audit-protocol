// pages/api/audit.ts
// Main audit endpoint: called after ADI payment confirmed on frontend

import type { NextApiRequest, NextApiResponse } from "next";
import { recordADIIncome } from "@/lib/treasury-store";

const ADI_PRICE_USD = 0.42;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { txHash, adiPaymentTxHash, fromAddress } = req.body;

  console.log("[Audit API] Received request:", { txHash, adiPaymentTxHash, fromAddress });

  if (!txHash || !adiPaymentTxHash) {
    console.log("[Audit API] Missing required fields");
    return res.status(400).json({ error: "txHash and adiPaymentTxHash required" });
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    console.log("[Audit API] Invalid txHash format:", txHash);
    return res.status(400).json({ error: "Invalid transaction hash" });
  }

  // Record ADI income
  console.log("[Audit API] Calling recordADIIncome with:", { amount: 1.0, price: ADI_PRICE_USD, from: fromAddress || "unknown", txHash: adiPaymentTxHash });
  recordADIIncome(1.0, ADI_PRICE_USD, fromAddress || "unknown", adiPaymentTxHash);
  console.log("[Audit API] ADI income recorded successfully");

  // Return orchestration initiation — frontend calls /api/forensic directly
  return res.status(200).json({
    ok: true,
    message: "Payment recorded. Proceeding with x402 forensic flow.",
    adiRecorded: true,
  });
}
