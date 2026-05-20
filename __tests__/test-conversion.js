import TurndownService from 'turndown';
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createTurndownService, htmlToMarkdown, configureMarked } from '../utils/markdown.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFile = join(__dirname, 'test.md');
const outputFile = join(__dirname, 'test-output.md');

console.log('🧪 Testing Markdown Conversion\n');

configureMarked();

const originalMarkdown = readFileSync(testFile, 'utf-8');
console.log('✅ Read original test.md file\n');

console.log('📝 Converting markdown → HTML → markdown...\n');

const html = marked(originalMarkdown);
console.log('✅ Converted to HTML\n');

const turndownService = createTurndownService();
const convertedMarkdown = htmlToMarkdown(html, turndownService);

writeFileSync(outputFile, convertedMarkdown);
console.log(`✅ Wrote converted markdown to ${outputFile}\n`);

console.log('🔍 Checking for issues...\n');

const issues = [];

if (convertedMarkdown.includes('* * *')) {
  issues.push('❌ FAIL: Found "* * *" instead of "---"');
}

if (convertedMarkdown.match(/-\s{3,}/)) {
  issues.push('❌ FAIL: Found list items with extra spaces "-   "');
}

if (convertedMarkdown.match(/^\d+\.\s{3,}/m)) {
  issues.push('❌ FAIL: Found ordered list items with extra spaces "1.   "');
}

const listItemPattern = /^- .+$/gm;
const listMatches = convertedMarkdown.match(listItemPattern);
if (listMatches) {
  const listSection = convertedMarkdown.substring(
    convertedMarkdown.indexOf(listMatches[0]),
    convertedMarkdown.lastIndexOf(listMatches[listMatches.length - 1]) + listMatches[listMatches.length - 1].length
  );
  
  if (listSection.match(/^- .+\n\n- .+/m)) {
    issues.push('❌ FAIL: Found blank lines between consecutive list items');
  }
}

if (convertedMarkdown.includes('\\[1\\]')) {
  issues.push('❌ FAIL: Found escaped brackets "\\[1\\]" instead of "[1]"');
}

const hrMatches = convertedMarkdown.match(/^---$/gm);
const originalHrMatches = originalMarkdown.match(/^---$/gm);

if (!originalHrMatches || originalHrMatches.length === 0) {
  issues.push('⚠️  WARNING: No horizontal rules found in original markdown');
} else if (!hrMatches || hrMatches.length !== originalHrMatches.length - 2) {
  issues.push(`❌ FAIL: Expected ${originalHrMatches.length - 2} horizontal rules, found ${hrMatches?.length || 0}`);
}

if (issues.length === 0) {
  console.log('✅ All checks passed!\n');
  console.log('📊 Statistics:');
  console.log(`   - Original length: ${originalMarkdown.length} chars`);
  console.log(`   - Converted length: ${convertedMarkdown.length} chars`);
  console.log(`   - Horizontal rules: ${hrMatches?.length || 0}`);
  console.log(`   - List items: ${listMatches?.length || 0}`);
} else {
  console.log('⚠️  Issues found:\n');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n');
  process.exit(1);
}
