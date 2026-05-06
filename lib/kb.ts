import { promises as fs } from "fs";
import path from "path";

let _cached: string | null = null;

export async function loadKnowledgeBase(): Promise<string> {
  if (_cached) return _cached;
  const dir = path.join(process.cwd(), "knowledge-base");
  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parts: string[] = [];
  for (const f of files) {
    const content = await fs.readFile(path.join(dir, f), "utf-8");
    parts.push(`<documento path="${f}">\n${content}\n</documento>`);
  }
  _cached = parts.join("\n\n");
  return _cached;
}
