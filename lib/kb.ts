import { promises as fs } from "fs";
import path from "path";

let _cachedKB: string | null = null;
let _cachedPrompt: string | null = null;

export async function loadKnowledgeBase(): Promise<string> {
  if (_cachedKB) return _cachedKB;
  const dir = path.join(process.cwd(), "knowledge-base");
  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parts: string[] = [];
  for (const f of files) {
    const content = await fs.readFile(path.join(dir, f), "utf-8");
    parts.push(`<documento path="${f}">\n${content}\n</documento>`);
  }
  _cachedKB = parts.join("\n\n");
  return _cachedKB;
}

export async function loadSystemPrompt(): Promise<string> {
  if (_cachedPrompt) return _cachedPrompt;
  const filePath = path.join(process.cwd(), "prompts", "system-prompt.md");
  _cachedPrompt = await fs.readFile(filePath, "utf-8");
  return _cachedPrompt;
}
