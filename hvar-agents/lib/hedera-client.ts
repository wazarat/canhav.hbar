import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
  TransferTransaction,
  Hbar,
} from "@hiero-ledger/sdk";

let _client: Client | null = null;

export function getHvarClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_OPERATOR_ID;
  const privateKey = process.env.HEDERA_OPERATOR_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required");
  }

  _client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  const key = privateKey.startsWith("0x")
    ? PrivateKey.fromStringECDSA(privateKey)
    : PrivateKey.fromString(privateKey);

  _client.setOperator(AccountId.fromString(accountId), key);
  return _client;
}

export async function createAuditTopic(): Promise<string> {
  const client = getHvarClient();
  const tx = new TopicCreateTransaction().setTopicMemo("hvar-agents-audit");
  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  return receipt.topicId!.toString();
}

export async function submitAuditMessage(
  topicId: string,
  message: string
): Promise<string | undefined> {
  const client = getHvarClient();
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message);
  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  return response.transactionId.toString();
}

export async function transferHbar(
  recipientId: string,
  amountHbar: number
): Promise<string> {
  const client = getHvarClient();
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const tx = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(operatorId), new Hbar(-amountHbar))
    .addHbarTransfer(AccountId.fromString(recipientId), new Hbar(amountHbar));
  const response = await tx.execute(client);
  await response.getReceipt(client);
  return response.transactionId.toString();
}

export function getHashScanUrl(txId?: string): string {
  const base =
    process.env.NEXT_PUBLIC_HASHSCAN_URL || "https://hashscan.io/testnet";
  if (txId) return `${base}/transaction/${txId}`;
  return base;
}

export function getHashScanTopicUrl(topicId: string): string {
  const base =
    process.env.NEXT_PUBLIC_HASHSCAN_URL || "https://hashscan.io/testnet";
  return `${base}/topic/${topicId}`;
}

export function hbarToTinybar(hbar: number): number {
  return Math.round(hbar * 100_000_000);
}

export function getStubWorkerId(): string {
  return process.env.HVAR_STUB_WORKER_ID || process.env.HEDERA_OPERATOR_ID || "0.0.0";
}

export function getYieldScoutWorkerId(): string {
  return (
    process.env.HVAR_YIELD_SCOUT_WORKER_ID ||
    process.env.HVAR_STUB_WORKER_ID ||
    process.env.HEDERA_OPERATOR_ID ||
    "0.0.0"
  );
}
