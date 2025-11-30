import type { Metadata } from "next";
import "./styles/globals.css";

import { Instrument_Sans } from "next/font/google";

import { Header } from "./components/navigation/Header";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rinde Chile - Transparencia en Compras Municipales",
  description: "Plataforma dedicada a monitorear y promover la transparencia en las compras municipales en Chile.",
  metadataBase: new URL("https://rindechile.cl"),
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://rindechile.cl",
    siteName: "Rinde Chile",
    title: "Rinde Chile - Transparencia en Compras Municipales",
    description: "Plataforma dedicada a monitorear y promover la transparencia en las compras municipales en Chile.",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Rinde Chile - Transparencia en Compras Municipales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rinde Chile - Transparencia en Compras Municipales",
    description: "Plataforma dedicada a monitorear y promover la transparencia en las compras municipales en Chile.",
    images: ["/opengraph.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${instrumentSans.variable} flex flex-col antialiased bg-background text-foreground p-6 tablet:p-8 gap-12 tablet:gap-16`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
