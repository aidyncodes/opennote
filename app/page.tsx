// http://localhost:3000/
// LOGIN PAGE
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // If already logged in, go to feed
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) router.replace("/feed");
    })();
  }, [router]);

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setBusy(true);

    try {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) throw new Error("Enter your email.");

      // Optional: UGA-only gate for MVP
      // if (!trimmed.endsWith("@uga.edu")) throw new Error("Use your @uga.edu email.");

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
      });

      if (error) throw error;

      setStatus("Check your email for the sign-in link.");
      setEmail("");
    } catch (err: any) {
      setStatus(err?.message ?? "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>OpenNote</h1>
      <p style={{ marginTop: 8 }}>
        Sign in to access your campus learning community.
      </p>

      <form onSubmit={signInWithMagicLink} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label>
          <div style={{ fontWeight: 600 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@uga.edu"
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          style={{ padding: 12, borderRadius: 10, fontWeight: 700, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Sending..." : "Send magic link"}
        </button>

        {status && <p style={{ marginTop: 8 }}>{status}</p>}
      </form>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.75 }}>
        Tip: If the link opens a new tab, just return here after clicking it—this page will redirect you to the feed when you’re signed in.
      </p>
    </main>
  );
}