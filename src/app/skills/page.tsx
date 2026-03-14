import Link from "next/link";
import fs from "fs";
import path from "path";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Shield,
  Coins,
  FileText,
  Globe,
  Layers,
  Wallet,
  Cpu,
  Bot,
  Rocket,
  Wrench,
  HelpCircle,
  Code,
  Map,
} from "lucide-react";

type SkillCategory = {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  fileCount: number;
};

const iconMap: Record<string, React.ElementType> = {
  hts: Coins,
  hcs: FileText,
  hscs: Code,
  wallets: Wallet,
  security: Shield,
  costs: Coins,
  "ai-agents": Bot,
  enterprise: Globe,
  ship: Rocket,
  tools: Wrench,
  "why-hedera": HelpCircle,
  addresses: Map,
  defi: Layers,
};

function getSkillCategories(): SkillCategory[] {
  const skillsDir = path.join(process.cwd(), "public", "skills");
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  return entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const dirPath = path.join(skillsDir, dir.name);
      const files = fs.readdirSync(dirPath);
      const mdFiles = files.filter((f) => f.endsWith(".md"));

      const skillMdPath = path.join(dirPath, "SKILL.md");
      let description = "";
      if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, "utf-8");
        const firstParagraph = content
          .split("\n")
          .filter((l) => l.trim() && !l.startsWith("#"))[0];
        description = firstParagraph?.trim() ?? "";
      }

      return {
        slug: dir.name,
        title: dir.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        description: description.slice(0, 120) + (description.length > 120 ? "..." : ""),
        icon: iconMap[dir.name] || Cpu,
        fileCount: mdFiles.length,
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
            Endpoint:{" "}
            <code className="bg-muted px-2 py-0.5 rounded text-xs">
              /skills/[category]/SKILL.md
            </code>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.slug} href={`/skills/${cat.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{cat.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {cat.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">
                      {cat.fileCount} {cat.fileCount === 1 ? "file" : "files"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 p-6 rounded-lg border bg-muted/30">
          <div className="flex items-start gap-4">
            <BookOpen className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">For AI Agents</h3>
              <p className="text-sm text-muted-foreground mb-2">
                All skill files are served as static markdown at predictable
                URLs. Your agent can fetch them directly:
              </p>
              <pre className="bg-background border rounded-md p-3 text-xs overflow-x-auto">
                {`curl https://canhav.hbar/skills/hts/SKILL.md\ncurl https://canhav.hbar/skills/hscs/SKILL.md`}
              </pre>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
