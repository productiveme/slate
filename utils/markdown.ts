import TurndownService from 'turndown';
import { marked } from 'marked';

export interface MarkdownConverterOptions {
  headingStyle?: 'atx' | 'setext';
  codeBlockStyle?: 'fenced' | 'indented';
  emDelimiter?: '*' | '_';
  bulletListMarker?: '-' | '*' | '+';
  strongDelimiter?: '**' | '__';
  hr?: string;
}

export function renderHorizontalRule(rawText: string): string {
  const dashCount = rawText.trim().length;
  
  if (dashCount === 4) {
    return '<hr data-slide-type="vertical" />\n';
  }
  return '<hr />\n';
}

export function configureMarked() {
  const renderer = new marked.Renderer();
  renderer.hr = function(token) {
    return renderHorizontalRule(token.raw);
  };

  marked.use({ renderer });
}

export function createTurndownService(options: MarkdownConverterOptions = {}): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: options.headingStyle || 'atx',
    codeBlockStyle: options.codeBlockStyle || 'fenced',
    emDelimiter: options.emDelimiter || '*',
    bulletListMarker: options.bulletListMarker || '-',
    strongDelimiter: options.strongDelimiter || '**',
    hr: options.hr || '---',
    br: '\n'
  });

  turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: (content) => {
      return '~~' + content + '~~';
    }
  });

  turndownService.addRule('horizontalRule', {
    filter: 'hr',
    replacement: (content, node) => {
      const slideType = node.getAttribute('data-slide-type');
      if (slideType === 'vertical') {
        return '\n----\n';
      }
      return '\n---\n';
    }
  });

  turndownService.addRule('commentPlaceholder', {
    filter: 'comment-placeholder',
    replacement: (content) => {
      return `<comment-placeholder>${content}</comment-placeholder>`;
    }
  });

  turndownService.addRule('frontmatter', {
    filter: (node) => {
      return node.getAttribute && node.getAttribute('data-type') === 'frontmatter';
    },
    replacement: () => {
      return '';
    }
  });

  turndownService.addRule('tableCellParagraph', {
    filter: (node) => {
      return node.nodeName === 'P' && 
             node.parentNode && 
             (node.parentNode.nodeName === 'TD' || node.parentNode.nodeName === 'TH');
    },
    replacement: (content) => {
      return content;
    }
  });

  turndownService.addRule('table', {
    filter: 'table',
    replacement: (content) => {
      return '\n\n' + content + '\n\n';
    }
  });

  turndownService.addRule('tableRow', {
    filter: 'tr',
    replacement: (content, node) => {
      let borderCells = '';
      const alignMap: Record<string, string> = { left: ':--', right: '--:', center: ':-:' };
      
      if (node.parentNode.nodeName === 'THEAD') {
        for (let i = 0; i < node.childNodes.length; i++) {
          const align = (node.childNodes[i] as HTMLElement).getAttribute('align') || 'left';
          borderCells += '| ' + (alignMap[align] || '---') + ' ';
        }
        return '| ' + content + '|\n' + borderCells + '|\n';
      }
      return '| ' + content + '|\n';
    }
  });

  turndownService.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content) => {
      return content + ' | ';
    }
  });

  turndownService.addRule('taskListItem', {
    filter: (node) => {
      return (node as HTMLInputElement).type === 'checkbox' && node.getAttribute('type') === 'checkbox';
    },
    replacement: (content, node) => {
      return (node as HTMLInputElement).checked ? '[x] ' : '[ ] ';
    }
  });

  return turndownService;
}

export function postProcessMarkdown(markdown: string): string {
  let processed = markdown;
  
  processed = processed.replace(/\\\[(\d+)\\\]/g, '[$1]');
  
  processed = processed.replace(/^\* \* \*$/gm, '---');
  processed = processed.replace(/^- - -$/gm, '---');
  processed = processed.replace(/^_ _ _$/gm, '---');
  
  processed = processed.split('\n').map((line, index, lines) => {
    if (/^-\s{2,}/.test(line)) {
      return line.replace(/^-\s{2,}/, '- ');
    }
    if (/^(\d+)\.\s{2,}/.test(line)) {
      return line.replace(/^(\d+)\.\s{2,}/, '$1. ');
    }
    
    if (index > 0 && line === '' && lines[index - 1].match(/^-\s/) && lines[index + 1]?.match(/^-\s/)) {
      return null;
    }
    if (index > 0 && line === '' && lines[index - 1].match(/^\d+\.\s/) && lines[index + 1]?.match(/^\d+\.\s/)) {
      return null;
    }
    
    return line;
  }).filter(line => line !== null).join('\n');
  
  processed = processed.replace(/<!--(.+?)-->/gs, (match, content) => {
    if (content.includes('\n')) {
      return `<!--\n${content}\n-->`;
    }
    return match;
  });
  
  return processed;
}

export function htmlToMarkdown(html: string, turndownService: TurndownService): string {
  if (!html) return '';
  
  let processedHtml = html.replace(/<!--([\s\S]*?)-->/g, (match, content) => {
    return `<comment-placeholder>${content}</comment-placeholder>`;
  });
  
  let markdown = turndownService.turndown(processedHtml);
  
  markdown = markdown.replace(/<comment-placeholder>([\s\S]*?)<\/comment-placeholder>/g, (match, content) => {
    return `<!--${content}-->`;
  });
  
  markdown = postProcessMarkdown(markdown);
  
  return markdown;
}
