import type { Metadata } from "next";
import "./globals.css"; // <-- THIS IS THE CRITICAL LINE

export const metadata: Metadata = {
  title: "Watchdog V4",
  description: "Institutional Research Desk",
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