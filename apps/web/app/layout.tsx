import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Smart Campus",
  description:
    "Next-generation Smart Campus Information & Complaint Intelligence System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
