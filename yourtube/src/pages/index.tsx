
import CategoryTabs from "@/components/ui/category-tabs";
import Videogrid from "@/components/ui/Videogrid";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="p-4 w-full">
      <CategoryTabs />
      <Suspense fallback={<div>Loading videos...</div>}>
        <Videogrid />
      </Suspense>
    </div>
  );
}