import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automation Test Dashboard",
  description: "Web UI for running and managing Playwright automation tests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
