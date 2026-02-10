import { Header } from "./components/common";
import { colors } from "./styles/designSystem";

const LAYOUT_STYLES = {
  minHeight: "100vh",
  background: colors.bgPage
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
