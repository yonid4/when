import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import NotificationBell from "./notifications/NotificationBell";

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const isLandingPage = location.pathname === '/';
    const isDashboard = location.pathname === '/dashboard';
    // const isEventPage = location.pathname.startsWith('/events/'); // Not strictly needed for logic but good for context

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setCurrentUserId(session?.user?.id || null);
            setUser(session?.user || null);
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            setCurrentUserId(session?.user?.id || null);
            setUser(session?.user || null);
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
                    redirectTo: window.location.origin + "/dashboard", // Redirect to dashboard after login
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
            if (isDashboard) {
                navigate("/");
            }
            // If on landing page, stay there. Auth state change will update UI.
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
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            padding: "0 2rem",
            width: "100%",
            boxSizing: "border-box"
        }}>
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

            {/* Right side container */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>

                {/* Notification Bell - Always visible if authenticated? Or always? User didn't specify, but usually requires auth. 
            The previous layout showed it always, but passed currentUserId. 
            Let's keep it consistent with previous layout but maybe hide if not auth? 
            Previous layout: <NotificationBell currentUserId={currentUserId} isAuthenticated={isAuthenticated} />
        */}
                {isAuthenticated && (
                    <NotificationBell currentUserId={currentUserId} isAuthenticated={isAuthenticated} />
                )}

                {/* Landing Page Logic */}
                {isLandingPage && !isAuthenticated && (
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
                            padding: "0.5rem 1rem",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {isLoading ? "Signing in..." : "Sign in with Google"}
                    </button>
                )}

                {isLandingPage && isAuthenticated && (
                    <>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                background: "var(--secondary-color)",
                                color: "white",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                transition: "all 0.2s"
                            }}
                        >
                            Go to Dashboard
                        </button>
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
                        >
                            Logout
                        </button>
                    </>
                )}

                {/* Dashboard Logic */}
                {isDashboard && isAuthenticated && (
                    <>
                        {/* User Avatar - simplified as text or image if available */}
                        {user?.user_metadata?.avatar_url ? (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="User Avatar"
                                style={{ width: 32, height: 32, borderRadius: '50%' }}
                            />
                        ) : (
                            <div style={{ fontWeight: 500, color: 'var(--secondary-color)' }}>
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
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
                        >
                            Logout
                        </button>
                    </>
                )}

                {/* Fallback for other pages (like EventPage) or if states don't match above exactly */}
                {!isLandingPage && !isDashboard && (
                    <>
                        {isAuthenticated ? (
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
                            >
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={handleGoogleLogin}
                                style={{
                                    background: "white",
                                    color: "#444",
                                    border: "1px solid #ddd",
                                    borderRadius: "4px",
                                    padding: "0.5rem 1rem",
                                    fontSize: "0.9rem",
                                    fontWeight: 500,
                                    cursor: "pointer"
                                }}
                            >
                                Sign in with Google
                            </button>
                        )}
                    </>
                )}

            </div>
        </header>
    );
};

export default Header;
