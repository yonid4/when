import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon, IconButton, Tooltip } from "@chakra-ui/react";
import { FiPlus, FiSettings } from "react-icons/fi";

import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { NotificationBell } from "../notifications";
import { colors } from "../../styles/designSystem";

const HEADER_STYLES = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "64px",
  background: "var(--primary-color)",
  borderBottom: "1px solid var(--salt-pepper-light-gray)",
  padding: "0 2rem",
  width: "100%",
  boxSizing: "border-box",
  position: "sticky",
  top: 0,
  zIndex: 1000
};

const LOGO_BUTTON_STYLES = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center"
};

const RIGHT_SECTION_STYLES = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem"
};

const GHOST_HOVER_STYLE = { bg: "rgba(255,255,255,0.1)" };
const PRIMARY_BUTTON_HOVER = { bg: colors.primarySoft };
const PRIMARY_COLOR = colors.primary;

function Header() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const isAuthenticated = !!session;
  const currentUserId = user?.id ?? null;
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        }
      }
    });

    if (error) {
      console.error("Error signing in:", error);
      alert("Failed to sign in with Google");
    }
    setIsLoading(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      return;
    }
    navigate("/");
  }

  function handleLogoClick() {
    navigate(isAuthenticated ? "/dashboard" : "/");
  }

  function renderAuthButton() {
    if (isAuthenticated) {
      return (
        <Button
          onClick={handleLogout}
          variant="outline"
          colorScheme="gray"
          size="sm"
          borderColor="rgba(255,255,255,0.3)"
          color="white"
          _hover={GHOST_HOVER_STYLE}
        >
          Logout
        </Button>
      );
    }

    return (
      <Button
        onClick={handleGoogleLogin}
        isLoading={isLoading}
        loadingText="Signing in..."
        variant="solid"
        size="sm"
        bg="white"
        color={PRIMARY_COLOR}
        _hover={PRIMARY_BUTTON_HOVER}
      >
        Sign in with Google
      </Button>
    );
  }

  return (
    <header style={HEADER_STYLES}>
      <button
        onClick={handleLogoClick}
        style={LOGO_BUTTON_STYLES}
        aria-label="Go to home page"
      >
        <img
          src="/when_logo.png"
          alt="When logo"
          style={{ height: "60px", width: "auto" }}
        />
      </button>

      <div style={RIGHT_SECTION_STYLES}>
        {isAuthenticated && (
          <>
            <Button
              onClick={() => navigate("/event/create")}
              size="sm"
              bg="white"
              color={PRIMARY_COLOR}
              fontWeight="600"
              leftIcon={<Icon as={FiPlus} />}
              _hover={PRIMARY_BUTTON_HOVER}
              borderRadius="8px"
            >
              Create Event
            </Button>
            <NotificationBell
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
            />
            <Tooltip label="Settings">
              <IconButton
                icon={<Icon as={FiSettings} />}
                onClick={() => navigate("/settings")}
                size="sm"
                variant="ghost"
                color="white"
                _hover={GHOST_HOVER_STYLE}
                aria-label="Settings"
              />
            </Tooltip>
          </>
        )}
        {renderAuthButton()}
      </div>
    </header>
  );
}

export default Header;
