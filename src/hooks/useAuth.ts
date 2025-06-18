"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
    id: string;
    email: string;
    name?: string;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const router = useRouter();

    // Check authentication status from localStorage
    const checkAuth = useCallback(() => {
        try {
            const authData = localStorage.getItem("auth-data");
            if (authData) {
                const parsedData = JSON.parse(authData);
                setAuthState({
                    user: parsedData.user,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            }
        } catch (error) {
            console.error("Error checking auth:", error);
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    }, []);

    // Login function
    const login = useCallback((userData: AuthUser, token: string) => {
        try {
            const authData = {
                user: userData,
                token: token,
                timestamp: Date.now(),
            };

            // Store in localStorage
            localStorage.setItem("auth-data", JSON.stringify(authData));

            // Set cookie for server-side middleware
            document.cookie = `auth-token=${token}; path=/; max-age=${
                60 * 60 * 24 * 7
            }`; // 7 days

            setAuthState({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
            });

            return true;
        } catch (error) {
            console.error("Error during login:", error);
            return false;
        }
    }, []);

    // Logout function
    const logout = useCallback(() => {
        try {
            // Clear localStorage
            localStorage.removeItem("auth-data");

            // Clear cookie
            document.cookie =
                "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            // Redirect to login page
            router.push("/auth/login");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }, [router]);

    // Check auth on mount and when localStorage changes
    useEffect(() => {
        checkAuth();

        // Listen for storage changes (in case of multiple tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "auth-data") {
                checkAuth();
            }
        };

        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [checkAuth]);

    return {
        ...authState,
        login,
        logout,
        checkAuth,
    };
}
