"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * useUser — React hook that returns the currently authenticated Supabase user.
 *
 * Returns `null` while loading and `undefined` when no user is signed in.
 * Components that need the owner_id for API calls should use this hook.
 *
 * @example
 * const user = useUser();
 * if (!user) return null; // still loading or not signed in
 * formData.append("owner_id", user.id);
 */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    // Get the current session synchronously from the cache
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
