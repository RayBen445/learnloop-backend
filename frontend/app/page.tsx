"use client";

import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useState } from "react";
import Feed from "../components/Feed";
import PostComposer from "../components/PostComposer";

function MainContent() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />
      <main className="container mx-auto px-4 mt-8 max-w-2xl">
        <PostComposer onPostCreated={handlePostCreated} />
        <Feed refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
