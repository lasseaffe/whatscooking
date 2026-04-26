// Run with: npx tsx scripts/monitor-images.ts
// Or:       npx tsx scripts/monitor-images.ts --dry-run --limit 10

import { runImageMonitor } from "../src/lib/image-monitor";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oruplzhfmtehsjbnsoms.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getArg(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const concurrency = parseInt(getArg("--concurrency") ?? "8", 10);
const limit = parseInt(getArg("--limit") ?? "0", 10);
const dryRun = process.argv.includes("--dry-run");

console.log("🔍 What's Cooking — Image Monitor");
console.log(`   dry-run: ${dryRun}, concurrency: ${concurrency}${limit ? `, limit: ${limit}` : ""}\n`);

async function main() {
  const report = await runImageMonitor({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_KEY,
    concurrency,
    limit,
    dryRun,
  });

  console.log(`📋 ${report.totalRecipes} recipes scanned`);
  console.log(`⚠️  ${report.issues.length} issues found`);

  const byReason: Record<string, number> = { null: 0, broken: 0, duplicate: 0, mismatched: 0 };
  for (const i of report.issues) byReason[i.reason]++;
  if (byReason.null)       console.log(`   • ${byReason.null} missing image_url`);
  if (byReason.broken)     console.log(`   • ${byReason.broken} broken URLs`);
  if (byReason.duplicate)  console.log(`   • ${byReason.duplicate} duplicate URLs`);
  if (byReason.mismatched) console.log(`   • ${byReason.mismatched} mismatched (wrong category)`);

  if (!dryRun) console.log(`✅ ${report.fixed} recipes auto-fixed`);

  const logPath = path.join(process.cwd(), "logs", "image-problems.log");
  const logEntry = [
    `\n[${report.generatedAt}]`,
    `total=${report.totalRecipes} issues=${report.issues.length} fixed=${report.fixed} dryRun=${report.dryRun}`,
    ...report.issues.map(i => `  ${i.reason.padEnd(12)} [${i.id.slice(0, 8)}] ${i.title} → ${i.fixedUrl.slice(0, 60)}`),
  ].join("\n");

  fs.appendFileSync(logPath, logEntry + "\n");
  console.log(`\n📝 Appended to logs/image-problems.log`);

  const reportPath = path.join(process.cwd(), "image-audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📁 Full report saved to image-audit-report.json`);

  if (report.issues.length > 0 && dryRun) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
