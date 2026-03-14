import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-background border rounded-md p-4 text-xs overflow-x-auto my-4"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-bold mt-8 mb-4">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-semibold mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-muted-foreground list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    }
  }

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
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              /skills/{params.category}/SKILL.md
            </code>
          </p>
        </div>

        <div className="prose-sm">{renderMarkdown(content)}</div>
      </main>
      <Footer />
    </div>
  );
}
