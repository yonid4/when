import React from "react";
import { useNavigate } from "react-router-dom";
// import whenLogo from "frontend/public/when-logo.png";

const Layout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>
      <header style={{
        display: "flex",
        alignItems: "center",
        height: "64px",
        background: "var(--primary-color)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
        padding: "0 2rem"
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
      </header>
      <main style={{ paddingTop: "2rem" }}>{children}</main>
    </div>
  );
};

export default Layout;
