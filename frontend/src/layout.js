import React from "react";

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>
      <main style={{ paddingTop: "0.5rem" }}>{children}</main>
    </div>
  );
};

export default Layout;
