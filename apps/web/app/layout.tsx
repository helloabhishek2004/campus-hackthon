import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "CampusGram — Smart Campus",
  description:
    "Next-generation Smart Campus Information, Services & Student Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
