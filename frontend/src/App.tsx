import { useState } from "react";
import Navbar from "./components/Navbar";
import MovieGrid from "./components/MovieGrid";
import MovieDetail from "./pages/MovieDetail";
import SeenMovies from "./pages/SeenMovies";
import Auth from "./pages/Auth";
import "./App.css";

type Page = "home" | "trending" | "seen" | "detail" | "auth";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [returnPage, setReturnPage] = useState<Page>("home");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  const handleMovieSelect = (id: number) => {
    setReturnPage(currentPage);
    setSelectedMovieId(id);
    setCurrentPage("detail");
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setCurrentPage(returnPage);
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
        {currentPage === "seen" && (
          <SeenMovies
            onSelectMovie={handleMovieSelect}
            onSignIn={() => setCurrentPage("auth")}
          />
        )}
        {currentPage === "detail" && selectedMovieId && (
          <MovieDetail movieId={selectedMovieId} onBack={handleBack} />
        )}
        {currentPage === "auth" && (
          <Auth onBack={() => setCurrentPage("home")} />
        )}
      </main>
    </div>
  );
}

export default App;
