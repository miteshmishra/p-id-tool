"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "./AuthProvider";

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            const currentPath = window.location.pathname;
            const redirectUrl = `/auth/login?redirect=${encodeURIComponent(
                currentPath
            )}`;
            router.push(redirectUrl);
        }
    }, [isAuthenticated, isLoading, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-lg">Loading...</div>
                </div>
            )
        );
    }

    // Show children only if authenticated
    if (isAuthenticated) {
        return <>{children}</>;
    }

    // Return null while redirecting
    return null;
}
