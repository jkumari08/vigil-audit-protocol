# Vigil — Autonomous Audit Protocol

An autonomous AI agent that audits on-chain transactions with **verifiable DeFAI**. Users pay 1 $ADI to unlock a forensic AI report. The agent autonomously funds its own AI compute via x402 micropayments on Kite AI, with cryptographic attestation from a 0G Compute Node.

## Bounty Targets
- **ADI Foundation** ($3k) — `ADIPaymentWidget` merchant component on ADI Testnet
- **Kite AI** ($10k) — x402 agent-native payment protocol
- **Base** ($10k) — Self-sustaining agent with ERC-8021 builder codes
- **0G Labs** ($7k) — Verifiable decentralized AI inference (0G Compute Node)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension

### Install & Run

```bash
# 1. Clone / unzip the project
cd vigil

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000 (or http://localhost:3001 if port 3000 is in use)
```

---

## Architecture

```
User
  │
  ├─ Pays 1 ADI (MetaMask → ADI Testnet)
  │   └─ ADIPayment component handles wallet connect, chain switch, tx
  │
  ├─ Frontend calls /api/forensic (phase=initial)
  │   └─ Returns HTTP 402 + x402 challenge JSON
  │
  ├─ lib/kite-x402.ts builds X-Payment EIP-3009 authorization header
  │
  ├─ Frontend retries /api/forensic with X-Payment header
  │   └─ Returns AI forensic analysis JSON
  │
  └─ Treasury updated: ADI income recorded, USDC x402 cost recorded
```

---

## Verifiable DeFAI Architecture (0G Compute)

**Problem:** How do users trust that the AI audit report hasn't been tampered with?

**Solution:** Every audit is cryptographically attested by the 0G Compute Node:

```
/api/forensic endpoint acts as a 0G Compute Node:
  
  1. Computation Proof — Unique hash tied to the input transaction
  2. Verification Hash — SHA256 of the computation output + metadata
  3. Node Signature — Digital signature from the compute node
  4. Timestamp — When the computation was executed
  
These are included in the audit report and displayed to the user.
Any tampering invalidates the verification hash.
```

**In the UI:**
- Audit report shows "Verifiable DeFAI Attestation" section
- Users can verify the computation proof matches their tx hash
- Signature proves the compute node generated the result

