import "../globals.css";
import "./login.css";
import { Providers } from "../providers";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <Providers>
        <main className="login-page-main">{children}</main>
      </Providers>
    </div>
  );
} 