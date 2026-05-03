import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ToastContainer } from '@/components/Toast'
import { SubscriptionBanner } from '@/components/SubscriptionBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'SIRAJ — AI-Powered Procurement',
  description: 'Make smarter procurement decisions with AI-powered supplier analysis and scoring.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`font-sans ${inter.variable}`}>
      <body className="flex min-h-screen bg-[#080c14] text-gray-50 antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <SubscriptionBanner />
          <main className="flex-1">
            <div className="max-w-[1200px] mx-auto px-6 py-8">
              {children}
            </div>
          </main>
          <footer className="border-t border-white/[0.05] py-4 px-6">
            <p className="text-xs text-gray-700 text-center">© 2024 SIRAJ. All rights reserved.</p>
          </footer>
        </div>
        <ToastContainer />
      </body>
    </html>
  )
}
