import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { ToastContainer } from '@/components/Toast'
import { SubscriptionBanner } from '@/components/SubscriptionBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SIRAJ — AI-Powered Procurement',
  description: 'Make smarter procurement decisions with AI-powered supplier analysis and scoring.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SIRAJ',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#22D3EE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const pathname    = headersList.get('x-pathname') ?? ''
  const isFormPage  = pathname.startsWith('/form')
  const isAuthPage  = pathname === '/login' || pathname === '/signup'

  const locale   = await getLocale()
  const messages = await getMessages()
  const dir      = locale === 'ar' ? 'rtl' : 'ltr'

  // Auth pages and form pages: bare layout — no Sidebar, no MobileHeader
  if (isFormPage || isAuthPage) {
    return (
      <html lang={locale} dir={dir} className={`font-sans ${inter.variable} ${ibmPlexArabic.variable}`}>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className="min-h-[100dvh] bg-[#060B14] text-gray-50 antialiased">
          <NextIntlClientProvider messages={messages}>
            {children}
            <ToastContainer />
          </NextIntlClientProvider>
        </body>
      </html>
    )
  }

  return (
    <html lang={locale} dir={dir} className={`font-sans ${inter.variable} ${ibmPlexArabic.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo-bar.png" />
      </head>
      <body className="flex min-h-[100dvh] bg-[#080c14] text-gray-50 antialiased overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>

          {/* Desktop sidebar — hidden on mobile (drawer handled by Sidebar internals) */}
          <Sidebar />

          {/* Main content column */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Mobile sticky header — only visible on mobile */}
            <MobileHeader />

            <SubscriptionBanner />

            <main className="flex-1 pt-14 md:pt-0">
              <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8 safe-inset-bottom">
                {children}
              </div>
            </main>

            <footer className="border-t border-white/[0.05] py-4 px-4 sm:px-6 safe-inset-bottom">
              <p className="text-xs text-gray-700 text-center">© 2024 SIRAJ. All rights reserved.</p>
            </footer>
          </div>

          <ToastContainer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
