import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="px-8 py-8 tablet:py-10">
        <div className="flex flex-col gap-8 tablet:flex-row tablet:justify-between tablet:items-start">
          {/* Brand and description */}
          <div className="flex flex-col gap-3">
            <Link 
              href="/" 
              className="w-fit transition-opacity duration-200 hover:opacity-80"
            >
              <Image
                src="/logo-full.svg"
                alt="RindeChile Logo"
                width={128}
                height={128}
                className="fill-foreground"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Plataforma dedicada a monitorear y promover la transparencia en las compras municipales en Chile.
            </p>
          </div>

          {/* Links section */}
          <div className="flex flex-col tablet:flex-row gap-8 tablet:gap-16">
            {/* Resources */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Recursos</h3>
              <nav className="flex flex-col gap-2">
                <a
                  href="https://www.mercadopublico.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mercado Público (abre en nueva pestaña)"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Mercado Público
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
                <a
                  href="https://www.chilecompra.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ChileCompra (abre en nueva pestaña)"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  ChileCompra
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </nav>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Contacto</h3>
              <nav className="flex flex-col gap-2">
                <a
                  href="mailto:hello@rindechile.cl"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <span>hello@rindechile.cl</span>
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col tablet:flex-row tablet:justify-between tablet:items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RindeChile. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              Hecho con ♥ en Chile
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/rindechile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn (abre en nueva pestaña)"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://github.com/IgnacioPalma/rindechile"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub (abre en nueva pestaña)"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
