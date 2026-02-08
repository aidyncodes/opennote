"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#cdc66b",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* NAV BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <h1
            className="imperial-script-regular"
            style={{ margin: 0, fontSize: 50, cursor: "pointer" }}
            onClick={() => router.push("/feed")}
          >
            Noteify
          </h1>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "#fafafe",
                border: "1px solid #ececf5",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              {userEmail && (
                <span
                  style={{
                    fontSize: 12,
                    opacity: 0.85,
                    maxWidth: 240,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                  }}
                >
                  {userEmail}
                </span>
              )}
            </button>

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

        {/* PAGE CONTENT */}
        {children}
      </div>
    </main>
  );
}
