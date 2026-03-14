"use client"

import { usePathname } from "next/navigation"
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const inter = Inter({ subsets: ["latin"] });

// We can't export metadata from a client component, but we need client logic for unconditional layout
// So we'll split this or just handle the layout logic inside a client wrapper
// Simpler approach for now is to move the logic into a client component inside the body

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/onboarding"

  return (
    <div className="flex h-screen overflow-hidden">
      {!isAuthPage && <Sidebar />}
      <div className={`flex flex-1 flex-col overflow-hidden ${!isAuthPage ? "lg:pl-64" : ""} transition-all duration-300`}>
        {!isAuthPage && (
          <div className="sticky top-0 z-10 lg:static">
            <Header />
          </div>
        )}
        <main className={`flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 ${isAuthPage ? "p-0" : ""}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
