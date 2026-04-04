import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/layout/Navbar";
import SidebarClient from "./SidebarClient";
import Alerts from "@/components/layout/Alerts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en" className="dark">
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="flex h-screen overflow-hidden">
            <SidebarClient />
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
              <Navbar />
              <Alerts />
              <main className="flex-1 overflow-y-auto">
                <div className="w-full max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-70px-56px)]">
                  {/* 70px Navbar, 56px Footer */}
                  {children}
                </div>
              </main>
              <footer className="w-full flex items-center justify-center h-14 border-t border-cyan-300/10 bg-black/20 backdrop-blur-md">
                <Link
                  isExternal
                  className="flex items-center gap-1 text-slate-300 hover:text-cyan-200 transition-colors"
                  href="https://heroui.com?utm_source=next-app-template"
                  title="heroui.com homepage"
                >
                  <span>Powered by</span>
                  <p className="text-cyan-300">HeroUI</p>
                </Link>
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
