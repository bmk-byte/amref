#!/usr/bin/env node
// Classifies PDFs into the H4GT resource library's 6 categories using extracted
// text keyword scoring, falling back to an image-heavy heuristic for photo books.
// Usage: node scripts/classify-pdf.js "<folder>" [--move]

const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const CATEGORIES = {
  Reports: [
    "report", "quarterly", "annual", "profile", "strategy", "monitoring",
    "evaluation", "findings", "summary", "brief", "objectives", "achievements",
    "activities implemented", "program overview",
  ],
  Abstracts: [
    "abstract", "conference", "keywords:", "methodology", "background:",
    "introduction:", "poster presentation", "manuscript", "doi",
  ],
  "Human Interest Stories": [
    "my name is", "her story", "his story", "testimony", "testimonial",
    "when i was", "life changed", "her journey", "his journey",
  ],
  Photos: ["photo book", "photography", "captured by", "photo essay", "gallery"],
  "IEC Materials": [
    "brand book", "logo usage", "brand guideline", "flyer", "poster",
    "brochure", "fact sheet", "campaign material", "communication material",
    "iec material",
  ],
  "Impact Series": [
    "impact series", "before and after", "transformation story", "change story",
    "impact story",
  ],
};

async function classifyFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });

  const textResult = await parser.getText();
  const pageCount = textResult.total;
  const text = textResult.text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let imageCount = 0;
  try {
    const imgResult = await parser.getImage();
    imageCount = imgResult.pages.reduce((sum, p) => sum + p.images.length, 0);
  } catch {
    // image extraction is best-effort
  }

  await parser.destroy();

  const scores = {};
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    scores[category] = keywords.reduce((score, kw) => score + (text.includes(kw) ? 1 : 0), 0);
  }

  const wordsPerPage = pageCount > 0 ? wordCount / pageCount : 0;
  const imagesPerPage = pageCount > 0 ? imageCount / pageCount : 0;
  if (wordsPerPage < 30 && imagesPerPage >= 1) {
    scores.Photos += 3;
  }

  let best = "Uncategorized";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }

  return {
    pageCount,
    wordCount,
    imageCount,
    scores,
    best,
    bestScore,
    sample: text.replace(/\s+/g, " ").trim().slice(0, 200),
  };
}

async function main() {
  const targetDir = process.argv[2];
  const shouldMove = process.argv.includes("--move");

  if (!targetDir) {
    console.error('Usage: node scripts/classify-pdf.js "<folder>" [--move]');
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    console.log("No PDFs found directly in that folder.");
    return;
  }

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    console.log(`\n${file}`);
    try {
      const result = await classifyFile(fullPath);
      console.log(`  pages: ${result.pageCount}, words: ${result.wordCount}, images: ${result.imageCount}`);
      console.log(`  scores: ${JSON.stringify(result.scores)}`);
      console.log(`  => ${result.best} (score ${result.bestScore})`);
      console.log(`  sample: ${result.sample}`);

      if (shouldMove && result.bestScore > 0) {
        const destDir = path.join(targetDir, result.best);
        fs.mkdirSync(destDir, { recursive: true });
        fs.renameSync(fullPath, path.join(destDir, file));
        console.log(`  moved -> ${result.best}/`);
      } else if (shouldMove) {
        console.log("  not moved (no confident match) - left in place for manual review");
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }
}

main();
