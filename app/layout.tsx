import type { Metadata } from "next";
import "./styles/globals.css";

import { Instrument_Sans } from "next/font/google";
import { Info } from "lucide-react";

import { Header } from "./components/navigation/Header";
import { Footer } from "./components/navigation/Footer";
import { Alert, AlertDescription } from "./components/ui/alert";
import Link from "next/link";

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
        className={`${instrumentSans.variable} flex flex-col min-h-screen antialiased bg-background text-foreground`}
      >
        {/* Work in Progress Disclaimer */}
        <Alert className="w-full py-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este sitio web está en desarrollo activo. Si te gusta este proyecto, por favor <Link href="https://youtu.be/eC48TKl38LY" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4 hover:text-primary transition-colors">deja un like en nuestro video de YouTube</Link> para apoyarnos en el concurso del Gobierno de Chile; Transparenta 2025.
          </AlertDescription>
        </Alert>

        <Header />

        <main className="p-6 tablet:p-8 gap-12 tablet:gap-16">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
