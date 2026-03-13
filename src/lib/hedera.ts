import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
} from "@hashgraph/sdk";

let _client: Client | null = null;

export function getHederaClient(): Client {
  if (_client) return _client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY required");
  }

  _client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  _client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringED25519(privateKey)
  );

  return _client;
}

export async function createTopic(): Promise<string> {
  const client = getHederaClient();
  const tx = new TopicCreateTransaction();
  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);
  return receipt.topicId!.toString();
}

export async function submitMessage(
  topicId: string,
  message: string
): Promise<void> {
  const client = getHederaClient();
  const tx = new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message);
  await tx.execute(client);
}

export function getHashScanUrl(txHash?: string): string {
  const base =
    process.env.NEXT_PUBLIC_HASHSCAN_URL || "https://hashscan.io/testnet";
  if (txHash) return `${base}/transaction/${txHash}`;
  return base;
}

export function getHashScanTopicUrl(topicId: string): string {
  const base =
    process.env.NEXT_PUBLIC_HASHSCAN_URL || "https://hashscan.io/testnet";
  return `${base}/topic/${topicId}`;
}
