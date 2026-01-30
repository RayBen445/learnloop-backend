import { useEffect, useState } from "react";
import { getPosts, Post } from "../lib/realtime/posts";

export default function Feed({ refreshTrigger }: { refreshTrigger: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (error) {
        console.error("Error fetching posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [refreshTrigger]);

  if (loading) return <div className="text-center p-4">Loading posts...</div>;

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center text-gray-500">No posts yet. Be the first!</div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="p-4 bg-white rounded shadow border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-semibold text-gray-900">{post.authorName}</div>
              <div className="text-xs text-gray-500">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString()
                  : "Just now"}
              </div>
            </div>
            <p className="text-gray-800">{post.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
