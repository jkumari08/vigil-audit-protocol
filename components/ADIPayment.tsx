// components/ADIPayment.tsx
// Merchant payment widget for accepting ADI payments

import { useState, useEffect } from "react";
import { Wallet, QrCode, CheckCircle, AlertCircle, Loader, Copy } from "lucide-react";
import {
  connectWallet,
  switchToADIChain,
  sendADIPayment,
  getConnectedAddress,
  shortenAddress,
} from "@/lib/adi-chain";

// Agent receiving address — set via env or use default
const AGENT_WALLET = process.env.NEXT_PUBLIC_AGENT_WALLET || "0x080C1b57a068CFd0000000000000000000000001";
const AUDIT_FEE_ADI = "1";
const ADI_PRICE_USD = 0.42;

export type PaymentStatus = "idle" | "connecting" | "switching" | "pending" | "success" | "error";

interface ADIPaymentProps {
  txHashToAudit: string;
  onSuccess: (adiTxHash: string, fromAddress: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function ADIPayment({ txHashToAudit, onSuccess, onError, disabled }: ADIPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(setConnectedAddress);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(AGENT_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async () => {
    try {
      setErrorMsg("");
      setStatus("connecting");

      // Connect wallet if needed
      let from = connectedAddress;
      if (!from) {
        from = await connectWallet();
        setConnectedAddress(from);
      }

      // Switch to ADI chain
      setStatus("switching");
      await switchToADIChain();

      // Send payment
      setStatus("pending");
      const hash = await sendADIPayment(
        AGENT_WALLET,
        AUDIT_FEE_ADI,
        `vigil-audit:${txHashToAudit.slice(0, 20)}`
      );
      setTxHash(hash);
      setStatus("success");

      // Notify parent
      onSuccess(hash, from!);
    } catch (err: unknown) {
      const e = err as Error;
      const msg =
        e.message.includes("user rejected") || e.message.includes("User denied")
          ? "Transaction rejected by user."
          : e.message.includes("MetaMask")
          ? "MetaMask not found. Please install MetaMask."
          : e.message || "Payment failed";
      setErrorMsg(msg);
      setStatus("error");
      onError?.(msg);
    }
  };

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
    setTxHash(null);
  };

  const statusMessages: Record<PaymentStatus, string> = {
    idle: "Pay 1 ADI to unlock audit",
    connecting: "Connecting to MetaMask...",
    switching: "Switching to ADI Testnet...",
    pending: "Confirm payment in MetaMask...",
    success: "Payment confirmed!",
    error: errorMsg,
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-600 text-text">ADI Payment</h3>
          <p className="text-xs text-dim mt-0.5">Required to initiate audit</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-display font-700 text-text">1 ADI</div>
          <div className="text-xs text-dim">${(1 * ADI_PRICE_USD).toFixed(2)} USD</div>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-bg rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-dim">To</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-text">{shortenAddress(AGENT_WALLET)}</span>
            <button onClick={handleCopy} className="text-dim hover:text-text transition-colors">
              <Copy className="w-3 h-3" />
            </button>
            {copied && <span className="text-green-400">Copied!</span>}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-dim">Network</span>
          <span className="font-mono text-amber-400">ADI Testnet (99999)</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-dim">Token</span>
          <span className="font-mono text-text">ADI (Native)</span>
        </div>
        {connectedAddress && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-dim">From</span>
            <span className="font-mono text-text">{shortenAddress(connectedAddress)}</span>
          </div>
        )}
      </div>

      {/* Status area */}
      {status !== "idle" && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
            status === "success"
              ? "bg-green-400/10 border border-green-400/20 text-green-400"
              : status === "error"
              ? "bg-red-400/10 border border-red-400/20 text-red-400"
              : "bg-blue-400/10 border border-blue-400/20 text-blue-400"
          }`}
        >
          {status === "success" ? (
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          ) : status === "error" ? (
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          ) : (
            <Loader className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-spin" />
          )}
          <span>{statusMessages[status]}</span>
        </div>
      )}

      {/* Tx hash on success */}
      {status === "success" && txHash && (
        <div className="text-xs">
          <div className="text-dim mb-1">Payment TX</div>
          <div className="font-mono text-green-400 break-all text-[10px] bg-green-400/5 p-2 rounded">
            {txHash}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === "error" ? (
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-lg border border-border text-dim hover:text-text hover:border-muted transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        ) : status !== "success" ? (
          <>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-2.5 rounded-lg border border-border text-dim hover:text-text transition-colors"
              title="Show QR code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={handlePay}
              disabled={status !== "idle" || disabled || !txHashToAudit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-400 text-bg font-semibold text-sm hover:bg-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status !== "idle" ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {status === "connecting"
                    ? "Connecting..."
                    : status === "switching"
                    ? "Switching..."
                    : "Confirm in wallet..."}
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Pay with MetaMask
                </>
              )}
            </button>
          </>
        ) : null}
      </div>

      {/* QR Code fallback */}
      {showQR && (
        <div className="text-center p-4 bg-bg rounded-lg">
          <div className="text-xs text-dim mb-2">Scan to pay from mobile</div>
          {/* Simple ASCII QR representation */}
          <div className="font-mono text-[8px] leading-[10px] text-green-400 inline-block bg-surface p-2 rounded">
            ▄▄▄▄▄ ▄ ▄▄▄▄▄<br/>
            █ ▄▄█ ██ ▄▄█<br/>
            █ ▀▀█ ██ ▀▀█<br/>
            ▀▀▀▀▀ ▀ ▀▀▀▀▀
          </div>
          <div className="text-[10px] font-mono text-dim mt-2 break-all">{AGENT_WALLET}</div>
          <div className="text-[10px] text-dim mt-1">Amount: 1 ADI</div>
        </div>
      )}
    </div>
  );
}
