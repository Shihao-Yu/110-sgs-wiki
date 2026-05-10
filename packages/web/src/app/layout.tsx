import type { Metadata } from "next";
import type { ReactNode } from "react";
import FallbackBanner from "@/components/FallbackBanner";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { AdminProvider } from "@/components/admin/AdminContext";
import Toaster from "@/components/admin/Toaster";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sgs-wiki.local"),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <AdminProvider>
          <div className="flex min-h-screen flex-col">
            <FallbackBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AdminProvider>
      </body>
    </html>
  );
}
