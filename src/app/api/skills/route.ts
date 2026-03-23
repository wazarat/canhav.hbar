import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const skillsDir = path.join(process.cwd(), "public", "skills");
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  const categories = entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const dirPath = path.join(skillsDir, dir.name);
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));

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
        description: description.slice(0, 200),
        fileCount: files.length,
        files,
      };
    });

  return NextResponse.json({ categories });
}
