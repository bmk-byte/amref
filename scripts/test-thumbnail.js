const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function main() {
  const filePath = process.argv[2];
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getScreenshot({ partial: [1], desiredWidth: 600 });
  const page = result.pages[0];
  fs.writeFileSync("test-thumb.png", Buffer.from(page.data));
  console.log(`OK: ${page.width}x${page.height}, bytes: ${page.data.length}`);
  await parser.destroy();
}

main().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
