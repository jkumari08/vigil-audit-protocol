// lib/adi-chain.ts
// ADI Chain integration - Chain ID 99999

export const ADI_CHAIN_CONFIG = {
  chainId: "0x1869F", // 99999 in hex
  chainName: "ADI Testnet",
  nativeCurrency: {
    name: "ADI",
    symbol: "ADI",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.ab.testnet.adifoundation.ai"],
  blockExplorerUrls: ["https://explorer.ab.testnet.adifoundation.ai"],
};

export const BASE_CHAIN_CONFIG = {
  chainId: "0x2105", // 8453 in hex
  chainName: "Base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"],
};

// ERC-8021 Builder Code for Vigil
export const BUILDER_CODE = "0x80218021802180218021802180218021";

// Append builder code to calldata
export function appendBuilderCode(data: string): string {
  const cleanData = data.startsWith("0x") ? data.slice(2) : data;
  const builderHex = BUILDER_CODE.slice(2);
  return "0x" + cleanData + builderHex;
}

export async function switchToADIChain(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ADI_CHAIN_CONFIG.chainId }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ADI_CHAIN_CONFIG],
      });
    } else {
      throw switchError;
    }
  }
}

export async function switchToBaseChain(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_CONFIG.chainId }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [BASE_CHAIN_CONFIG],
      });
    } else {
      throw switchError;
    }
  }
}

export async function getConnectedAddress(): Promise<string | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as string[];
  return accounts[0] || null;
}

export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed. Please install MetaMask to continue.");
  }
  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts[0]) throw new Error("No accounts found");
  return accounts[0];
}

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Send ADI native token payment
export async function sendADIPayment(
  toAddress: string,
  amountInADI: string,
  memo?: string
): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask required");

  await switchToADIChain();

  const from = await connectWallet();

  // Convert ADI amount to wei (18 decimals)
  const amountWei = BigInt(Math.floor(parseFloat(amountInADI) * 1e18)).toString(16);

  // Build calldata with builder code if memo provided
  let data = "0x";
  if (memo) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(memo);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    data = appendBuilderCode("0x" + hex);
  } else {
    data = BUILDER_CODE;
  }

  const txParams = {
    from,
    to: toAddress,
    value: "0x" + amountWei,
    data,
  };

  // Estimate gas for the transaction and add 20% buffer
  let gasEstimate = "0x5208"; // fallback to minimum
  try {
    const estimated = (await window.ethereum.request({
      method: "eth_estimateGas",
      params: [txParams],
    })) as string;
    // Add 20% buffer to estimated gas
    const estimatedNum = BigInt(estimated);
    const gasWithBuffer = (estimatedNum * BigInt(120)) / BigInt(100);
    gasEstimate = "0x" + gasWithBuffer.toString(16);
  } catch {
    // Fall back to a reasonable default with memo buffer
    gasEstimate = data.length > 10 ? "0x6978" : "0x5208"; // 26472 or 21000
  }

  const txHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        ...txParams,
        gas: gasEstimate,
      },
    ],
  })) as string;

  return txHash;
}

// USDC ABI (minimal)
export const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// USDC on Base
export const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export async function sendUSDCOnBase(
  toAddress: string,
  amountUSDC: string
): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask required");

  await switchToBaseChain();
  const from = await connectWallet();

  // USDC has 6 decimals
  const amountRaw = BigInt(Math.floor(parseFloat(amountUSDC) * 1e6));

  // ERC20 transfer function selector + encoded params
  const transferSig = "0xa9059cbb"; // transfer(address,uint256)
  const paddedTo = toAddress.slice(2).padStart(64, "0");
  const paddedAmount = amountRaw.toString(16).padStart(64, "0");

  const calldata = transferSig + paddedTo + paddedAmount;
  const dataWithBuilder = appendBuilderCode(calldata);

  const txHash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: USDC_BASE_ADDRESS,
        value: "0x0",
        data: dataWithBuilder,
        gas: "0x15F90", // 90000 gas
      },
    ],
  })) as string;

  return txHash;
}
