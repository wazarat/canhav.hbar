"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useChat, type Message } from "ai/react";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Send,
  Loader2,
  AlertTriangle,
  Coins,
  MessageSquare,
  Wallet,
  FileCode,
  ArrowRight,
  Activity,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Receipt,
} from "lucide-react";

const TOPIC_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string; advanced?: boolean }
> = {
  hts: { label: "HTS", icon: Coins, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  hcs: { label: "HCS", icon: MessageSquare, color: "text-pink-400", bgColor: "bg-pink-400/10" },
  account: { label: "Account", icon: Wallet, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  evm: { label: "EVM", icon: FileCode, color: "text-orange-400", bgColor: "bg-orange-400/10", advanced: true },
  defi: { label: "DeFi", icon: Activity, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
  transactions: { label: "Transactions", icon: Receipt, color: "text-violet-400", bgColor: "bg-violet-400/10" },
};

type OnChainEvent = {
  id: string;
  type: string;
  description: string;
  txId?: string;
  timestamp: number;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("ai-studio-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("ai-studio-session", id);
  }
  return id;
}

export default function AIStudioPage() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");

  const [activeTopics, setActiveTopics] = useState<string[]>(() => {
    if (topicParam && TOPIC_CONFIG[topicParam]) return [topicParam];
    return ["hts"];
  });

  const [events, setEvents] = useState<OnChainEvent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, reload, setMessages } =
    useChat({
      api: "/api/ai-studio",
      headers: {
        "x-session-id": getSessionId(),
      },
      body: {
        topics: activeTopics,
      },
      onFinish(message) {
        const txMatches = message.content.match(/0\.0\.\d+@\d+\.\d+/g);
        const topicMatches = message.content.match(/topic\s+(0\.0\.\d+)/gi);
        const tokenMatches = message.content.match(/token\s+(?:ID\s+)?(0\.0\.\d+)/gi);

        if (txMatches || topicMatches || tokenMatches) {
          const newEvents: OnChainEvent[] = [];

          txMatches?.forEach((tx) => {
            newEvents.push({
              id: crypto.randomUUID(),
              type: "transaction",
              description: `Transaction: ${tx}`,
              txId: tx,
              timestamp: Date.now(),
            });
          });

          topicMatches?.forEach((match) => {
            const id = match.match(/0\.0\.\d+/)?.[0];
            if (id) {
              newEvents.push({
                id: crypto.randomUUID(),
                type: "hcs-topic",
                description: `HCS Topic: ${id}`,
                txId: id,
                timestamp: Date.now(),
              });
            }
          });

          tokenMatches?.forEach((match) => {
            const id = match.match(/0\.0\.\d+/)?.[0];
            if (id) {
              newEvents.push({
                id: crypto.randomUUID(),
                type: "token",
                description: `Token: ${id}`,
                txId: id,
                timestamp: Date.now(),
              });
            }
          });

          if (newEvents.length > 0) {
            setEvents((prev) => [...newEvents, ...prev]);
          }
        }
      },
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleTopic(topic: string) {
    setActiveTopics((prev) => {
      if (prev.includes(topic)) {
        const next = prev.filter((t) => t !== topic);
        return next.length === 0 ? ["hts"] : next;
      }
      return [...prev, topic];
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  }

  function clearChat() {
    setMessages([]);
    setEvents([]);
  }

  const hashScanBase = "https://hashscan.io/testnet";

  return (
    <div className="min-h-screen flex flex-col">
      <NavHeader />

      {/* Testnet disclaimer banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
          <span className="text-yellow-200">
            <strong>Testnet Only</strong> — All actions run on Hedera Testnet. No real HBAR value is at risk.
          </span>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Studio</h1>
              <p className="text-sm text-muted-foreground">
                Powered by Hedera Agent Kit v3 — explain, execute, and verify on-chain
              </p>
            </div>
          </div>
        </div>

        {/* Plugin toggles */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Active plugins:</span>
            {Object.entries(TOPIC_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = activeTopics.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleTopic(key)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all border
                    ${isActive
                      ? `${cfg.bgColor} ${cfg.color} border-current`
                      : "bg-muted/30 text-muted-foreground border-transparent hover:border-muted-foreground/30"
                    }
                  `}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                  {cfg.advanced && (
                    <span className="text-[10px] opacity-60 ml-0.5">Advanced</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main layout: Chat + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat panel */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col min-h-[500px]">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-base">Chat</CardTitle>
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearChat}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px]">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Hedera AI Studio
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Ask anything about Hedera or request on-chain actions. Toggle plugins above to scope capabilities.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-6 justify-center">
                        {[
                          "Create an HTS fungible token",
                          "Submit a message to HCS",
                          "What are HTS custom fees?",
                          "Query my account balance",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => {
                              const syntheticEvent = {
                                target: { value: suggestion },
                              } as React.ChangeEvent<HTMLTextAreaElement>;
                              handleInputChange(syntheticEvent);
                              setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m: Message) => (
                    <div
                      key={m.id}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about Hedera or request an on-chain action..."
                      className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] max-h-[120px]"
                      rows={1}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="h-[44px] w-[44px] shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Activity panel */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  On-Chain Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      On-chain events will appear here as the agent executes transactions on Hedera Testnet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-start gap-2 text-xs border-b border-border/50 pb-2 last:border-0"
                      >
                        <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          {evt.type === "transaction" && <ArrowRight className="h-3 w-3 text-primary" />}
                          {evt.type === "hcs-topic" && <MessageSquare className="h-3 w-3 text-pink-400" />}
                          {evt.type === "token" && <Coins className="h-3 w-3 text-yellow-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{evt.description}</p>
                          <p className="text-muted-foreground">
                            {new Date(evt.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {evt.txId && (
                          <a
                            href={`${hashScanBase}/${evt.type === "hcs-topic" ? "topic" : evt.type === "token" ? "token" : "transaction"}/${evt.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active plugins info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeTopics.map((topic) => {
                    const cfg = TOPIC_CONFIG[topic];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <div key={topic} className="flex items-center gap-2 text-xs">
                        <div className={`h-6 w-6 rounded ${cfg.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-3 w-3 ${cfg.color}`} />
                        </div>
                        <div>
                          <span className="font-medium">{cfg.label}</span>
                          {topic === "hts" && <span className="text-muted-foreground ml-1">Token Service</span>}
                          {topic === "hcs" && <span className="text-muted-foreground ml-1">Consensus Service</span>}
                          {topic === "account" && <span className="text-muted-foreground ml-1">Account queries</span>}
                          {topic === "evm" && <span className="text-muted-foreground ml-1">Smart Contracts</span>}
                          {topic === "defi" && <span className="text-muted-foreground ml-1">DeFi analysis</span>}
                          {topic === "transactions" && <span className="text-muted-foreground ml-1">Tx operations</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground p-3 border rounded-lg">
              <p className="font-medium mb-1">Powered by</p>
              <p>Hedera Agent Kit v3 + Vercel AI SDK</p>
              <a
                href="https://hedera.com/blog/whats-new-in-ai-studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Learn more <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
