import type { Metadata } from "next";
import { Outfit, Playfair_Display, Geist } from "next/font/google";
import SmoothScrolling from "@/components/SmoothScrolling";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import JsonLd from "@/components/JsonLd";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SalonFlow | Never Miss Another Salon Booking",
  description: "The modern salon appointment management and lead capture platform.",
  keywords: ["Salon SaaS", "Appointment Booking", "Salon Management", "Salon CRM"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", outfit.variable, playfair.variable, "font-sans", geist.variable)}>
      <body className="flex flex-col bg-white text-zinc-950 min-h-screen">
        <SmoothScrolling>
          <AuthProvider>
            <main className="flex-grow">{children}</main>
          </AuthProvider>
        </SmoothScrolling>
      </body>
    </html>
  );
}
