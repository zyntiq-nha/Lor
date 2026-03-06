import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "LOR Generator",
  description: "Self-service letter of recommendation generator"
};

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.31 0-6 2.02-6 4.5V20h12v-1.5C18 16.02 15.31 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="topnav">
            <Link href="/" className="brand-logo-link" aria-label="Go to home">
              <Image
                src="/assets/logo.png"
                alt="Zyntiq"
                className="brand-logo"
                width={130}
                height={34}
                priority
              />
            </Link>

            <Link className="icon-btn" href="/login" aria-label="Admin login">
              <AdminIcon />
            </Link>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}