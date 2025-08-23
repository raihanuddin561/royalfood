import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import "./globals.css";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get server session and pass into SessionProvider so client starts hydrated
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (e) {
    // ignore — if server session fails, client will still attempt to hydrate
    console.error('Failed to get server session in RootLayout', e)
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
      >
        {/* Expose server session on window before client hydration so client-only components
            can read it synchronously (used as a fallback while next-auth client rehydrates) */}
        {session && (
          // eslint-disable-next-line react/no-danger
          <script
            dangerouslySetInnerHTML={{ __html: `window.__royal_food_server_session = ${JSON.stringify(session).replace(/</g, '\\u003c')};` }}
          />
        )}
        <ErrorBoundary>
          <AuthProvider session={session}>
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
