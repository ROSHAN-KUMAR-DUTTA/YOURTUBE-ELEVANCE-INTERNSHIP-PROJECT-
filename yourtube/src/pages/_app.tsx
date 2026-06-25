
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { SocketProvider } from "../lib/SocketContext";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import IncomingCallModal from "@/components/ui/IncomingCallModal";
import VideoCall from "@/components/ui/VideoCall";
import DeveloperPanel from "@/components/ui/DeveloperPanel";
import { SidebarProvider } from "@/lib/SidebarContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <SocketProvider>
        <SidebarProvider>
          <div className="min-h-screen theme-transition flex flex-col">
            <title>Your-Tube Clone</title>
          <Header />
          <Toaster />
          <div className="flex flex-1 overflow-hidden relative">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto custom-scrollbar h-[calc(100vh-3.5rem)]">
              <Component {...pageProps} />
            </main>
          </div>
          {/* Global Modals for Calling */}
          <VideoCall />
          <DeveloperPanel />
          </div>
        </SidebarProvider>
      </SocketProvider>
    </UserProvider>
  );
}