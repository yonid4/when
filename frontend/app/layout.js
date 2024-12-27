import localFont from "next/font/local";
import './globals.css';
import './App.css';

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

// export const metadata = {
//   title: "when.",
//   description: "Stop asking when. Start planning when.",
// };

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {/* <a className="header" href="http://localhost:3000">when.</a> */}
          <div>{children}</div>
        </body>
      </html>
  </>
  );
}
