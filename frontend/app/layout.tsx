import "@/styles/globals.css";
import { Poppins } from "next/font/google";

import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={`${poppins.variable} font-sans`}
      lang="en"
    >
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased text-gray-800 bg-gradient-to-br from-[#e0f7fa] via-[#f3e5f5] to-[#e3f2fd]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
