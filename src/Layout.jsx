import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated user check (replace with real auth if needed)
  useEffect(() => {
    setIsLoading(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <span className="font-bold text-xl text-purple-400">Wandalf</span>
          <Link
            to="/"
            className={`hover:text-purple-400 ${
              currentPageName === "Home" ? "text-purple-400" : "text-slate-300"
            }`}
          >
            Home
          </Link>
          <Link
            to="/chat"
            className={`hover:text-purple-400 ${
              currentPageName === "Chat" ? "text-purple-400" : "text-slate-300"
            }`}
          >
            Chat
          </Link>
          <Link
            to="/demo"
            className={`hover:text-purple-400 ${
              currentPageName === "Demo" ? "text-purple-400" : "text-slate-300"
            }`}
          >
            Demo
          </Link>
        </div>
        <div>
          {isLoading ? (
            <span className="text-slate-400">Loading...</span>
          ) : user ? (
            <button
              onClick={() => {
                setUser(null);
                navigate("/");
              }}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setUser({ name: "Guest" })}
              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 p-4 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} Wandalf. All rights reserved.
      </footer>
    </div>
  );
}
