import video from "../Modals/video.js";
import like from "../Modals/like.js";

export const handlelike = async (req, res) => {
  const { userId, type } = req.body;
  const { videoId } = req.params;
  

  if (!["like", "dislike"].includes(type)) {
    return res.status(400).json({
      message: "Invalid reaction type",
    });
  }

  try {
    const existingReaction = await like.findOne({
      viewer: userId,
      videoid: videoId,
    });

    // ----------------------------
    // No previous reaction
    // ----------------------------
    if (!existingReaction) {
      await Promise.all([
        like.create({
          viewer: userId,
          videoid: videoId,
          type,
        }),

        video.updateOne(
          { _id: videoId },
          {
            $inc:
              type === "like"
                ? { Like: 1 }
                : { Dislike: 1 },
          }
        ),
      ]);

      return res.json({
        action: "added",
        type,
      });
    }

    // ----------------------------
    // Same reaction clicked again
    // ----------------------------
    if (existingReaction.type === type) {
      await Promise.all([
        like.deleteOne({ _id: existingReaction._id }),

        video.updateOne(
          { _id: videoId },
          {
            $inc:
              type === "like"
                ? { Like: -1 }
                : { Dislike: -1 },
          }
        ),
      ]);

      return res.json({
        action: "removed",
        type,
      });
    }

    // ----------------------------
// Switch Like ↔ Dislike
// ----------------------------
existingReaction.type = type;

await Promise.all([
  existingReaction.save(),
  video.updateOne(
    { _id: videoId },
    {
      $inc:
        type === "like"
          ? {
              Like: 1,
              Dislike: -1,
            }
          : {
              Like: -1,
              Dislike: 1,
            },
    }
  ),
]);

    return res.json({
      action: "switched",
      type,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
export const getReactionStatus = async (req, res) => {
  const { userId, videoId } = req.params;

  try {
    const reaction = await like.findOne(
  {
    viewer: userId,
    videoid: videoId,
  },
  {
    type: 1,
    _id: 0,
  }
);

    if (!reaction) {
      return res.json({
        type: null,
      });
    }

    return res.json({
      type: reaction.type,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const likevideo = await like
      .find({
  viewer: userId,
  type: "like",
})
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};