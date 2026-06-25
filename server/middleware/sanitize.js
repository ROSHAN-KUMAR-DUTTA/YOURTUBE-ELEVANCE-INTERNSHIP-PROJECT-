const badWords = ["badword1", "badword2", "fuck", "shit", "bitch", "ass"]; // Basic profanity list

export const sanitizeComment = (req, res, next) => {
  const { commentbody } = req.body;
  if (!commentbody) {
    return next();
  }

  const lowerCaseBody = commentbody.toLowerCase();
  
  const containsProfanity = badWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerCaseBody);
  });

  if (containsProfanity) {
    return res.status(400).json({ message: "Your comment contains inappropriate language." });
  }

  // Special Character Validation
  const repeatedSymbolsRegex = /([@#$%^&<>{}\|\[\]\-])\1{2,}/;
  const clusterRegex = /[@#\$%\^&\[\]\{\}<>\|\-\+\=\\\/~\`]{4,}/;
  const restrictedChars = commentbody.match(/[@#\$%\^&\[\]\{\}<>\|\-\+\=\\\/~\`]/g);
  
  let isExcessive = false;
  if (repeatedSymbolsRegex.test(commentbody) || clusterRegex.test(commentbody)) {
    isExcessive = true;
  }
  if (restrictedChars && commentbody.length > 0) {
    if (restrictedChars.length / commentbody.length > 0.5) {
      isExcessive = true;
    }
  }

  if (isExcessive) {
    return res.status(400).json({ message: "Comments cannot contain excessive special characters." });
  }

  next();
};
