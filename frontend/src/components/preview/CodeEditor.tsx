// CodeEditor Component - Monaco Editor wrapper for code viewing/editing
// Based on Monaco Editor (@monaco-editor/react)

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs } from 'antd';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface CodeEditorProps {
  content: string;
  language?: string;
  fileName?: string;
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
  height?: string;
  defaultTab?: 'preview' | 'source'; // For markdown files
  onTabChange?: (tab: 'preview' | 'source') => void; // Callback when tab changes
}

/**
 * Detect programming language from file extension
 */
function detectLanguage(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    // Web
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',

    // Backend
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',

    // Shell & Config
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',

    // Markup
    md: 'markdown',
    markdown: 'markdown',
    txt: 'plaintext',

    // Data
    sql: 'sql',
    graphql: 'graphql',

    // Others
    dockerfile: 'dockerfile',
  };

  return languageMap[extension || ''] || 'plaintext';
}

export function CodeEditor({
  content,
  language,
  fileName = '',
  readOnly = true,
  onChange,
  height = '100%',
  defaultTab = 'preview',
  onTabChange,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>(defaultTab);

  // Update activeTab when defaultTab changes (e.g., when entering edit mode)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    const newTab = key as 'preview' | 'source';
    setActiveTab(newTab);
    onTabChange?.(newTab);
  };

  const detectedLanguage = language || detectLanguage(fileName);
  const isMarkdown = detectedLanguage === 'markdown';

  // Markdown files: show preview/source tabs
  if (isMarkdown) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: '16px',
            paddingRight: '16px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
          items={[
            {
              key: 'preview',
              label: '预览',
              children: (
                <div style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
                  <MarkdownRenderer content={content} />
                </div>
              ),
            },
            {
              key: 'source',
              label: '源码',
              children: (
                <Editor
                  height="calc(100vh - 300px)"
                  language="markdown"
                  value={content}
                  onChange={onChange}
                  theme="vs-dark"
                  options={{
                    readOnly,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    folding: true,
                    automaticLayout: true,
                  }}
                />
              ),
            },
          ]}
        />
      </div>
    );
  }

  // Non-markdown files: show editor only
  return (
    <Editor
      height={height}
      language={detectedLanguage}
      value={content}
      onChange={onChange}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        folding: true,
        automaticLayout: true,
        wordWrap: detectedLanguage === 'plaintext' ? 'on' : 'off',
      }}
    />
  );
}
