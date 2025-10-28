// MarkdownRenderer Component - Renders Markdown with GFM support
// Based on spec.md FR-025: Document preview with Markdown rendering

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Custom components for markdown rendering
  const components: Components = {
    // Custom code block (simple version without syntax highlighting)
    code({ node, inline, className, children, ...props }) {
      return !inline ? (
        <pre
          style={{
            backgroundColor: '#f5f5f5',
            padding: '16px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: '1.5',
          }}
        >
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code
          style={{
            backgroundColor: '#f5f5f5',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '13px',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    // Custom heading with better spacing
    h1: ({ children }) => (
      <h1 style={{ fontSize: '28px', marginTop: '24px', marginBottom: '16px', fontWeight: 600 }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{ fontSize: '24px', marginTop: '20px', marginBottom: '12px', fontWeight: 600 }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontSize: '20px', marginTop: '16px', marginBottom: '12px', fontWeight: 600 }}>
        {children}
      </h3>
    ),
    // Custom table styling
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #e8e8e8',
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ backgroundColor: '#fafafa' }}>{children}</thead>
    ),
    th: ({ children }) => (
      <th
        style={{
          padding: '12px 16px',
          textAlign: 'left',
          border: '1px solid #e8e8e8',
          fontWeight: 600,
        }}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: '12px 16px',
          border: '1px solid #e8e8e8',
        }}
      >
        {children}
      </td>
    ),
    // Custom blockquote
    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: '16px 0',
          padding: '12px 16px',
          borderLeft: '4px solid #1890ff',
          backgroundColor: '#f0f7ff',
          color: 'rgba(0, 0, 0, 0.85)',
        }}
      >
        {children}
      </blockquote>
    ),
    // Custom list
    ul: ({ children }) => (
      <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ paddingLeft: '24px', marginBottom: '16px' }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ marginBottom: '8px' }}>{children}</li>
    ),
    // Custom paragraph - use div instead of p to avoid nesting errors with pre/code blocks
    p: ({ children }) => (
      <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>{children}</div>
    ),
    // Custom link
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1890ff', textDecoration: 'none' }}
      >
        {children}
      </a>
    ),
    // Custom horizontal rule
    hr: () => (
      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e8e8e8' }} />
    ),
  };

  return (
    <div
      className={`markdown-renderer ${className}`}
      style={{
        padding: '16px',
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'rgba(0, 0, 0, 0.85)',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
