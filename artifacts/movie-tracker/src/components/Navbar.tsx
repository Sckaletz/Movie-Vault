import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Film, User, Search, Library, BarChart2, LogOut } from "lucide-react";

export function Navbar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold tracking-wider text-xl">
            <Film className="h-6 w-6 text-primary" />
            <span>CineLog</span>
          </Link>

          <div className="hidden md:flex gap-6 items-center">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Discovery
              </div>
            </Link>
            {user && (
              <>
                <Link 
                  href="/library" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/library") ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div className="flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Library
                  </div>
                </Link>
                <Link 
                  href="/stats" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/stats") ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Stats
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-primary">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Link href="/auth" className="flex items-center">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
