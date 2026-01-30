import {
  getDatabase,
  ref,
  set,
  serverTimestamp
} from "firebase/database";
import { app } from "../firebase";
import { User } from "firebase/auth";

const db = getDatabase(app);

export const createUserProfile = async (user: User) => {
  try {
    const userRef = ref(db, 'users/' + user.uid);

    // We use set here to create or overwrite.
    // In RTDB, merging is done with update(), but set is fine for this initialization
    // if we include all fields we want to persist.
    // However, to mimic 'merge: true', we should use update if we don't want to blow away existing data.
    // For profile creation on login, update is safer.

    // Actually, 'set' with specific paths is safer to ensure schema, but 'update' is better for non-destructive.
    // Let's use set for the base profile data that comes from Auth.

    await set(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
};
