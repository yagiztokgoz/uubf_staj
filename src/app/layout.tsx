import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "İTU UUBF'deki staj çileni paylaş, analitikleri görüntüle",
  description: "Havacılık ve uzay mühendisliği staj deneyimlerini paylaş, analitikleri görüntüle",
  openGraph: {
    title: "İTU UUBF'deki staj çileni paylaş, analitikleri görüntüle",
    description: "Havacılık ve uzay mühendisliği staj deneyimlerini paylaş, analitikleri görüntüle",
    url: "https://uubf-staj.vercel.app",
    siteName: "UUBF Staj Takip",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    title: "İTU UUBF'deki staj çileni paylaş, analitikleri görüntüle",
    description: "Havacılık ve uzay mühendisliği staj deneyimlerini paylaş, analitikleri görüntüle",
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#020917]">
        {children}
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
