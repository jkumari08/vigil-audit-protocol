import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Activity, Shield, ChevronDown } from "lucide-react";
import { connectWallet, getConnectedAddress, shortenAddress } from "@/lib/adi-chain";

interface Ticker {
  adi: number;
  eth: number;
  usdc: number;
  block: number;
  agentOnline: boolean;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [ticker, setTicker] = useState<Ticker>({
    adi: 0.42,
    eth: 3241.88,
    usdc: 1.0,
    block: 22841131,
    agentOnline: true,
  });

  useEffect(() => {
    // Initial address check
    getConnectedAddress().then(setAddress);

    // Handle wallet account changes with type casting for Vercel
    const handleAccountsChanged = (args: unknown) => {
      const accounts = args as string[];
      setAddress(accounts[0] || null);
    };

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    // Simulate live ticker updates
    const interval = setInterval(() => {
      setTicker((prev) => ({
        ...prev,
        block: prev.block + 1,
        adi: parseFloat((prev.adi + (Math.random() - 0.5) * 0.002).toFixed(4)),
      }));
    }, 4000);

    // Cleanup listeners and intervals on unmount
    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
      clearInterval(interval);
    };
  }, []);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/terminal", label: "Terminal" },
    { href: "/merchant", label: "Merchant" },
    { href: "/treasury", label: "Treasury" },
  ];

  const adiChange = "+2.4%";

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* Top ticker bar */}
      <div className="bg-surface border-b border-border py-1.5 px-4 flex items-center gap-6 text-xs font-mono text-dim overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-subtle">BASE GAS</span>
          <span className="text-text">0.0012 gwei</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-subtle">$ADI</span>
          <span className="text-text">${ticker.adi.toFixed(2)}</span>
          <span className="text-green-400">{adiChange}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-subtle">BLOCK</span>
          <span className="text-text">{ticker.block.toLocaleString()}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-subtle">USDC/ETH</span>
          <span className="text-text">${ticker.eth.toFixed(2)}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${ticker.agentOnline ? "bg-green-400" : "bg-red-400"}`} />
          <span className={ticker.agentOnline ? "text-green-400" : "text-red-400"}>
            {ticker.agentOnline ? "AGENT ONLINE" : "AGENT OFFLINE"}
          </span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="badge-blue px-2 py-0.5 rounded text-blue-400 text-xs font-mono">X402</div>
      </div>

      {/* Main navbar */}
      <nav className="bg-surface border-b border-border px-6 py-3.5 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 mr-4">
          <div className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="font-display font-700 text-text text-sm leading-none">Vigil</div>
            <div className="text-dim text-[10px] font-mono uppercase tracking-wider">Audit Protocol</div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href || 
              (item.href !== "/" && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-400/10 text-green-400"
                    : "text-dim hover:text-text hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-400/5 border border-blue-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs font-medium text-blue-400">Base</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/5 border border-amber-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-400">ADI</span>
          </div>
        </div>

        {address ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-400/5 border border-green-400/20 cursor-pointer hover:bg-green-400/10 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-xs font-mono text-green-400">{shortenAddress(address)}</span>
            <ChevronDown className="w-3 h-3 text-green-400" />
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-400/10 border border-green-400/30 text-green-400 text-xs font-medium hover:bg-green-400/20 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Connect Wallet
          </button>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border px-6 py-4 flex items-center justify-between text-xs text-dim">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span className="font-display">Vigil</span>
          <span>Audit Protocol — ETHDenver 2026</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>ADI Chain · Base · Kite AI · 0G Labs</span>
        </div>
      </footer>
    </div>
  );
}