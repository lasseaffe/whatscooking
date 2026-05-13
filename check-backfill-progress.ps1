# Check recipe enhancement backfill progress

$env:NEXT_PUBLIC_SUPABASE_URL = (Get-Content .env.local | Select-String "NEXT_PUBLIC_SUPABASE_URL" | ForEach-Object {$_.Line.Split('=')[1]})
$env:SUPABASE_SERVICE_ROLE_KEY = (Get-Content .env.local | Select-String "SUPABASE_SERVICE_ROLE_KEY" | ForEach-Object {$_.Line.Split('=')[1]})

Write-Host "📊 Recipe Enhancement Backfill Progress" -ForegroundColor Cyan
Write-Host "========================================`n"

# Check total recipes
Write-Host "Total recipes in database:" -ForegroundColor Yellow
$totalCount = npx supabase inspect table recipes --json 2>/dev/null | jq '.estimated_row_count' 2>/dev/null || echo "?"

# Check enhanced counts
Write-Host "Recipes with instructions_enhanced:" -ForegroundColor Yellow
$instructionsCount = npx supabase db inspect recipes 2>/dev/null | grep -c "instructions_enhanced" || echo "?"

Write-Host "Recipes with description_enhanced:" -ForegroundColor Yellow
$descriptionCount = npx supabase db inspect recipes 2>/dev/null | grep -c "description_enhanced" || echo "?"

Write-Host "`n⏱️  Backfill started: $(Get-Date)" -ForegroundColor Green
Write-Host "`n📝 Check logs in: backfill-full.log"
Write-Host "   tail -f backfill-full.log (to monitor in real-time)"

Write-Host "`n💡 To see a sample enhanced recipe:"
Write-Host "   1. Open http://localhost:3002/recipes/[id]"
Write-Host "   2. Scroll down to see enhanced description (if available)"
Write-Host "   3. Click 'Enter Cooking Mode' to see enhanced instructions"
