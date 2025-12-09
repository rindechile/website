import type { Metadata } from "next";
import "./styles/globals.css";

import { Outfit } from "next/font/google";

import { AppSidebar } from "./components/navigation/AppSidebar";
import { Footer } from "./components/navigation/Footer";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import { DynamicBreadcrumb } from "./components/navigation/DynamicBreadcrumb";

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

        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <DynamicBreadcrumb />
              </div>
            </header>

            <main id="main-content" className="flex-1 p-6 tablet:p-8" tabIndex={-1}>
              {children}
            </main>

            <Footer />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
