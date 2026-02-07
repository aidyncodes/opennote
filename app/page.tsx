import { supabase } from "../lib/supabaseClient";

export default async function Page() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code");

  return (
    <main style={{ padding: 24 }}>
      <h1>OpenNote – Courses</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}

