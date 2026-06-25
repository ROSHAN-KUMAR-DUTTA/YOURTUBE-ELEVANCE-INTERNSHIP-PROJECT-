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

  if (loading) return <div className="p-4">Loading calls...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Video className="w-6 h-6 text-blue-500" />
        Call History
      </h2>
      
      {calls.length === 0 ? (
        <p className="text-muted-foreground">No call history found.</p>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => {
            const isOutgoing = call.callerId._id === user?._id;
            const otherPerson = isOutgoing ? call.receiverId : call.callerId;
            
            return (
              <div key={call._id} className="bg-card p-4 rounded-xl border border-border flex items-center gap-4">
                <div className={`p-3 rounded-full ${isOutgoing ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {isOutgoing ? <PhoneOutgoing className="w-5 h-5" /> : <PhoneIncoming className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{otherPerson?.name || otherPerson?.email || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(call.startedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatDuration(call.startedAt, call.endedAt)}</p>
                  {call.recordingName && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full mt-1 inline-block">
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
