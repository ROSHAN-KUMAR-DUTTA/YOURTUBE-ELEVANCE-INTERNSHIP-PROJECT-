// Force Turbopack recompile
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { ThumbsUp, ThumbsDown, Globe, MapPin, Edit, Trash2 } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon?: string;
  createdAt?: string;
  city?: string;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [city, setCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [translated, setTranslated] = useState<{ [key: string]: string }>({});
  const [lang, setLang] = useState("en");

  // prevent multiple likes/dislikes
  const [userActions, setUserActions] = useState<{ [key: string]: string }>({});

  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      const updated = res.data.map((c: any) => ({
        ...c,
        likes: c.likes || 0,
        dislikes: c.dislikes || 0,
        likedBy: c.likedBy || [],
        dislikedBy: c.dislikedBy || [],
        city: c.city || "Unknown"
      }));
      setComments(updated);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 safer filter (does NOT block languages)
  const containsBadChars = (text: string) => {
    const repeatedSymbolsRegex = /([@#$%^&<>{}\|\[\]\-])\1{2,}/;
    const clusterRegex = /[@#\$%\^&\[\]\{\}<>\|\-\+\=\\\/~\`]{4,}/;
    const restrictedChars = text.match(/[@#\$%\^&\[\]\{\}<>\|\-\+\=\\\/~\`]/g);
    
    if (repeatedSymbolsRegex.test(text) || clusterRegex.test(text)) {
      return true;
    }
    if (restrictedChars && text.length > 0) {
      if (restrictedChars.length / text.length > 0.5) return true;
    }
    return false;
  };

  // 🌍 TRANSLATE
  const handleTranslate = async (id: string, text: string) => {
    try {
      const res = await axiosInstance.post(`/comment/translate/${id}`, {
        text,
        lang
      });

      if (res.data.translatedText) {
        setTranslated(prev => ({
          ...prev,
          [id]: res.data.translatedText
        }));
      }
    } catch (err) {
      console.log("Translate error:", err);
    }
  };

  // ➕ ADD COMMENT
  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    if (containsBadChars(newComment)) {
      alert("Comments cannot contain excessive special characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
        city
      });

      if (res.data.comment) {
        const newCommentObj: Comment = res.data.data ? {
          ...res.data.data,
          likes: res.data.data.likes || 0,
          dislikes: res.data.data.dislikes || 0,
          likedBy: res.data.data.likedBy || [],
          dislikedBy: res.data.data.dislikedBy || []
        } : {
          _id: Date.now().toString(),
          videoid: videoId,
          userid: user._id,
          commentbody: newComment,
          usercommented: user.name || "Anonymous",
          createdAt: new Date().toISOString(),
          city,
          likes: 0,
          dislikes: 0,
          likedBy: [],
          dislikedBy: []
        };

        setComments([newCommentObj, ...comments]);
      }

      setNewComment("");
      setCity("");
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);
      } else {
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 👍👎 REACT (with limit)
  const handleReact = async (id: string, type: "like" | "dislike") => {
    if (!user) {
      alert("Please login to react to comments");
      return;
    }

    try {
      const res = await axiosInstance.post(`/comment/react/${id}`, {
        userId: user._id,
        type
      });

      if (res.data.deleted) {
        // Comment was moderated and deleted
        setComments(prev => prev.filter(c => c._id !== id));
        return;
      }

      setComments(prev =>
        prev.map(c => (c._id === id ? { ...c, likes: res.data.likes, dislikes: res.data.dislikes, likedBy: res.data.likedBy, dislikedBy: res.data.dislikedBy } : c))
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ✏️ EDIT
  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;

    if (containsBadChars(editText)) {
      alert("Comments cannot contain excessive special characters.");
      return;
    }

    try {
      await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );

      setComments(prev =>
        prev.map(c =>
          c._id === editingCommentId
            ? { ...c, commentbody: editText }
            : c
        )
      );

      setEditingCommentId(null);
      setEditText("");
    } catch (error) {
      console.log(error);
    }
  };

  // 🗑 DELETE
  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/comment/deletecomment/${id}`);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {/* ADD COMMENT */}
      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
            />

            <input
              placeholder="Enter your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border p-1 text-sm"
            />

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE SELECT */}
      <select 
        onChange={(e) => setLang(e.target.value)}
        className="bg-background text-foreground border border-input rounded p-1 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="bn">Bengali</option>
        <option value="es">Spanish</option>
        <option value="ta">Tamil</option>
        <option value="fr">French</option>
      </select>

      {/* COMMENTS */}
      {comments.map(comment => (
        <div key={comment._id} className="flex gap-3 sm:gap-4">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
            <AvatarFallback>{comment.usercommented?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span className="font-medium truncate max-w-full">{comment.usercommented}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(comment.createdAt || comment.commentedon || Date.now()))} ago
              </span>
            </div>

            {/* EDIT OR VIEW */}
            {editingCommentId === comment._id ? (
              <div className="space-y-2 mt-1">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateComment}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm sm:text-base break-words whitespace-pre-wrap">
                {translated[comment._id] || comment.commentbody}
              </p>
            )}

            <small className="flex items-center text-muted-foreground mt-1 text-xs">
              <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{comment.city}</span>
            </small>

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm items-center text-muted-foreground">
              <button onClick={() => handleReact(comment._id, "like")} className={`flex items-center gap-1 hover:text-black dark:hover:text-white ${comment.likedBy?.includes(user?._id) ? 'text-black dark:text-white font-medium' : ''}`}>
                <ThumbsUp className={`w-4 h-4 ${comment.likedBy?.includes(user?._id) ? 'fill-current' : ''}`} /> <span>{comment.likes}</span>
              </button>

              <button onClick={() => handleReact(comment._id, "dislike")} className={`flex items-center gap-1 hover:text-black dark:hover:text-white ${comment.dislikedBy?.includes(user?._id) ? 'text-black dark:text-white font-medium' : ''}`}>
                <ThumbsDown className={`w-4 h-4 ${comment.dislikedBy?.includes(user?._id) ? 'fill-current' : ''}`} /> <span>{comment.dislikes}</span>
              </button>

              <button
                onClick={() =>
                  handleTranslate(comment._id, comment.commentbody)
                }
                className="flex items-center gap-1 hover:text-black dark:hover:text-white whitespace-nowrap"
              >
                <Globe className="w-4 h-4 shrink-0" /> <span>Translate</span>
              </button>

              {comment.userid === user?._id && (
                <>
                  <button onClick={() => handleEdit(comment)} className="flex items-center gap-1 hover:text-black dark:hover:text-white whitespace-nowrap">
                    <Edit className="w-4 h-4 shrink-0" /> <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(comment._id)} className="flex items-center gap-1 hover:text-red-500 whitespace-nowrap">
                    <Trash2 className="w-4 h-4 shrink-0" /> <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Comments;