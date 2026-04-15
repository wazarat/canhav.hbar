import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { CopyUrlButton } from "@/components/copy-url-button";

function getSkillContent(category: string): string | null {
  const filePath = path.join(
    process.cwd(),
    "public",
    "skills",
    category,
    "SKILL.md"
  );
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

function getSkillFiles(category: string): string[] {
  const dirPath = path.join(process.cwd(), "public", "skills", category);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

function renderInline(text: string, key: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Patterns: `code`, **bold**, *italic*, [link](url)
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code key={`${key}-${m.index}`} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={`${key}-${m.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${key}-${m.index}`}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={`${key}-${m.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let listItems: { key: string; content: React.ReactNode; ordered: boolean; num?: number }[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    const ordered = listItems[0].ordered;
    if (ordered) {
      elements.push(
        <ol key={`ol-${listItems[0].key}`} className="list-decimal ml-5 space-y-1 my-2">
          {listItems.map((li) => (
            <li key={li.key} className="text-sm text-muted-foreground">
              {li.content}
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${listItems[0].key}`} className="list-disc ml-5 space-y-1 my-2">
          {listItems.map((li) => (
            <li key={li.key} className="text-sm text-muted-foreground">
              {li.content}
            </li>
          ))}
        </ul>
      );
    }
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-background border rounded-md p-4 text-xs overflow-x-auto my-4 font-mono"
          >
            {codeLang && (
              <div className="text-muted-foreground text-xs mb-2 border-b pb-1">{codeLang}</div>
            )}
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const orderedMatch = line.match(/^(\d+)\.\s(.+)/);
    const unorderedMatch = line.match(/^[-*]\s(.+)/);

    if (orderedMatch) {
      listItems.push({
        key: `li-${i}`,
        content: renderInline(orderedMatch[2], `li-${i}`),
        ordered: true,
        num: parseInt(orderedMatch[1]),
      });
      continue;
    } else if (unorderedMatch) {
      listItems.push({
        key: `li-${i}`,
        content: renderInline(unorderedMatch[1], `li-${i}`),
        ordered: false,
      });
      continue;
    } else {
      flushList();
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-8 mb-4 first:mt-0">
          {renderInline(line.slice(2), `h1-${i}`)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-6 mb-3 border-b pb-2">
          {renderInline(line.slice(3), `h2-${i}`)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
          {renderInline(line.slice(4), `h3-${i}`)}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={i} className="text-base font-semibold mt-3 mb-1">
          {renderInline(line.slice(5), `h4-${i}`)}
        </h4>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary/40 pl-4 my-3 italic text-muted-foreground text-sm">
          {renderInline(line.slice(2), `bq-${i}`)}
        </blockquote>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-3" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  }

  flushList();
  return elements;
}

export default function SkillCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const content = getSkillContent(params.category);
  if (!content) notFound();

  const files = getSkillFiles(params.category);
  const title = params.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://canhav-hbar.vercel.app";
  const rawUrl = `${appUrl}/skills/${params.category}/SKILL.md`;
  const githubUrl = `https://github.com/wazarat/canhav.hbar/blob/main/public/skills/${params.category}/SKILL.md`;

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/skills">
              <ArrowLeft className="mr-2 h-4 w-4" /> All Skills
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            <Badge variant="outline">{files.length} files</Badge>
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <CopyUrlButton url={rawUrl} />
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Edit on GitHub
              </Button>
            </a>
          </div>
        </div>

        <div className="prose-sm">{renderMarkdown(content)}</div>

        <div className="mt-10 p-5 rounded-lg border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Practice with AI Studio</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try this skill hands-on — the AI Studio agent can explain concepts and execute real transactions on Hedera Testnet, scoped to this topic.
              </p>
              <Link href={`/ai-studio?topic=${params.category}`}>
                <Button size="sm">
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Open in AI Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex items-center justify-between">
          <CopyUrlButton url={rawUrl} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Give this URL to your AI agent
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
