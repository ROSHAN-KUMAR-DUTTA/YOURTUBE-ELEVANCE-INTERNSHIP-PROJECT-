import { Bell, Menu, Mic, Search, User, VideoIcon, Crown } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./button";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import { useSidebar } from "@/lib/SidebarContext";
import Channeldialogue from "./Channeldialogue";
import LoginDialog from "./LoginDialog";

const Header = () => {
  const { user, logout, handlegooglesignin } = useUser();
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = () => {
    if (!user) {
      alert("Please login first");
      return;
    }
    router.push("/pricing");
  };
  
  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };
  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 bg-background border-b sticky top-0 z-40">
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:mr-2">
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded hidden sm:block">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-lg sm:text-xl font-medium tracking-tight">YourTube</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1 hidden sm:inline">IN</span>
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl mx-2 sm:mx-4"
      >
        <div className="flex flex-1 min-w-0">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-full border-r-0 focus-visible:ring-0 min-w-0 h-9 sm:h-10 text-sm"
          />
          <Button
            type="submit"
            className="rounded-r-full px-3 sm:px-6 bg-background hover:bg-muted text-muted-foreground border border-l-0 h-9 sm:h-10"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex shrink-0 h-10 w-10">
          <Mic className="w-5 h-5" />
        </Button>
      </form>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {user ? (
          <>
            {user?.currentPlan !== "Gold" && (
              <Button variant="outline" size="sm" className="hidden lg:flex mr-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all duration-300" onClick={handleUpgrade}>
                <Crown className="w-4 h-4 mr-2" />
                {user?.currentPlan === "Free" || !user?.currentPlan ? "Upgrade" : "Upgrade Plan"}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10">
              <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full ml-1 sm:ml-0"
                >
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user._id}`}>Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <div className="px-2 py-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setisdialogeopen(true)}
                    >
                      Create Channel
                    </Button>
                  </div>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                {user?.currentPlan !== "Gold" && (
                   <DropdownMenuItem asChild className="lg:hidden text-yellow-600 font-medium">
                     <Link href="/pricing">Upgrade Plan</Link>
                   </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
              onClick={() => {
                setAuthMode("signin");
                setIsLoginDialogOpen(true);
              }}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="text-xs sm:text-sm px-2 sm:px-4 h-8 sm:h-9"
              onClick={() => {
                setAuthMode("signup");
                setIsLoginDialogOpen(true);
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
      <LoginDialog 
        isopen={isLoginDialogOpen} 
        onclose={() => setIsLoginDialogOpen(false)} 
        initialMode={authMode}
      />
    </header>
  );
};

export default Header;