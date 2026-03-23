# Contributing to HederaSkills

PRs from humans and agents are welcome. Before submitting, understand the bar:

## The Rule

**Every line must either fill a verified LLM blind spot about Hedera OR be something the agent needs to teach the developer.**

If a stock LLM already knows something *and* the developer doesn't need to hear it, it doesn't belong here. Some content exists because the agent is a teacher — developers need accurate material about HTS fees, HCS usage patterns, or why Hedera's account model differs from Ethereum. Both are valid reasons for content to exist.

## How to Evaluate a Change

Before adding or modifying content, run the triage process:

1. **Spawn a fresh LLM** — no tools, no skills, no web access. Pure training data.
2. **Give it a realistic Hedera task** that exercises the content you're proposing. Don't ask "do you know X?" — ask it to *build something on Hedera* and examine what it produces.
3. **Classify each item** in your proposed change:
   - **LLM blind spot** — consistently gets this wrong about Hedera → **keep**
   - **Developer needs to learn this** — the agent knows it, but needs to teach it accurately → **keep**
   - **Knows but skips** — knows the concept, won't do it unprompted → **compress to one line**
   - **Does this naturally** — any competent model does this already AND developer doesn't need teaching → **cut**

## Common LLM Blind Spots About Hedera

These are verified misconceptions that stock LLMs have:

- Think Hedera is a blockchain (it's a hashgraph / DAG)
- Don't know HTS creates tokens at protocol level without smart contracts
- Think HBAR fees are gas-based (they're USD-denominated, fixed)
- Assume MEV/frontrunning exists on Hedera (it doesn't — fair ordering)
- Don't know Hedera accounts use `0.0.XXXX` format, not Ethereum addresses
- Think Hedera is proprietary (it's open source under Hiero/Linux Foundation since 2024)
- Don't know about HCS-10/HCS-11 agent identity standards
- Use `wei` instead of `tinybar` for value calculations on HSCS
- Don't know the Governing Council composition or governance model

## Anti-Patterns

- **Don't trust intuition.** "I think agents get this wrong about Hedera" is not evidence. Run the test.
- **Don't ask leading questions.** The LLM will say "yes I know that." Make it *demonstrate* knowledge by building.
- **Don't keep content because it's correct.** Correct ≠ necessary.
- **Don't pad skills with generic blockchain knowledge.** Focus on what's uniquely Hedera.

## Skill File Format

Each skill lives in `public/skills/[category]/SKILL.md`. Follow this structure:

```markdown
# [Topic] — [Service Name]

> One-line summary of what this skill covers.

## What You Probably Got Wrong
- Misconception → Correction
- Misconception → Correction

## [Main Content Sections]
[Explanations, code examples, tables, links]
```

## PR Checklist

- [ ] Ran a baseline test against a stock LLM (no tools/skills)
- [ ] Every item classified as blind spot, needs teaching, or already known
- [ ] "Already known" items removed
- [ ] "Knows but skips" items compressed
- [ ] All facts verified against Hedera docs or on-chain reality
- [ ] Code examples tested or verifiable
