import React from "react";
import Header from "./components/Header";

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fb" }}>
      <Header />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
