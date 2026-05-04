"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { SubmitPage } from "@/components/SubmitPage";
import { AnimatePresence, motion } from "framer-motion";

export default function AppSubmitPage() {
  const router = useRouter();

  return (
    <>
      <Header 
        onPostClick={() => {}} 
        onLogoClick={() => router.push('/app/browse', { scroll: false })} 
        searchQuery={""}
        onSearchChange={() => {}}
        sortBy={"balanced"}
        onSortChange={() => {}}
        selectedCategories={[]}
        onCategoryChange={() => {}}
        hideControls={true}
      />
      <main className="flex-1 w-full pt-2">
        <AnimatePresence mode="wait">
            <motion.div 
              key="submit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-4 md:pt-0"
            >
              <SubmitPage />
            </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
