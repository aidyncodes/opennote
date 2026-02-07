"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Course = { id: number; code: string; name: string };

type PostRow = {
  id: number;
  user_id: string;
  course_id: number;
  title: string;
  body: string | null;
  file_path: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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
        .select("id, code, name")
        .order("code", { ascending: true });

      if (!error && data) setCourses(data as Course[]);
    };

    loadCourses();
  }, []);

  const fetchMyPosts = async (uid: string) => {
    setLoadingPosts(true);
    setPostsError("");

    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, course_id, title, body, file_path, created_at")
      .eq("user_id", uid)
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

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setCreating(true);
    setCreateError("");

    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!courseId) {
      setCreateError("Please select a course.");
      setCreating(false);
      return;
    }
    if (!cleanTitle) {
      setCreateError("Title is required.");
      setCreating(false);
      return;
    }

    const { error } = await supabase.from("posts").insert([
      {
        user_id: userId,
        course_id: courseId,          // ✅ REQUIRED by your schema
        title: cleanTitle,
        body: cleanBody || null,
        file_path: null,              // optional for now
      },
    ]);

    if (error) {
      setCreateError(error.message);
      setCreating(false);
      return;
    }

    setTitle("");
    setBody("");
    setCourseId("");
    await fetchMyPosts(userId);

    setCreating(false);
  };

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>Dashboard</h1>

      <p style={{ marginTop: 12, fontSize: 18 }}>
        {name ? `Welcome, ${name}` : "Loading..."}
      </p>

      {/* CREATE POST */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Create a new post</h2>

        <form onSubmit={createPost} style={{ display: "grid", gap: 10 }}>
          {/* ✅ Course picker */}
          <select
            value={courseId}
            onChange={(e) =>
              setCourseId(e.target.value ? Number(e.target.value) : "")
            }
            style={{ padding: 10, fontSize: 16 }}
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            style={{ padding: 10, fontSize: 16 }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write something (optional)"
            rows={4}
            style={{ padding: 10, fontSize: 16 }}
          />

          {createError && <p style={{ color: "red", margin: 0 }}>{createError}</p>}

          <button
            type="submit"
            disabled={creating || !userId}
            style={{ padding: "10px 14px", fontSize: 16, width: "fit-content" }}
          >
            {creating ? "Posting..." : "Post"}
          </button>
        </form>
      </section>

      {/* YOUR POSTS */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Your posts</h2>

        {loadingPosts && <p>Loading your posts...</p>}
        {postsError && <p style={{ color: "red" }}>{postsError}</p>}

        {!loadingPosts && !postsError && posts.length === 0 && (
          <p>No posts yet. Create your first one above.</p>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {posts.map((p) => (
            <article
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                <small style={{ opacity: 0.7 }}>
                  {new Date(p.created_at).toLocaleString()}
                </small>
              </div>

              <div style={{ marginTop: 6, opacity: 0.8 }}>
                Course ID: {p.course_id}
              </div>

              {p.body && <p style={{ marginTop: 10, marginBottom: 0 }}>{p.body}</p>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
