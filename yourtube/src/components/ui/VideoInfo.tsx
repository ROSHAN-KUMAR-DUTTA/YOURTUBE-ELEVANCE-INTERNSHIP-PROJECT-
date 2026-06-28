import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user, setUser } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (user && user.subscribedChannels) {
      setIsSubscribed(user.subscribedChannels.includes(video.uploader));
    }
  }, [user, video.uploader]);

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user]);

  const handleDownload = async () => {
    if (!user) {
      alert("Please login to download videos.");
      return;
    }
    try {
      const res = await axiosInstance.post(`/download/${video._id}`, {
        userId: user._id,
      });
      if (res.data.url) {
        window.open(res.data.url, "_blank");
      }
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        alert(error.response.data.message);
      } else {
        console.log("Download Error:", error);
      }
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubscribe = async () => {
  if (!user) {
    alert("Please login to subscribe");
    return;
  }

  // video.uploader already has the channel owner's _id
  const channelOwnerId = video?.uploader;

  if (!channelOwnerId) {
    alert("Channel not found");
    return;
  }

  if (channelOwnerId === user._id) {
    alert("You cannot subscribe to your own channel");
    return;
  }

  try {
    const res = await axiosInstance.post(
      `/user/subscribe/${channelOwnerId}`,
      { userId: user._id }
    );

    if (res.data.subscribed !== undefined) {
      setIsSubscribed(res.data.subscribed);
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    }

  } catch (err: any) {
    console.error("Subscription Error:", err);
    alert(err.response?.data?.message || "Subscription failed");
  }
};
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (!res.data.liked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-medium truncate">{video.videochanel}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              1.2M subscribers
            </p>
          </div>
          {(!user || user._id !== video.uploader) && (
            <Button
              className={`ml-2 sm:ml-4 shrink-0 ${isSubscribed ? "bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" : "bg-white text-black hover:bg-gray-200 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"}`}
              onClick={handleSubscribe}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>

        {/* Action Buttons Container - Scrollable on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-full shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full px-4"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${
                  isLiked ? "fill-current" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-5 bg-muted" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full px-4"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${
                  isDisliked ? "fill-current" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-full shrink-0 px-4 ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-full shrink-0 px-4"
          >
            <Share className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-full shrink-0 px-4"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-full shrink-0 min-w-[36px]"
          >
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 text-black dark:bg-[#272727] dark:text-white rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(VideoInfo);
