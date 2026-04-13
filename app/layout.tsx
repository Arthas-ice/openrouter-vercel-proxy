import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenRouter Proxy",
  description: "Vercel-hosted proxy for OpenRouter",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
