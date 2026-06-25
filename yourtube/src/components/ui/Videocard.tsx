// Force Turbopack recompile
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./avatar";
import { useState } from "react";

export default function VideoCard({ video }: any) {
  const [duration, setDuration] = useState<number | null>(null);

  const handleLoadedMetadata = (e: any) => {
    setDuration(e.currentTarget.duration);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <video
            src={`${"http://localhost:5000"}/${video?.filepath}`}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            {duration !== null ? formatTime(duration) : "..."}
          </div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{video?.videochanel}</p>
            <p className="text-sm text-muted-foreground">
              {video?.views?.toLocaleString() || 0} views •{" "}
              {video?.createdAt ? formatDistanceToNow(new Date(video.createdAt)) : ""} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}