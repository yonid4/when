import React from "react";
import Layout from "../layout";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/events"
    }
  });
};

const Login = () => {
  return (
    <Layout>
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <h2 style={{ color: "var(--primary-color)", marginBottom: "2rem" }}>
          Sign in to connect your Google Calendar
        </h2>
        <button
          onClick={handleGoogleLogin}
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
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.2s"
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            style={{ width: 24, height: 24, marginRight: 12 }}
          />
          Sign in with Google
        </button>
      </div>
    </Layout>
  );
};

export default Login;
