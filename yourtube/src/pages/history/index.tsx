import HistoryContent from "@/components/ui/HistoryContent";
import CallHistoryContent from "@/components/ui/CallHistoryContent";
import React, { Suspense } from "react";

const index = () => {
  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl space-y-12">
        <div>
          <h1 className="text-2xl font-bold mb-6">Watch history</h1>
          <Suspense fallback={<div>Loading...</div>}>
            <HistoryContent />
          </Suspense>
        </div>
        
        <div>
          <CallHistoryContent />
        </div>
      </div>
    </main>
  );
};

export default index;