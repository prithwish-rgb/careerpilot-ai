
import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { StructuredData } from "@/components/StructuredData";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeIQ - Intelligent Resume & Career Management",
  description: "ATS optimization, resume intelligence, job match analysis, application tracking, and optional AI tailoring — all at zero cost.",
  keywords: ["resume tracker", "ATS score", "resume intelligence", "job match analysis", "career management", "resume builder"],
  authors: [{ name: "Prithwish Karmakar" }],
  creator: "Prithwish Karmakar",
  publisher: "ResumeIQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ai-resume-tracker-lake.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-resume-tracker-lake.vercel.app',
    siteName: 'ResumeIQ',
    title: 'ResumeIQ - Intelligent Resume & Career Management',
    description: 'ATS optimization, resume intelligence, job match analysis, application tracking, and optional AI tailoring.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'ResumeIQ - Intelligent Resume & Career Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeIQ - Intelligent Resume & Career Management',
    description: 'ATS optimization, resume intelligence, job match analysis, and application tracking.',
    images: ['/api/og'],
    creator: '@prithwish_rgb',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>  
          <ErrorBoundary>
            <Navbar />
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 sm:pt-24 md:pt-28 min-h-screen">
              {children}
            </main>
          </ErrorBoundary>
        </Providers>

      </body>
    </html>
  );
}
