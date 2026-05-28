import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://oruplzhfmtehsjbnsoms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydXBsemhmbXRlaHNqYm5zb21zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2MDM1NiwiZXhwIjoyMDkwNjM2MzU2fQ.CInXejW7vdTVPwsqCpVUWCOi2Swf6rsPP3n_Of3nma4'
);

let allTitles = [];
let from = 0;
const PAGE = 1000;

while (true) {
  const { data, error } = await supabase
    .from('recipes')
    .select('title')
    .order('title')
    .range(from, from + PAGE - 1);

  if (error) { console.error(error); process.exit(1); }
  if (!data.length) break;

  allTitles.push(...data.map(r => r.title));
  if (data.length < PAGE) break;
  from += PAGE;
}

writeFileSync('recipe-titles.txt', allTitles.join('\n'), 'utf8');
console.log(`Exported ${allTitles.length} recipe titles → recipe-titles.txt`);
