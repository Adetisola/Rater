"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 mt-auto flex justify-center items-center">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
        © {currentYear} Rater
      </p>
    </footer>
  );
}
