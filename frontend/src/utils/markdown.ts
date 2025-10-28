// Markdown Utility Functions
// Based on research.md Markdown rendering decisions

/**
 * Calculate word count for Markdown content
 * (counts Chinese characters and English words)
 */
export function getMarkdownWordCount(content: string): number {
  // Remove Markdown syntax
  const plainText = content
    .replace(/[#*`_~\[\]()]/g, '') // Remove common Markdown symbols
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .trim();

  // Count Chinese characters
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCount = chineseChars.length;

  // Count English words
  const englishWords = plainText.match(/[a-zA-Z]+/g) || [];
  const englishCount = englishWords.length;

  return chineseCount + englishCount;
}

/**
 * Extract frontmatter from Markdown content
 */
export function extractFrontmatter(content: string): { frontmatter: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterText = match[1];
  const mainContent = match[2];

  const frontmatter: Record<string, string> = {};
  frontmatterText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { frontmatter, content: mainContent };
}

/**
 * Sanitize Markdown content (remove potentially harmful HTML)
 */
export function sanitizeMarkdown(content: string): string {
  // Remove script tags
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
