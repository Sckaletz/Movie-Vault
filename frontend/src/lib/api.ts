import { supabase } from "./supabase";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Not authenticated");
  }

  let { data: sessionData } = await supabase.auth.getSession();
  let token = sessionData.session?.access_token;

  const expiresAt = sessionData.session?.expires_at ?? 0;
  if (!token || expiresAt * 1000 < Date.now() + 60_000) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) {
      throw new Error("Session expired. Please sign in again.");
    }
    token = refreshed.session.access_token;
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchSeenMovies(): Promise<number[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiUrl}/seen`, { headers });

  if (!response.ok) {
    throw new Error("Failed to fetch seen movies");
  }

  const data = await response.json();
  return data.movies.map((m: { movie_id: number }) => m.movie_id);
}

export async function markMovieSeen(movieId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiUrl}/seen/${movieId}`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to mark movie as seen");
  }
}

export async function unmarkMovieSeen(movieId: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiUrl}/seen/${movieId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to unmark movie as seen");
  }
}
