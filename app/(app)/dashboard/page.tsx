"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Course = {
  id: string;
  code: string;
  professor: string | null;
  school: string | null;
};

type PostRow = {
  id: string;
  author_id: string;
  course_id: string;
  title: string;
  body: string;
  file_path: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string>("");

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState("");

  // Load user + display name
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return;

      const user = data.user;
      setUserId(user.id);

      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        (user.user_metadata?.display_name as string | undefined);

      const fallback = user.email?.split("@")[0] ?? "User";
      setName(fullName || fallback);
    };

    load();
  }, []);

  // Load courses for dropdown
  useEffect(() => {
    const loadCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, code, professor, school")
        .order("code", { ascending: true });

      if (error) return;
      setCourses((data as Course[]) ?? []);
    };

    loadCourses();
  }, []);

  const fetchMyPosts = async (uid: string) => {
    setLoadingPosts(true);
    setPostsError("");

    const { data, error } = await supabase
      .from("posts")
      .select("id, author_id, title, body, file_path, created_at")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setPostsError(error.message);
      setPosts([]);
    } else {
      setPosts((data as PostRow[]) ?? []);
    }

    setLoadingPosts(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchMyPosts(userId);
  }, [userId]);

  return (
    <>
      <h1>Dashboard</h1>

      <p style={{ marginTop: 12, fontSize: 18 }}>
        {name ? `Welcome, ${name}` : "Loading..."}
      </p>

      {/* YOUR POSTS */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Your posts</h2>

        {loadingPosts && <p>Loading your posts...</p>}
        {postsError && <p style={{ color: "red" }}>{postsError}</p>}

        {!loadingPosts && !postsError && posts.length === 0 && (
          <p>No posts yet.</p>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((p) => (
            <article
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 14,
                background: "rgba(255,255,255,0.75)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                <small style={{ opacity: 0.7 }}>
                  {new Date(p.created_at).toLocaleString()}
                </small>
              </div>

              {p.body && (
                <p style={{ marginTop: 10, marginBottom: 0 }}>{p.body}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}