
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { SocketProvider } from "../lib/SocketContext";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import IncomingCallModal from "@/components/ui/IncomingCallModal";
import VideoCall from "@/components/ui/VideoCall";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <SocketProvider>
        <div className="min-h-screen theme-transition">
          <title>Your-Tube Clone</title>
          <Header />
          <Toaster />
          <div className="flex">
            <Sidebar />
            <Component {...pageProps} />
          </div>
          {/* Global Modals for Calling */}
          <VideoCall />
        </div>
      </SocketProvider>
    </UserProvider>
  );
}