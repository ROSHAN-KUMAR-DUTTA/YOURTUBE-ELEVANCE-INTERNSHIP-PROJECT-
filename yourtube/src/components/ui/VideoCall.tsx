import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/lib/SocketContext";
import { useUser } from "@/lib/AuthContext";
import { PhoneOff, Mic, MicOff, Video, VideoOff, MonitorUp, Circle, Square, Maximize2, Minimize2, User as UserIcon } from "lucide-react";
import { Button } from "./button";
import IncomingCallModal from "./IncomingCallModal";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const BACKEND_URL = process.env.BACKEND_URL || "";

const stunServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Detect mobile browser — used to adapt constraints
const getIsMobile = () => {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768);
};

// Check if screen sharing via getDisplayMedia is fully supported on the current platform
const isScreenShareSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  const hasDisplayMedia = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === "function");
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return hasDisplayMedia && !isMobileUA;
};

// Map getUserMedia error names to user-friendly messages
const mediaErrorMessage = (err: any): string => {
  const messages: Record<string, string> = {
    NotAllowedError: "Microphone/camera permission denied. Please allow access in your browser settings.",
    NotFoundError: "No microphone/camera found. Please connect a device and try again.",
    NotReadableError: "Microphone/camera is in use by another app. Close other apps and try again.",
    OverconstrainedError: "Your device does not meet the required media constraints.",
    AbortError: "Media request was aborted. Please try again.",
    SecurityError: "Media access blocked by browser security policy.",
  };
  return messages[err?.name] || `Media error: ${err?.message || "Unknown error"}`;
};

/**
 * Attach track lifecycle listeners for debugging on mobile.
 * Logs 'ended', 'mute', and 'unmute' events so we can spot silent failures in mobile console.
 */
const attachTrackListeners = (track: MediaStreamTrack, label: string) => {
  track.addEventListener("ended", () => {
    console.warn(`[Track:${label}] ${track.kind} track ENDED (id=${track.id}, readyState=${track.readyState})`);
  });
  track.addEventListener("mute", () => {
    console.warn(`[Track:${label}] ${track.kind} track MUTED (id=${track.id}, enabled=${track.enabled})`);
  });
  track.addEventListener("unmute", () => {
    console.log(`[Track:${label}] ${track.kind} track UNMUTED (id=${track.id}, enabled=${track.enabled})`);
  });
  console.log(`[Track:${label}] Listeners attached — kind=${track.kind}, id=${track.id}, enabled=${track.enabled}, readyState=${track.readyState}`);
};

/**
 * Get camera stream with mobile-friendly constraints.
 * Uses ideal (not exact) width/height so mobile cameras can satisfy them.
 * Falls back to bare { video: true } if constrained request fails (OverconstrainedError).
 */
const getVideoStream = async (): Promise<MediaStream> => {
  // First attempt: ideal constraints with front camera preference
  try {
    console.log("[getUserMedia] Attempting video with ideal constraints (facingMode: user)...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
    });
    console.log("[getUserMedia] Video acquired with ideal constraints:", stream.getVideoTracks()[0]?.getSettings());
    return stream;
  } catch (err: any) {
    console.warn(`[getUserMedia] Ideal constraints failed (${err.name}), trying bare { video: true }...`);
  }

  // Second attempt: bare video — no constraints at all
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("[getUserMedia] Video acquired with bare constraints:", stream.getVideoTracks()[0]?.getSettings());
    return stream;
  } catch (err: any) {
    console.error(`[getUserMedia] Bare video also failed: ${err.name} — ${err.message}`);
    throw err; // Caller handles the toast
  }
};

