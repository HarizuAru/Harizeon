import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Client components call the control plane at /api/v1/*. Without this proxy
  // those calls hit the Next server, 404, and every console write silently fell
  // through to fabricated local data. The rewrite forwards the browser's
  // hz_session cookie, which the API authenticates.
  async rewrites() {
    const api = process.env.HARIZEON_API_BASE ?? "http://localhost:8080";
    return [{ source: "/api/v1/:path*", destination: `${api}/v1/:path*` }];
  },
};

export default nextConfig;
