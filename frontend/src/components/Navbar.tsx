import { useState } from "react";
import "./Navbar.css";

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => onNavigate("home")}>
          🎬 Mikkel CD TEST Movie Vault
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
              onClick={() => {
                onNavigate("home");
                setIsOpen(false);
              }}
            >
              Popular
            </a>
          </li>
          <li>
            <a
              className={currentPage === "trending" ? "active" : ""}
              onClick={() => {
                onNavigate("trending");
                setIsOpen(false);
              }}
            >
              Trending
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
