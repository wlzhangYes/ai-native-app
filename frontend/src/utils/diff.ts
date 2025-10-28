// Document Diff Utility using diff-match-patch
// Based on research.md diff implementation

import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

// ============================================================================
// Diff Types
// ============================================================================

export interface DiffResult {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface LineDiff {
  lineNumber: number;
  type: 'equal' | 'insert' | 'delete' | 'modified';
  oldText?: string;
  newText?: string;
}

// ============================================================================
// Diff Functions
// ============================================================================

/**
 * Compute diff between two strings
 */
export function computeDiff(oldText: string, newText: string): DiffResult[] {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs); // Clean up for better readability

  return diffs.map(([type, text]) => ({
    type: type === 1 ? 'insert' : type === -1 ? 'delete' : 'equal',
    text,
  }));
}

/**
 * Compute line-by-line diff
 */
export function computeLineDiff(oldText: string, newText: string): LineDiff[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const diffs = dmp.diff_main(oldLines.join('\n'), newLines.join('\n'));
  dmp.diff_cleanupSemantic(diffs);

  const lineDiffs: LineDiff[] = [];
  let lineNumber = 1;

  diffs.forEach(([type, text]) => {
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (index > 0 || lineDiffs.length === 0) {
        lineDiffs.push({
          lineNumber: lineNumber++,
          type: type === 1 ? 'insert' : type === -1 ? 'delete' : 'equal',
          oldText: type === -1 ? line : undefined,
          newText: type === 1 ? line : line,
        });
      }
    });
  });

  return lineDiffs;
}

/**
 * Generate HTML diff view
 */
export function generateDiffHTML(oldText: string, newText: string): string {
  const diffs = computeDiff(oldText, newText);

  return diffs
    .map((diff) => {
      if (diff.type === 'equal') {
        return `<span>${escapeHTML(diff.text)}</span>`;
      } else if (diff.type === 'insert') {
        return `<ins class="diff-insert">${escapeHTML(diff.text)}</ins>`;
      } else {
        return `<del class="diff-delete">${escapeHTML(diff.text)}</del>`;
      }
    })
    .join('');
}

/**
 * Calculate similarity percentage between two strings
 */
export function calculateSimilarity(oldText: string, newText: string): number {
  const diffs = dmp.diff_main(oldText, newText);
  const levenshteinDistance = dmp.diff_levenshtein(diffs);
  const maxLength = Math.max(oldText.length, newText.length);

  if (maxLength === 0) return 100;

  return Math.round(((maxLength - levenshteinDistance) / maxLength) * 100);
}

// ============================================================================
// Helper Functions
// ============================================================================

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
