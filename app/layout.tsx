import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPro Terminal | Investment Platform",
  description: "Real-time stocks, news, and portfolio management for US, India & Crypto markets.",
  applicationName: "StockPro Terminal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StockPro",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.warn(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Using a non-functional Clerk fallback key for build-time rendering only.",
    );
  }
  return (
    <ClerkProvider publishableKey={publishableKey ?? "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k"}>
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <html lang="en" className="dark">
        <head>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className="antialiased">
          <ErrorBoundary>{children}</ErrorBoundary>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </AppProviders>
  );
}
