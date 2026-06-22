import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => handleNavigate("home")}>
          🎬 Movie Vault
        </div>
        <button
          className="nav-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
          <li>
            <a
              className={currentPage === "home" ? "active" : ""}
              onClick={() => handleNavigate("home")}
            >
              Popular
            </a>
          </li>
          <li>
            <a
              className={currentPage === "trending" ? "active" : ""}
              onClick={() => handleNavigate("trending")}
            >
              Trending
            </a>
          </li>
          <li>
            <a
              className={currentPage === "seen" ? "active" : ""}
              onClick={() => handleNavigate("seen")}
            >
              Movies I&apos;ve Seen
            </a>
          </li>
          <li className="nav-auth">
            {!loading && (
              user ? (
                <div className="nav-user">
                  <span className="nav-email">{user.email}</span>
                  <button className="nav-signout" onClick={() => signOut()}>
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  className="nav-signin"
                  onClick={() => handleNavigate("auth")}
                >
                  Sign In
                </button>
              )
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
