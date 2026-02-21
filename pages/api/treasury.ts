// pages/api/treasury.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getTreasuryState, recordADIIncome } from "@/lib/treasury-store";

const ADI_PRICE_USD = 0.42; // Mock price; in prod fetch from CoinGecko

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const state = getTreasuryState();
    const netPL = state.revenue - state.infraCost;
    const margin = state.revenue > 0 ? ((netPL / state.revenue) * 100).toFixed(1) : "0.0";

    return res.status(200).json({
      ...state,
      netPL,
      margin,
      adiPriceUSD: ADI_PRICE_USD,
      agentWallet: process.env.AGENT_WALLET || "0x080C1b57a068CFd0000000000000000000000001",
      builderCode: "0x80218021802180218021802180218021",
      appCode: "bc_1a931pe1",
      schemaId: "0x00",
      builderCodeStatus: "ACTIVE",
      ethBalance: 0.005,
      ethUSD: 16.0,
    });
  }

  if (req.method === "POST") {
    // Called after ADI payment confirmed
    const { amountADI, fromAddress, txHash } = req.body;
    if (!amountADI || !fromAddress) {
      return res.status(400).json({ error: "amountADI and fromAddress required" });
    }
    recordADIIncome(parseFloat(amountADI), ADI_PRICE_USD, fromAddress, txHash);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
