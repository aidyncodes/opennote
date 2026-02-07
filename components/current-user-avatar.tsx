"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CurrentUserAvatar() {
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      setEmail(user.email ?? null);
      setAvatarUrl(user.user_metadata?.avatar_url ?? null);
    };

    load();
  }, []);

  if (!email) return null;

  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    email
  )}`;

  return (
    <Link href="/dashboard" aria-label="Go to dashboard">
      <Image
        src={avatarUrl || fallbackAvatar}
        alt="Profile"
        width={32}
        height={32}
        className="rounded-full border hover:ring-2 hover:ring-purple-500 transition"
      />
    </Link>
  );
}
