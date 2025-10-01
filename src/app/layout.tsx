import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
    title: 'AI Chat Assistant - Professional Claude-style Interface',
    description: 'Experience the most advanced AI chat assistant with a clean, professional interface inspired by Claude',
    keywords: 'AI, chat, assistant, Claude, GPT, chatbot',
    authors: [{ name: 'Your Name' }],
    creator: 'Your Company',
    publisher: 'Your Company',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon-16x16.png',
        apple: '/apple-icon.png',
    },
    openGraph: {
        type: 'website',
        title: 'AI Chat Assistant',
        description: 'Professional AI Chat with Claude-style interface',
        siteName: 'AI Chat',
        locale: 'vi_VN',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Chat Assistant',
        description: 'Professional AI Chat with Claude-style interface',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
        { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
    ],
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi" className="smooth-scroll">
        <head>
            <meta charSet="UTF-8" />
            {/*<link rel="manifest" href="/manifest.json" />*/}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body className={`${inter.className} safe-area-padding`}>

        <main id="main">
            {children}
        </main>
        </body>
        </html>
    )
}