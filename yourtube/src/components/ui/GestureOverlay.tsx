import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, FastForward, Rewind, MessageSquare, Home, SkipForward } from "lucide-react";

interface GestureOverlayProps {
  onSingleTapCenter: () => void;
  onDoubleTapLeft: () => void;
  onDoubleTapRight: () => void;
  onTripleTapCenter: () => void;
  onTripleTapLeft: () => void;
  onTripleTapRight: () => void;
  isPlaying: boolean;
}

type Region = "left" | "center" | "right";

export default function GestureOverlay({
  onSingleTapCenter,
  onDoubleTapLeft,
  onDoubleTapRight,
  onTripleTapCenter,
  onTripleTapLeft,
  onTripleTapRight,
  isPlaying,
}: GestureOverlayProps) {
  const [tapCount, setTapCount] = useState(0);
  const [lastRegion, setLastRegion] = useState<Region | null>(null);
  
  // Temporary visual feedback
  const [feedback, setFeedback] = useState<{ type: string; region: Region } | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = (type: string, region: Region) => {
    setFeedback({ type, region });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 800);
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid double-firing if both touch and click trigger
    // e.preventDefault(); // Don't prevent default as it might block other necessary events, but we rely on standard click/touch
    
    let clientX = 0;
    
    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else {
        return;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    let region: Region = "center";
    if (x < width / 3) region = "left";
    else if (x > (width * 2) / 3) region = "right";

    // If tap is in a different region, reset count
    const currentTapCount = region === lastRegion ? tapCount + 1 : 1;
    
    setTapCount(currentTapCount);
    setLastRegion(region);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Evaluate taps after timeout
      evaluateGesture(currentTapCount, region);
      
      // Reset after evaluation
      setTapCount(0);
      setLastRegion(null);
    }, 300); // 300ms window for multi-taps
  };

  const evaluateGesture = (count: number, region: Region) => {
    if (count === 1) {
      if (region === "center") {
        onSingleTapCenter();
        showFeedback(isPlaying ? "pause" : "play", "center");
      }
    } else if (count === 2) {
      if (region === "left") {
        onDoubleTapLeft();
        showFeedback("-10s", "left");
      } else if (region === "right") {
        onDoubleTapRight();
        showFeedback("+10s", "right");
      } else if (region === "center") {
        // Fallback for double tap center if not specified (maybe just pause/play again or ignore)
      }
    } else if (count >= 3) {
      if (region === "left") {
        onTripleTapLeft();
        showFeedback("comments", "left");
      } else if (region === "right") {
        onTripleTapRight();
        showFeedback("home", "right");
      } else if (region === "center") {
        onTripleTapCenter();
        showFeedback("next", "center");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-10 cursor-pointer"
      onClick={handleTap}
    >
      {/* Feedback Overlay */}
      {feedback && (
        <div
          className={`absolute inset-y-0 flex items-center justify-center pointer-events-none animate-pulse ${
            feedback.region === "left"
              ? "left-10"
              : feedback.region === "right"
              ? "right-10"
              : "inset-x-0"
          }`}
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-full p-6 flex flex-col items-center shadow-2xl">
            {feedback.type === "play" && <Play className="w-12 h-12 text-white fill-white ml-2" />}
            {feedback.type === "pause" && <Pause className="w-12 h-12 text-white fill-white" />}
            {feedback.type === "+10s" && (
              <>
                <FastForward className="w-10 h-10 text-white fill-white" />
                <span className="text-white font-bold mt-2 text-lg">+10s</span>
              </>
            )}
            {feedback.type === "-10s" && (
              <>
                <Rewind className="w-10 h-10 text-white fill-white" />
                <span className="text-white font-bold mt-2 text-lg">-10s</span>
              </>
            )}
            {feedback.type === "next" && (
              <>
                <SkipForward className="w-12 h-12 text-white fill-white" />
                <span className="text-white font-bold mt-2 text-lg">Next Video</span>
              </>
            )}
            {feedback.type === "comments" && (
              <>
                <MessageSquare className="w-10 h-10 text-white fill-white" />
                <span className="text-white font-bold mt-2 text-lg">Comments</span>
              </>
            )}
            {feedback.type === "home" && (
              <>
                <Home className="w-10 h-10 text-white fill-white" />
                <span className="text-white font-bold mt-2 text-lg">Home</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
