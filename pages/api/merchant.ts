// pages/api/merchant.ts
import type { NextApiRequest, NextApiResponse } from "next";

// In-memory merchant config (use DB in production)
let merchantConfig: Record<string, unknown> | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ config: merchantConfig });
  }

  if (req.method === "POST") {
    const { businessName, receivingAddress, settlementToken, pricingCurrency, webhookUrl } = req.body;

    if (!businessName || !receivingAddress) {
      return res.status(400).json({ error: "businessName and receivingAddress required" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(receivingAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    merchantConfig = {
      businessName,
      receivingAddress,
      settlementToken: settlementToken || "ADI",
      pricingCurrency: pricingCurrency || "USD",
      webhookUrl: webhookUrl || null,
      createdAt: new Date().toISOString(),
      embedCode: generateEmbedCode(receivingAddress, settlementToken || "ADI", pricingCurrency || "USD"),
    };

    return res.status(200).json({ ok: true, config: merchantConfig });
  }

  res.status(405).json({ error: "Method not allowed" });
}

function generateEmbedCode(address: string, token: string, currency: string): string {
  return `<!-- Vigil ADI Payment Widget -->
<script src="https://vigil.app/widget.js"></script>
<div 
  id="vigil-payment"
  data-address="${address}"
  data-token="${token}"
  data-currency="${currency}"
  data-amount="1"
></div>
<script>Vigil.mount('#vigil-payment');</script>`;
}
