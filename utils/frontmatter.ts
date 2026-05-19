import matter from 'gray-matter';

export interface FrontmatterData {
  [key: string]: any;
}

export interface ParsedContent {
  frontmatter: FrontmatterData | null;
  content: string;
  hasFrontmatter: boolean;
}

export function parseFrontmatter(markdown: string): ParsedContent {
  if (!markdown || typeof markdown !== 'string') {
    return {
      frontmatter: null,
      content: markdown || '',
      hasFrontmatter: false
    };
  }

  try {
    const parsed = matter(markdown);
    const hasFrontmatter = Object.keys(parsed.data).length > 0;
    
    return {
      frontmatter: hasFrontmatter ? parsed.data : null,
      content: parsed.content,
      hasFrontmatter
    };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return {
      frontmatter: null,
      content: markdown,
      hasFrontmatter: false
    };
  }
}

export function stringifyFrontmatter(frontmatter: FrontmatterData | null, content: string): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return content;
  }

  try {
    return matter.stringify(content, frontmatter);
  } catch (error) {
    console.error('Error stringifying frontmatter:', error);
    return content;
  }
}

export function frontmatterToYAML(frontmatter: FrontmatterData | null): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) {
    return '';
  }

  try {
    const yaml = matter.stringify('', frontmatter);
    return yaml.replace(/---\n\n$/, '---\n').trim();
  } catch (error) {
    console.error('Error converting frontmatter to YAML:', error);
    return '';
  }
}
