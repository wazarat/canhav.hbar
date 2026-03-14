import OpenAI from "openai";
import fs from "fs";
import path from "path";

let skillsContext: string | null = null;

function loadSkills(): string {
  if (skillsContext) return skillsContext;
  const skillsDir = path.join(process.cwd(), "public", "skills");
  const parts: string[] = [];

  function readDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        readDir(path.join(dir, entry.name));
      } else if (entry.name === "SKILL.md") {
        const content = fs.readFileSync(path.join(dir, entry.name), "utf-8");
        parts.push(content);
      }
    }
  }

  readDir(skillsDir);
  skillsContext = parts.join("\n\n---\n\n");
  return skillsContext;
}

export interface HederaSkillsInput {
  question: string;
  context?: string;
}

export async function runHederaSkillsAgent(
  intake: HederaSkillsInput
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const skills = loadSkills();

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are the CanHav HederaSkills Agent — an expert on building production applications on the Hedera network. You answer questions using the authoritative skill knowledge below. Be specific, cite costs, addresses, and code examples. If the user's question is outside Hedera, say so.

--- HEDERA SKILLS KNOWLEDGE BASE ---
${skills}
--- END KNOWLEDGE BASE ---`,
    },
    {
      role: "user",
      content: intake.context
        ? `Context: ${intake.context}\n\nQuestion: ${intake.question}`
        : intake.question,
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 2000,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? "No response generated.";
}
