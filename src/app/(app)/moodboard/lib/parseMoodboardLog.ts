import fs from "node:fs";
import path from "node:path";

export type LogEntry = {
  title: string;
  date: string;
  changed: string[];
  ideas: string[];
};

export function parseMoodboardLog(limit = 5): LogEntry[] {
  const file = path.join(process.cwd(), "docs", "moodboard.log.md");
  if (!fs.existsSync(file)) return [];
  const md = fs.readFileSync(file, "utf-8");

  const entries: LogEntry[] = [];
  const lines = md.split(/\r?\n/);

  let current: LogEntry | null = null;
  let bucket: "changed" | "ideas" | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(\S+)\s*(?:—|-)\s*(.+)$/);
    if (h2) {
      if (current) entries.push(current);
      if (entries.length >= limit) break;
      current = { title: h2[2].trim(), date: h2[1].trim(), changed: [], ideas: [] };
      bucket = null;
      continue;
    }
    if (!current) continue;
    if (/^###\s+Changed/i.test(line)) { bucket = "changed"; continue; }
    if (/^###\s+Ideas/i.test(line))   { bucket = "ideas";   continue; }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet && bucket) current[bucket].push(bullet[1].trim());
  }
  if (current && entries.length < limit) entries.push(current);

  return entries;
}
