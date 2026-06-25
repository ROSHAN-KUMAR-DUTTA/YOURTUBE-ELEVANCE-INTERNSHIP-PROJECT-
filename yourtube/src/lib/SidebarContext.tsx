import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
  isDesktopExpanded: boolean;
  setIsDesktopExpanded: (val: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  isDesktopExpanded: true,
  setIsDesktopExpanded: () => {},
  toggleSidebar: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarExpanded");
    if (savedState !== null) {
      setIsDesktopExpanded(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newState = !isDesktopExpanded;
      setIsDesktopExpanded(newState);
      localStorage.setItem("sidebarExpanded", String(newState));
    }
  };

  return (
    <SidebarContext.Provider value={{
      isMobileOpen, setIsMobileOpen,
      isDesktopExpanded, setIsDesktopExpanded,
      toggleSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
