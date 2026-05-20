import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createTurndownService, htmlToMarkdown } from '../utils/markdown.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFile = join(__dirname, 'test.md');
const htmlOutputFile = join(__dirname, 'test-output.html');
const roundtripOutputFile = join(__dirname, 'test-roundtrip.md');

console.log('🧪 Testing Full Markdown ↔ HTML Conversion\n');

const originalMarkdown = readFileSync(testFile, 'utf-8');
console.log('✅ Read original test.md file\n');

console.log('📝 Step 1: Markdown → HTML...\n');
const html = marked(originalMarkdown);
writeFileSync(htmlOutputFile, html);
console.log(`✅ Converted to HTML (${html.length} chars)`);
console.log(`✅ Wrote HTML to ${htmlOutputFile}\n`);

console.log('📝 Step 2: HTML → Markdown (roundtrip)...\n');
const turndownService = createTurndownService();
const roundtripMarkdown = htmlToMarkdown(html, turndownService);
writeFileSync(roundtripOutputFile, roundtripMarkdown);
console.log(`✅ Converted back to Markdown (${roundtripMarkdown.length} chars)`);
console.log(`✅ Wrote roundtrip markdown to ${roundtripOutputFile}\n`);

console.log('🔍 Analyzing HTML output...\n');

const htmlIssues = [];

const hrCount = (html.match(/<hr>/g) || []).length;
const originalHrCount = (originalMarkdown.match(/^---$/gm) || []).length - 2;
console.log(`   Horizontal rules: ${hrCount} (expected ~${originalHrCount})`);

const h1Count = (html.match(/<h1>/g) || []).length;
const h2Count = (html.match(/<h2>/g) || []).length;
const h3Count = (html.match(/<h3>/g) || []).length;
console.log(`   Headings: ${h1Count} H1, ${h2Count} H2, ${h3Count} H3`);

const ulCount = (html.match(/<ul>/g) || []).length;
const olCount = (html.match(/<ol>/g) || []).length;
const liCount = (html.match(/<li>/g) || []).length;
console.log(`   Lists: ${ulCount} unordered, ${olCount} ordered, ${liCount} total items`);

const strongCount = (html.match(/<strong>/g) || []).length;
const emCount = (html.match(/<em>/g) || []).length;
console.log(`   Formatting: ${strongCount} bold, ${emCount} italic\n`);

if (!html.includes('<hr>')) {
  htmlIssues.push('❌ FAIL: No <hr> tags found in HTML');
}

if (!html.includes('<ul>') && originalMarkdown.includes('- ')) {
  htmlIssues.push('❌ FAIL: No <ul> tags found but markdown has bullet lists');
}

if (!html.includes('<ol>') && originalMarkdown.includes('1. ')) {
  htmlIssues.push('❌ FAIL: No <ol> tags found but markdown has ordered lists');
}

if (!html.includes('<strong>') && originalMarkdown.includes('**')) {
  htmlIssues.push('❌ FAIL: No <strong> tags found but markdown has bold text');
}

console.log('🔍 Analyzing roundtrip conversion...\n');

const roundtripIssues = [];

if (roundtripMarkdown.includes('* * *')) {
  roundtripIssues.push('❌ FAIL: Found "* * *" instead of "---"');
}

if (roundtripMarkdown.match(/-\s{3,}/)) {
  roundtripIssues.push('❌ FAIL: Found list items with extra spaces "-   "');
}

if (roundtripMarkdown.match(/^\d+\.\s{3,}/m)) {
  roundtripIssues.push('❌ FAIL: Found ordered list items with extra spaces "1.   "');
}

const roundtripHrCount = (roundtripMarkdown.match(/^---$/gm) || []).length;
console.log(`   Horizontal rules: ${roundtripHrCount} (original had ${originalHrCount})`);

const roundtripListItems = (roundtripMarkdown.match(/^- .+$/gm) || []).length;
const originalListItems = (originalMarkdown.match(/^- .+$/gm) || []).length;
console.log(`   List items: ${roundtripListItems} (original had ${originalListItems})`);

const roundtripOrderedItems = (roundtripMarkdown.match(/^\d+\. .+$/gm) || []).length;
const originalOrderedItems = (originalMarkdown.match(/^\d+\. .+$/gm) || []).length;
console.log(`   Ordered list items: ${roundtripOrderedItems} (original had ${originalOrderedItems})`);

const roundtripBold = (roundtripMarkdown.match(/\*\*.+?\*\*/g) || []).length;
const originalBold = (originalMarkdown.match(/\*\*.+?\*\*/g) || []).length;
console.log(`   Bold text: ${roundtripBold} (original had ${originalBold})`);

const listItemPattern = /^- .+$/gm;
const listMatches = roundtripMarkdown.match(listItemPattern);
if (listMatches) {
  const listSection = roundtripMarkdown.substring(
    roundtripMarkdown.indexOf(listMatches[0]),
    roundtripMarkdown.lastIndexOf(listMatches[listMatches.length - 1]) + listMatches[listMatches.length - 1].length
  );
  
  if (listSection.match(/^- .+\n\n- .+/m)) {
    roundtripIssues.push('❌ FAIL: Found blank lines between consecutive list items');
  }
}

if (roundtripMarkdown.includes('\\[1\\]')) {
  roundtripIssues.push('❌ FAIL: Found escaped brackets "\\[1\\]" instead of "[1]"');
}

console.log('\n📊 Comparison:\n');
console.log(`   Original markdown:  ${originalMarkdown.length} chars`);
console.log(`   HTML output:        ${html.length} chars`);
console.log(`   Roundtrip markdown: ${roundtripMarkdown.length} chars`);

const lengthDiff = Math.abs(roundtripMarkdown.length - originalMarkdown.length);
const lengthDiffPercent = ((lengthDiff / originalMarkdown.length) * 100).toFixed(1);
console.log(`   Length difference:  ${lengthDiff} chars (${lengthDiffPercent}%)\n`);

if (htmlIssues.length > 0) {
  console.log('⚠️  HTML Conversion Issues:\n');
  htmlIssues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n');
}

if (roundtripIssues.length > 0) {
  console.log('⚠️  Roundtrip Conversion Issues:\n');
  roundtripIssues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n');
}

if (htmlIssues.length === 0 && roundtripIssues.length === 0) {
  console.log('✅ All conversion checks passed!\n');
  console.log('🎉 The markdown ↔ HTML conversion is working correctly!\n');
} else {
  console.log('❌ Some conversion issues detected. See details above.\n');
  process.exit(1);
}
