import React, { useEffect, useState } from "react";
import Videocard from "./Videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  // const videos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/nature-doc.mp4",
  //     filesize: "500MB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     videotitle: "Cooking Tutorial: Perfect Pasta",
  //     filename: "pasta-tutorial.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/pasta-tutorial.mp4",
  //     filesize: "300MB",
  //     videochanel: "Chef's Kitchen",
  //     Like: 890,
  //     views: 23000,
  //     uploader: "chef_master",
  //     createdAt: new Date(Date.now() - 86400000).toISOString(),
  //   },
  // ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 mt-4 w-full">
      {loading ? (
        Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 w-full">
            <div className="w-full aspect-video bg-muted animate-pulse rounded-xl" />
            <div className="flex gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
                <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
              </div>
            </div>
          </div>
        ))
      ) : videos.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">No videos found.</p>
        </div>
      ) : (
        videos.map((video: any) => <Videocard key={video._id} video={video} />)
      )}
    </div>
  );
};

export default Videogrid;