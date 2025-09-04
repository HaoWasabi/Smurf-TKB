import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Smurf TKB',
  description: 'A tool to help you create and manage your schedules.',
  generator: 'HaoWasabi',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
          {/* ...existing code... */}
        {/* Hiển thị số lượt truy cập */}
        <div style={{textAlign: "center", marginTop: 24}}>
          <a href="https://www.freecounterstat.com" title="website counters">
            <img src="https://counter5.optistats.ovh/private/freecounterstat.php?c=ynk91y89ft63w8dlaesb83nnsfb8nku5" style={{border:0}} title="website counters" alt="website counters" />
          </a>
        </div>
      </body>
    </html>
  )
}
