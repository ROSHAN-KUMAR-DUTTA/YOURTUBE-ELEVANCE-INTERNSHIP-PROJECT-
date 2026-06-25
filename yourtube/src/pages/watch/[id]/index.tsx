// Force Turbopack recompile
import Comments from "@/components/ui/Comments";
import RelatedVideos from "@/components/ui/RelatedVideos";
import VideoInfo from "@/components/ui/VideoInfo";
import Videopplayer from "@/components/ui/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";

const WatchVideo = () => {
  const router = useRouter();
  const { id } = router.query;

  const [videos, setvideo] = useState<any>(null);
  const [videoList, setvide] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  
  const commentsRef = useRef<HTMLDivElement>(null);
  
  const handleOpenComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;

      try {
        const videoRes = await axiosInstance.get(`/video/${id}`);
        setvideo(videoRes.data);
        
        const allRes = await axiosInstance.get("/video/getall");
        setvide(allRes.data);
      } catch (error) {
        console.log("Error fetching video data:", error);
      } finally {
        setloading(false);
      }
    };

    if (id) {
      fetchvideo();
    }
  }, [id]);

  if (loading) return <div>Loading..</div>;
  if (!videos) return <div>Video not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer 
              key={videos._id}
              video={videos} 
              onNextVideo={() => {
                const nextVid = videoList.find((v: any) => v._id !== id);
                if (nextVid) router.push(`/watch/${nextVid._id}`);
              }}
              onOpenComments={handleOpenComments}
              onGoHome={() => router.push('/')}
            />
            <VideoInfo video={videos} />

            {/* 🔥 COMMENTS INTEGRATED HERE */}
            <div ref={commentsRef} className="scroll-mt-6">
              <Comments videoId={typeof id === "string" ? id : ""} />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="space-y-4">
            <RelatedVideos videos={videoList} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default WatchVideo;