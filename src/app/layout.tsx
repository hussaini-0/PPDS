import type { Metadata, Viewport } from "next";

import "./globals.css";

import { ThemeToggle } from "@/components/theme/theme-toggle";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "PPDS | Tool Subscriptions & Custom Software",
    template: "%s | PPDS",
  },
  description: "Premium digital subscriptions and supported delivery from PPDS.",
  icons: {
    icon: [{ url: "/ppds-favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/ppds-favicon.png",
    apple: [{ url: "/ppds-apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
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

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
};

const themeScript = `
  try {
    const savedTheme = localStorage.getItem("ppds-theme");
    const useDark = savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", useDark);
    document.documentElement.style.colorScheme = useDark ? "dark" : "light";
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-950 antialiased dark:bg-slate-950 dark:text-slate-50">
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
        <ThemeToggle className="fixed bottom-4 right-4 z-[100] sm:hidden" />
      </body>
    </html>
  );
}
