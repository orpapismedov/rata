import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "מערכת ניהול רישיונות מטיסים",
  description: "מערכת מקצועית לניהול רישיונות מטיסים ותעודות רפואיות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-black">
          {children}
        </div>
      </body>
    </html>
  );
}
