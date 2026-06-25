import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
  Download,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./button";
import Channeldialogue from "./Channeldialogue";
import { useSidebar } from "@/lib/SidebarContext";

const SidebarItem = ({ icon: Icon, label, href, isDesktopExpanded, isMobile }: any) => {
  return (
    <Link href={href}>
      <Button 
        variant="ghost" 
        className={`w-full ${isDesktopExpanded || isMobile ? 'justify-start px-4' : 'justify-center px-0'} h-12 mb-1`}
        title={!isDesktopExpanded && !isMobile ? label : undefined}
      >
        <Icon className={`w-5 h-5 ${isDesktopExpanded || isMobile ? 'mr-4' : ''} shrink-0`} />
        {(isDesktopExpanded || isMobile) && <span className="truncate">{label}</span>}
      </Button>
    </Link>
  );
};

const Sidebar = () => {
  const { user } = useUser();
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const { isMobileOpen, setIsMobileOpen, isDesktopExpanded } = useSidebar();

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setIsMobileOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-[100dvh] bg-background border-r flex flex-col transition-all duration-300 ease-in-out
          lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]
          ${isMobileOpen ? 'translate-x-0 w-[280px] shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isDesktopExpanded ? 'lg:w-64' : 'lg:w-[72px]'}
        `}
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex items-center p-4 lg:hidden border-b shrink-0 h-14">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="mr-2">
            <X className="w-6 h-6" />
          </Button>
          <div className="bg-red-600 p-1 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-medium ml-2 tracking-tight">YourTube</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 pb-20 custom-scrollbar">
          <div className="space-y-1">
            <SidebarItem icon={Home} label="Home" href="/" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
            <SidebarItem icon={Compass} label="Explore" href="/explore" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
            <SidebarItem icon={PlaySquare} label="Subscriptions" href="/subscriptions" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
            <Link href="/friends">
              <Button 
                variant="ghost" 
                className={`w-full text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 h-12 mb-1 ${isDesktopExpanded || isMobileOpen ? 'justify-start px-4' : 'justify-center px-0'}`}
                title={!isDesktopExpanded && !isMobileOpen ? "Friends (Calls)" : undefined}
              >
                <Users className={`w-5 h-5 ${isDesktopExpanded || isMobileOpen ? 'mr-4' : ''} shrink-0`} />
                {(isDesktopExpanded || isMobileOpen) && <span className="truncate">Friends (Calls)</span>}
              </Button>
            </Link>
          </div>

          {user && (
            <div className="border-t mt-3 pt-3 space-y-1">
              <SidebarItem icon={History} label="History" href="/history" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
              <SidebarItem icon={ThumbsUp} label="Liked videos" href="/liked" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
              <SidebarItem icon={Download} label="Downloads" href="/downloads" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
              <SidebarItem icon={Clock} label="Watch later" href="/watch-later" isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
              
              {user?.channelname ? (
                <SidebarItem icon={User} label="Your channel" href={`/channel/${user._id}`} isDesktopExpanded={isDesktopExpanded} isMobile={isMobileOpen} />
              ) : (
                <div className={`pt-2 ${isDesktopExpanded || isMobileOpen ? 'px-2' : 'px-1'}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setisdialogeopen(true)}
                  >
                    {(isDesktopExpanded || isMobileOpen) ? "Create Channel" : "+"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </nav>
        
        <Channeldialogue
          isopen={isdialogeopen}
          onclose={() => setisdialogeopen(false)}
          mode="create"
        />
      </aside>
    </>
  );
};

export default Sidebar;