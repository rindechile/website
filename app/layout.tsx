import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sobreprecios",
  description: "Análisis de sobreprecios en las compras municipales de Chile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${instrumentSans.variable} antialiased`}
        style={{ backgroundColor: '#121A1D' }}
      >
        {children}
      </body>
    </html>
  );
}
