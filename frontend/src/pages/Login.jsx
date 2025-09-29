import React, { useEffect, useState } from "react";
import Layout from "../layout";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

const Login = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/" // redirect to dashboard page
        }
      });
      if (error) {
        if (error.message.includes("provider is not enabled")) {
          throw new Error("Google login is not configured. Please contact support.");
        }
        throw error;
      }
      // Wait for session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/";
      }
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have a session after redirect
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = "/";
        }
      } catch (error) {
        // Ignore
      }
    };
    checkSession();
  }, []);

  return (
    <Layout>
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <h2 style={{ color: "var(--secondary-color)", marginBottom: "2rem" }}>
          Sign in to connect your Google Calendar
        </h2>
        {error && (
          <div style={{
            color: "#dc3545",
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            background: "#f8d7da",
            border: "1px solid #f5c6cb"
          }}>
            {error}
          </div>
        )}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            background: "white",
            color: "#444",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            fontWeight: 500,
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            transition: "all 0.2s",
            opacity: isLoading ? 0.7 : 1
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            style={{ width: 24, height: 24, marginRight: 12 }}
          />
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </Layout>
  );
};

export default Login;
