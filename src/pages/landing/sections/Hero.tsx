// Hero Section - Scaffold
// Contains: "Judgment is built, not found" headline + CTA

import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section id="hero" className="py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <h1 className="text-4xl font-bold text-[#111111] mb-4">
          [Hero Section Placeholder]
        </h1>
        <p className="text-gray-500 mb-8">
          "Judgment is built, not found"
        </p>
        
        {/* Primary CTA - routes to app */}
        <Link 
          to="/app" 
          className="inline-block px-6 py-3 bg-[#FEC312] text-[#111111] font-bold rounded-full hover:bg-[#e6b00f] transition-colors"
        >
          Enter Rater App →
        </Link>
      </div>
    </section>
  );
}
