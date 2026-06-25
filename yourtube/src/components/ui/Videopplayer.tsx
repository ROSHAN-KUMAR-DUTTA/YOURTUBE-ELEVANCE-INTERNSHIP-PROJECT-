// Force Turbopack recompile
import { useRef, useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import { Lock, Crown, Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind } from "lucide-react";
import GestureOverlay from "./GestureOverlay";
import { Button } from "./button";


interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onNextVideo?: () => void;
  onOpenComments?: () => void;
  onGoHome?: () => void;
}

export default function VideoPlayer({ 
  video, 
  onNextVideo, 
  onOpenComments, 
  onGoHome 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const router = useRouter();
  
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | "unlimited" | null>(null);
  
  // Custom Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch Time Tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkInitialLimit = async () => {
      if (!user) return;
      try {
        const res = await axiosInstance.post("/videoTrack/track", {
          userId: user._id,
          secondsWatched: 0, // Just check status without incrementing
        });

        if (res.data.limitReached) {
          setIsLocked(true);
          setRemainingTime(0);
          if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        } else {
          setRemainingTime(res.data.remainingSeconds);
        }
      } catch (error) {
        console.error("Failed to check initial watch time limit", error);
      }
    };

    checkInitialLimit();

    const trackTime = async () => {
      if (!user || isLocked) return;
      if (videoRef.current && !videoRef.current.paused) {
        try {
          const res = await axiosInstance.post("/videoTrack/track", {
            userId: user._id,
            secondsWatched: 5,
          });

          if (res.data.limitReached) {
            videoRef.current.pause();
            setIsPlaying(false);
            setIsLocked(true);
            setRemainingTime(0);
          } else {
            setRemainingTime(res.data.remainingSeconds);
          }
        } catch (error) {
          console.error("Failed to track watch time", error);
        }
      }
    };
    
    interval = setInterval(trackTime, 5000);
    return () => clearInterval(interval);
  }, [user, isLocked]);

  // Handle Mouse Idle Auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !isLocked) {
      setShowControls(false);
    }
  };

  // Video Events
  const togglePlay = () => {
    if (isLocked || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipForward = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  const skipBackward = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (Number(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = Number(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (isLocked) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          skipForward();
          break;
        case "arrowleft":
          e.preventDefault();
          skipBackward();
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(videoRef.current.volume + 0.05, 1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(videoRef.current.volume - 0.05, 0);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, isPlaying, isMuted, volume, isFullscreen]);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group font-sans select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {!isLocked && (
        <GestureOverlay 
          isPlaying={isPlaying}
          onSingleTapCenter={togglePlay}
          onDoubleTapLeft={skipBackward}
          onDoubleTapRight={skipForward}
          onTripleTapCenter={() => onNextVideo && onNextVideo()}
          onTripleTapLeft={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().then(() => {
                setIsFullscreen(false);
                setTimeout(() => onOpenComments && onOpenComments(), 100);
              }).catch(err => console.log(err));
            } else {
              onOpenComments && onOpenComments();
            }
          }}
          onTripleTapRight={() => {
            window.close();
            setTimeout(() => {
              if (onGoHome) onGoHome();
            }, 300);
          }}
        />
      )}
      {/* Video Element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${isLocked ? "blur-md brightness-50 pointer-events-none" : "cursor-pointer"}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={`${process.env.BACKEND_URL}/${video?.filepath}`} type="video/mp4" />
      </video>

      {/* Floating Remaining Time Badge */}
      {!isLocked && remainingTime !== null && remainingTime !== "unlimited" && remainingTime > 0 && (
        <div className={`absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          {formatRemaining(remainingTime as number)} limit
        </div>
      )}

      {/* Custom Controls Overlay */}
      {!isLocked && (
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pt-12 pb-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={(e) => e.stopPropagation()} // Prevent toggling play when clicking controls
        >
          
          {/* Progress Bar */}
          <div className="relative w-full h-1.5 bg-card text-card-foreground/30 rounded-full mb-3 cursor-pointer group/slider">
            <div 
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full pointer-events-none" 
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/slider:scale-100 transition-transform"></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleProgressChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              
              {/* Skip Backward */}
              <button onClick={skipBackward} className="hover:text-red-500 transition-colors focus:outline-none hidden sm:block">
                <Rewind className="w-5 h-5 fill-current" />
              </button>

              {/* Play/Pause */}
              <button onClick={togglePlay} className="hover:text-red-500 transition-colors focus:outline-none">
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              {/* Skip Forward */}
              <button onClick={skipForward} className="hover:text-red-500 transition-colors focus:outline-none hidden sm:block">
                <FastForward className="w-5 h-5 fill-current" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume ml-2">
                <button onClick={toggleMute} className="hover:text-red-500 transition-colors focus:outline-none">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-card text-card-foreground/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-card text-card-foreground [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="text-xs font-medium tracking-wide">
                {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors focus:outline-none">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Play Button Overlay (shows when paused and controls are visible) */}
      {!isLocked && !isPlaying && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm animate-pulse">
            <Play className="w-12 h-12 text-white fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
          <div className="bg-card text-card-foreground p-8 rounded-2xl max-w-md w-full mx-4 text-center shadow-2xl border border-border transform transition-all scale-100 pointer-events-auto">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Daily Limit Reached</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              You've reached your daily watch limit for your current plan. Upgrade to a premium plan to unlock more watch time.
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-card text-card-foreground text-foreground border border-gray-300 hover:bg-background" onClick={() => router.push("/")}>
                Go Home
              </Button>
              <Button className="bg-yellow-500/100 hover:bg-yellow-600 text-white border-0 shadow-lg shadow-yellow-500/30" onClick={() => router.push("/pricing")}>
                <Crown className="w-4 h-4 mr-2" /> View Plans
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
