import { useCallback, useEffect, useState } from "react";

import { getGoogleAuthUrl, logout } from "../services/authService.js";
import { supabase } from "../services/supabaseClient.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const cfg = await getGoogleAuthUrl();
    const authUrl = cfg?.auth_url || (typeof cfg === "string" ? cfg : null);
    if (authUrl) {
      window.location.href = authUrl;
    }
  }, []);

  const signOut = useCallback(() => logout(), []);

  return { session, user, loading, signInWithGoogle, signOut };
}
