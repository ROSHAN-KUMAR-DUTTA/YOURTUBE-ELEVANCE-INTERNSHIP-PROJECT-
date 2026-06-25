let comments: any[] = [];

function containsSpecialChars(text: string) {
  return /[^a-zA-Z0-9\s]/.test(text);
}

export const addComment = (text: string, city: string) => {
  if (containsSpecialChars(text)) {
    alert("Special characters not allowed");
    return;
  }

  comments.push({
    id: Date.now(),
    text,
    city,
    likes: 0,
    dislikes: 0
  });
};

export const getComments = () => comments;

export const reactToComment = (id: number, type: string) => {
  const comment = comments.find(c => c.id === id);

  if (!comment) return;

  if (type === "like") comment.likes++;
  if (type === "dislike") comment.dislikes++;

  if (comment.dislikes >= 2) {
    comments = comments.filter(c => c.id !== id);
  }
};