"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/firebase/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/lib/api/query-provider"
import { PasswordChangeWrapper } from "@/components/auth/password-change-wrapper"

const inter = Inter({ subsets: ["latin"] })

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <PasswordChangeWrapper>
                {children}
              </PasswordChangeWrapper>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
} 