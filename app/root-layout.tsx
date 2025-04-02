import { Metadata } from "next"
import { RootLayoutClient } from "./layout"

export const metadata: Metadata = {
  title: "Workshop Service Manager",
  description: "Manage your workshop services and customer vehicles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>
} 