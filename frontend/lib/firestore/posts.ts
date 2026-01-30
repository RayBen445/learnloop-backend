import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  getFirestore
} from "firebase/firestore";
import { app } from "../firebase";
import { User } from "firebase/auth";

const db = getFirestore(app);

export interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: Timestamp | null;
}

export const createPost = async (content: string, user: User) => {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      content,
      authorId: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL,
      createdAt: serverTimestamp(),
      likes: 0,
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const getPosts = async (): Promise<Post[]> => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const posts: Post[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    posts.push({
      id: doc.id,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      authorPhotoURL: data.authorPhotoURL,
      createdAt: data.createdAt,
    });
  });
  return posts;
};
