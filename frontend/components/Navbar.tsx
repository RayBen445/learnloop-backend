import { useAuth } from "../context/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const { user, logOut, sendVerification } = useAuth();

  return (
    <div>
      {user && !user.emailVerified && (
        <div className="bg-yellow-500 text-black text-center p-2 text-sm">
          Please verify your email address.
          <button
            onClick={sendVerification}
            className="underline ml-2 font-bold hover:text-white"
          >
            Send Verification Email
          </button>
        </div>
      )}
      <nav className="p-4 bg-gray-800 text-white flex justify-between items-center">
      <h1 className="text-xl font-bold">LearnLoop</h1>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <Image
              src={user.photoURL || "https://via.placeholder.com/40"}
              alt="Profile"
              width={32}
              height={32}
              className="rounded-full"
            />
            <button
              onClick={logOut}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
    </div>
  );
}
