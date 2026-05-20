import { describe, it, expect } from 'vitest';
import { marked } from 'marked';
import { configureMarked, createTurndownService, htmlToMarkdown } from '../utils/markdown';

describe('Vertical Slide Preservation', () => {
  it('should preserve ---- through markdown -> HTML -> markdown roundtrip', () => {
    configureMarked();
    const turndownService = createTurndownService();
    
    const originalMarkdown = `## Slide 1

----

## Slide 2 (vertical)

---

## Slide 3`;
    
    const html = marked(originalMarkdown);
    console.log('HTML:', html);
    
    const roundtripMarkdown = htmlToMarkdown(html, turndownService);
    console.log('Roundtrip:', roundtripMarkdown);
    
    expect(roundtripMarkdown).toContain('----');
    expect(roundtripMarkdown).toContain('---');
    
    const verticalCount = (roundtripMarkdown.match(/^----$/gm) || []).length;
    const horizontalCount = (roundtripMarkdown.match(/^---$/gm) || []).length;
    
    expect(verticalCount).toBe(1);
    expect(horizontalCount).toBe(1);
  });
});
