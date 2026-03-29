import { withAuth } from "next-auth/middleware";

export default withAuth(
    function middleware() {
        return;
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/approvals") || req.nextUrl.pathname.startsWith("/expenses") || req.nextUrl.pathname.startsWith("/workflows") || req.nextUrl.pathname.startsWith("/analytics") || req.nextUrl.pathname.startsWith("/users") || req.nextUrl.pathname.startsWith("/audit-logs") || req.nextUrl.pathname.startsWith("/settings")) {
                    return !!token;
                }
                return true;
            },
        },
    },
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/approvals/:path*",
        "/expenses/:path*",
        "/workflows/:path*",
        "/analytics/:path*",
        "/users/:path*",
        "/audit-logs/:path*",
        "/settings/:path*",
    ],
};
