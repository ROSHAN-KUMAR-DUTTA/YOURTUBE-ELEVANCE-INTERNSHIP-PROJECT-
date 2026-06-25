import React, { useState } from "react";
import { Button } from "./button";
const tabs = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "playlists", label: "Playlists" },
  { id: "community", label: "Community" },
  { id: "downloads", label: "Downloads" },
  { id: "about", label: "About" },
];
const Channeltabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  return (
    <div className="border-b px-4">
      <div className="flex gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`px-0 py-4 border-b-2 rounded-none ${
              activeTab === tab.id ? "border-black text-black" : "border-transparent text-muted-foreground hover:text-black"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Channeltabs;