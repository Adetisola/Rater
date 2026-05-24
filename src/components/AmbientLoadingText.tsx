"use client";

import { useState, useEffect } from "react";

const AMBIENT_VARIANTS = [
  "Gathering good stuff...",
  "One sec.",
  "Loading something clean..."
];

export function AmbientLoadingText({
  defaultText = "Gathering good stuff...",
  className = "",
  interval = 3000
}: {
  defaultText?: string;
  className?: string;
  interval?: number;
}) {
  const [text, setText] = useState(defaultText);

  useEffect(() => {
    // Pick an initial random variant
    setText(AMBIENT_VARIANTS[Math.floor(Math.random() * AMBIENT_VARIANTS.length)]);

    // Rotate variants every `interval` milliseconds
    const timer = setInterval(() => {
      setText(prev => {
        let next;
        do {
          next = AMBIENT_VARIANTS[Math.floor(Math.random() * AMBIENT_VARIANTS.length)];
        } while (next === prev && AMBIENT_VARIANTS.length > 1);
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <span className={`inline-block transition-opacity duration-300 ${className}`}>
      {text}
    </span>
  );
}
