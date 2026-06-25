"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

export default function HistoryContent() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(true);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const historyData = await axiosInstance.get(`/history/${user?._id}`);
      setHistory(historyData.data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="space-y-4 w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 sm:gap-4 w-full">
            <div className="w-32 sm:w-40 md:w-48 aspect-video bg-muted animate-pulse rounded shrink-0"></div>
            <div className="flex-1 space-y-2 py-1 min-w-0">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleRemoveFromHistory = async (historyId: string) => {
    try {
      console.log("Removing from history:", historyId);

      setHistory(history.filter((item) => item._id !== historyId));
    } catch (error) {
      console.error("Error removing from history:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 px-4 bg-card rounded-xl border border-border shadow-sm">
        <Clock className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Keep track of what you watch
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Watch history isn't viewable when signed out.
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-card rounded-xl border border-border shadow-sm">
        <Clock className="w-12 sm:w-16 h-12 sm:h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold mb-2">No watch history yet</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Videos you watch will appear here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-between items-center px-1">
        <p className="text-sm font-medium text-muted-foreground">{history.length} videos</p>
      </div>

      <div className="space-y-4 w-full">
        {history.map((item) => (
          <div key={item._id} className="flex gap-3 sm:gap-4 group relative pr-8 sm:pr-12 w-full">
            <Link href={`/watch/${item.videoid._id}`} className="flex-shrink-0">
              <div className="relative w-32 sm:w-40 md:w-48 aspect-video bg-muted rounded overflow-hidden">
                <video
                  src={`${"http://localhost:5000"}/${item.videoid?.filepath}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>

            <div className="flex-1 min-w-0 py-0.5">
              <Link href={`/watch/${item.videoid._id}`}>
                <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 mb-1 leading-snug">
                  {item.videoid.videotitle}
                </h3>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                {item.videoid.videochanel}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                {item.videoid.views.toLocaleString()} views •{" "}
                {formatDistanceToNow(new Date(item.videoid.createdAt))} ago
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-8 h-8 sm:w-10 sm:h-10"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleRemoveFromHistory(item._id)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove from history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}