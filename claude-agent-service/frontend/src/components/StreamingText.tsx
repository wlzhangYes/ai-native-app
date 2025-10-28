import { useEffect, useState } from 'react';

interface StreamingTextProps {
  text: string;
  className?: string;
}

export default function StreamingText({ text, className = '' }: StreamingTextProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">▊</span>
    </span>
  );
}
