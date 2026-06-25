import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "./button";
import { useSocket } from "@/lib/SocketContext";

export default function IncomingCallModal({ onAccept, onReject }: { onAccept: () => void, onReject: () => void }) {
  const { activeCall, callState } = useSocket();

  if (callState !== "incoming" || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-card text-card-foreground p-8 rounded-3xl shadow-2xl border border-border flex flex-col items-center max-w-sm w-full mx-4 text-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Phone className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          {activeCall.name} is calling...
        </p>
        <div className="flex gap-6 w-full justify-center">
          <Button 
            onClick={onReject}
            variant="destructive"
            size="lg"
            className="rounded-full w-16 h-16 p-0 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>
          <Button 
            onClick={onAccept}
            size="lg"
            className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Phone className="w-7 h-7 fill-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
