"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, ExternalLink, ArrowRight } from "lucide-react";

export type SkillCardData = {
  slug: string;
  title: string;
  description: string;
  fileCount: number;
  rawUrl: string;
  content: string;
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-background text-xs font-mono text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
    >
      {copied ? (
        <Check className="h-3 w-3 text-primary" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="truncate max-w-[200px]">
        {copied ? "Copied!" : label ?? text}
      </span>
    </button>
  );
}

function renderPreviewMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (inCode) {
        elements.push(
          <pre key={`c-${i}`} className="bg-muted/50 border rounded p-3 text-xs overflow-x-auto my-3 font-mono">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.startsWith("# "))
      elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{line.slice(2)}</h1>);
    else if (line.startsWith("## "))
      elements.push(<h2 key={i} className="text-base font-semibold mt-3 mb-1.5 text-foreground">{line.slice(3)}</h2>);
    else if (line.startsWith("### "))
      elements.push(<h3 key={i} className="text-sm font-semibold mt-2 mb-1 text-foreground">{line.slice(4)}</h3>);
    else if (line.startsWith("> "))
      elements.push(<blockquote key={i} className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground text-xs italic">{line.slice(2)}</blockquote>);
    else if (line.startsWith("- ") || line.startsWith("* "))
      elements.push(<li key={i} className="text-xs text-muted-foreground ml-4 list-disc">{line.slice(2)}</li>);
    else if (line.trim() === "")
      elements.push(<div key={i} className="h-1.5" />);
    else
      elements.push(<p key={i} className="text-xs text-muted-foreground leading-relaxed">{line}</p>);
  }
  return elements;
}

export function SkillGrid({
  skills,
  iconEmojis,
}: {
  skills: SkillCardData[];
  iconEmojis: Record<string, string>;
}) {
  const [previewSkill, setPreviewSkill] = useState<SkillCardData | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => (
          <Card
            key={skill.slug}
            className="h-full hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => setPreviewSkill(skill)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-lg">
                  {iconEmojis[skill.slug] || "📄"}
                </div>
                <Badge variant="outline" className="text-xs">
                  {skill.fileCount} {skill.fileCount === 1 ? "file" : "files"}
                </Badge>
              </div>
              <CardTitle className="text-base">{skill.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {skill.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CopyButton text={skill.rawUrl} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={previewSkill !== null}
        onOpenChange={(open) => { if (!open) setPreviewSkill(null); }}
      >
        {previewSkill && (
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg">{previewSkill.title}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 -mt-1">
              <CopyButton text={previewSkill.rawUrl} />
            </div>
            <div className="overflow-y-auto flex-1 pr-2 -mr-2 min-h-0">
              {renderPreviewMarkdown(previewSkill.content)}
            </div>
            <div className="flex items-center justify-between pt-3 border-t mt-3 shrink-0">
              <CopyButton text={previewSkill.rawUrl} label="Copy URL" />
              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/wazarat/canhav.hbar/blob/main/public/skills/${previewSkill.slug}/SKILL.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Edit on GitHub
                  </Button>
                </a>
                <Link href={`/skills/${previewSkill.slug}`} onClick={() => setPreviewSkill(null)}>
                  <Button size="sm">
                    Full Page <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
