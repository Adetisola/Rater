"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';

interface MentionRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text content while converting valid @username tokens into clickable profile links.
 */
export function MentionRenderer({ content, className = '' }: MentionRendererProps) {
  const parts = useMemo(() => {
    if (!content) return [];

    // Boundary-aware regex for @username (3-20 characters: alphanumeric, underscore, dot)
    const regex = /(?:^|\s)@([a-z0-9_.]{3,20})(?=$|[^\w.])/gi;
    const tokens: Array<{ type: 'text' | 'mention'; text: string; username?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Leading whitespace before '@'
      const prefix = match[0].startsWith(' ') ? ' ' : '';
      const atSymbolIndex = matchIndex + prefix.length;

      // Append text preceding the mention
      if (atSymbolIndex > lastIndex) {
        tokens.push({
          type: 'text',
          text: content.slice(lastIndex, atSymbolIndex),
        });
      }

      // Append mention
      const username = match[1];
      tokens.push({
        type: 'mention',
        text: `@${username}`,
        username,
      });

      lastIndex = atSymbolIndex + username.length + 1; // +1 for '@'
    }

    // Append remaining text
    if (lastIndex < content.length) {
      tokens.push({
        type: 'text',
        text: content.slice(lastIndex),
      });
    }

    return tokens;
  }, [content]);

  return (
    <span className={`inline break-words whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.type === 'mention' && part.username) {
          return (
            <Link
              key={i}
              href={`/@${part.username}`}
              scroll={false}
              onClick={(e) => e.stopPropagation()}
              className="text-primary font-semibold hover:underline transition-colors focus:outline-none"
            >
              {part.text}
            </Link>
          );
        }
        return <React.Fragment key={i}>{part.text}</React.Fragment>;
      })}
    </span>
  );
}
