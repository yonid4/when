import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, useBreakpointValue } from "@chakra-ui/react";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { supabase } from "../services/supabaseClient";
import {
  HeroSection,
  ScrollZoomSection,
  PinnedFeatureSection,
  HowItWorksSection,
  CtaSection
} from "../components/landing";

/**
 * Landing page with Apple-style scroll-driven animations.
 * Coordinates authentication and delegates rendering to child components.
 */
const Landing = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const reducedMotion = useReducedMotion();

  // Detect mobile for simpler fallback experience
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && session) {
      console.log("User authenticated, redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [user, session, loading, navigate]);

  // Handle Google OAuth sign-in
  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes:
            "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events"
        }
      });

      if (error) {
        console.error("Sign in error:", error);
      }
    } catch (err) {
      console.error("Failed to initiate sign in:", err);
    }
  };

  // Show nothing while checking auth (prevents flash)
  if (loading) {
    return null;
  }

  return (
    <Box bg="white">
      {/* Hero with entrance animations */}
      <HeroSection onSignIn={handleSignIn} reducedMotion={reducedMotion} />

      {/* Scroll zoom calendar section */}
      <Box id="scroll-zoom-section">
        <ScrollZoomSection reducedMotion={reducedMotion} isMobile={isMobile} />
      </Box>

      {/* Pinned feature section with slide switching */}
      <PinnedFeatureSection reducedMotion={reducedMotion} isMobile={isMobile} />

      {/* How it works - 3 step cards */}
      <HowItWorksSection reducedMotion={reducedMotion} />

      {/* Final CTA and footer */}
      <CtaSection onSignIn={handleSignIn} reducedMotion={reducedMotion} />
    </Box>
  );
};

export default Landing;
