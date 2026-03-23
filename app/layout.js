// app/layout.js
'use client'

import { usePathname } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/nav";
import AuthGuard from "@/components/AuthGuide";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const publicRoutes = ['/auth', '/Signin', '/signup', '/forgot-password'];

function RootLayout({ children }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          {isPublicRoute ? (
            <>
              <Navigation />
              {children}
            </>
          ) : (
            <AuthGuard>
              <Navigation />
              {children}
            </AuthGuard>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayout;
