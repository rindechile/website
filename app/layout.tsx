import type { Metadata } from "next";
import "./styles/globals.css";

import { Instrument_Sans } from "next/font/google";

import { Header } from "./components/navigation/Header";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vigil Chile - Transparencia en Compras Municipales",
  description: "Plataforma dedicada a monitorear y promover la transparencia en las compras municipales en Chile, facilitando el acceso a información pública y fomentando la participación ciudadana.",
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
