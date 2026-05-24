"use client";

import { useState, useEffect } from "react";

const AMBIENT_SUCCESS_VARIANTS = [
  "Saved.",
  "Changes updated.",
  "All set."
];

/**
 * A simple component that displays a randomly selected success message 
 * from a predefined set of conversational, "ambient" variants.
 * Handles hydration mismatch by avoiding rendering until mounted.
 */
export function AmbientSuccessText({ className = "" }: { className?: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    // Pick a random variant on mount
    setText(AMBIENT_SUCCESS_VARIANTS[Math.floor(Math.random() * AMBIENT_SUCCESS_VARIANTS.length)]);
  }, []);

  // Return null or empty space until mounted to avoid hydration mismatch
  if (!text) return <span className={className}>&nbsp;</span>;

  return (
    <span className={className}>
      {text}
    </span>
  );
}
