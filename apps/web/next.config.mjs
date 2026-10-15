/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    // Tarayıcı isteklerini API'ye yönlendirir; çerezler aynı origin üzerinden çalışır.
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
