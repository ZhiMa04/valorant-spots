import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/site/Navbar";
import { ErrorBoundary } from "@/components/site/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "酷点无畏契约点位库",
  description: "面向《无畏契约》玩家的非盈利素材与点位分享平台",
  keywords: ["无畏契约", "点位", "战术", "Valorant"],
  authors: [{ name: "酷点点位库" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 自动适配浏览器深色/浅色模式 */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)');if(d.matches)document.documentElement.classList.add('dark');d.addEventListener('change',function(e){if(e.matches)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');});}catch(e){}})();`
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <Navbar />
          <main>{children}</main>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
