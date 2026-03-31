import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanguosha Wiki",
  description: "Sanguosha Kingdom War Wiki and Simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
