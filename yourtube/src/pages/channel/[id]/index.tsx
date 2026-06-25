
import ChannelHeader from "@/components/ui/ChannelHeader";
import Channeltabs from "@/components/ui/Channeltabs";
import ChannelVideos from "@/components/ui/ChannelVideos";
import VideoUploader from "@/components/ui/VideoUploader";
import ChannelDownloads from "@/components/ui/ChannelDownloads";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = React.useState("videos");

  useEffect(() => {
    if (!id) return;
    const fetchChannel = async () => {
      try {
        const res = await axiosInstance.get(`/user/${id}`);
        setChannel(res.data);
      } catch (error) {
        console.error("Error fetching channel:", error);
        // Fallback or handle error
      } finally {
        setLoading(false);
      }
    };
    fetchChannel();
  }, [id]);

  const videos = [
    {
      _id: "1",
      videotitle: "Amazing Nature Documentary",
      filename: "nature-doc.mp4",
      filetype: "video/mp4",
      filepath: "/videos/nature-doc.mp4",
      filesize: "500MB",
      videochanel: "Nature Channel",
      Like: 1250,
      views: 45000,
      uploader: "nature_lover",
      createdAt: new Date().toISOString(),
    },
    {
      _id: "2",
      videotitle: "Cooking Tutorial: Perfect Pasta",
      filename: "pasta-tutorial.mp4",
      filetype: "video/mp4",
      filepath: "/videos/pasta-tutorial.mp4",
      filesize: "300MB",
      videochanel: "Chef's Kitchen",
      Like: 890,
      views: 23000,
      uploader: "chef_master",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  if (loading) {
    return <div className="text-center py-20">Loading channel...</div>;
  }

  if (!channel) {
    return <div className="text-center py-20">Channel not found</div>;
  }

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === "videos" && (
          <>
            {user?._id === channel._id && (
              <div className="px-4 pb-8">
                <VideoUploader channelId={id as string} channelName={channel?.channelname} />
              </div>
            )}
            <div className="px-4 pb-8">
              <ChannelVideos videos={videos} />
            </div>
          </>
        )}

        {activeTab === "downloads" && user?._id === channel._id && (
          <div className="px-4 pb-8 py-4">
            <h2 className="text-xl font-semibold mb-4">Your Downloads</h2>
            <ChannelDownloads userId={channel._id as string} />
          </div>
        )}
      </div>
    </div>
  );
};

export default index;