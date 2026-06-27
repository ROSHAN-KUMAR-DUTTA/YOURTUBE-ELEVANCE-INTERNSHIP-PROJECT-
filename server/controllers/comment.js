import comment from "../Modals/comment.js";
import mongoose from "mongoose";

// ✅ Create Comment
export const postcomment = async (req, res) => {
  const { commentbody, userid, usercommented, videoid, city } = req.body;

  if (!commentbody || commentbody.trim() === "") {
    return res.status(400).json({ message: "Empty comment not allowed" });
  }

  try {
    const newComment = await comment.create({
      commentbody: commentbody.trim(),
      userid,
      usercommented,
      videoid,
      city: city || "Unknown",
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      translations: {}
    });

    return res.status(200).json({ comment: true, data: newComment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to post comment" });
  }
};


export const getallcomment = async (req, res) => {
  const { videoid } = req.params;

  try {
    const comments = await comment.find({ videoid }).sort({ createdAt: -1 });
    return res.status(200).json(comments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch comments" });
  }
};


export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Invalid ID" });
  }

  try {
    const deleted = await comment.findByIdAndDelete(_id);

    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json({ deleted: true });
  } catch {
    return res.status(500).json({ message: "Delete failed" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Invalid ID" });
  }

  if (!commentbody || commentbody.trim() === "") {
    return res.status(400).json({ message: "Empty comment not allowed" });
  }

  try {
    const updated = await comment.findByIdAndUpdate(
      _id,
      { $set: { commentbody: commentbody.trim() } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(200).json(updated);
  } catch {
    return res.status(500).json({ message: "Update failed" });
  }
};


export const reactToComment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId, type } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Invalid ID" });
  }

  if (!userId || !["like", "dislike"].includes(type)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    const c = await comment.findById(_id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    let { likedBy, dislikedBy, likes, dislikes } = c;

    likedBy = likedBy || [];
    dislikedBy = dislikedBy || [];

    const hasLiked = likedBy.includes(userId);
    const hasDisliked = dislikedBy.includes(userId);

    // remove previous reaction
    likedBy = likedBy.filter(id => id !== userId);
    dislikedBy = dislikedBy.filter(id => id !== userId);

    if (type === "like" && !hasLiked) {
      likedBy.push(userId);
    }
    if (type === "dislike" && !hasDisliked) {
      dislikedBy.push(userId);
    }

    likes = likedBy.length;
    dislikes = dislikedBy.length;

    // ✅ SAFE MODERATION (delete after 2 dislikes)
    if (dislikes >= 2) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({ deleted: true });
    }

    const updated = await comment.findByIdAndUpdate(
      _id,
      { likes, dislikes, likedBy, dislikedBy },
      { new: true }
    );

    return res.status(200).json(updated);
  } catch {
    return res.status(500).json({ message: "Reaction failed" });
  }
};


// REPLACE THE ENTIRE translateComment FUNCTION WITH THIS:
export const translateComment = async (req, res) => {
  const { id: _id } = req.params;
  const { lang } = req.body;

  if (!lang || typeof lang !== "string") {
    return res.status(400).json({ message: "Invalid language" });
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Invalid ID" });
  }

  try {
    const c = await comment.findById(_id);
    if (!c) return res.status(404).json({ message: "Comment not found" });

    const text = c.commentbody;

    // If target is English, return original text
    if (lang === "en") {
      return res.status(200).json({ translatedText: text });
    }

    // Cache check — return if already translated
    if (c.translations?.[lang]) {
      return res.status(200).json({ translatedText: c.translations[lang] });
    }

    // MyMemory Free Translation API
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;

    const response = await fetch(url);
    const data = await response.json();

    const translatedText = data?.responseData?.translatedText;

    if (!translatedText || translatedText.includes("INVALID") || translatedText.includes("NO CONTENT")) {
      console.error("MyMemory error:", data);
      return res.status(500).json({ message: "Translation failed" });
    }

    // Save to cache in DB
    await comment.updateOne(
      { _id },
      { $set: { [`translations.${lang}`]: translatedText } }
    );

    return res.status(200).json({ translatedText });

  } catch (err) {
    console.error("Translate error:", err);
    return res.status(500).json({ message: "Server error during translation" });
  }
};