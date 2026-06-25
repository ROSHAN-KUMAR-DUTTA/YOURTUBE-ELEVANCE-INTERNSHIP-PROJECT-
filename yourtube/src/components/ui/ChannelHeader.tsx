import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const ChannelHeader = ({ channel }: any) => {
  const { user, setUser } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (user && user.subscribedChannels) {
      setIsSubscribed(user.subscribedChannels.includes(channel?._id));
    }
  }, [user, channel?._id]);

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please login to subscribe.");
      return;
    }
    try {
      const res = await axiosInstance.post(`/user/subscribe/${channel?._id}`, {
        userId: user._id,
      });
      setIsSubscribed(res.data.subscribed);
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (error) {
      console.log("Subscription Error:", error);
    }
  };
  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>@{channel?.channelname.toLowerCase().replace(/\s+/g, "")}</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-muted text-black dark:text-white" : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;