import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./styles/globals.css";
import { Header } from "./components/Header";

export const runtime = "edge";

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
        className={`${instrumentSans.variable} antialiased bg-background text-foreground p-6 tablet:p-8`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
