import './globals.css'
import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title: 'Cribbage Game',
  description: 'Play cribbage against CPU opponents',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}