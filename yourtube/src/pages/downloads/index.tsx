import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { format } from "date-fns";
import { Play, Trash2, Search, DownloadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DownloadsPage = () => {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDownloads = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/download/user/${user._id}`);
      setDownloads(res.data);
    } catch (error) {
      console.log("Error fetching downloads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this download?")) return;
    try {
      await axiosInstance.delete(`/download/${id}`);
      setDownloads((prev) => prev.filter((d) => d._id !== id));
    } catch (error) {
      console.log("Error deleting download", error);
      alert("Failed to delete download.");
    }
  };

  const filteredDownloads = downloads.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <DownloadCloud className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-medium mb-2">Sign in to view your downloads</h2>
        <p className="text-muted-foreground">Log in to manage and watch your downloaded videos offline.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DownloadCloud className="w-6 h-6" /> Downloads
            </h1>
            <p className="text-muted-foreground mt-1">Manage your offline videos</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card text-card-foreground border-border"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="bg-muted aspect-video rounded-xl"></div>
                <div className="bg-muted h-4 w-3/4 mt-2 rounded"></div>
                <div className="bg-muted h-3 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-card text-card-foreground rounded-2xl border border-border p-8 text-center shadow-sm">
            <DownloadCloud className="w-12 h-12 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No downloads found</h2>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Videos you download will appear here"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDownloads.map((download) => (
              <div key={download._id} className="group bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative aspect-video bg-black/5">
                  <video 
                    src={download.fileUrl} 
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="icon" className="rounded-full w-10 h-10 shadow-lg" onClick={() => window.open(download.fileUrl, "_blank")}>
                      <Play className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {download.duration || "0:00"}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => window.open(download.fileUrl, "_blank")}>
                    {download.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(download.downloadedAt), "MMM d, yyyy")}</span>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 -mr-2" onClick={() => handleDelete(download._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPage;
