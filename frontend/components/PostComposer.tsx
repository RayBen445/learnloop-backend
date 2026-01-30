import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../lib/realtime/posts";

export default function PostComposer({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      await createPost(content, user);
      setContent("");
      onPostCreated();
    } catch (error) {
      console.error("Error creating post", error);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow mb-4">
      <textarea
        className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        rows={3}
        placeholder="What did you learn today?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!content.trim()}
        >
          Post
        </button>
      </div>
    </form>
  );
}
