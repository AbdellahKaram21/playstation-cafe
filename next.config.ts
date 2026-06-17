import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler: true  ← معطّل عشان بيكسر الـ build على Vercel
  // بيسبب Turbopack crash مع الـ production build
};

export default nextConfig;
