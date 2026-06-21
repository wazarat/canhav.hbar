import {
  AccountId,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionResult,
  ContractId,
  TransactionRecord,
} from "@hiero-ledger/sdk";
import { Interface, LogDescription } from "ethers";
import { fetchBonzoReserves } from "../../../hbar-agents/lib/plugins/bonzo-readonly";
import { getHbarClient } from "../../../hbar-agents/lib/hedera-client";
import {
  assertBonzoInfraConfigured,
  getBonzoNetwork,
  resolveBonzoInfra,
  STRATEGY_ABI,
  VAULT_ABI,
  VAULT_FACTORY_ABI,
  type Network,
} from "./bonzo-addresses";
import type { StrategyConfig } from "./strategy-config.schema";
import type { IVaultAdapter, VaultHealth } from "./vault-adapter.types";

const PPS_SCALE = BigInt("1000000000000000000");

const vaultIface = new Interface(VAULT_ABI as unknown as string[]);
const factoryIface = new Interface(VAULT_FACTORY_ABI as unknown as string[]);
const stratIface = new Interface(STRATEGY_ABI as unknown as string[]);
const erc20Iface = new Interface([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function mint(address to, uint256 amount)",
] as const);

function contractId(evm: string): ContractId {
  const normalized = evm.startsWith("0x") ? evm : `0x${evm}`;
  return ContractId.fromEvmAddress(0, 0, normalized);
}

function resolveAgentEvmAddress(): string {
  const fromEnv = process.env.HBAR_BONZO_VAULT_AGENT_EVM?.trim();
  if (fromEnv) return fromEnv.startsWith("0x") ? fromEnv : `0x${fromEnv}`;
  const operatorId =
    process.env.HBAR_BONZO_VAULT_STRATEGIST_WORKER_ID ||
    process.env.HBAR_STUB_WORKER_ID ||
    process.env.HEDERA_OPERATOR_ID;
  if (!operatorId) {
    throw new Error(
      "HEDERA_OPERATOR_ID or HBAR_BONZO_VAULT_AGENT_EVM required for chain vault adapter"
    );
  }
  if (operatorId.startsWith("0x")) return operatorId;
  const solidity = AccountId.fromString(operatorId).toSolidityAddress();
  return solidity.startsWith("0x") ? solidity : `0x${solidity}`;
}

function resolveOperatorEvmAddress(): string {
  return resolveAgentEvmAddress();
}

function decodeProxyCreated(record: TransactionRecord): string {
  const logs = record.contractFunctionResult?.logs ?? [];
  for (const log of logs) {
    try {
      const topics = log.topics.map((t) =>
        typeof t === "string" ? t : `0x${Buffer.from(t).toString("hex")}`
      );
      const data =
        typeof log.data === "string"
          ? log.data
          : `0x${Buffer.from(log.data).toString("hex")}`;
      const parsed: LogDescription | null = factoryIface.parseLog({
        topics,
        data,
      });
      if (parsed?.name === "ProxyCreated") {
        const proxy = parsed.args[0] as string;
        return proxy.startsWith("0x") ? proxy : `0x${proxy}`;
      }
    } catch {
      // try next log
    }
  }
  throw new Error("ProxyCreated event not found in cloneVault transaction logs");
}

export class BonzoVaultAdapter implements IVaultAdapter {
  constructor(
    private client: Client,
    private network: Network,
    private agentEvmAddress: string
  ) {}

  static create(): BonzoVaultAdapter {
    assertBonzoInfraConfigured();
    return new BonzoVaultAdapter(
      getHbarClient(),
      getBonzoNetwork(),
      resolveAgentEvmAddress()
    );
  }

  async getVaultHealth(
    vaultEvm: string,
    userShares: bigint
  ): Promise<VaultHealth> {
    const pps = await this.callView(vaultEvm, vaultIface, "getPricePerFullShare", []);
    const totalBalance = await this.callView(vaultEvm, vaultIface, "balance", []);
    const userAssets = this.sharesToAssets(userShares, pps);
    return { pricePerFullShare: pps, totalBalance, userShares, userAssets };
  }

  async getStrategyApy(strategyEvm: string): Promise<number> {
    void strategyEvm;
    const reserves = await fetchBonzoReserves();
    const top = [...reserves].sort((a, b) => b.supplyApy - a.supplyApy)[0];
    return top?.supplyApy ?? 0;
  }

  sharesToAssets(shares: bigint, pps: bigint): bigint {
    if (pps === BigInt(0)) return BigInt(0);
    return (shares * pps) / PPS_SCALE;
  }

  assetsToShares(assets: bigint, pps: bigint): bigint {
    if (pps === BigInt(0)) return BigInt(0);
    return (assets * PPS_SCALE) / pps;
  }

  async createVault(opts: {
    isCLM: boolean;
    strategyEvm: string;
    name: string;
    symbol: string;
    approvalDelay: number;
    isHederaToken: boolean;
  }): Promise<string> {
    const { vaultFactory } = resolveBonzoInfra(this.network);
    const fn = opts.isCLM ? "cloneVaultCLM" : "cloneVault";
    const { record } = await this.exec(vaultFactory, factoryIface, fn, []);
    const proxy = decodeProxyCreated(record);
    await this.exec(proxy, vaultIface, "initialize", [
      opts.strategyEvm,
      opts.name,
      opts.symbol,
      opts.approvalDelay,
      opts.isHederaToken,
    ]);
    return proxy;
  }

