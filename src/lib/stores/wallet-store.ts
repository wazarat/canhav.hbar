import { create } from "zustand";

type WalletState = {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  network: "testnet" | "mainnet";
  connect: () => Promise<void>;
  disconnect: () => void;
  setAddress: (address: string | null) => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnecting: false,
  isConnected: false,
  network: "testnet",

  connect: async () => {
    set({ isConnecting: true });
    try {
      const magicKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;

      if (magicKey && typeof window !== "undefined") {
        const { Magic } = await import("magic-sdk");
        const { HederaExtension } = await import("@magic-ext/hedera");
        const magic = new Magic(magicKey, {
          extensions: [
            new HederaExtension({ network: get().network }),
          ],
        });

        const accounts = await magic.wallet.connectWithUI();
        if (accounts?.[0]) {
          set({ address: accounts[0], isConnected: true });
          return;
        }
      }

      // Demo mode: simulate wallet connection
      set({
        address: "0x051b9a60557d5bb202f55759d20059e2805637f8",
        isConnected: true,
      });
    } catch (err) {
      console.error("Wallet connection failed:", err);
      // Fall back to demo mode
      set({
        address: "0x051b9a60557d5bb202f55759d20059e2805637f8",
        isConnected: true,
      });
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnect: () => {
    set({ address: null, isConnected: false });
  },

  setAddress: (address) => {
    set({ address, isConnected: !!address });
  },
}));

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getHashScanAddressUrl(address: string, network = "testnet"): string {
  return `https://hashscan.io/${network}/account/${address}`;
}

export function getHashScanTxUrl(txHash: string, network = "testnet"): string {
  return `https://hashscan.io/${network}/transaction/${txHash}`;
}

export function getHashScanTopicUrl(topicId: string, network = "testnet"): string {
  return `https://hashscan.io/${network}/topic/${topicId}`;
}

export function getHashScanContractUrl(address: string, network = "testnet"): string {
  return `https://hashscan.io/${network}/contract/${address}`;
}
