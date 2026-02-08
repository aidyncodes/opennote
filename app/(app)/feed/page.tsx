"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import CurrentUserAvatar from "../../../components/current-user-avatar";

type Course = {
  id: string;
  code: string;
  professor: string | null;
  school: string | null;
};

type PostRow = {
  id: string;
  course_id: string;
  title: string;
  body: string | null;
  file_path: string | null;
  created_at: string;
  upvotes: number;

  course_code: string;
  course_professor: string | null;
  course_school: string | null;

  author_id: string | null;
  isMine?: boolean;
};

type PostWithCourse = {
  id: string;
  course_id: string;
  title: string;
  body: string | null;
  file_path: string | null;
  created_at: string;
  author_id: string | null;
  courses: {
    code: string;
    professor: string | null;
    school: string | null;
  } | null;
};

type UpvoteRow = { post_id: string };

export default function FeedPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string | "">("");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Protect this page: if not logged in, go to login and capture user id
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/");
        return;
      }
      setUserId(data.user.id);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace("/");
      else setUserId(session.user.id);
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Load courses
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,code,professor,school")
        .order("code");

      if (error) setStatus(`Error loading courses: ${error.message}`);
      else setCourses((data as Course[]) ?? []);
    })();
  }, []);

  async function loadPosts(selectedCourseId?: string | "", searchText?: string) {
    setStatus("");

    // Include author_id in the select so we can detect user's posts
    let q = supabase
      .from("posts")
      .select(
        `
        id,
        author_id,
        course_id,
        title,
        body,
        file_path,
        created_at,
        courses:course_id (
          code,
          professor,
          school
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectedCourseId) q = q.eq("course_id", selectedCourseId);

    const s = (searchText ?? "").trim();
    if (s) q = q.or(`title.ilike.%${s}%,body.ilike.%${s}%`);

    const { data: postData, error: postErr } = await q.returns<PostWithCourse[]>();

    if (postErr) {
      setStatus(`Error loading posts: ${postErr.message}`);
      setPosts([]);
      return;
    }

    const rows: PostWithCourse[] = postData ?? [];

    // Fetch upvote rows for these posts and count in JS
    const postIds = rows.map((r) => r.id);
    const counts = new Map<string, number>();

    if (postIds.length > 0) {
      const { data: voteRows, error: voteErr } = await supabase
        .from("post_upvotes")
        .select("post_id")
        .in("post_id", postIds)
        .returns<UpvoteRow[]>();

      if (voteErr) {
        setStatus(`Loaded posts, but error loading upvotes: ${voteErr.message}`);
      } else {
        for (const v of voteRows ?? []) {
          counts.set(v.post_id, (counts.get(v.post_id) ?? 0) + 1);
        }
      }
    }

    const shaped: PostRow[] = rows.map((r) => ({
      id: r.id,
      course_id: r.course_id,
      title: r.title,
      body: r.body,
      file_path: r.file_path,
      created_at: r.created_at,
      upvotes: counts.get(r.id) ?? 0,

      course_code: r.courses?.code ?? "Unknown course",
      course_professor: r.courses?.professor ?? null,
      course_school: r.courses?.school ?? null,

      author_id: r.author_id ?? null,
      isMine: userId ? r.author_id === userId : false,
    }));

    // Optional: put user's posts first, then the rest in chronological order
    shaped.sort((a, b) => {
      if ((a.isMine ? 1 : 0) !== (b.isMine ? 1 : 0)) return a.isMine ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setPosts(shaped);
  }

  useEffect(() => {
    // whenever userId (or filters) change, reload posts so isMine is accurate
    loadPosts(courseId, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, search, userId]);

  const postsWithUrls = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    return posts.map((p) => ({
      ...p,
      fileUrl: p.file_path ? `${base}/storage/v1/object/public/notes/${p.file_path}` : null,
    }));
  }, [posts]);

  return (
    <>
      {/* Top bar (kept here if you also show feed title block) */}
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
          marginTop: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Feed</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.75 }}>
            Browse notes by course and discover recent uploads.
          </p>
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
            onChange={(e) => setCourseId(e.target.value || "")}
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
                {c.code}
                {c.professor ? ` — ${c.professor}` : ""}
                {c.school ? ` (${c.school})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
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

      {/* Posts section */}
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
                  background: p.isMine ? "#fffdf2" : "#ffffff", // subtle highlight for your posts
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, lineHeight: 1.25 }}>
                      {p.title}
                    </h3>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                      <span style={{ fontWeight: 800 }}>{p.course_code}</span>
                      {p.course_professor ? ` — ${p.course_professor}` : ""}
                      {p.course_school ? ` (${p.course_school})` : ""}
                      {" · "}
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

                    {p.isMine ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          padding: "6px 8px",
                          borderRadius: 999,
                          background: "#fff0d9",
                          border: "1px solid #ffe3c4",
                        }}
                        title="Your post"
                      >
                        Your post
                      </span>
                    ) : null}
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

      {!status ? null : <p style={{ marginTop: 12 }}>{status}</p>}
    </>
  );
}