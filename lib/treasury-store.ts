// lib/treasury-store.ts
// In-memory treasury state with optional file persistence (for dev server reliability)
// NOTE: Vercel serverless functions don't support persistent filesystems.
// For production, use a database like PostgreSQL or Supabase instead.

import fs from "fs";
import path from "path";

export interface TreasuryTransaction {
  id: string;
  time: string;
  type: "IN" | "OUT";
  amount: string;
  token: string;
  network: string;
  counterparty: string;
  memo: string;
  txHash?: string;
}

export interface TreasuryState {
  revenue: number;       // USD value from ADI payments
  infraCost: number;     // USDC spent on x402
  audits: number;
  adiBalance: number;
  usdcBalance: number;
  transactions: TreasuryTransaction[];
}

// Detect if running on Vercel
const isVercel = process.env.VERCEL === "1";

// Path to persistent storage file (only used in development/local)
const STORE_FILE = path.join(process.cwd(), ".treasury-store.json");

// Load state from file or initialize
function loadState(): TreasuryState {
  // On Vercel, skip file system operations
  if (isVercel) {
    console.warn("[Treasury] Running on Vercel - using in-memory only (not persistent)");
    return getDefaultState();
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      const loaded = JSON.parse(data);
      console.log("[Treasury] Loaded state from file:", { revenue: loaded.revenue, transactions: loaded.transactions.length });
      return loaded;
    }
  } catch (e) {
    console.log("[Treasury] Failed to load state file:", (e as Error).message);
  }

  return getDefaultState();
}

function getDefaultState(): TreasuryState {
  return {
    revenue: 0,
    infraCost: 0,
    audits: 0,
    adiBalance: 0,
    usdcBalance: 1.0,
    transactions: [],
  };
}

// Global in-memory store (initialized from file)
let state: TreasuryState = loadState();

// Save state to file (skipped on Vercel)
function saveState(): void {
  if (isVercel) {
    console.log("[Treasury] Skipping file save on Vercel (use database for production)");
    return;
  }

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
    console.log("[Treasury] State saved to file");
  } catch (e) {
    console.error("[Treasury] Failed to save state:", (e as Error).message);
  }
}

export function getTreasuryState(): TreasuryState {
  console.log(`[Treasury] getTreasuryState called - current state:`, { revenue: state.revenue, infraCost: state.infraCost, audits: state.audits, transactionCount: state.transactions.length, transactions: state.transactions });
  return { ...state, transactions: [...state.transactions] };
}

export function recordADIIncome(
  amountADI: number,
  adiPriceUSD: number,
  fromAddress: string,
  txHash?: string
): void {
  const usdValue = amountADI * adiPriceUSD;
  state.revenue += usdValue;
  state.adiBalance += amountADI;
  state.audits += 1;

  console.log(`[Treasury] Recording ADI income: ${amountADI} ADI = $${usdValue.toFixed(2)} USD, from: ${fromAddress}`);

  state.transactions.unshift({
    id: Date.now().toString(),
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type: "IN",
    amount: `+${amountADI.toFixed(2)}`,
    token: "ADI",
    network: "ADI Testnet",
    counterparty: fromAddress,
    memo: "Audit fee",
    txHash,
  });

  console.log(`[Treasury] New state - Revenue: ${state.revenue}, Balance: ${state.adiBalance}, Transactions: ${state.transactions.length}`);
  saveState();
}

export function recordX402Payment(
  amountUSDC: number,
  toNode: string,
  txHash?: string
): void {
  state.infraCost += amountUSDC;
  state.usdcBalance = Math.max(0, state.usdcBalance - amountUSDC);

  console.log(`[Treasury] Recording x402 payment: ${amountUSDC} USDC to ${toNode}`);

  state.transactions.unshift({
    id: (Date.now() + 1).toString(),
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type: "OUT",
    amount: `-${amountUSDC.toFixed(4)}`,
    token: "USDC",
    network: "Base",
    counterparty: toNode,
    memo: "x402 compute",
    txHash,
  });

  console.log(`[Treasury] New state - InfraCost: ${state.infraCost}, USDCBalance: ${state.usdcBalance}, Transactions: ${state.transactions.length}`);
  saveState();
}

export function getNetPL(): number {
  return state.revenue - state.infraCost;
}

export function getMarginPct(): number {
  if (state.revenue === 0) return 0;
  return ((state.revenue - state.infraCost) / state.revenue) * 100;
}

export function clearStore(): void {
  state = {
    revenue: 0,
    infraCost: 0,
    audits: 0,
    adiBalance: 0,
    usdcBalance: 1.0,
    transactions: [],
  };
  saveState();
  console.log("[Treasury] Store cleared");
}
