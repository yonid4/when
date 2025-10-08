import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import api from "../services/api";

export const useEnsureProfile = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    let retryCount = 0;
    const ensureProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const fetchOrCreateProfile = async () => {
        try {
          const profileResponse = await api.get(`/api/users/${userId}`);
          // Profile exists, check if it needs enrichment with Google data
          const profile = profileResponse.data;
          
          // If profile exists but doesn't have Google data, enrich it
          if (profile && !profile.google_auth_token && session.user.app_metadata?.provider === 'google') {
            try {
              console.log('Enriching profile with Google data...');
              await api.post('/api/auth/enrich-profile');
              console.log('Profile enriched successfully');
            } catch (enrichErr) {
              console.warn('Failed to enrich profile with Google data:', enrichErr);
              // Don't fail the entire flow if enrichment fails
            }
          }
        } catch (err) {
          const status = err?.response?.status;
          if (status === 404) {
            try {
              const email = session.user.email;
              const full_name = session.user.user_metadata?.full_name || email;
              const avatar_url = session.user.user_metadata?.avatar_url;
              await api.post(`/api/users`, {
                email_address: email,
                full_name,
                avatar_url
              });
              return;
            } catch (createErr) {
              if (retryCount < 3) {
                retryCount++;
                setTimeout(fetchOrCreateProfile, 500 * retryCount);
                return;
              }
            }
            setError("Your account is being set up or there was a problem fetching your profile. Please refresh the page in a few seconds or contact support if this persists.");
          } else {
            setError("Your account is being set up or there was a problem fetching your profile. Please refresh the page in a few seconds or contact support if this persists.");
          }
        }
      };
      fetchOrCreateProfile();
    };
    ensureProfile();
  }, []);

  return { error };
}; 