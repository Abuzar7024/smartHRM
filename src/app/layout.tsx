import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "sonner";

// Use Inter as the primary corporate font
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHR — Intelligent Workforce Management",
  description: "A modern, role-based Human Resource Management portal with AI-powered insights for employers and employees.",
  keywords: ["HR", "Human Resources", "Workforce Management", "Payroll", "Attendance", "SmartHR"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AuthProvider>
          <AppProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
