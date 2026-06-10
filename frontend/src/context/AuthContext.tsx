import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { fetchSeenMovies, markMovieSeen, unmarkMovieSeen } from "../lib/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  seenMovieIds: Set<number>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSeenMovies: () => Promise<void>;
  toggleSeen: (movieId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [seenMovieIds, setSeenMovieIds] = useState<Set<number>>(new Set());

  const refreshSeenMovies = useCallback(async () => {
    try {
      const ids = await fetchSeenMovies();
      setSeenMovieIds(new Set(ids));
    } catch {
      setSeenMovieIds(new Set());
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await refreshSeenMovies();
        } else {
          setSeenMovieIds(new Set());
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [refreshSeenMovies]);

  useEffect(() => {
    if (user) {
      refreshSeenMovies();
    }
  }, [user, refreshSeenMovies]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSeenMovieIds(new Set());
  };

  const toggleSeen = async (movieId: number) => {
    const isSeen = seenMovieIds.has(movieId);
    if (isSeen) {
      await unmarkMovieSeen(movieId);
      setSeenMovieIds((prev) => {
        const next = new Set(prev);
        next.delete(movieId);
        return next;
      });
    } else {
      await markMovieSeen(movieId);
      setSeenMovieIds((prev) => new Set(prev).add(movieId));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        seenMovieIds,
        signUp,
        signIn,
        signOut,
        refreshSeenMovies,
        toggleSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
