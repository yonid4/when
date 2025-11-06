import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
// import whenLogo from "frontend/public/when-logo.png";

// client provided by services/supabaseClient

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Don't show logout button on login page
  const showLogoutButton = isAuthenticated && location.pathname !== "/login";
  // Show sign in button when not authenticated and not on login page
  const showSignInButton = !isAuthenticated && location.pathname !== "/login";

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: (showLogoutButton || showSignInButton) ? "space-between" : "flex-start",
        height: "64px",
        background: "var(--primary-color)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        padding: "0 0",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center"
          }}
          aria-label="Go to home page"
        >
          <img
            src="/when_logo.png"
            alt="When logo"
            style={{ height: "40px", width: "auto" }}
          />  
        </button>
        {showLogoutButton && (
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "1px solid var(--secondary-color)",
              color: "var(--secondary-color)",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "var(--secondary-color)";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--secondary-color)";
            }}
          >
            Logout
          </button>
        )}
        {showSignInButton && (
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "1px solid var(--secondary-color)",
              color: "var(--secondary-color)",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "var(--secondary-color)";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--secondary-color)";
            }}
          >
            Sign In
          </button>
        )}
      </header>
      <main style={{ paddingTop: "0.5rem" }}>{children}</main>
    </div>
  );
};

export default Layout;
