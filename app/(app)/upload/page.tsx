// app/upload/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { summarizeFile } from '../../ai/geminiService';


function normalizeCourseCode(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "") // remove spaces, underscores, hyphens
    .replace(/[^A-Z0-9]/g, ""); // keep only letters+numbers
}

export default function UploadPage() {
  const router = useRouter();
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
    const [aiSummary, setAiSummary] = useState("");
    const [aiLoading, setAiLoading] = useState(false);


  // Protect this page: must be logged in
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) router.replace("/");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session?.user) {
          router.replace("/");
        }
      });      

    return () => sub.subscription.unsubscribe();
  }, [router]);

  function validateFile(f: File) {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    const maxBytes = 15 * 1024 * 1024; // 15MB
    if (!allowed.includes(f.type)) return "Only PDF or images (png/jpg/webp) are allowed.";
    if (f.size > maxBytes) return "File too large (max 15MB).";
    return null;
  }

  async function handleAiSummarize() {
  setStatus("");

  if (!file) {
    setStatus("Please attach a PDF or image first.");
    return;
  }

  const fileErr = validateFile(file);
  if (fileErr) {
    setStatus(fileErr);
    return;
  }

  setAiLoading(true);
  try {
    const summary = await summarizeFile(file);
    setBody(summary); // <- puts the AI summary into your Body textarea
    // optional: setStatus("AI summary added to Body.");
  } catch (err: any) {
    setStatus(err?.message ?? "Failed to summarize with AI.");
  } finally {
    setAiLoading(false);
  }
}


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    const normalizedCourse = normalizeCourseCode(courseCode);
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!normalizedCourse) return setStatus("Course code is required.");
    if (!trimmedTitle) return setStatus("Title is required.");
    if (!trimmedBody) return setStatus("Body is required.");
    if (!file) return setStatus("Attach a PDF or image.");

    const fileErr = validateFile(file);
    if (fileErr) return setStatus(fileErr);

    setSubmitting(true);

    // If anything fails after uploading, we’ll try best-effort cleanup
    let uploadedPath: string | null = null;

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes.user;
      if (!user) {
        router.replace("/");
        return;
      }

      // 1) Look up course by normalized code
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .select("id,code,professor,school")
        .eq("code", normalizedCourse)
        .maybeSingle();

      if (courseErr) throw courseErr;
      if (!course) {
        setStatus(`Course ${normalizedCourse} not found. Add it in Supabase first.`);
        return;
      }

      // 2) Create stable post id, upload file using that id
      const postId = crypto.randomUUID();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const storagePath = `${user.id}/${postId}.${ext}`;
      uploadedPath = storagePath;

      const { error: uploadErr } = await supabase.storage.from("notes").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (uploadErr) throw uploadErr;

      // 3) Insert post row
      const { error: insertErr } = await supabase.from("posts").insert({
        id: postId,
        author_id: user.id,
        course_id: course.id,
        title: trimmedTitle,
        body: trimmedBody,
        file_path: storagePath,
      });

      if (insertErr) {
        // best-effort cleanup
        await supabase.storage.from("notes").remove([storagePath]);
        throw insertErr;
      }

      router.push("/feed");
    } catch (err: any) {
      // best-effort cleanup if we uploaded but later failed
      if (uploadedPath) {
        await supabase.storage.from("notes").remove([uploadedPath]);
      }
      setStatus(err?.message ?? "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#cdc66b", padding: 24 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            border: "1px solid #e7e7ee",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Upload notes</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.75 }}>
            Attach a PDF or image and add a description. Course codes normalize (e.g. “csci 1302” → “CSCI1302”).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 14,
            background: "white",
            border: "1px solid #e7e7ee",
            borderRadius: 16,
            padding: 16,
            display: "grid",
            gap: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>Course code</span>
            <input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g. CSCI1302 or MATH2000"
              autoComplete="off"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ececf5",
                background: "#fafafe",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm review (Ch. 1–6)"
              autoComplete="off"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #ececf5",
                background: "#fafafe",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </label>

<label style={{ display: "grid", gap: 6 }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <span style={{ fontWeight: 800, fontSize: 13 }}>Body</span>

    <button
      type="button"
      onClick={handleAiSummarize}
      disabled={!file || aiLoading}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #e7e7ee",
        background: "white",
        fontWeight: 900,
        fontSize: 12,
        cursor: !file || aiLoading ? "not-allowed" : "pointer",
        opacity: !file || aiLoading ? 0.6 : 1,
      }}
      title={!file ? "Attach a file first" : "Generate a summary from the attached file"}
    >
      {aiLoading ? "Summarizing…" : "Summarize with AI"}
    </button>
  </div>

  <textarea
    value={body}
    onChange={(e) => setBody(e.target.value)}
    placeholder="Describe what these notes cover…"
    rows={5}
    style={{
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #ececf5",
      background: "#fafafe",
      fontWeight: 600,
      outline: "none",
      resize: "vertical",
    }}
  />
</label>


          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 13 }}>File (PDF or image)</span>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </span>
            ) : null}
          </label>

          {status ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#fff6f6",
                border: "1px solid #ffd7d7",
              }}
            >
              {status}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push("/feed")}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #e7e7ee",
                background: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid black",
                background: "black",
                color: "white",
                fontWeight: 900,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Uploading…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
