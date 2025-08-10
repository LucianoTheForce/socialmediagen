"use client";

import { useSession } from "@/lib/auth/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = [
  "/", // Home page
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/blog",
  "/contributors"
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }
  
  // Check if it's a blog post route (/blog/[slug])
  if (pathname.startsWith("/blog/") && pathname.split("/").length === 3) {
    return true;
  }
  
  // Check API routes (should be handled server-side but just in case)
  if (pathname.startsWith("/api/")) {
    return true;
  }
  
  return false;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-white" />
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  );
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect during initial load
    if (isPending) return;

    const isPublic = isPublicRoute(pathname);

    // If user is not authenticated and trying to access private route
    if (!session?.user && !isPublic) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // If user is authenticated and trying to access login/signup, redirect to editor
    if (session?.user && (pathname === "/login" || pathname === "/signup")) {
      // Check if there's a return URL in the query params
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get("returnUrl");
      
      if (returnUrl && returnUrl !== "/login" && returnUrl !== "/signup") {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push("/editor");
      }
      return;
    }
  }, [session, isPending, pathname, router]);

  // Show loading screen while checking authentication
  if (isPending) {
    return <LoadingScreen />;
  }

  // For public routes, always show content
  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // For private routes, only show content if authenticated
  if (session?.user) {
    return <>{children}</>;
  }

  // If we get here, user is being redirected to login
  return <LoadingScreen />;
}