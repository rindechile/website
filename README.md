# RindeChile

Plataforma de visualizacion interactiva para datos de compras publicas del gobierno chileno. Herramienta de transparencia para que todos los ciudadanos puedan explorar como se gastan los recursos publicos en sus regiones y municipalidades.

## Caracteristicas

- **Mapa Interactivo**: Navega por las 16 regiones y mas de 400 municipalidades de Chile
- **Datos de Compras Publicas**: Mas de 50.000 compras de mas de 500 proveedores
- **Visualizacion de Datos**: Analiza patrones de gasto y distribucion de proveedores
- **Diseño Responsivo**: Optimizado para escritorio y dispositivos moviles

## Stack Tecnologico

- **Framework**: Next.js 16 con App Router
- **Base de Datos**: Cloudflare D1 (SQLite serverless)
- **ORM**: Drizzle ORM
- **Despliegue**: Cloudflare Pages
- **Estilos**: Tailwind CSS
- **Visualizacion**: D3.js

## Inicio Rapido

### Prerrequisitos

- Node.js 20+
- pnpm 9+
- Cuenta de Cloudflare (gratis)

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/IgnacioPalma/rindechile.git
cd rinde-chile

# Instalar dependencias
pnpm install

# Generar mapeo de municipalidades
pnpm generate:mapping

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Configurar Base de Datos

```bash
# 1. Crear base de datos D1 en Cloudflare
npx wrangler login
npx wrangler d1 create transparenta-db

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Sembrar datos (en orden)
pnpm db:seed          # Taxonomia UNSPSC
pnpm db:seed:data     # Regiones y municipalidades
pnpm db:seed:purchases # Compras publicas
```

## Contribuir

Las contribuciones son bienvenidas. Por favor lee nuestra [Guia de Contribucion](CONTRIBUTING.md) antes de enviar un Pull Request.

## Codigo de Conducta

Este proyecto sigue un [Codigo de Conducta](CODE_OF_CONDUCT.md). Al participar, te pedimos que lo respetes.

## Licencia

Este proyecto esta licenciado bajo la GNU Affero General Public License v3.0 (AGPL-3.0). Consulta el archivo [LICENSE.md](LICENSE.md) para mas detalles.

### Que significa esto?

- Puedes usar, modificar y distribuir este software
- Puedes usarlo para propositos comerciales
- Si modificas y despliegas este software en un servidor, **debes** hacer tus modificaciones publicamente disponibles
- Cualquier trabajo derivado debe tambien estar licenciado bajo AGPL-3.0

---

**Construido para la transparencia gubernamental en Chile**
