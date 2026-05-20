import { describe, it, expect } from 'vitest';
import { createTurndownService, htmlToMarkdown, postProcessMarkdown } from './markdown';

describe('Markdown Conversion', () => {
  describe('postProcessMarkdown', () => {
    it('should convert * * * to ---', () => {
      const input = '## Heading\n\n* * *\n\n## Another Heading';
      const expected = '## Heading\n\n---\n\n## Another Heading';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should convert - - - to ---', () => {
      const input = '## Heading\n\n- - -\n\n## Another Heading';
      const expected = '## Heading\n\n---\n\n## Another Heading';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should convert _ _ _ to ---', () => {
      const input = '## Heading\n\n_ _ _\n\n## Another Heading';
      const expected = '## Heading\n\n---\n\n## Another Heading';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should unescape numbered references like [1]', () => {
      const input = 'Some text \\[1\\] and \\[2\\]';
      const expected = 'Some text [1] and [2]';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should remove extra spaces after list markers', () => {
      const input = '-   Item 1\n-   Item 2\n-   Item 3';
      const expected = '- Item 1\n- Item 2\n- Item 3';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should remove extra spaces after ordered list markers', () => {
      const input = '1.   Item 1\n2.   Item 2\n3.   Item 3';
      const expected = '1. Item 1\n2. Item 2\n3. Item 3';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should remove blank lines between consecutive list items', () => {
      const input = '- Item 1\n\n- Item 2\n\n- Item 3';
      const expected = '- Item 1\n- Item 2\n- Item 3';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should remove blank lines between consecutive ordered list items', () => {
      const input = '1. Item 1\n\n2. Item 2\n\n3. Item 3';
      const expected = '1. Item 1\n2. Item 2\n3. Item 3';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should preserve blank lines that are not between list items', () => {
      const input = '- Item 1\n\nSome paragraph\n\n- Item 2';
      const expected = '- Item 1\n\nSome paragraph\n\n- Item 2';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should format multi-line HTML comments', () => {
      const input = '<!--This is a comment\nwith multiple lines-->';
      const expected = '<!--\nThis is a comment\nwith multiple lines\n-->';
      expect(postProcessMarkdown(input)).toBe(expected);
    });

    it('should preserve single-line HTML comments', () => {
      const input = '<!--This is a single line comment-->';
      expect(postProcessMarkdown(input)).toBe(input);
    });
  });

  describe('htmlToMarkdown', () => {
    const turndownService = createTurndownService();

    it('should convert horizontal rule correctly', () => {
      const html = '<p>Before</p><hr><p>After</p>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('---');
      expect(result).not.toContain('* * *');
    });

    it('should convert unordered lists without extra spaces', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
      expect(result).toContain('- Item 3');
      expect(result).not.toContain('-   ');
    });

    it('should convert ordered lists without extra spaces', () => {
      const html = '<ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('1. Item 1');
      expect(result).toContain('2. Item 2');
      expect(result).toContain('3. Item 3');
      expect(result).not.toContain('.   ');
    });

    it('should not have blank lines between list items', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const result = htmlToMarkdown(html, turndownService);
      const lines = result.split('\n');
      
      const listItemIndices = lines
        .map((line, index) => (line.startsWith('- ') ? index : -1))
        .filter(index => index !== -1);
      
      for (let i = 0; i < listItemIndices.length - 1; i++) {
        const currentIndex = listItemIndices[i];
        const nextIndex = listItemIndices[i + 1];
        expect(nextIndex - currentIndex).toBe(1);
      }
    });

    it('should preserve strong (bold) formatting', () => {
      const html = '<p>This is <strong>bold</strong> text</p>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('**bold**');
    });

    it('should preserve emphasis (italic) formatting', () => {
      const html = '<p>This is <em>italic</em> text</p>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('*italic*');
    });

    it('should convert headings correctly', () => {
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('# Heading 1');
      expect(result).toContain('## Heading 2');
      expect(result).toContain('### Heading 3');
    });

    it('should handle Reveal.js slide separator format', () => {
      const html = '<h2>Slide 1</h2><p>Content</p><hr><h2>Slide 2</h2><p>More content</p>';
      const result = htmlToMarkdown(html, turndownService);
      
      expect(result).toContain('## Slide 1');
      expect(result).toContain('---');
      expect(result).toContain('## Slide 2');
      expect(result).not.toContain('* * *');
    });

    it('should preserve HTML comments for Reveal.js notes', () => {
      const html = '<p>Slide content</p><!--Note: This is a speaker note-->';
      const result = htmlToMarkdown(html, turndownService);
      expect(result).toContain('<!--Note: This is a speaker note-->');
    });
  });

  describe('createTurndownService', () => {
    it('should create a TurndownService instance', () => {
      const service = createTurndownService();
      expect(service).toBeDefined();
      expect(typeof service.turndown).toBe('function');
    });

    it('should accept custom options', () => {
      const service = createTurndownService({
        bulletListMarker: '*',
        hr: '___'
      });
      expect(service).toBeDefined();
    });
  });

  describe('Reveal.js Integration', () => {
    const turndownService = createTurndownService();

    it('should handle a complete Reveal.js slide deck structure', () => {
      const html = `
        <h1>Title Slide</h1>
        <p>Subtitle</p>
        <hr>
        <h2>Slide 2</h2>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
          <li>Point 3</li>
        </ul>
        <hr>
        <h2>Slide 3</h2>
        <p>Content here</p>
        <!--Note: Speaker notes go here-->
      `;
      
      const result = htmlToMarkdown(html, turndownService);
      
      expect(result).toContain('# Title Slide');
      expect(result).toContain('---');
      expect(result).toContain('## Slide 2');
      expect(result).toContain('- Point 1');
      expect(result).toContain('- Point 2');
      expect(result).toContain('- Point 3');
      expect(result).toContain('## Slide 3');
      expect(result).toContain('<!--Note: Speaker notes go here-->');
      
      expect(result).not.toContain('* * *');
      expect(result).not.toContain('-   ');
      
      const listSection = result.match(/- Point 1[\s\S]*- Point 3/);
      if (listSection) {
        expect(listSection[0]).not.toMatch(/- Point \d\n\n- Point \d/);
      }
    });
  });
});
