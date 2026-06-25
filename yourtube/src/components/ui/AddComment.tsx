"use client";
import { useState } from "react";
import { addComment } from "@/lib/commentService";

export default function AddComment({ refresh }: any) {
  const [text, setText] = useState("");
  const [city, setCity] = useState("");

  const submit = () => {
    addComment(text, city);
    setText("");
    setCity("");
    refresh();
  };

  return (
    <div>
      <input
        placeholder="Comment"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <button onClick={submit}>Post</button>
    </div>
  );
}