#!/usr/bin/env node
// fix-descriptions-standard.mjs — live streaming progress for standard recipes
import http from "http";

const body = JSON.stringify({ dryRun: false, onlyPremium: false, limit: 500 });

console.log("Fixing descriptions for STANDARD (non-premium) recipes...");
console.log("Make sure 'npm run dev' is running first!\n");

const req = http.request(
  {
    hostname: "localhost",
    port: 3002,
    path: "/api/admin/fix-descriptions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  },
  (res) => {
    let buf = "";
    res.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n");
      buf = lines.pop(); // keep incomplete last line
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const j = JSON.parse(line);
          switch (j.event) {
            case "start":
              console.log(`[START] ${j.candidates} candidates out of ${j.total} recipes`);
              break;
            case "progress":
              process.stdout.write(`[${j.index}/${j.of}] ${j.title} ... `);
              break;
            case "item": {
              const icon = j.status === "updated" ? "OK" : j.status === "dry_run" ? "DRY" : "SKIP";
              console.log(`[${icon}]`);
              break;
            }
            case "done":
              console.log(`\n[DONE] Rewritten: ${j.rewritten}  Failed: ${j.failed}  Candidates: ${j.candidates}`);
              break;
            case "error":
              console.error(`[ERROR] ${j.message}: ${j.detail ?? ""}`);
              break;
          }
        } catch {
          console.log(line);
        }
      }
    });
    res.on("end", () => {
      if (buf.trim()) console.log(buf);
    });
  },
);

req.on("error", (e) => {
  console.error(`\n[ERROR] Could not connect: ${e.message}`);
  console.error("Is 'npm run dev' running on port 3002?");
  process.exit(1);
});

req.write(body);
req.end();
