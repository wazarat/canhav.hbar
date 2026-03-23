[HederaSkills](index.html) / ai-agents

        # AI on Hedera

Hedera is betting heavily on AI — from governance audit trails to agent identity standards. Here's what's real today and what's emerging.





          ## ⚠ What You Probably Got Wrong

            - **"AI + blockchain is all hype."** — On most chains, yes. On Hedera, HCS provides a genuinely useful primitive: a $0.0001 immutable timestamped log. For AI governance (audit trails, decision logging, model provenance), this is exactly what regulators are starting to require.
            - **"Hedera has no AI ecosystem."** — There's a growing ecosystem: Standards Working Group for agent identity, HCS-10/HCS-11 proposals for agent communication, multiple AI-focused projects, and a dedicated AI agent track in hackathons.
            - **"I need a special blockchain for AI."** — You don't need a blockchain at all. You need: (1) an immutable log for audit trails (HCS), (2) identity for agents (HTS + accounts), (3) payment rails (HBAR). Hedera provides all three cheaply.



        ## Why Hedera for AI Agents

Three things make Hedera uniquely suited for AI agent infrastructure:

        ### 1. HCS for Audit Trails — $0.0001 per log entry

Every AI decision, model invocation, and output can be logged to HCS with a consensus timestamp. This creates a tamper-proof record that proves *what* the AI decided, *when* it decided, and *what inputs* it had.

```
// Log an AI agent decision to HCS
const msg = new TopicMessageSubmitTransaction()
  .setTopicId(auditTopicId)
  .setMessage(JSON.stringify({
    agent_id: "0.0.5678",
    action: "trade_execution",
    model: "gpt-4-turbo",
    input_hash: "sha256:a1b2c3...",
    output_hash: "sha256:d4e5f6...",
    decision: "BUY 100 HBAR",
    confidence: 0.87,
    timestamp: Date.now()
  }));

await msg.execute(client);
// Cost: $0.0001 — log 10,000 decisions for $1
```

        ### 2. Agent Identity — Onchain Accounts

Each AI agent gets a Hedera account (`0.0.XXXX`) that serves as its onchain identity. The account can:


          - Hold HBAR for paying transaction fees
          - Hold HTS tokens (credentials, reputation tokens)
          - Have its key managed by the agent's operator
          - Be associated with metadata via HCS topics


        ### 3. Cheap Payment Rails

Agent-to-agent and agent-to-service micropayments at $0.001 per transfer. This enables AI agents to pay for API calls, data feeds, and other agent services without the overhead of Ethereum gas fees.

        ## Emerging Standards

        ### HCS-10: Agent Communication Protocol

A proposed standard for AI agent communication via HCS topics. Agents register on a shared topic, discover each other, and exchange messages through dedicated HCS channels. Still in proposal stage but actively developed.

        ### HCS-11: Agent Identity & Profile

A proposed standard for onchain AI agent profiles — linking a Hedera account to agent metadata (capabilities, model info, operator, trust score). Think of it as an ENS-like profile system for AI agents.

        ## AI-Focused Projects on Hedera




                Project
                Focus
                Status



              NeuronAI model marketplace and inferenceActive development
              SentXAI-powered analytics and trading signalsLive
              KiloScribeAI content creation with onchain provenanceLive
              Bonzo AI AgentDeFi assistant for Bonzo FinanceLive
              HashGuard AISmart contract security analysisDevelopment




        ## Hello Future Hackathon — AI Agent Track

Hedera regularly runs hackathons with dedicated AI tracks, signaling the ecosystem's strategic commitment to AI agents. The Hello Future hackathon has featured:


          - AI agent communication via HCS
          - Decentralized AI governance frameworks
          - Agent-to-agent payment systems
          - AI model provenance and audit trails




**For AI agent builders:** Start with HCS for audit logging — it's production-ready, costs nearly nothing, and satisfies emerging regulatory requirements for AI transparency. Add agent identity via Hedera accounts. Use HBAR for micropayments. The HCS-10/HCS-11 standards are worth tracking but not yet production-ready.





      [← Enterprise](enterprise.html)
      [All Skills](index.html)
      [Security →](security.html)