/**
 * One-time script: create HCS audit topic on Hedera testnet.
 *
 * Usage (from repo root):
 *   pnpm hbar:create-audit-topic
 *
 * Requires HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env.local
 */
async function main() {
  const { createAuditTopic } = await import("../lib/hedera-client");
  const topicId = await createAuditTopic();
  console.log("\nHCS audit topic created:", topicId);
  console.log("\nAdd to .env.local:");
  console.log(`HBAR_AUDIT_TOPIC_ID=${topicId}`);
  console.log(
    `\nHashScan: https://hashscan.io/testnet/topic/${topicId}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
