import type { NextConfig } from "next";

function supabaseStorageRemotePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];
  try {
    const host = new URL(raw).hostname;
    return [
      {
        protocol: "https" as const,
        hostname: host,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseStorageRemotePattern(),
  },
};

export default nextConfig;
