import { Metadata } from "next"
import { RootLayoutClient } from "./layout-client"

export const metadata: Metadata = {
  title: "M Auto Seris",
  description: "Manage your workshop services and customer vehicles",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RootLayoutClient>{children}</RootLayoutClient>
}

