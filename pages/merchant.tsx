// pages/merchant.tsx
import { useState, useEffect } from "react";
import { CheckCircle, Code, Copy, RefreshCw, Info } from "lucide-react";

interface MerchantConfig {
  businessName: string;
  receivingAddress: string;
  settlementToken: "ADI" | "USDC";
  pricingCurrency: "USD" | "AED";
  webhookUrl: string;
  embedCode?: string;
}

interface ConversionResult {
  fiat: number;
  currency: string;
  adi: number;
  adiPrice: number;
  timestamp: string;
}

const ADI_PRICE_USD = 0.42;
const AED_TO_USD = 0.272;

function fiatToADI(amount: number, currency: string): ConversionResult {
  const usdAmount = currency === "AED" ? amount * AED_TO_USD : amount;
  const adiAmount = usdAmount / ADI_PRICE_USD;
  return {
    fiat: amount,
    currency,
    adi: adiAmount,
    adiPrice: ADI_PRICE_USD,
    timestamp: new Date().toLocaleTimeString(),
  };
}

export default function MerchantPage() {
  const [config, setConfig] = useState<MerchantConfig>({
    businessName: "",
    receivingAddress: "",
    settlementToken: "ADI",
    pricingCurrency: "USD",
    webhookUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [conversionAmount, setConversionAmount] = useState("10.00");
  const [conversion, setConversion] = useState<ConversionResult | null>(null);

  // Checklist state
  const checklist = [
    { label: "Business name configured", done: config.businessName.length > 0 },
    { label: "Receiving address set", done: /^0x[a-fA-F0-9]{40}$/.test(config.receivingAddress) },
    { label: "Settlement token selected", done: true },
    { label: "Pricing currency selected", done: true },
    { label: "Configuration saved", done: saved },
    { label: "Webhook configured (optional)", done: config.webhookUrl.length > 0 },
    { label: "Embed code integrated", done: showEmbed && saved },
  ];

  // Load saved config
  useEffect(() => {
    fetch("/api/merchant")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          const c = data.config;
          setConfig({
            businessName: c.businessName || "",
            receivingAddress: c.receivingAddress || "",
            settlementToken: c.settlementToken || "ADI",
            pricingCurrency: c.pricingCurrency || "USD",
            webhookUrl: c.webhookUrl || "",
          });
          if (c.embedCode) setEmbedCode(c.embedCode);
          setSaved(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.config?.embedCode) setEmbedCode(data.config.embedCode);
      setSaved(true);
    } catch (e: unknown) {
      const err = e as Error;
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = () => {
    const amt = parseFloat(conversionAmount);
    if (!isNaN(amt) && amt > 0) {
      setConversion(fiatToADI(amt, config.pricingCurrency));
    }
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSave =
    config.businessName.length > 0 &&
    /^0x[a-fA-F0-9]{40}$/.test(config.receivingAddress);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-700 text-3xl text-text mb-2">Merchant Setup</h1>
        <p className="text-dim text-sm">
          Configure payment acceptance on ADI Chain. Accept payments in AED or USD, settle in $ADI or ERC-20 tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-6">
            <h2 className="font-display font-600 text-text mb-5">Configuration</h2>
            <div className="space-y-4">
              {/* Business Name */}
              <div>
                <label className="block text-xs text-dim mb-1.5">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => { setConfig(c => ({ ...c, businessName: e.target.value })); setSaved(false); }}
                  placeholder="Your business name"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-muted focus:border-green-400 transition-colors"
                />
              </div>

              {/* Receiving Address */}
              <div>
                <label className="block text-xs text-dim mb-1.5">
                  Receiving Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.receivingAddress}
                  onChange={(e) => { setConfig(c => ({ ...c, receivingAddress: e.target.value })); setSaved(false); }}
                  placeholder="0x..."
                  className={`w-full px-3 py-2.5 rounded-lg bg-bg border text-text text-sm font-mono placeholder:text-muted focus:border-green-400 transition-colors ${
                    config.receivingAddress && !/^0x[a-fA-F0-9]{40}$/.test(config.receivingAddress)
                      ? "border-red-400/50"
                      : "border-border"
                  }`}
                />
                {config.receivingAddress && !/^0x[a-fA-F0-9]{40}$/.test(config.receivingAddress) && (
                  <p className="text-xs text-red-400 mt-1">Invalid Ethereum address format</p>
                )}
              </div>

              {/* Settlement Token */}
              <div>
                <label className="block text-xs text-dim mb-2">Settlement Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["ADI", "USDC"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setConfig(c => ({ ...c, settlementToken: t })); setSaved(false); }}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        config.settlementToken === t
                          ? "bg-text text-bg"
                          : "bg-bg border border-border text-dim hover:border-muted"
                      }`}
                    >
                      {t === "ADI" ? "ADI (Native)" : "USDC (ERC-20)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Currency */}
              <div>
                <label className="block text-xs text-dim mb-2">Pricing Currency</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["USD", "AED"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setConfig(cfg => ({ ...cfg, pricingCurrency: c })); setSaved(false); }}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        config.pricingCurrency === c
                          ? "bg-text text-bg"
                          : "bg-bg border border-border text-dim hover:border-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Webhook */}
              <div>
                <label className="block text-xs text-dim mb-1.5">Webhook URL (optional)</label>
                <input
                  type="text"
                  value={config.webhookUrl}
                  onChange={(e) => { setConfig(c => ({ ...c, webhookUrl: e.target.value })); setSaved(false); }}
                  placeholder="https://your-api.com/payment-webhook"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-muted focus:border-green-400 transition-colors"
                />
              </div>

              {/* Save button */}
              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="w-full py-2.5 rounded-lg bg-green-400 text-bg font-semibold text-sm hover:bg-green-300 transition-colors disabled:opacity-40"
              >
                {saving ? "Saving..." : saved ? "Configuration Saved ✓" : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Price Conversion Test */}
          <div className="card p-5">
            <h3 className="font-display font-600 text-text mb-4">Price Conversion Test</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={conversionAmount}
                onChange={(e) => setConversionAmount(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg bg-bg border border-border text-text text-sm font-mono focus:border-green-400"
              />
              <div className="px-3 py-2.5 rounded-lg bg-bg border border-border text-dim text-sm font-mono">
                {config.pricingCurrency}
              </div>
              <button
                onClick={handleConvert}
                className="px-4 py-2.5 rounded-lg bg-text text-bg font-medium text-sm hover:bg-text/90 transition-colors"
              >
                Convert
              </button>
            </div>
            {conversion && (
              <div className="bg-bg rounded-lg p-3 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-dim">Input</span>
                  <span className="text-text">{conversion.fiat.toFixed(2)} {conversion.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">$ADI price</span>
                  <span className="text-text">${conversion.adiPrice}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-dim">You receive</span>
                  <span className="text-green-400 font-medium">{conversion.adi.toFixed(4)} ADI</span>
                </div>
                <div className="text-[10px] text-muted">Calculated at {conversion.timestamp}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Embed + Checklist */}
        <div className="lg:col-span-2 space-y-4">
          {/* Embed Code */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-600 text-text">Embed Code</h3>
              {saved && (
                <button
                  onClick={() => setShowEmbed(!showEmbed)}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  {showEmbed ? "Hide" : "Show"}
                </button>
              )}
            </div>
            {!saved ? (
              <p className="text-xs text-dim">Save your configuration first to generate embed code.</p>
            ) : showEmbed ? (
              <div>
                <div className="relative">
                  <pre className="bg-bg rounded-lg p-3 text-[10px] font-mono text-dim overflow-auto max-h-40 leading-relaxed whitespace-pre-wrap">
                    {embedCode}
                  </pre>
                  <button
                    onClick={handleCopyEmbed}
                    className="absolute top-2 right-2 p-1.5 rounded bg-surface border border-border text-dim hover:text-text transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                {copied && <p className="text-xs text-green-400 mt-1">Copied!</p>}
              </div>
            ) : (
              <p className="text-xs text-dim">Click Show to view your embed code.</p>
            )}
          </div>

          {/* Integration Checklist */}
          <div className="card p-5">
            <h3 className="font-display font-600 text-text mb-4">Integration Checklist</h3>
            <div className="space-y-2.5">
              {checklist.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      done ? "bg-green-400 border-green-400" : "border-muted"
                    }`}
                  >
                    {done && (
                      <svg className="w-2.5 h-2.5 text-bg" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7z" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${done ? "text-text" : "text-dim"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
