"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "./navbar";
import type { Profile } from "@/lib/types";

export function NavbarWrapper() {
  const { data: session, isPending: sessionPending } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    fetch("/api/user/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = (await res.json()) as Profile;
        setProfile(data);
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [session]);

  const user =
    session?.user && profile
      ? {
          name: session.user.name ?? profile.fullName ?? "",
          image: session.user.image ?? undefined,
          role: profile.role,
        }
      : undefined;

  if (sessionPending || profileLoading) {
    return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4" />
      </header>
    );
  }

  return <Navbar user={user} />;
}
