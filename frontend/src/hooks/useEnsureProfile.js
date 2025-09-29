import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const useEnsureProfile = () => {
  const [error, setError] = useState(null);

  useEffect(() => {
    let retryCount = 0;
    const ensureProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const fetchProfile = async () => {
        try {
          await axios.get(
            `http://localhost:5000/api/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );
          // Profile exists, do nothing
        } catch (err) {
          if (err.response && err.response.status === 404 && retryCount < 3) {
            retryCount++;
            setTimeout(fetchProfile, 500 * retryCount); // Exponential backoff
          } else {
            setError("Your account is being set up or there was a problem fetching your profile. Please refresh the page in a few seconds or contact support if this persists.");
          }
        }
      };
      fetchProfile();
    };
    ensureProfile();
  }, []);

  return { error };
}; 