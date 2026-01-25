import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { BottomNav } from '@/components/BottomNav'
import { Footer } from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NuPeer - Sigma Nu Class Matching',
  description: 'Connect with brothers who can help with your classes',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
          <BottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

