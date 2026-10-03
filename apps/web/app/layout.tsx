import type { Metadata } from "next";
import "../styles/globals.css";
import { AuthProvider } from "@/components/auth/auth-guard";
import { ThemeProvider } from "@/components/theme/theme-context";
import { SidebarProvider } from "@/components/layout/sidebar-context";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