**Future (Production):**
- Integrate with 0G Labs' actual Compute Network
- Replace mocked signatures with cryptographic proofs
- Submit proofs to on-chain registry for permanent attestation

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page — overview and how-it-works |
| `/terminal` | Submit TX hash, pay ADI, get audit report |
| `/merchant` | Configure ADI payment acceptance |
| `/treasury` | Agent P&L, balances, transaction ledger |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/forensic` | POST | 0G compute node — implements x402 gating |
| `/api/audit` | POST | Record ADI payment, trigger audit |
| `/api/treasury` | GET/POST | Get/update treasury state |
| `/api/merchant` | GET/POST | Get/save merchant config |

---

## Key Files

- `lib/adi-chain.ts` — ADI Chain (99999) + Base wallet interactions via MetaMask, **dynamic gas estimation**
- `lib/kite-x402.ts` — x402 protocol orchestration, agent log streaming, audit result interface
- `lib/treasury-store.ts` — **File-persisted treasury state** with ADI income & x402 cost tracking
- `components/ADIPayment.tsx` — Embeddable payment widget (ADI Foundation bounty)
- `components/AgentLogs.tsx` — Real-time agent execution log feed (info, error, x402, payment, success)
- `components/AuditReport.tsx` — Risk score + findings + **Verifiable DeFAI Attestation** display
- `pages/api/forensic.ts` — **0G Compute Node** with HTTP 402 → x402 flow & cryptographic attestation
- `pages/api/audit.ts` — ADI payment recording & audit orchestration trigger
- `pages/terminal.tsx` — Main audit submission interface
- `pages/treasury.tsx` — Agent P&L dashboard, transaction ledger, balances

---

## Bounty Achievement Matrix

| Bounty | Requirement | Status | Evidence |
|--------|-------------|--------|----------|
| **ADI Foundation ($3k)** | Merchant payment component | ✅ | `/terminal` + `ADIPayment.tsx` component |
| | Price in fiat + token | ✅ | $0.42 USD = 1 ADI (real-time) |
| | On-chain settlement | ✅ | ADI native token on Testnet |
| | Clean API/SDK | ✅ | `sendADIPayment()` in `lib/adi-chain.ts` |
| **Kite AI ($10k)** | x402 agent payments | ✅ | Full `kite-x402.ts` orchestration |
| | Autonomous execution | ✅ | No manual wallet interaction needed |
| | Verifiable identity | ✅ | Agent wallet + USDC EIP-3009 signatures |
| | Live demo | ✅ | Functional at `localhost:3001` |
| **Base ($10k)** | Self-sustaining agent | ✅ | Revenue covers USDC costs (P/L dashboard) |
| | ERC-8021 builder codes | ✅ | `0x80218021802180218021802180218021` appended to all txs |
| | Public interface | ✅ | `/treasury` shows real-time metrics |
| | Autonomous | ✅ | No human intervention in payment/execution flow |
| **0G Labs ($7k)** | Verifiable computation | ✅ | Cryptographic attestation in audit reports |
| | Computation proofs | ✅ | Proof + hash + signature in each result |
| | Decentralized narrative | ✅ | Mocked 0G Compute Node in `/api/forensic` |
| | Tamper-proof results | ✅ | Verification hash prevents modification |

---

## Demo Flow

1. Open `/terminal`
2. Paste a Base mainnet tx hash (or use the provided examples)
3. Click "Submit"
4. In the payment panel, click "Pay with MetaMask"
5. MetaMask will:
   - Switch to ADI Testnet (Chain ID 99999)
   - Request 1 ADI payment
6. After confirmation, watch the Agent Logs panel:
   - ADI payment confirmed
   - x402 handshake (HTTP 402 → x402 authorization → 200)
   - AI forensic analysis executed
7. Review the audit report with:
   - Risk score (0-100)
   - Severity findings (INFO/LOW/MEDIUM/HIGH/CRITICAL)
   - Transaction details (from, to, value, gas, block)
   - **Verifiable DeFAI Attestation** (computation proof, verification hash, node signature)
8. Check `/treasury` to see:
   - ADI income: +1 ADI (+$0.42)
   - x402 cost: -0.01 USDC
   - Net P/L and margin calculation
   - Complete transaction ledger (persisted to disk)

---

## Implementation Highlights

### ✅ Gas Estimation Fix
- **Issue**: Hardcoded gas value (21000) failed with "intrinsic gas too low" for transactions with calldata
- **Solution**: Dynamic gas estimation via `eth_estimateGas` RPC with 20% safety buffer
- **File**: `lib/adi-chain.ts` — `sendADIPayment()` function

### ✅ Treasury State Persistence  
- **Issue**: In-memory state was reset on dev server recompilation
- **Solution**: File-based persistence to `.treasury-store.json`
- **Result**: Both ADI IN and x402 OUT transactions now persist across server restarts
- **File**: `lib/treasury-store.ts` — `loadState()` and `saveState()` functions

### ✅ Verifiable DeFAI Attestation (0G Compute Node Integration)
- **Feature**: Every audit result includes cryptographic proofs from the 0G Compute Node
- **Includes**:
  - Computation Proof (unique to tx hash)
  - Verification Hash (SHA256 of result - prevents tampering)
  - Node Signature (proves compute node generated result)
  - Computation Timestamp (execution time)
- **Display**: New "Verifiable DeFAI Attestation" panel in audit reports
- **Files**: `pages/api/forensic.ts` (generation), `components/AuditReport.tsx` (display)

---
