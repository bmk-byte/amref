// One-off backfill: render page-1 thumbnails for existing PDFs and upload them to Storage.
// Usage: node scripts/backfill-thumbnails.js <supabase-url> <access-token>
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const SUPABASE_URL = process.argv[2];
const TOKEN = process.argv[3];
const APIKEY = "sb_publishable_R_5pEQQ-fS0qBPj4h4qltQ_MnIbN43l";

const folder = "C:\\Users\\Administrator\\Downloads\\Heroes Folder";

const files = [
  { path: `${folder}\\Reports\\Heroes-July-Sept-Newsletter-1.pdf`, dest: "reports/thumbnails/Heroes-July-Sept-Newsletter-1.png" },
  { path: `${folder}\\Reports\\HEROES-Newsletter-2.pdf`, dest: "reports/thumbnails/HEROES-Newsletter-2.png" },
  { path: `${folder}\\Reports\\Heroes-updated-project-profile.pdf`, dest: "reports/thumbnails/Heroes-updated-project-profile.png" },
  { path: `${folder}\\Reports\\Heroes-for-Gender-Transformative-Communicaiton-Strategy-.pdf`, dest: "reports/thumbnails/Heroes-for-Gender-Transformative-Communication-Strategy.png" },
  { path: `${folder}\\Reports\\HEROE PROGRAM BRIEF.pdf`, dest: "reports/thumbnails/HEROES-Program-Brief.png" },
  { path: `${folder}\\Reports\\Report Heroe.pdf`, dest: "reports/thumbnails/Meaningful-Youth-Engagement-Strategy.png" },
  { path: `${folder}\\Photos\\AMREF-HEROES-PHOTO-BOOK.pdf`, dest: "photos/thumbnails/AMREF-HEROES-PHOTO-BOOK.png" },
  { path: `${folder}\\Photos\\HEROES FOR GENDER-3.pdf`, dest: "photos/thumbnails/HEROES-FOR-GENDER-3.png" },
  { path: `${folder}\\IEC Materials\\HEROES Program Brand book.pdf`, dest: "iec-materials/thumbnails/HEROES-Program-Brand-Book.png" },
];

async function main() {
  for (const f of files) {
    try {
      const buffer = fs.readFileSync(f.path);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getScreenshot({ partial: [1], desiredWidth: 600 });
      const png = Buffer.from(result.pages[0].data);
      await parser.destroy();

      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/h4gt-assets/${f.dest}`, {
        method: "POST",
        headers: {
          apikey: APIKEY,
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "image/png",
        },
        body: png,
      });

      if (res.ok) {
        console.log(`OK   ${f.dest} (${png.length} bytes)`);
      } else {
        console.log(`FAIL ${f.dest}: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.log(`ERROR ${f.path}: ${err.message}`);
    }
  }
}

main();
