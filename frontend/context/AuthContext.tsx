"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getAuth } from "firebase/auth";
import { app } from "../lib/firebase";
import { createUserProfile } from "../lib/realtime/users";

// Initialize Auth
const auth = getAuth(app);

// Define Context Type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, username?: string) => Promise<void>;
  logOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
  sendVerification: async () => {},
});

// Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user profile to Realtime Database on login
        await createUserProfile(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const sendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert("Verification email sent! Please check your inbox.");
      } catch (error) {
        console.error("Error sending verification email", error);
        alert("Failed to send verification email.");
      }
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, username?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (username && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username
        });
        // Force context update or manual sync could be needed if onAuthStateChanged doesn't trigger on profile update alone
        // But usually the next reload fixes it. For now, we rely on the object being updated.
      }
    } catch (error) {
      console.error("Error signing up with Email", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logOut, sendVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);
