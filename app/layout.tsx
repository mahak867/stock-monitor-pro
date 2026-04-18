import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPro Terminal | Investment Platform",
  description: "Real-time stocks, news, and portfolio management.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="antialiased">
          <ErrorBoundary>{children}</ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
} 