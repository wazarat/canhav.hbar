import fs from "fs";
import path from "path";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { SkillGrid, type SkillCardData } from "@/components/skill-card";

const iconEmojis: Record<string, string> = {
  hts: "🪙",
  hcs: "📝",
  hscs: "📜",
  wallets: "👛",
  security: "🛡️",
  costs: "💰",
  "ai-agents": "🤖",
  enterprise: "🏢",
  ship: "🚀",
  tools: "🔧",
  "why-hedera": "❓",
  addresses: "📍",
  defi: "🏗️",
  testing: "🧪",
  indexing: "🔎",
  concepts: "💡",
  protocol: "📋",
};

function getSkillCategories(): SkillCardData[] {
  const skillsDir = path.join(process.cwd(), "public", "skills");
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://canhav-hbar.vercel.app";

  return entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const dirPath = path.join(skillsDir, dir.name);
      const files = fs.readdirSync(dirPath);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      const skillMdPath = path.join(dirPath, "SKILL.md");
      let description = "";
      let content = "";
      if (fs.existsSync(skillMdPath)) {
        content = fs.readFileSync(skillMdPath, "utf-8");
        const cleanLines = content.split("\n").filter((l) => {
          const t = l.trim();
          return t && !t.startsWith("#") && !t.startsWith("[HederaSkills]") && !t.startsWith(">");
        });
        const firstLine = cleanLines[0]?.trim() ?? "";
        description = firstLine.slice(0, 140) + (firstLine.length > 140 ? "..." : "");
      }

      return {
        slug: dir.name,
        title: dir.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        description,
        fileCount: mdFiles.length,
        rawUrl: `${appUrl}/skills/${dir.name}/SKILL.md`,
        content,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export default function SkillsPage() {
  const categories = getSkillCategories();

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mb-12">
          <Badge variant="secondary" className="mb-4">
            Knowledge Layer
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            HederaSkills Catalog
          </h1>
          <p className="text-lg text-muted-foreground">
            Agent-consumable Hedera knowledge. Plain markdown files — any AI
            agent can fetch and use them. No auth, no JavaScript required.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Click any card to preview. Copy the URL and give it to your AI agent.
          </p>
        </div>

        <SkillGrid skills={categories} iconEmojis={iconEmojis} />

        <div className="mt-16 p-6 rounded-lg border bg-muted/30">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">For AI Agents</h3>
              <p className="text-sm text-muted-foreground mb-2">
                All skill files are served as static markdown at predictable
                URLs. Your agent can fetch them directly:
              </p>
              <pre className="bg-background border rounded-md p-3 text-xs overflow-x-auto font-mono">
                {`curl https://canhav-hbar.vercel.app/skills/hts/SKILL.md
curl https://canhav-hbar.vercel.app/skills/hscs/SKILL.md
curl https://canhav-hbar.vercel.app/skills/security/SKILL.md`}
              </pre>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
