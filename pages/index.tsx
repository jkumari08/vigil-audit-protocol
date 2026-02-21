// pages/index.tsx
import Link from "next/link";
import { Shield, Zap, Lock, TrendingUp, ArrowRight, Activity, Globe, Cpu } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: "AI-Powered Forensics",
      description:
        "Every transaction analyzed by AI running on 0G's decentralized compute network. Tamper-proof, verifiable results every time.",
      color: "text-green-400",
      bg: "bg-green-400/5 border-green-400/20",
    },
    {
      icon: Zap,
      title: "x402 Micropayments",
      description:
        "Our agent autonomously pays for AI compute via the x402 protocol on Kite AI — zero human intervention required.",
      color: "text-blue-400",
      bg: "bg-blue-400/5 border-blue-400/20",
    },
    {
      icon: Lock,
      title: "ADI Native Payments",
      description:
        "Pay for audits in $ADI on ADI Chain. Merchants configure receiving addresses and settlement tokens via our embeddable widget.",
      color: "text-amber-400",
      bg: "bg-amber-400/5 border-amber-400/20",
    },
    {
      icon: TrendingUp,
      title: "Self-Sustaining Agent",
      description:
        "Vigil earns ADI from users and spends USDC on AI compute — the agent keeps itself alive. Track every dollar via the Treasury.",
      color: "text-violet-400",
      bg: "bg-violet-400/5 border-violet-400/20",
    },
  ];

  const stats = [
    { label: "Audits Completed", value: "2,847" },
    { label: "Avg Risk Score", value: "34.2" },
    { label: "Agent Uptime", value: "99.8%" },
    { label: "Avg Net Margin", value: "97.1%" },
  ];

  const chains = [
    { name: "ADI Chain", desc: "Payments in", color: "text-amber-400", dot: "bg-amber-400" },
    { name: "Base", desc: "x402 USDC compute", color: "text-blue-400", dot: "bg-blue-400" },
    { name: "Kite AI", desc: "Agent identity", color: "text-violet-400", dot: "bg-violet-400" },
    { name: "0G Labs", desc: "Verifiable AI inference", color: "text-green-400", dot: "bg-green-400" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center">
        <h1 className="font-display font-800 text-5xl md:text-6xl text-text leading-tight mb-6">
          On-chain transaction
          <br />
          <span className="text-green-400">forensics,</span> automated.
        </h1>

        <p className="text-lg text-dim max-w-2xl mx-auto leading-relaxed mb-10">
          Vigil is an autonomous AI agent that audits blockchain transactions. Pay in $ADI, and the
          agent funds its own AI inference via x402 micropayments — no middlemen, no trust required.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/terminal"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-400 text-bg font-semibold hover:bg-green-300 transition-colors"
          >
            Run an Audit
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/treasury"
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-dim hover:text-text hover:border-muted transition-colors"
          >
            <Activity className="w-4 h-4" />
            View Treasury
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-700 text-2xl text-text mb-1">{stat.value}</div>
              <div className="text-xs text-dim">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-mono text-dim uppercase tracking-widest mb-3">How It Works</div>
          <h2 className="font-display font-700 text-3xl text-text">The autonomous audit loop</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Submit TX", desc: "Enter a transaction hash in the Terminal", icon: Globe },
            { step: "02", title: "Pay 1 ADI", desc: "Connect MetaMask and pay the audit fee on ADI Chain", icon: Lock },
            { step: "03", title: "x402 Handshake", desc: "Agent hits the Forensic API, gets 402, autonomously pays in USDC", icon: Zap },
            { step: "04", title: "Get Report", desc: "Decentralized AI returns a verified risk assessment", icon: Shield },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="card p-5 relative">
              <div className="text-xs font-mono text-dim mb-3">{step}</div>
              <Icon className="w-6 h-6 text-green-400 mb-3" />
              <h3 className="font-display font-600 text-text mb-1">{title}</h3>
              <p className="text-xs text-dim leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className={`card p-6 border ${f.bg}`}>
              <f.icon className={`w-6 h-6 ${f.color} mb-4`} />
              <h3 className="font-display font-600 text-text mb-2">{f.title}</h3>
              <p className="text-sm text-dim leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chain integrations */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <div className="card p-6">
          <div className="text-xs font-mono text-dim uppercase tracking-widest mb-6 text-center">
            Built on 4 Chains
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chains.map((c) => (
              <div key={c.name} className="text-center">
                <div className={`flex items-center justify-center gap-1.5 mb-1`}>
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`font-display font-600 text-sm ${c.color}`}>{c.name}</span>
                </div>
                <div className="text-xs text-dim">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <div className="card p-10 bg-green-400/5 border-green-400/20">
          <Cpu className="w-8 h-8 text-green-400 mx-auto mb-4" />
          <h2 className="font-display font-700 text-2xl text-text mb-3">
            Try your first audit
          </h2>
          <p className="text-dim text-sm mb-6">
            Paste any Ethereum, Base, or ADI transaction hash and let the agent work.
          </p>
          <Link
            href="/terminal"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-400 text-bg font-semibold hover:bg-green-300 transition-colors"
          >
            Open Terminal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
