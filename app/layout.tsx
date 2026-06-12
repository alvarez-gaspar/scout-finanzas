import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scout Finanzas",
  description: "Gestión financiera de la unidad scout",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 flex flex-col">
        <Nav />
        <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">{children}</main>
      </body>
    </html>
  );
}
