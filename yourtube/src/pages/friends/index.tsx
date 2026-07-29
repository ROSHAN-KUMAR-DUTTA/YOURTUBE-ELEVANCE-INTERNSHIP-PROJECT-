import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useSocket } from "@/lib/SocketContext";
import { PhoneCall, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const BACKEND_URL = process.env.BACKEND_URL || "";

export default function FriendsList() {
  const { user } = useUser();
  const { setCallState, setRemoteSocketId, setActiveCall, setPendingLocalStream } = useSocket();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/user");
        // filter out current user
        setUsers(res.data.filter((u: any) => u._id !== user?._id));
      } catch (error) {
        console.error("Error fetching users", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const initiateCall = async (friend: any) => {
    // CRITICAL: getUserMedia MUST be called directly inside a user-gesture handler.
    // Mobile browsers (Safari/Chrome) silently reject getUserMedia when called from
    // a useEffect or after async work that breaks the user-gesture call chain.
    // We acquire the audio stream HERE (in the click handler) and pass it via context.
    let preAcquiredStream: MediaStream | null = null;
    try {
      console.log("[Caller] Acquiring audio inside click handler (user-gesture context)");
      preAcquiredStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Caller] Audio stream acquired:", preAcquiredStream.id);
    } catch (err: any) {
      console.error("[Caller] getUserMedia failed in click handler:", err.name, err.message);
      const messages: Record<string, string> = {
        NotAllowedError: "Microphone permission denied. Please allow microphone access and try again.",
        NotFoundError: "No microphone found. Please connect a microphone and try again.",
        NotReadableError: "Microphone is in use by another app. Please close other apps and try again.",
        OverconstrainedError: "Microphone does not meet the required constraints.",
      };
      toast.error(messages[err.name] || `Microphone error: ${err.message}`);
      // Don't block the call — VideoCall.tsx will fall back to a dummy audio track
    }

    setPendingLocalStream(preAcquiredStream);
    setRemoteSocketId(friend._id);
    setActiveCall({ from: user?._id, name: friend.name || friend.channelname, signal: null });
    setCallState("calling");
  };

  if (!user) return <div className="p-8">Please log in to view friends.</div>;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <User className="w-8 h-8" />
        Friends & Creators
      </h1>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-card rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((friend) => (
            <div key={friend._id} className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <Avatar className="w-16 h-16">
                <AvatarImage src={friend.profilePic} />
                <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                  {friend.channelname ? friend.channelname[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{friend.name || friend.channelname}</h3>
                <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{friend.state}</p>
              </div>
              <Button 
                onClick={() => initiateCall(friend)}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                Call
              </Button>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-muted-foreground col-span-2 text-center py-10">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}
