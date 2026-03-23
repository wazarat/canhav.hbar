import OpenAI from "openai";

export interface ContractAuditorInput {
  contractSource: string;
  contractName?: string;
}

const HEDERA_AUDIT_CHECKLIST = `
HEDERA-SPECIFIC SOLIDITY AUDIT CHECKLIST:
1. HBAR units: msg.value on Hedera EVM uses tinybars (1e8), NOT wei (1e18). Check all value calculations.
2. System contracts: HTS precompile at 0x167 — verify correct usage of associateToken, transferToken.
3. Gas limits: Hedera gas schedule differs from Ethereum. Functions with many storage writes may hit limits sooner.
4. No MEV: Hedera has no MEV/front-running risk due to hashgraph ordering — sandwich attack defenses are unnecessary.
5. Key management: If using HTS tokens with admin/freeze/wipe keys, verify key permissions are minimal.
6. Scheduled transactions (HIP-755): If using on-chain scheduling, verify temporal constraints.
7. Account abstraction: Hedera accounts differ from Ethereum EOAs — verify msg.sender assumptions.
8. OpenZeppelin: Confirm OZ version compatibility with Solidity 0.8.24 on HSCS.
9. Reentrancy: Still relevant on HSCS — check for reentrancy in payable functions.
10. Access control: Verify onlyOwner, role-based patterns. Check constructor sets correct initial owner.
11. Integer overflow: Solidity 0.8.x has built-in overflow checks, but verify unchecked blocks.
12. Fee handling: If platform fees use basis points, verify fee + payout = total (no dust).
`;

export async function runContractAuditorAgent(
  intake: ContractAuditorInput
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are the CanHav Contract Auditor Agent — a security auditor specialized in Solidity smart contracts deployed on Hedera's HSCS (EVM). Analyze the provided contract source code using the Hedera-specific audit checklist below. For each finding, rate severity (Critical/High/Medium/Low/Info) and provide the fix.

${HEDERA_AUDIT_CHECKLIST}

Output format:
## Audit Report: [ContractName]
### Summary
[1-2 sentence overview]
### Findings
[Numbered list with severity, description, location, recommendation]
### Hedera-Specific Notes
[Any Hedera-unique observations]
### Overall Risk: [Low/Medium/High/Critical]`,
    },
    {
      role: "user",
      content: `${intake.contractName ? `Contract: ${intake.contractName}\n\n` : ""}${intake.contractSource}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 3000,
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content ?? "No response generated.";
}
