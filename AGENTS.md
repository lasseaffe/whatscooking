# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Logging Mandate — ALL Agents and Non-Agents

**Every agent MUST update their log file after completing any task. This is non-negotiable.**

## Log file locations (`/logs/`):
| Agent | Log File |
|---|---|
| head-chef | `/logs/head_chef_log.txt` |
| architect | `/logs/architect_log.txt` |
| artisan | `/logs/artisan_log.txt` |
| aesthetic-lead | `/logs/aesthetic-lead_log.txt` |
| visual-artist | `/logs/visual-artist_log.txt` |
| motion-designer | `/logs/motion-designer_log.txt` |
| librarian | `/logs/librarian_log.txt` |
| data-steward | `/logs/data-steward_log.txt` |
| salesperson | `/logs/salesperson_log.txt` |
| data-security | `/logs/data_security_log.txt` |

If you are not one of the named agents above, append your entry to `/logs/head_chef_log.txt`.

## Log entry format:
```
YYYY-MM-DD - [Category]: [Task Name]
Achievement: [What was done, which files were changed, what decisions were made, and why.]
```

## Rules:
1. **Before finishing any task** — check your log file and write an entry for what you did.
2. **Date every entry** with the actual current date (not a placeholder).
3. **Be specific** — include file paths, function names, API routes, or CSS class names affected.
4. **Never use placeholders** like `[DATE]`, `[Feature Name]`, or `[Task Name]` — write real content.
5. **head-chef**: Also update the ECOSYSTEM HEALTH section at the bottom of `head_chef_log.txt` after each sprint.
6. **data-security**: Run a review whenever a new API route or Supabase table is added, and log findings.

## Before claiming a task complete:
- [ ] Log entry written with today's date
- [ ] Log entry has real file paths and specifics (not placeholders)
- [ ] If you are head-chef: ECOSYSTEM HEALTH section updated