  async depositToVault(
    config: StrategyConfig,
    vaultEvm: string,
    amountAssets: bigint
  ): Promise<{ txId?: string }> {
    void config;
    await this.ensureErc20Allowance(vaultEvm, amountAssets);
    const { txId } = await this.exec(vaultEvm, vaultIface, "deposit", [
      amountAssets,
    ]);
    return { txId };
  }

  /** Mint mock want tokens when BONZO_SMOKE_WANT_TOKEN is set (testnet smoke only). */
  async ensureMockWantBalance(amount: bigint): Promise<void> {
    const wantToken = process.env.BONZO_SMOKE_WANT_TOKEN?.trim();
    if (!wantToken) return;
    const owner = resolveOperatorEvmAddress();
    const balance = await this.callView(wantToken, erc20Iface, "balanceOf", [
      owner,
    ]);
    if (balance >= amount) return;
    await this.exec(wantToken, erc20Iface, "mint", [owner, amount * BigInt(2)]);
  }

  private async ensureErc20Allowance(
    vaultEvm: string,
    amountAssets: bigint
  ): Promise<void> {
    const wantToken = await this.callViewAddress(vaultEvm, vaultIface, "want", []);
    const owner = resolveOperatorEvmAddress();
    const vaultNorm = vaultEvm.startsWith("0x") ? vaultEvm : `0x${vaultEvm}`;
    const allowance = await this.callView(wantToken, erc20Iface, "allowance", [
      owner,
      vaultNorm,
    ]);
    if (allowance >= amountAssets) return;
    const max = BigInt(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
    await this.exec(wantToken, erc20Iface, "approve", [vaultNorm, max]);
  }

  async withdrawFromVault(
    config: StrategyConfig,
    vaultEvm: string,
    shares: bigint
  ): Promise<{ txId?: string }> {
    void config;
    const { txId } = await this.exec(vaultEvm, vaultIface, "withdraw", [shares]);
    return { txId };
  }

  async harvest(
    config: StrategyConfig,
    strategyEvm: string
  ): Promise<{ txId?: string }> {
    void config;
    const { txId } = await this.exec(strategyEvm, stratIface, "harvest(address)", [
      this.agentEvmAddress,
    ]);
    return { txId };
  }

  async panic(strategyEvm: string): Promise<{ txId?: string }> {
    const { txId } = await this.exec(strategyEvm, stratIface, "panic", []);
    return { txId };
  }

  async pause(strategyEvm: string): Promise<{ txId?: string }> {
    const { txId } = await this.exec(strategyEvm, stratIface, "pause", []);
    return { txId };
  }

  private async exec(
    evm: string,
    iface: Interface,
    fn: string,
    args: unknown[]
  ): Promise<{ txId: string; record: TransactionRecord }> {
    const data = iface.encodeFunctionData(fn, args);
    const tx = new ContractExecuteTransaction()
      .setContractId(contractId(evm))
      .setGas(1_500_000)
      .setFunctionParameters(Buffer.from(data.slice(2), "hex"));
    const response = await tx.execute(this.client);
    const record = await response.getRecord(this.client);
    await response.getReceipt(this.client);
    return { txId: response.transactionId.toString(), record };
  }

  private async callView(
    evm: string,
    iface: Interface,
    fn: string,
    args: unknown[]
  ): Promise<bigint> {
    const raw = await this.callViewRaw(evm, iface, fn, args);
    if (typeof raw === "bigint") return raw;
    throw new Error(`Expected uint256 from ${fn}, got ${typeof raw}`);
  }

  private async callViewAddress(
    evm: string,
    iface: Interface,
    fn: string,
    args: unknown[] = []
  ): Promise<string> {
    const raw = await this.callViewRaw(evm, iface, fn, args);
    if (typeof raw === "string") {
      return raw.startsWith("0x") ? raw : `0x${raw}`;
    }
    throw new Error(`Expected address from ${fn}`);
  }

  private async callViewRaw(
    evm: string,
    iface: Interface,
    fn: string,
    args: unknown[]
  ): Promise<bigint | string> {
    const data = iface.encodeFunctionData(fn, args);
    const q = new ContractCallQuery()
      .setContractId(contractId(evm))
      .setGas(150_000)
      .setFunctionParameters(Buffer.from(data.slice(2), "hex"));
    const res = await q.execute(this.client);
    return decodeViewResult(fn, iface, res);
  }
}

function decodeViewResult(
  fn: string,
  iface: Interface,
  result: ContractFunctionResult
): bigint | string {
  const bytes = result.bytes;
  const hex =
    typeof bytes === "string"
      ? bytes
      : `0x${Buffer.from(bytes).toString("hex")}`;
  const decoded = iface.decodeFunctionResult(fn, hex);
  const first = decoded[0];
  if (typeof first === "bigint") return first;
  if (typeof first === "number") return BigInt(first);
  const asString = String(first);
  if (asString.startsWith("0x") && asString.length === 42) return asString;
  if (/^0x[0-9a-fA-F]{40}$/.test(asString)) return asString;
  return BigInt(asString);
}

let _chainAdapter: BonzoVaultAdapter | null = null;

export function getChainVaultAdapter(): BonzoVaultAdapter {
  if (!_chainAdapter) {
    _chainAdapter = BonzoVaultAdapter.create();
  }
  return _chainAdapter;
}
