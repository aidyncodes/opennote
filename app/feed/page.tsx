// http://localhost:3000/feed
// MAIN FEED PAGE
// protected, redirected to login if not signed in
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Course = { id: number; code: string; name: string };
type PostRow = {
  id: number;
  course_id: number;
  title: string;
  body: string | null;
  file_path: string | null;
  created_at: string;
  upvotes: number;
};

export default function FeedPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Protect this page: if not logged in, go to login
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/");
        return;
      }
      setUserEmail(data.user.email ?? "");
    })();

    // Also react to auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace("/");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,name")
        .order("code");

      if (error) setStatus(`Error loading courses: ${error.message}`);
      else setCourses((data as Course[]) ?? []);
    })();
  }, []);

  async function loadPosts(selectedCourseId?: number | "") {
    setStatus("");

    let q = supabase
      .from("post_vote_counts")
      .select("id,course_id,title,body,file_path,created_at,upvotes")
      .order("created_at", { ascending: false })
      .limit(50);


    if (selectedCourseId) {
        q = q.eq("course_id", selectedCourseId);
    }

    const { data, error } = await q;
    if (error) setStatus(`Error loading posts: ${error.message}`);
    else setPosts((data as PostRow[]) ?? []);
  }

  useEffect(() => {
    loadPosts(courseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const postsWithUrls = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return posts.map((p) => ({
      ...p,
      fileUrl: p.file_path ? `${base}/storage/v1/object/public/notes/${p.file_path}` : null,
    }));
  }, [posts]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Feed</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {userEmail && <span style={{ fontSize: 12, opacity: 0.8 }}>{userEmail}</span>}
          <button onClick={signOut} style={{ padding: "8px 10px", borderRadius: 10, fontWeight: 700 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Course:</label>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
          style={{ padding: 10, borderRadius: 8 }}
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <a href="/upload" style={{ marginLeft: 12 }}>
          Upload notes
        </a>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {postsWithUrls.map((p) => (
          <article key={p.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{p.title}</h2>
              <div style={{ fontWeight: 600 }}>▲ {p.upvotes}</div>
            </div>

            {p.body && <p style={{ marginTop: 8 }}>{p.body}</p>}

            <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
              {p.fileUrl && (
                <a href={p.fileUrl} target="_blank" rel="noreferrer">
                  View file
                </a>
              )}
              <span style={{ opacity: 0.7, fontSize: 12 }}>{new Date(p.created_at).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </main>
  );
}
