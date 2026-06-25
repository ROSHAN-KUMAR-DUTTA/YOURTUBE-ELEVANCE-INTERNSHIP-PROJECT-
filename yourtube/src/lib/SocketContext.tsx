import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useUser } from "./AuthContext";

interface CallData {
  from: string;
  name: string;
  profilePic?: string;
  signal: any;
}

interface SocketContextType {
  socket: Socket | null;
  activeCall: CallData | null;
  setActiveCall: (call: CallData | null) => void;
  callState: "idle" | "calling" | "incoming" | "connected";
  setCallState: (state: "idle" | "calling" | "incoming" | "connected") => void;
  remoteSocketId: string | null;
  setRemoteSocketId: (id: string | null) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  activeCall: null,
  setActiveCall: () => {},
  callState: "idle",
  setCallState: () => {},
  remoteSocketId: null,
  setRemoteSocketId: () => {}
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "connected">("idle");
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    if (user?._id) {
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      if (newSocket.connected) {
        newSocket.emit("register", user._id);
      }

      newSocket.on("connect", () => {
        newSocket.emit("register", user._id);
      });

      newSocket.on("incoming-call", (data: CallData) => {
        if (callStateRef.current === "idle") {
          setActiveCall(data);
          setCallState("incoming");
          setRemoteSocketId(data.from); // the caller's userId
        } else {
          // busy, emit reject
          newSocket.emit("reject-call", { to: data.from });
        }
      });

      newSocket.on("call-ended", () => {
        setCallState("idle");
        setActiveCall(null);
        setRemoteSocketId(null);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?._id]); // omit callState dependency to avoid reconnect loop, use refs or stable setters in practice, but this is fine since we just register.
  
  return (
    <SocketContext.Provider value={{ socket, activeCall, setActiveCall, callState, setCallState, remoteSocketId, setRemoteSocketId }}>
      {children}
    </SocketContext.Provider>
  );
};
