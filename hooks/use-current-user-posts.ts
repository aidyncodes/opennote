import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Post {
  id: string;
  created_at: string;
  content: string;
  title?: string;
  user_id: string;
  // Add other fields from your posts table
}

export function useCurrentUserPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchPosts() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const { data, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        setPosts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();

    // Set up real-time subscription for posts
    const channel = supabase
      .channel("user-posts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, error };
}