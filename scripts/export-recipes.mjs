import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  'https://oruplzhfmtehsjbnsoms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDM1NiwiZXhwIjoyMDkwNjM2MzU2fQ.CInXejW7vdTVPwsqCpVUWCOi2Swf6rsPP3n_Of3nma4'
)

let allRecipes = []
let from = 0
const PAGE = 1000

while (true) {
  const { data, error } = await supabase
    .from('recipes')
    .select('title, description, ingredients')
    .order('title')
    .range(from, from + PAGE - 1)

  if (error) { console.error(error); process.exit(1) }
  if (!data.length) break
  allRecipes = allRecipes.concat(data)
  if (data.length < PAGE) break
  from += PAGE
}

console.log(`Fetched ${allRecipes.length} recipes`)

const lines = []
for (const r of allRecipes) {
  lines.push(`TITLE: ${r.title}`)
  lines.push(`DESCRIPTION: ${r.description ?? 'description missing'}`)

  const ingredients = Array.isArray(r.ingredients) ? r.ingredients : []
  if (ingredients.length === 0) {
    lines.push('INGREDIENTS: none listed')
  } else {
    const formatted = ingredients.map(i => {
      const amount = i.amount != null ? i.amount : ''
      const unit = i.unit ?? ''
      const name = i.name ?? ''
      return `  - ${[amount, unit, name].filter(Boolean).join(' ')}`
    }).join('\n')
    lines.push(`INGREDIENTS:\n${formatted}`)
  }
  lines.push('---')
}

writeFileSync('C:/Users/lasse/Desktop/whatscooking/scripts/recipes-export.txt', lines.join('\n'))
console.log('Written to scripts/recipes-export.txt')
