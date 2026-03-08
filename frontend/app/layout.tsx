import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reelcraft — Blog to Video Storyboard",
  description: "Transform any article or blog post into a cinematic video storyboard with AI-generated scene illustrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="glass sticky top-0 z-50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🎬</span>
              <span className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Reelcraft
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/history"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                History
              </Link>
              <Link href="/" className="btn-primary text-sm px-4 py-2">
                New Storyboard
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
