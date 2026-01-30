import {
  getDatabase,
  ref,
  push,
  get,
  child,
  query,
  limitToLast,
  serverTimestamp
} from "firebase/database";
import { app } from "../firebase";
import { User } from "firebase/auth";

const db = getDatabase(app);

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: number | null; // RTDB timestamp is number
  likes: number;
}

export const createPost = async (content: string, user: User) => {
  try {
    const postsRef = ref(db, 'posts');
    const newPostRef = await push(postsRef, {
      content,
      authorId: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL,
      createdAt: serverTimestamp(),
      likes: 0,
    });
    return newPostRef.key;
  } catch (e) {
    console.error("Error adding post: ", e);
    throw e;
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    const dbRef = ref(db);
    // RTDB doesn't support descending sort directly easily without client-side reversal
    // We fetch the last 50 posts (which would be the newest if keys are pushed chronologically)
    const postsQuery = query(child(dbRef, 'posts'), limitToLast(50));
    const snapshot = await get(postsQuery);

    if (snapshot.exists()) {
      const posts: Post[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        posts.push({
          id: childSnapshot.key as string,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoURL: data.authorPhotoURL,
          createdAt: data.createdAt,
          likes: data.likes || 0
        });
      });
      // Reverse to show newest first
      return posts.reverse();
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
};
