import { useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { getGoogleAuthUrl, logout } from "../services/authService";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    if (cfg?.auth_url) {
      window.location.href = cfg.auth_url;
    } else if (typeof cfg === "string") {
      window.location.href = cfg;
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  return { session, user, loading, signInWithGoogle, signOut };
}


