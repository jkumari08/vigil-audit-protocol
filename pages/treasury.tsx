// pages/treasury.tsx
import { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Shield } from "lucide-react";

interface TreasuryData {
  revenue: number;
  infraCost: number;
  netPL: number;
  margin: string;
  audits: number;
  adiBalance: number;
  usdcBalance: number;
  ethBalance: number;
  ethUSD: number;
  adiPriceUSD: number;
  agentWallet: string;
  builderCode: string;
  appCode: string;
  schemaId: string;
  builderCodeStatus: string;
  transactions: {
    id: string;
    time: string;
    type: "IN" | "OUT";
    amount: string;
    token: string;
    network: string;
    counterparty: string;
    memo: string;
    txHash?: string;
  }[];
}

function shortenAddr(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function TreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/treasury");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-center h-64">
        <div className="text-dim font-mono text-sm">Loading treasury...</div>
      </div>
    );
  }

  if (!data) return null;

  const netPositive = data.netPL >= 0;
  const adiUSD = data.adiBalance * data.adiPriceUSD;
  const totalBalance = adiUSD + data.usdcBalance + data.ethUSD;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-700 text-3xl text-text mb-2">Treasury</h1>
          <p className="text-dim text-sm">Agent revenue and infrastructure spend across ADI Testnet and Base</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-dim mb-1">AGENT WALLET</div>
          <div className="font-mono text-xs text-text bg-surface border border-border px-3 py-1.5 rounded-lg">
            {shortenAddr(data.agentWallet)}
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Revenue", value: `${data.revenue.toFixed(2)} USD`, color: "text-green-400" },
          {
            label: "Infra Cost",
            value: `${data.infraCost.toFixed(4)} USDC`,
            color: "text-red-400",
          },
          {
            label: "Net P/L",
            value: `${netPositive ? "+" : ""}$${data.netPL.toFixed(2)}`,
            color: netPositive ? "text-green-400" : "text-red-400",
          },
          { label: "Audits", value: data.audits.toString(), color: "text-text" },
          { label: "ADI Balance", value: `${data.adiBalance.toFixed(2)} ADI`, color: "text-text" },
          {
            label: "USDC Balance",
            value: `${data.usdcBalance.toFixed(4)} USDC`,
            color: "text-text",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-dim mb-1">{label}</div>
            <div className={`font-display font-600 text-sm ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Per-Audit Economics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-display font-600 text-text mb-5">Per-Audit Economics</h2>
            <div className="space-y-4">
              {/* Revenue bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-dim">Revenue (1 ADI)</span>
                  <span className="text-text">${data.adiPriceUSD.toFixed(2)}</span>
                </div>
                <div className="w-full bg-bg rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

              {/* x402 Compute */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-dim">x402 Compute</span>
                  <span className="text-text">$0.01</span>
                </div>
                <div className="w-full bg-bg rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${(0.01 / data.adiPriceUSD) * 100}%` }}
                  />
                </div>
              </div>

              {/* Gas */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-dim">Gas (est.)</span>
                  <span className="text-text">$0.002</span>
                </div>
                <div className="w-full bg-bg rounded-full h-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full"
                    style={{ width: `${(0.002 / data.adiPriceUSD) * 100}%` }}
                  />
                </div>
              </div>

              {/* Net margin */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm text-dim">Net Margin</span>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-display font-700 text-green-400">
                    ${(data.adiPriceUSD - 0.012).toFixed(3)} ({data.margin}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ERC-8021 Builder Code */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-600 text-text">ERC-8021 Builder Code</h2>
              <span className="badge-green text-[10px] font-mono px-2 py-0.5 rounded">
                {data.builderCodeStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-dim mb-1">App Code</div>
                <div className="font-mono text-text">{data.appCode}</div>
              </div>
              <div>
                <div className="text-dim mb-1">Schema ID</div>
                <div className="font-mono text-text">{data.schemaId}</div>
              </div>
              <div>
                <div className="text-dim mb-1">Marker</div>
                <div className="font-mono text-text truncate">{data.builderCode.slice(0, 12)}...{data.builderCode.slice(-4)}</div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-bg rounded text-[10px] font-mono text-dim break-all">
              {data.builderCode}
            </div>
            <p className="text-[10px] text-dim mt-2">
              Appended to every on-chain transaction by the Vigil agent for ERC-8021 compliance.
            </p>
          </div>

          {/* Transaction Ledger */}
          <div className="card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-600 text-text">Transaction Ledger</h2>
              <span className="text-xs text-dim">{data.transactions.length} transactions</span>
            </div>
            {data.transactions.length === 0 ? (
              <div className="px-5 py-10 text-center text-dim text-sm">
                No transactions yet. Run an audit to see activity.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {["TIME", "TYPE", "AMOUNT", "TOKEN", "NETWORK", "COUNTERPARTY", "MEMO"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-mono text-dim font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-dim">{tx.time}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              tx.type === "IN" ? "badge-green" : "badge-red"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 font-mono font-medium ${
                            tx.type === "IN" ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {tx.amount}
                        </td>
                        <td className="px-4 py-3 font-mono text-text">{tx.token}</td>
                        <td className="px-4 py-3 text-dim">{tx.network}</td>
                        <td className="px-4 py-3 font-mono text-dim">{shortenAddr(tx.counterparty)}</td>
                        <td className="px-4 py-3 text-dim">{tx.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Balances sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display font-600 text-text mb-4">Balances</h2>
            <div className="space-y-3">
              {[
                {
                  symbol: "A",
                  name: "ADI",
                  sub: "ADI Token",
                  amount: data.adiBalance.toFixed(2),
                  usd: `$${adiUSD.toFixed(2)}`,
                  color: "bg-amber-400/10 text-amber-400",
                },
                {
                  symbol: "U",
                  name: "USDC",
                  sub: "USD Coin",
                  amount: data.usdcBalance.toFixed(4),
                  usd: `$${data.usdcBalance.toFixed(4)}`,
                  color: "bg-blue-400/10 text-blue-400",
                },
                {
                  symbol: "E",
                  name: "ETH",
                  sub: "Ether",
                  amount: data.ethBalance.toFixed(4),
                  usd: `$${data.ethUSD.toFixed(2)}`,
                  color: "bg-violet-400/10 text-violet-400",
                },
              ].map((b) => (
                <div key={b.name} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-medium ${b.color}`}
                  >
                    {b.symbol}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text">{b.name}</span>
                      <span className="text-sm font-mono text-text">{b.amount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dim">{b.sub}</span>
                      <span className="text-xs text-dim">{b.usd}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-dim">Total</span>
                <span className="font-display font-700 text-text">${totalBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-dim hover:text-text hover:border-muted transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {lastUpdate && (
            <p className="text-center text-[10px] text-dim font-mono">Last updated {lastUpdate}</p>
          )}

          {/* Agent status */}
          <div className="card p-4 bg-green-400/5 border-green-400/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Agent Active</span>
            </div>
            <p className="text-xs text-dim leading-relaxed">
              Vigil is online and processing audits autonomously. The agent covers its own compute costs via x402 micropayments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
