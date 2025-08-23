import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Royal Food - Restaurant Management System",
  description: "Royal Food management system for tracking inventory, sales, employees, and partnership profits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
      >
        <ErrorBoundary>
          <AuthProvider session={null}>
            <SidebarProvider>
              <div className="w-full min-h-screen flex flex-col">
                {/* Main area: let individual routes/layouts control centering and spacing */}
                <main className="flex-1 w-full">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
