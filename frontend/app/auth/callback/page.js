"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // Send the code to your backend for token exchange
      fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Handle login success (e.g., store JWT, redirect, etc.)
          // Example: router.push("/dashboard");
          alert("Google login successful!");
          router.push("/");
        })
        .catch((err) => {
          alert("Google login failed.");
          router.push("/");
        });
    } else {
      // No code in URL, redirect home
      router.push("/");
    }
  }, [searchParams, router]);

  return <div>Signing you in with Google...</div>;
}