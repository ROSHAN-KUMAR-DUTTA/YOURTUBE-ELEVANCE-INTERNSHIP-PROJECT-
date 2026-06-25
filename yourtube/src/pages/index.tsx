
import CategoryTabs from "@/components/ui/category-tabs";
import Videogrid from "@/components/ui/Videogrid";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex-1 p-4">
      <CategoryTabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </main>
  );
}