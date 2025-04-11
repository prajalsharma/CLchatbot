import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CL Web3 Grants Database",
  description: "Discover, track, and apply for Web3 grants using our interactive dashboard.",
  openGraph: {
    title: "Web3 Grants Dashboard",
    description: "Discover, track, and apply for Web3 grants using our interactive dashboard.",
    url: "https://www.web3grants.co",
    type: "website",
    images: [
      {
        url: "https://web3grants.s3.us-east-1.amazonaws.com/preview",
        width: 1200,
        height: 630,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@YourTwitterHandle",
    title: "CL Web3 Grants Dashboard",
    description:
      "Easily find, match, and analyze Web3 grants with the CL Web3 Grants Dashboard—your go-to tool for Web3 funding.",
    images: ["https://web3grants.s3.us-east-1.amazonaws.com/preview"],
  },
  icons: {
    icon: "/favicon.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-SR2EHKZMJQ" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag("js", new Date());
            gtag("config", "G-SR2EHKZMJQ");
          `}
        </Script>
      </head>
      <body className={`${inter.className} antialiased`}>
        <Header />
        {children}
        <footer className="flex flex-col items-center space-y-2 pb-8">
          <div className="flex flex-col justify-center items-center mb-1 gap-2">
            <a href="https://www.cornarolabs.xyz" target="_blank" rel="noreferrer">
              <img src="./logo.png" alt="" className="w-[14.625rem]" />
            </a>
            <div>
              <p className="text-white text-sm text-center">
                CL Web3 Grants Dashboard by{" "}
                <a
                  href="http://www.cornarolabs.xyz"
                  target="_blank"
                  className="text-blue-500 hover:underline">
                  Cornaro Labs
                </a>{" "}
                is built in collaboration with:
              </p>
              <div className="flex gap-2 items-center px-2">
                <a href="https://www.blackvogel.com/" target="_blank" rel="noreferrer">
                  <img src="./logo2.svg" alt="" className="w-52" />
                </a>
                <a href="https://hbi.gr/en/" target="_blank" rel="noreferrer">
                  <img src="./logo3.jpeg" alt="" className="w-52" />
                </a>
              </div>
            </div>
          </div>
          <div>
            <p className="flex flex-col items-center space-y-2 mt-4 text-[#ffffff7a]/20 text-xs text-center">
              <span>© Cornaro Labs 2025. All rights reserved.</span> For inquiries, please reach out
              to us at info@cornarolabs.xyz
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
