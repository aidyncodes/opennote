// http://localhost:3000/feed
// MAIN FEED PAGE
// protected, redirected to login if not signed in
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ProfileAvatar from '../../components/current-user-avatar'
import CurrentUserAvatar from "../../components/current-user-avatar";


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
  const [search, setSearch] = useState("");
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

  async function loadPosts(selectedCourseId?: number | "", searchText?: string) {
  setStatus("");

  let q = supabase
    .from("post_vote_counts")
    .select("id,course_id,title,body,file_path,created_at,upvotes")
    .order("created_at", { ascending: false })
    .limit(50);

  if (selectedCourseId) q = q.eq("course_id", selectedCourseId);

  const s = (searchText ?? "").trim();
  if (s) {
    // searches title OR body (case-insensitive)
    // note: body can be null, that's fine
    q = q.or(`title.ilike.%${s}%,body.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) setStatus(`Error loading posts: ${error.message}`);
  else setPosts((data as PostRow[]) ?? []);
}

  useEffect(() => {
  loadPosts(courseId, search);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, search]);


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
<main
    style={{
      minHeight: "100vh",
      background: "#f6f7fb",
      padding: 24,
    }}
  >
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {/* Top bar */}
      <div
        style={{
          background: "white",
          border: "1px solid #e7e7ee",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Feed</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.75 }}>
            Browse notes by course and discover recent uploads.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              background: "#fafafe",
              border: "1px solid #ececf5",
              borderRadius: 999,
            }}
          >
            <CurrentUserAvatar/>
            {userEmail && (
              <span style={{ fontSize: 12, opacity: 0.85, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>
                {userEmail}
              </span>
            )}
          </div>

          <button
            onClick={signOut}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
              border: "1px solid #e7e7ee",
              background: "white",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Course filter */}
        <div
          style={{
            background: "white",
            border: "1px solid #e7e7ee",
            borderRadius: 14,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13, opacity: 0.85 }}>Course</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ececf5",
              background: "#fafafe",
              fontWeight: 700,
              outline: "none",
            }}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search (you already have state wired) */}
        <div
          style={{
            flex: 1,
            minWidth: 240,
            background: "white",
            border: "1px solid #e7e7ee",
            borderRadius: 14,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 13, opacity: 0.85 }}>Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts by title or body..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ececf5",
              background: "#fafafe",
              outline: "none",
              fontWeight: 600,
            }}
          />
        </div>

        {/* Upload CTA */}
        <a
          href="/upload"
          style={{
            textDecoration: "none",
            padding: "12px 14px",
            borderRadius: 14,
            fontWeight: 900,
            background: "black",
            color: "white",
            border: "1px solid black",
          }}
        >
          Upload notes
        </a>
      </div>

      {/* Posts section (defined container) */}
      <section
        style={{
          marginTop: 16,
          background: "white",
          border: "1px solid #e7e7ee",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Posts</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.7 }}>
              Showing {postsWithUrls.length} most recent post{postsWithUrls.length === 1 ? "" : "s"}
              {courseId ? " for this course" : ""}.
            </p>
          </div>

          {/* Optional mini status pill */}
          {status ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "8px 10px",
                borderRadius: 999,
                background: "#fff6f6",
                border: "1px solid #ffd7d7",
              }}
            >
              {status}
            </span>
          ) : null}
        </div>

        {/* List */}
        {postsWithUrls.length === 0 ? (
          <div
            style={{
              border: "1px dashed #d9d9e6",
              borderRadius: 16,
              padding: 18,
              background: "#fafafe",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontWeight: 900 }}>No posts found</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>
              Try a different course or search term — or upload the first note.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {postsWithUrls.map((p) => (
              <article
                key={p.id}
                style={{
                  border: "1px solid #ececf5",
                  borderRadius: 16,
                  padding: 16,
                  background: "#ffffff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.25 }}>
                      {p.title}
                    </h3>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 10px",
                      borderRadius: 999,
                      border: "1px solid #ececf5",
                      background: "#fafafe",
                      fontWeight: 900,
                      fontSize: 13,
                    }}
                    title="Upvotes"
                  >
                    ▲ {p.upvotes}
                  </div>
                </div>

                {p.body && (
                  <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
                    {p.body}
                  </p>
                )}

                <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {p.fileUrl ? (
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        textDecoration: "none",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid #ececf5",
                        background: "#fafafe",
                        fontWeight: 900,
                        fontSize: 13,
                        color: "black",
                      }}
                    >
                      View file →
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.6 }}>No file attached</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* If you want status only at the bottom instead, move it here */}
      {!status ? null : <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  </main>
  );
}
