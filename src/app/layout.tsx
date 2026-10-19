import type { Metadata } from "next";

import "./globals.css";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PPDS | Tool Subscriptions & Custom Software",
    template: "%s | PPDS",
  },
  description: "Premium digital subscriptions and supported delivery from PPDS.",
  openGraph: {
    title: "PPDS | Tool Subscriptions & Custom Software",
    description: "Premium digital subscriptions and custom software from PPDS.",
    type: "website",
    images: [{ url: "/ppds-logo.png", width: 654, height: 650, alt: "PPDS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PPDS | Tool Subscriptions & Custom Software",
    description: "Premium digital subscriptions and custom software from PPDS.",
    images: ["/ppds-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-950 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PPDS",
              url: appUrl,
              logo: `${appUrl}/ppds-logo.png`,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                availableLanguage: ["English", "Urdu"],
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
