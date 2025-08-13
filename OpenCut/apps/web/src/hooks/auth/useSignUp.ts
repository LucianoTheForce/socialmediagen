"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isAnyLoading = isEmailLoading || isGoogleLoading;

  const handleSignUp = async () => {
    setError(null);
    setIsEmailLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Supabase sends a confirmation email by default
      // You might want to show a success message or redirect
      router.push("/projects");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/projects`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "Failed to sign up with Google");
      setIsGoogleLoading(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isAnyLoading,
    isEmailLoading,
    isGoogleLoading,
    handleSignUp,
    handleGoogleSignUp,
  };
}
