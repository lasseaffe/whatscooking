const { scrapeUrl } = require('../lib/scraper'); // Note: Use require if running via plain node

const recipeUrls = [
  'https://site.com/recipe-1',
  'https://site.com/recipe-2'
];

async function runImport() {
  console.log("Starting bulk import...");
  for (const url of recipeUrls) {
    const data = await scrapeUrl(url);
    console.log(`Imported: ${data.title}`);
    // Here you would typically run a Supabase/Prisma "insert" command
  }
}

runImport();