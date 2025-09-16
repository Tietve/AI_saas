import type { Metadata } from "next";
import "./globals.css";

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

export const metadata: Metadata = {
    title: "AI SaaS Platform",
    description: "Multi-model AI chat platform",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className="antialiased">
        {children}
        </body>
        </html>
    );
}