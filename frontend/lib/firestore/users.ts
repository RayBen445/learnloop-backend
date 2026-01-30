import {
  doc,
  setDoc,
  getFirestore,
  serverTimestamp
} from "firebase/firestore";
import { app } from "../firebase";
import { User } from "firebase/auth";

const db = getFirestore(app);

export const createUserProfile = async (user: User) => {
  const userRef = doc(db, "users", user.uid);

  // Create or merge user data
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: serverTimestamp(),
  }, { merge: true });
};