export default function VideoCall() {
  const { user } = useUser();
  const { socket, activeCall, callState, setCallState, remoteSocketId, setActiveCall, setRemoteSocketId, pendingLocalStream, setPendingLocalStream } = useSocket();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile] = useState(getIsMobile);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // Ref to always have the latest localStream without stale closures
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const callStartTimeRef = useRef<Date | null>(null);

  // Keep ref in sync with state so callbacks/closures always have latest
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Setup Streams to video elements when they change — with iOS .play() nudge
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("[VideoCall] Attaching local stream to <video> element, tracks:", localStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`));
      localVideoRef.current.srcObject = localStream;
      // iOS Safari sometimes needs an explicit play() after setting srcObject
      localVideoRef.current.play().catch(() => { /* autoplay blocked is fine for muted local */ });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("[VideoCall] Attaching remote stream to <video> element, tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`));
      remoteVideoRef.current.srcObject = remoteStream;
      // iOS Safari sometimes needs an explicit play() after setting srcObject
      remoteVideoRef.current.play().catch((e) => {
        console.warn("[VideoCall] Remote video .play() failed:", e.name);
      });
    }
  }, [remoteStream]);

  const processIceQueue = async () => {
    if (pcRef.current && pendingCandidatesRef.current.length > 0) {
      console.log(`[WebRTC] ICE Queue Processed (${pendingCandidatesRef.current.length} candidates)`);
      for (const candidate of pendingCandidatesRef.current) {
        try {
          console.log("[WebRTC] ICE Candidate Added (from queue)");
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
      pendingCandidatesRef.current = [];
    }
  };

  // Handle Socket Events for WebRTC
  useEffect(() => {
    if (!socket) return;

    const handleCallAnswered = async (signal: RTCSessionDescriptionInit) => {
      console.log("[WebRTC] Answer Received");
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("[WebRTC] Remote Description Set (Caller)");
          setCallState("connected");
          await processIceQueue();
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      console.log("[WebRTC] ICE Candidate Received");
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        if (!pcRef.current.remoteDescription) {
          console.log("[WebRTC] ICE Candidate Queued (Remote Description not set)");
          pendingCandidatesRef.current.push(candidate);
        } else {
          try {
            console.log("[WebRTC] ICE Candidate Added");
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding ice candidate", e);
          }
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

    // Handle renegotiation from the remote peer (needed when they toggle video on)
    const handleRenegotiationOffer = async (signal: RTCSessionDescriptionInit) => {
      console.log("[WebRTC] Renegotiation offer received");
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit("renegotiation-answer", {
            to: remoteSocketId,
            signal: answer,
          });
          console.log("[WebRTC] Renegotiation answer sent");
        } catch (err) {
          console.error("[WebRTC] Error handling renegotiation offer:", err);
        }
      }
    };

    const handleRenegotiationAnswer = async (signal: RTCSessionDescriptionInit) => {
      console.log("[WebRTC] Renegotiation answer received");
      if (pcRef.current && pcRef.current.signalingState !== "closed") {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("[WebRTC] Renegotiation answer applied");
        } catch (err) {
          console.error("[WebRTC] Error applying renegotiation answer:", err);
        }
      }
    };

    socket.on("call-answered", handleCallAnswered);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-rejected", handleCallRejected);
    socket.on("video-toggled", handleVideoToggled);
    socket.on("renegotiation-offer", handleRenegotiationOffer);
    socket.on("renegotiation-answer", handleRenegotiationAnswer);
    // call-ended is handled in SocketContext which resets state, but we need to cleanup media
    socket.on("call-ended", () => endCall(false));

    return () => {
      socket.off("call-answered", handleCallAnswered);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-rejected", handleCallRejected);
      socket.off("video-toggled", handleVideoToggled);
      socket.off("renegotiation-offer", handleRenegotiationOffer);
      socket.off("renegotiation-answer", handleRenegotiationAnswer);
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
    console.log("[Caller] initiateCall() started");
    callStartTimeRef.current = new Date();

    // Use the pre-acquired stream from the click handler (fixes mobile getUserMedia)
    const preAcquired = pendingLocalStream;
    if (preAcquired) {
      console.log("[Caller] Using pre-acquired audio stream from click handler:", preAcquired.id);
    } else {
      console.warn("[Caller] No pre-acquired stream — getUserMedia will be called in useEffect context (may fail on mobile)");
    }

    await setupMediaAndPeerConnection(preAcquired);

    // Clear the pending stream from context now that we've consumed it
    setPendingLocalStream(null);
    
    try {
      console.log("[Caller] Creating offer...");
      const offer = await pcRef.current!.createOffer();
      await pcRef.current!.setLocalDescription(offer);
      
      console.log("[Caller] Offer created and set as local description. Sending to remote...");
      socket?.emit("call-user", {
        userToCall: remoteSocketId,
        signalData: offer,
        from: user?._id,
        name: user?.name || user?.channelname || "User",
        profilePic: user?.profilePic,
      });
      console.log("[Caller] Offer sent to remote via socket");
    } catch (error) {
      console.error("[Caller] Error creating/sending offer:", error);
    }
  };

  const acceptCall = async () => {
    console.log("[Receiver] acceptCall() started — triggered by user tap (direct gesture context)");
    callStartTimeRef.current = new Date();
    setCallState("connected");
    
    // Receiver path: getUserMedia is called inside setupMediaAndPeerConnection,
    // which is synchronously called from the Accept button's onClick handler.
    // This preserves user-gesture context on mobile.
    await setupMediaAndPeerConnection(null);
    
    try {
      console.log("[Receiver] Setting remote description from incoming offer...");
      await pcRef.current!.setRemoteDescription(new RTCSessionDescription(activeCall!.signal));
      console.log("[Receiver] Remote Description Set");
      await processIceQueue();
      
      console.log("[Receiver] Creating answer...");
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);
      
      console.log("[Receiver] Answer created and sent");
      socket?.emit("answer-call", {
        to: activeCall!.from,
        signal: answer,
      });
    } catch (error) {
      console.error("[Receiver] Error accepting call:", error);
    }
  };

  const rejectCall = () => {
    socket?.emit("reject-call", { to: activeCall!.from });
    setCallState("idle");
    setActiveCall(null);
    setRemoteSocketId(null);
  };

  /**
   * Sets up media (audio) and the RTCPeerConnection.
   * 
   * @param preAcquiredStream - If provided (caller path), reuse this stream instead of
   *   calling getUserMedia again. This is critical on mobile: the stream was acquired inside
   *   the button click handler where user-gesture context is active.
   *   If null (receiver path or fallback), getUserMedia is called here — which works for
   *   the receiver because acceptCall() is called directly from a click handler.
   */
  const setupMediaAndPeerConnection = async (preAcquiredStream: MediaStream | null) => {
    let audioTrack: MediaStreamTrack | null = null;
    let audioStream: MediaStream | null = null;
    
    if (preAcquiredStream && preAcquiredStream.getAudioTracks().length > 0) {
      // ✅ Reuse the stream acquired inside the click handler (caller path)
      console.log("[Setup] Reusing pre-acquired audio stream");
      audioStream = preAcquiredStream;
      audioTrack = audioStream.getAudioTracks()[0];
      audioTrack.enabled = false; // Muted by default — user toggles mic on explicitly
      attachTrackListeners(audioTrack, "local-audio-preacquired");
    } else {
      // Receiver path or fallback: acquire audio here
      try {
        console.log("[Setup] Requesting audio via getUserMedia({audio: true})...");
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = audioStream.getAudioTracks()[0];
        audioTrack.enabled = false; // Muted by default — user toggles mic on explicitly
        console.log("[Setup] Audio acquired — id:", audioTrack.id, "enabled:", audioTrack.enabled, "readyState:", audioTrack.readyState);
        attachTrackListeners(audioTrack, "local-audio");
      } catch (error: any) {
        console.error(`[Setup] getUserMedia audio failed: ${error.name} — ${error.message}`, error);
        toast.warning(mediaErrorMessage(error));
        // Create Dummy Audio Track so the call can still proceed (video-only or silent)
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = ctx.createOscillator();
          const dst = ctx.createMediaStreamDestination();
          oscillator.connect(dst);
          oscillator.start();
          audioTrack = dst.stream.getAudioTracks()[0];
          audioTrack.enabled = false;
          attachTrackListeners(audioTrack, "local-audio-dummy");
          console.log("[Setup] Fell back to dummy audio track");
        } catch (dummyErr) {
          console.error("[Setup] Even dummy audio creation failed:", dummyErr);
          // Last resort: proceed without audio
          audioTrack = null;
        }
      }
    }

    try {
      // Create Dummy Video Track (placeholder until user toggles camera on)
      console.log("[Setup] Creating dummy video track (canvas)...");
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const canvasCtx = canvas.getContext("2d");
      if (canvasCtx) {
        canvasCtx.fillStyle = "black";
        canvasCtx.fillRect(0, 0, 1, 1);
      }
      const dummyStream = canvas.captureStream(1);
      const dummyVideoTrack = dummyStream.getVideoTracks()[0];
      attachTrackListeners(dummyVideoTrack, "local-video-dummy");

      // Initialize RTCPeerConnection
      console.log("[Setup] Creating RTCPeerConnection...");
      pcRef.current = new RTCPeerConnection(stunServers);
      pendingCandidatesRef.current = []; // Reset queue for new connection

      // Build the combined stream and add tracks to peer connection
      // IMPORTANT: tracks must be added BEFORE createOffer/createAnswer (mobile browsers are strict)
      const tracksToAdd: MediaStreamTrack[] = [];
      if (audioTrack) tracksToAdd.push(audioTrack);
      tracksToAdd.push(dummyVideoTrack);

      const combinedStream = new MediaStream(tracksToAdd);
      tracksToAdd.forEach((track) => {
        pcRef.current!.addTrack(track, combinedStream);
        console.log(`[Setup] addTrack: ${track.kind} (id=${track.id}, enabled=${track.enabled})`);
      });

      // Set local stream — include audio track so toggleMic works on it
      const localStreamTracks: MediaStreamTrack[] = [];
      if (audioTrack) localStreamTracks.push(audioTrack);
      setLocalStream(new MediaStream(localStreamTracks));
      console.log("[Setup] Local stream set (audio only), tracks:", localStreamTracks.length);

      pcRef.current.ontrack = (event) => {
        const track = event.track;
        console.log(`[WebRTC] Remote track received: ${track.kind}, id=${track.id}, enabled=${track.enabled}, readyState=${track.readyState}`);
        attachTrackListeners(track, "remote-" + track.kind);
        setRemoteStream(event.streams[0]);
        // Log all remote stream tracks for debugging
        console.log("[WebRTC] Remote stream tracks:", event.streams[0]?.getTracks().map(t => `${t.kind}:${t.id}:${t.enabled}:${t.readyState}`));
      };

      pcRef.current.onicecandidate = (event) => {
        if (event.candidate && remoteSocketId) {
          console.log("[WebRTC] ICE Candidate Generated");
          socket?.emit("ice-candidate", {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      pcRef.current.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE Connection State:", pcRef.current?.iceConnectionState);
      };

      pcRef.current.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection State:", pcRef.current?.connectionState);
      };

      // onnegotiationneeded: fires when addTrack/replaceTrack changes require renegotiation
      // This is critical for mobile — when camera is toggled on, replaceTrack may not trigger
      // renegotiation automatically on all browsers, but addTrack will.
      pcRef.current.onnegotiationneeded = async () => {
        console.log("[WebRTC] Negotiation needed event fired (signalingState:", pcRef.current?.signalingState, ")");
        // Only the initiator should create a new offer to avoid glare
        if (pcRef.current && pcRef.current.signalingState === "stable") {
          try {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            socket?.emit("renegotiation-offer", {
              to: remoteSocketId,
              signal: offer,
            });
            console.log("[WebRTC] Renegotiation offer sent");
          } catch (err) {
            console.error("[WebRTC] Error during renegotiation:", err);
          }
        }
      };

      console.log("[Setup] PeerConnection setup complete");
    } catch (error) {
      console.error("[Setup] Critical error setting up PeerConnection.", error);
      // Clean up the audio track if we fail here
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
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
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      pcRef.current.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          receiver.track.stop();
        }
      });
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clean up any pending stream that wasn't consumed
    if (pendingLocalStream) {
      pendingLocalStream.getTracks().forEach(track => track.stop());
      setPendingLocalStream(null);
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
    setIsVideoOn(false);
    setIsRemoteVideoOn(false);
    setCallState("idle");
    setActiveCall(null);
    setRemoteSocketId(null);
    callStartTimeRef.current = null;
    recordedChunksRef.current = [];
  };

  const toggleMic = () => {
    // Use ref for latest stream to avoid stale closures
    const stream = localStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("[Mic] No audio tracks in local stream — mic toggle has no effect");
        toast.error("No microphone available to toggle.");
        return;
      }
      const newMicState = !isMicOn;
      audioTracks.forEach((track) => {
        track.enabled = newMicState;
        console.log(`[Mic] Audio track ${track.id} enabled = ${newMicState}, readyState = ${track.readyState}`);
      });
      // Also ensure the sender track matches (same object, but log for debugging)
      pcRef.current?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          console.log(`[Mic] Sender audio track enabled = ${sender.track.enabled}, readyState = ${sender.track.readyState}`);
        }
      });
      setIsMicOn(newMicState);
    } else {
      console.warn("[Mic] toggleMic called but localStream is null");
    }
  };

  const toggleVideo = async () => {
    if (isVideoOn) {
      // Turn camera OFF
      const stream = localStreamRef.current;
      if (stream) {
        stream.getVideoTracks().forEach((track) => {
          console.log(`[Video] Stopping video track ${track.id}`);
          track.stop();
          stream.removeTrack(track);
        });
      }
      setIsVideoOn(false);
      socket?.emit("video-toggled", { to: remoteSocketId, isVideoOn: false });
    } else {
      // Turn camera ON
      try {
        console.log("[Video] Requesting camera via getUserMedia with mobile-friendly constraints...");
        const newStream = await getVideoStream();
        const newVideoTrack = newStream.getVideoTracks()[0];
        console.log("[Video] Camera acquired:", newVideoTrack.id, "settings:", newVideoTrack.getSettings());
        attachTrackListeners(newVideoTrack, "local-video-camera");
        
        // If the call was ended while waiting for permission, abort immediately
        if (!pcRef.current) {
          console.warn("[Video] PeerConnection gone — stopping acquired track");
          newVideoTrack.stop();
          return;
        }
        
        const stream = localStreamRef.current;
        if (stream) {
          stream.addTrack(newVideoTrack);
        }
        
        // Replace the dummy/previous video track being sent to the peer
        if (!isScreenSharing) {
          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === "video" || s.track === null);
          if (sender) {
            console.log("[Video] Replacing sender video track:", sender.track?.id, "→", newVideoTrack.id);
            await sender.replaceTrack(newVideoTrack);
            console.log("[Video] replaceTrack completed successfully");
          } else {
            console.warn("[Video] No video sender found — adding track directly (will trigger renegotiation)");
            pcRef.current.addTrack(newVideoTrack, stream || new MediaStream([newVideoTrack]));
          }

          // Force video element to refresh — directly set srcObject for reliability on mobile
          if (localVideoRef.current) {
            const displayStream = new MediaStream([newVideoTrack, ...(stream?.getAudioTracks() || [])]);
            localVideoRef.current.srcObject = displayStream;
            localVideoRef.current.play().catch(() => { /* autoplay blocked is fine for muted local */ });
            console.log("[Video] Local <video> srcObject updated with camera track");
          }
        }
        setIsVideoOn(true);
        socket?.emit("video-toggled", { to: remoteSocketId, isVideoOn: true });
      } catch (err: any) {
        console.error(`[Video] getUserMedia failed: ${err.name} — ${err.message}`, err);
        toast.error(mediaErrorMessage(err));
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      // Platform capability guard for mobile / unsupported browsers
      if (!isScreenShareSupported()) {
        toast.info("Screen sharing is available on desktop browsers only");
        return;
      }

      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // If the call was ended while waiting for permission, abort immediately
        if (!pcRef.current) {
          screenTrack.stop();
          return;
        }
        
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
        if (localVideoRef.current) {
          // Keep local audio track if it exists so recording still captures it
          const stream = localStreamRef.current;
          const tracks = [screenTrack];
          if (stream) {
            tracks.push(...stream.getAudioTracks());
          }
          localVideoRef.current.srcObject = new MediaStream(tracks);
        }
        setIsScreenSharing(true);
      } catch (err: any) {
        // User cancelled the screen share picker — not an error
        if (err.name === "NotAllowedError") {
          console.log("[ScreenShare] User cancelled screen share picker");
        } else {
          console.error("[ScreenShare] Error sharing screen:", err);
          toast.error("Failed to start screen sharing.");
        }
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0] || null;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video" || s.track === null);
      if (sender) {
        sender.replaceTrack(videoTrack).catch(err => console.error("Error replacing track", err));
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    setIsScreenSharing(false);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Record remote stream if available, otherwise local stream
      const streamToRecord = remoteStream || localStreamRef.current;
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
            : "fixed bottom-4 right-4 z-[200] w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
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
            
            {/* Remote Video — playsInline is critical for iOS */}
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
                  <AvatarImage src={activeCall?.profilePic || undefined} />
                  <AvatarFallback className="text-4xl bg-blue-100 text-blue-600">
                    {activeCall?.name ? activeCall.name[0].toUpperCase() : <UserIcon className="w-16 h-16" />}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-lg font-medium tracking-wide">{activeCall?.name || 'User'} has their camera off</p>
              </div>
            )}
            
            {/* Local Video PiP — playsInline + muted are critical for iOS autoplay */}
            <div className={`absolute bottom-4 right-4 z-50 bg-gray-900 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg ${isExpanded ? 'w-48 aspect-video' : 'w-24 aspect-video'}`}>
              
              {/* Local Video Overlay when Camera Off */}
              {!isVideoOn && !isScreenSharing && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-800">
                  <Avatar className="w-12 h-12 border-2 border-gray-600">
                    <AvatarImage src={user?.profilePic || undefined} />
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
                muted // Always mute local video — prevents echo feedback
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
          <div className="p-3 sm:p-4 bg-background border-t border-border flex items-center justify-center gap-2 sm:gap-3 shrink-0 relative z-50 flex-wrap sm:flex-nowrap">
            <Button
              variant={isMicOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            <Button
              variant={isVideoOn ? "outline" : "destructive"}
              size="icon"
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
              onClick={toggleVideo}
            >
              {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            {/* Screen share button: shown on all devices, styled as disabled with toast feedback on mobile */}
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="icon"
              className={`rounded-full w-9 h-9 sm:w-10 sm:h-10 ${
                isScreenSharing ? "bg-blue-600 text-white hover:bg-blue-700" : ""
              } ${
                !isScreenShareSupported() ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground" : ""
              }`}
              onClick={toggleScreenShare}
              title={isScreenShareSupported() ? "Share Screen" : "Screen sharing is available on desktop browsers only"}
            >
              <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
              onClick={toggleRecording}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? <Square className="w-3 h-3 sm:w-4 sm:h-4 fill-current" /> : <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10 flex"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10 ml-auto hover:scale-105 transition-transform shrink-0"
              onClick={() => endCall()}
              title="End Call"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
