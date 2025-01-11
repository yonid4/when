import localFont from "next/font/local";
import './globals.css';
import './App.css';
import Link from "next/link";
import Image from 'next/image'
import logo from "./images/logo.png"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <div className="header">
            <Link href="/">
              <Image src={logo} 
                alt="Logo"
                height={40}
                width={120}
              ></Image>
            </Link>
          </div>
          <div>{children}</div>
        </body>
      </html>
  </>
  );
}
