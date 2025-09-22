import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/components/theme-provider'
import { Inter } from "next/font/google";













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
        <ThemeProvider>     {}
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}