import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AppSidebar } from '@/components/app-sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/lib/i18n'
import { DashboardProvider } from '@/context/dashboard-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VIC Forecast | Hệ thống Dự báo Dòng tiền & Cảm xúc Thị trường',
  description: 'VIC Multimodal Conditional Probabilistic Forecasting System - Hệ thống hỗ trợ ra quyết định thông minh đầu tư cổ phiếu VIC',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0e17',
}

import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <I18nProvider>
            <DashboardProvider>
              <div className="flex min-h-screen" suppressHydrationWarning>
                <AppSidebar />
                {children}
              </div>
            </DashboardProvider>
          </I18nProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
