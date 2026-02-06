import { useEffect, useState } from "react";

import api from "../services/api.js";
import { supabase } from "../services/supabaseClient.js";

const PROFILE_ERROR_MESSAGE =
  "Your account is being set up or there was a problem fetching your profile. Please refresh the page in a few seconds or contact support if this persists.";

export function useEnsureProfile() {
  const [error, setError] = useState(null);

  useEffect(() => {
    let retryCount = 0;
    let timeoutId = null;
    let mounted = true;

    async function fetchOrCreateProfile(session) {
      if (!mounted) return;

      const userId = session.user.id;

      try {
        const profileResponse = await api.get(`/api/users/${userId}`);
        if (!mounted) return;

        const profile = profileResponse.data;
        const isGoogleUser = session.user.app_metadata?.provider === "google";

        if (profile && !profile.google_auth_token && isGoogleUser) {
          try {
            await api.post("/api/auth/enrich-profile");
          } catch {
            // Don't fail the entire flow if enrichment fails
          }
        }
      } catch (err) {
        if (!mounted) return;

        if (err?.response?.status === 404) {
          try {
            const { email, user_metadata } = session.user;
            await api.post("/api/users", {
              email_address: email,
              full_name: user_metadata?.full_name || email,
              avatar_url: user_metadata?.avatar_url,
            });
            return;
          } catch {
            if (retryCount < 3 && mounted) {
              retryCount++;
              timeoutId = setTimeout(() => fetchOrCreateProfile(session), 500 * retryCount);
              return;
            }
          }
        }

        if (mounted) {
          setError(PROFILE_ERROR_MESSAGE);
        }
      }
    }

    async function ensureProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && mounted) {
        fetchOrCreateProfile(session);
      }
    }

    ensureProfile();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return { error };
} 