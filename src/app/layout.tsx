import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://finzo-pi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Finzo - Personal Finance Management & Budget Tracking",
    template: "%s | Finzo",
  },
  description:
    "Finzo is a modern finance management website that helps you track expenses, manage budgets, monitor recurring bills, and gain smart insights into your spending habits.",
  keywords: [
    "finance management",
    "budget tracking",
    "expense tracker",
    "personal finance",
    "bill management",
    "money management",
    "financial planning",
    "recurring expenses",
    "spending insights",
  ],
  authors: [{ name: "Finzo" }],
  creator: "Finzo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Finzo",
    title: "Finzo - Personal Finance Management & Budget Tracking",
    description:
      "Track expenses, manage budgets, monitor recurring bills, and gain smart insights into your spending — all in one place.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finzo - Personal Finance Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finzo - Personal Finance Management & Budget Tracking",
    description:
      "Track expenses, manage budgets, monitor recurring bills, and gain smart insights into your spending.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: "Finzo",
  category: "Finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Finzo",
              url: siteUrl,
              description:
                "A modern finance management website that helps you track expenses, manage budgets, monitor recurring bills, and gain smart insights.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Expense Tracking",
                "Budget Management",
                "Recurring Bill Monitoring",
                "Smart Financial Insights",
                "Bill Payment Reminders",
                "Multi-Currency Support",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
