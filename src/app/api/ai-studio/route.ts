import { NextRequest } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  buildAIStudioToolkit,
  buildSystemPrompt,
  ALLOWED_TOPICS,
} from "@/agents/ai-studio-agent";
import { submitMessage } from "@/lib/hedera";
import fs from "fs";
import path from "path";

const rateLimiter = new Map<string, { count: number; reset: number }>();
const MAX_CALLS = 10;
const WINDOW_MS = 60_000;

function loadSkillContext(topic: string): string | undefined {
  const skillMap: Record<string, string> = {
    hts: "hts",
    hcs: "hcs",
    evm: "hscs",
    account: "wallets",
    defi: "defi",
    transactions: "costs",
  };

  const folder = skillMap[topic];
  if (!folder) return undefined;

  const filePath = path.join(process.cwd(), "public", "skills", folder, "SKILL.md");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const sessionId = req.headers.get("x-session-id") ?? "anonymous";
  const now = Date.now();
  const entry = rateLimiter.get(sessionId) ?? { count: 0, reset: now + WINDOW_MS };

  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + WINDOW_MS;
  }

  entry.count++;
  rateLimiter.set(sessionId, entry);

  if (entry.count > MAX_CALLS) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Maximum 10 requests per minute.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await req.json();
  const { messages, topics: rawTopics } = body as {
    messages: CoreMessage[];
    topics?: string[];
  };

  const topics = (rawTopics ?? []).filter((t: string) => ALLOWED_TOPICS.has(t));
  if (topics.length === 0) topics.push("hts");

  const skillContext = topics
    .map(loadSkillContext)
    .filter(Boolean)
    .join("\n\n---\n\n");

  const toolkit = await buildAIStudioToolkit({
    topics,
    skillContext: skillContext || undefined,
  });

  const systemPrompt = buildSystemPrompt(
    topics,
    skillContext || undefined
  );

  const hcsTopicId = process.env.AI_STUDIO_HCS_TOPIC_ID;
  if (hcsTopicId) {
    submitMessage(
      hcsTopicId,
      JSON.stringify({
        event: "ai_studio_session",
        sessionId,
        topics,
        timestamp: Date.now(),
      })
    ).catch(() => {});
  }

  const streamOpts: Parameters<typeof streamText>[0] = {
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    maxSteps: 5,
    temperature: 0.3,
    maxTokens: 3000,
  };

  if (!toolkit.fallback && Object.keys(toolkit.tools).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    streamOpts.tools = toolkit.tools as any;
  }

  const result = streamText(streamOpts);

  return result.toDataStreamResponse();
}
