"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 mt-auto flex justify-center items-center">
      <p className="text-[11px] font-medium text-gray-400 tracking-widest">
        Rater ©{currentYear}. All Rights Reserved.
      </p>
    </footer>
  );
}
