import type { Metadata } from 'next';
import Script from 'next/script';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Claude Agent Service',
  description: 'Multi-session Claude Code interface',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Load runtime configuration */}
        <Script src="/config.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
