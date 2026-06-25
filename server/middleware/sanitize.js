const badWords = ["badword1", "badword2", "fuck", "shit", "bitch", "ass"]; // Basic profanity list

export const sanitizeComment = (req, res, next) => {
  const { commentbody } = req.body;
  if (!commentbody) {
    return next();
  }

  const lowerCaseBody = commentbody.toLowerCase();
  const containsProfanity = badWords.some(word => lowerCaseBody.includes(word));

  if (containsProfanity) {
    return res.status(400).json({ message: "Comment contains inappropriate language." });
  }

  next();
};
