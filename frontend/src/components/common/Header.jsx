import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import { supabase } from "../../services/supabaseClient";
import { NotificationBell } from "../notifications";

const Header = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setCurrentUserId(session?.user?.id || null);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            setCurrentUserId(session?.user?.id || null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/dashboard",
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error signing in:", error);
            alert("Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate("/");
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <header style={{
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
        }}>
            {/* Logo */}
            <button
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
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

            {/* Right side: Create Event + Notification Bell + Login/Logout */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {isAuthenticated && (
                    <>
                        <Button
                            onClick={() => navigate("/event/create")}
                            size="sm"
                            bg="white"
                            color="#7C3AED"
                            fontWeight="600"
                            leftIcon={<Icon as={FiPlus} />}
                            _hover={{ bg: "#EDE9FE" }}
                            borderRadius="8px"
                        >
                            Create Event
                        </Button>
                        <NotificationBell
                            currentUserId={currentUserId}
                            isAuthenticated={isAuthenticated}
                        />
                    </>
                )}

                {isAuthenticated ? (
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        colorScheme="gray"
                        size="sm"
                        borderColor="rgba(255,255,255,0.3)"
                        color="white"
                        _hover={{ bg: "rgba(255,255,255,0.1)" }}
                    >
                        Logout
                    </Button>
                ) : (
                    <Button
                        onClick={handleGoogleLogin}
                        isLoading={isLoading}
                        loadingText="Signing in..."
                        variant="solid"
                        size="sm"
                        bg="white"
                        color="#7C3AED"
                        _hover={{ bg: "#EDE9FE" }}
                    >
                        Sign in with Google
                    </Button>
                )}
            </div>
        </header>
    );
};

export default Header;
