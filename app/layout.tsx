import { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "App Builder PWA - AI-Powered Webapp Creator",
  description: "Create webapps with AI assistance - plan, code, test, and deploy autonomously",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AppBuilder",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "App Builder PWA",
    description: "AI-powered autonomous webapp builder",
    type: "website",
  },
}

export const viewport = {
  themeColor: {
    light: "#ffffff",
    dark: "#000000",
  },
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  dark: "dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192x192.png" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}