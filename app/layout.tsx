import type { Metadata } from "next";
import "./styles/globals.css";

import { Outfit } from "next/font/google";

import { AppSidebar } from "./components/navigation/AppSidebar";
import { SiteHeader } from "./components/navigation/SiteHeader";
import { Footer } from "./components/navigation/Footer";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
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
        className={`${outfit.variable} antialiased bg-background text-foreground`}
      >
        {/* Skip to main content link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>

        <div className="[--header-height:3.5rem]">
          <SidebarProvider className="flex flex-col">
            <SiteHeader />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <SidebarInset>
                <main id="main-content" className="flex-1 p-6 tablet:p-8" tabIndex={-1}>
                  {children}
                </main>

                <Footer />
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </body>
    </html>
  );
}
