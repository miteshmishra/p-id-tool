// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define authentication token (from cookie)
    const authToken = request.cookies.get("auth-token")?.value;
    const isAuthenticated = !!authToken;

    const isLoginPage = pathname.startsWith("/auth/login");
    const isEditorPage = pathname.startsWith("/editor");
    const isRootPage = pathname === "/";

    // Case 1: Accessing protected routes (/, /editor)
    if ((isEditorPage || isRootPage) && !isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname); // Optional redirect param
        return NextResponse.redirect(loginUrl);
    }

    // Case 2: Accessing login while already authenticated
    if (isLoginPage && isAuthenticated) {
        // Check if there's a redirect parameter, otherwise go to editor
        const redirectTo = request.nextUrl.searchParams.get("redirect");
        const targetUrl = redirectTo || "/editor";
        return NextResponse.redirect(new URL(targetUrl, request.url));
    }

    // Allow request to proceed
    return NextResponse.next();
}

// Match all paths except static and public assets
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)"],
};
