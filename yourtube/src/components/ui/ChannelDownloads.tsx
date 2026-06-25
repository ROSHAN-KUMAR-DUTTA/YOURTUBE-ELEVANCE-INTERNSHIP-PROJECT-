import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import Videocard from "./Videocard";
import { useUser } from "@/lib/AuthContext";

const ChannelDownloads = ({ userId }: { userId: string }) => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const res = await axiosInstance.get(`/download/user/${userId}`);
        setDownloads(res.data);
      } catch (error) {
        console.error("Failed to fetch downloads", error);
      } finally {
        setLoading(false);
      }
    };
    if (userId) {
      fetchDownloads();
    }
  }, [userId]);

  if (loading) return <div className="p-4">Loading downloads...</div>;

  if (user?._id !== userId) {
    return <div className="p-4 text-center text-muted-foreground">You can only view your own downloads.</div>;
  }

  if (downloads.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No downloads found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {downloads.map((video: any) => (
        <Videocard key={video._id} video={video} />
      ))}
    </div>
  );
};

export default ChannelDownloads;
