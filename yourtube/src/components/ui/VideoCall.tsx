import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "@/lib/SocketContext";
import { useUser } from "@/lib/AuthContext";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MonitorUp, Circle, Square, Maximize2, Minimize2, User as UserIcon } from "lucide-react";
import { Button } from "./button";
import IncomingCallModal from "./IncomingCallModal";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const stunServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function VideoCall() {
  const { user } = useUser();
  const { socket, activeCall, callState, setCallState, remoteSocketId, setActiveCall, setRemoteSocketId } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const callStartTimeRef = useRef<Date | null>(null);

  // Setup Streams to video elements when they change
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Handle Socket Events for WebRTC
  useEffect(() => {
    if (!socket) return;

    const handleCallAnswered = async (signal: RTCSessionDescriptionInit) => {
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        setCallState("connected");
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    };

    const handleCallRejected = () => {
      toast.error("User is busy or rejected the call", { duration: 4000 });
      endCall();
    };

    const handleVideoToggled = (isRemoteOn: boolean) => {
      setIsRemoteVideoOn(isRemoteOn);
    };

    socket.on("call-answered", handleCallAnswered);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-rejected", handleCallRejected);
    socket.on("video-toggled", handleVideoToggled);
    // call-ended is handled in SocketContext which resets state, but we need to cleanup media
    socket.on("call-ended", () => endCall(false));

    return () => {
      socket.off("call-answered", handleCallAnswered);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-rejected", handleCallRejected);
      socket.off("video-toggled", handleVideoToggled);
      socket.off("call-ended");
    };
  }, [socket, callState]);

  // Initiate Call function (called from external components by changing callState to "calling")
  // We need an effect that runs when callState becomes "calling"
  useEffect(() => {
    if (callState === "calling" && remoteSocketId) {
      initiateCall();
    }
  }, [callState, remoteSocketId]);

  const initiateCall = async () => {
    callStartTimeRef.current = new Date();
    await setupMediaAndPeerConnection();
    
    const offer = await pcRef.current!.createOffer();
    await pcRef.current!.setLocalDescription(offer);
    
    socket?.emit("call-user", {
      userToCall: remoteSocketId,
      signalData: offer,
      from: user?._id,
      name: user?.name || user?.channelname || "User",
      profilePic: user?.profilePic,
    });
  };

  const acceptCall = async () => {
    callStartTimeRef.current = new Date();
    setCallState("connected");
    
    await setupMediaAndPeerConnection();
    await pcRef.current!.setRemoteDescription(new RTCSessionDescription(activeCall!.signal));
    
    const answer = await pcRef.current!.createAnswer();
    await pcRef.current!.setLocalDescription(answer);
    
    socket?.emit("answer-call", {
      to: activeCall!.from,
      signal: answer,
    });
  };

  const rejectCall = () => {
    socket?.emit("reject-call", { to: activeCall!.from });
    setCallState("idle");
    setActiveCall(null);
    setRemoteSocketId(null);
  };

  const setupMediaAndPeerConnection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);

      pcRef.current = new RTCPeerConnection(stunServers);

      stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));

      pcRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pcRef.current.onicecandidate = (event) => {
        if (event.candidate && remoteSocketId) {
          socket?.emit("ice-candidate", {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };
    } catch (error) {
      console.error("Error accessing media devices.", error);
      alert("Could not access camera/microphone.");
    }
  };

  const endCall = (emitEvent = true) => {
    if (emitEvent && remoteSocketId) {
      socket?.emit("end-call", { to: remoteSocketId });
    }

    if (isRecording) {
      stopRecording();
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    
    // Safety fallback: ensure any stream attached to the video element is killed
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Save call history
    if (callStartTimeRef.current && user?._id && remoteSocketId) {
      const endedAt = new Date();
      axiosInstance.post("/call/save", {
        callerId: callState === "calling" ? user._id : remoteSocketId,
        receiverId: callState === "calling" ? remoteSocketId : user._id,
        startedAt: callStartTimeRef.current,
        endedAt,
        recordingName: recordedChunksRef.current.length > 0 ? `call_${user._id}_${Date.now()}.webm` : null
      }).catch(err => console.error("Failed to save call", err));
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
    setIsRecording(false);
    setIsExpanded(false);
    setIsVideoOn(true);
    setIsRemoteVideoOn(true);
    setCallState("idle");
    setActiveCall(null);
    setRemoteSocketId(null);
    callStartTimeRef.current = null;
    recordedChunksRef.current = [];
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      if (localStream) {
        // Completely stop the hardware tracks to kill the camera light
        localStream.getVideoTracks().forEach((track) => {
          track.stop();
          localStream.removeTrack(track);
        });
      }
      setIsVideoOn(false);
      socket?.emit("video-toggled", { to: remoteSocketId, isVideoOn: false });
    } else {
      try {
        // Re-request camera hardware
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(newVideoTrack);
        }
        
        // If not screen sharing, replace the track being sent to the peer
        if (!isScreenSharing) {
          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video" || s.track === null);
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
          // Force video element to refresh
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([newVideoTrack, ...localStream?.getAudioTracks() || []]);
          }
        }
        setIsVideoOn(true);
        socket?.emit("video-toggled", { to: remoteSocketId, isVideoOn: true });
      } catch (err) {
        console.error("Could not restart video", err);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Handle native "Stop sharing" button in browser
        screenTrack.onended = () => {
          stopScreenShare();
        };

        // Update local video to show screen
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video" || s.track === null);
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }
    setIsScreenSharing(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Record remote stream if available, otherwise local stream
      const streamToRecord = remoteStream || localStream;
      if (!streamToRecord) return;

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamToRecord, { mimeType: "video/webm; codecs=vp9" });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `call_${Date.now()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
      };

      mediaRecorder.start(1000); // chunk every 1 second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } else {
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  if (callState === "idle") return null;

  return (
    <>
      {callState === "incoming" && <IncomingCallModal onAccept={acceptCall} onReject={rejectCall} />}

      {(callState === "connected" || callState === "calling") && (
        <div className={
          isExpanded 
            ? "fixed top-4 bottom-4 left-4 right-4 md:top-12 md:bottom-12 md:left-24 md:right-24 z-[200] bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in fade-in zoom-in-95 duration-300" 
            : "fixed bottom-4 right-4 z-[200] w-80 sm:w-96 bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
        }>
          
          <div className={`relative bg-black flex-1 min-h-0 overflow-hidden ${!isExpanded ? 'aspect-video' : ''}`}>
            {callState === "calling" && (
              <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col bg-black/60 backdrop-blur-sm">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                     <span className="w-12 h-12 rounded-full bg-blue-500 animate-ping absolute"></span>
                  </div>
                  <span className="font-semibold mt-2">Calling...</span>
                </div>
              </div>
            )}
            
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Remote Video Overlay when Camera Off */}
            {!isRemoteVideoOn && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 backdrop-blur-xl transition-all">
                <Avatar className="w-32 h-32 md:w-48 md:h-48 border-4 border-gray-700 shadow-2xl mb-4">
                  <AvatarImage src={`http://localhost:5000/${activeCall?.profilePic || 'default'}`} />
                  <AvatarFallback className="text-4xl bg-blue-100 text-blue-600">
                    {activeCall?.name ? activeCall.name[0].toUpperCase() : <UserIcon className="w-16 h-16" />}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-lg font-medium tracking-wide">{activeCall?.name || 'User'} has their camera off</p>
              </div>
            )}
            
            {/* Local Video PiP */}
            <div className={`absolute bottom-4 right-4 z-50 bg-gray-900 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg ${isExpanded ? 'w-48 aspect-video' : 'w-24 aspect-video'}`}>
              
              {/* Local Video Overlay when Camera Off */}
              {!isVideoOn && !isScreenSharing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800">
                  <Avatar className="w-12 h-12 border-2 border-gray-600">
                    <AvatarImage src={`http://localhost:5000/${user?.profilePic || 'default'}`} />
                    <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                      {user?.channelname ? user.channelname[0].toUpperCase() : <UserIcon />}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted // Always mute local video
                className="w-full h-full object-cover"
                style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }} // Mirror if camera
              />
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                REC
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-background border-t border-border flex items-center justify-center gap-3 shrink-0 relative z-50">
            <Button
              variant={isMicOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="icon"
              className={`rounded-full ${isScreenSharing ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
              onClick={toggleScreenShare}
              title="Share Screen"
            >
              <MonitorUp className="w-5 h-5" />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              className="rounded-full"
              onClick={toggleRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Circle className="w-5 h-5 text-red-500" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full hidden sm:flex"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full ml-auto hover:scale-105 transition-transform"
              onClick={() => endCall()}
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
