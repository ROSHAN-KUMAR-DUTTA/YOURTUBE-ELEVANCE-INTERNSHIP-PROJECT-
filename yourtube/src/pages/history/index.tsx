import HistoryContent from "@/components/ui/HistoryContent";
import CallHistoryContent from "@/components/ui/CallHistoryContent";
import React, { Suspense } from "react";

const index = () => {
  return (
    <div className="flex-1 p-4 sm:p-6 w-full">
      <div className="max-w-4xl mx-auto space-y-12 w-full">
        <div className="w-full">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Watch history</h1>
          <Suspense fallback={<div>Loading...</div>}>
            <HistoryContent />
          </Suspense>
        </div>
        
        <div className="w-full">
          <CallHistoryContent />
        </div>
      </div>
    </div>
  );
};

export default index;