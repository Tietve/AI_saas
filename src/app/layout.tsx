import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider'
import { Inter } from "next/font/google";

// Tạm thời comment out font imports nếu gây lỗi
// import { Geist, Geist_Mono } from "next/font/google";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
    title: "AI Chat",
    description: "Multi-model AI Chat",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <ThemeProvider>     {/* <-- Wrap children với ThemeProvider */}
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}