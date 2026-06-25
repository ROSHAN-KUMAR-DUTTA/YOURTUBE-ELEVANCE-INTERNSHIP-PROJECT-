import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { PhoneIncoming, PhoneOutgoing, Video } from "lucide-react";

export default function CallHistoryContent() {
  const { user } = useUser();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const res = await axiosInstance.get(`/call/history/${user?._id}`);
        setCalls(res.data.data);
      } catch (error) {
        console.error("Error fetching call history", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchCallHistory();
    }
  }, [user]);

  const formatDuration = (start: string, end: string) => {
    if (!end) return "Missed Call";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-500" />
          Call History
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 animate-pulse">
              <div className="w-11 h-11 rounded-full bg-muted shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
              <div className="w-16 h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Video className="w-6 h-6 text-blue-500" />
        Call History
      </h2>
      
      {calls.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card rounded-xl border border-border shadow-sm">
          <PhoneOutgoing className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No calls yet</h2>
          <p className="text-sm text-muted-foreground">Your video call history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => {
            const isOutgoing = call.callerId._id === user?._id;
            const otherPerson = isOutgoing ? call.receiverId : call.callerId;
            
            return (
              <div key={call._id} className="bg-card p-3 sm:p-4 rounded-xl border border-border flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                <div className={`p-2.5 sm:p-3 rounded-full shrink-0 ${isOutgoing ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                  {isOutgoing ? <PhoneOutgoing className="w-4 h-4 sm:w-5 sm:h-5" /> : <PhoneIncoming className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{otherPerson?.name || otherPerson?.email || "Unknown"}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{formatDate(call.startedAt)}</p>
                </div>
                <div className="text-right ml-auto">
                  <p className="font-medium text-sm sm:text-base">{formatDuration(call.startedAt, call.endedAt)}</p>
                  {call.recordingName && (
                    <span className="text-[10px] sm:text-xs bg-red-100 text-red-600 px-2 py-0.5 sm:py-1 rounded-full mt-1 inline-block">
                      Recorded
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
