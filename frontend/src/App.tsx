import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import MovieDetail from "./pages/MovieDetail";
import "./App.css";

type Page = "home" | "trending" | "detail";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const handleMovieSelect = (id: number) => {
    setSelectedMovieId(id);
    setCurrentPage("detail");
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSelectedMovieId(null);
  };

  return (
    <div className="app">
      <Navbar
        onNavigate={(page) => setCurrentPage(page as Page)}
        currentPage={currentPage}
      />
      <main className="main-content">
        {currentPage === "home" && <MovieGrid onSelectMovie={handleMovieSelect} />}
        {currentPage === "trending" && (
          <MovieGrid
            endpoint="trending"
            onSelectMovie={handleMovieSelect}
            title="Trending Movies"
          />
        )}
        {currentPage === "detail" && selectedMovieId && (
          <MovieDetail movieId={selectedMovieId} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}

export default App;
