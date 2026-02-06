import { Header } from "./components/common";

const LAYOUT_STYLES = {
  minHeight: "100vh",
  background: "#f7f9fb"
};

function Layout({ children }) {
  return (
    <div style={LAYOUT_STYLES}>
      <Header />
      <main>{children}</main>
    </div>
  );
}

export default Layout;
