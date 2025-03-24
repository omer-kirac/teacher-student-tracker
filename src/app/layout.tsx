import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import dynamic from "next/dynamic";

// Dynamically import Navbar with client-side rendering only
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: true });
// Import NavbarHandler directly since it's a client component with 'use client' directive
import NavbarHandler from "../components/NavbarHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Öğretmen-Öğrenci Takip Sistemi",
  description: "Öğrencilerin çözdüğü soruları takip etmek için bir sistem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-theme="light">
      <body className={inter.className}>
        <Providers>
          <NavbarHandler>
            <Navbar />
          </NavbarHandler>
          <main data-theme="light">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
