# Transparenta Website

Interactive visualization platform for Chilean government procurement data. Explore public purchases across regions and municipalities with detailed insights into suppliers, commodities, and spending patterns.

## Features

- 🗺️ **Interactive Map**: Navigate Chile's 16 regions and 400+ municipalities
- 📊 **Procurement Data**: 620K+ purchases from 30K+ suppliers
- 🔍 **Advanced Filtering**: Filter by region, municipality, and UNSPSC categories
- 📈 **Data Insights**: Analyze spending patterns and supplier distribution
- 🎨 **Responsive Design**: Optimized for desktop and mobile experiences

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (serverless SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com) via [@opennextjs/cloudflare](https://opennext.js.org/cloudflare)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Data Visualization**: [D3.js](https://d3js.org) for map rendering
- **UI Components**: [Radix UI](https://www.radix-ui.com)

## Database Schema

The database includes five main tables:

- **UNSPSC Taxonomy**: 70K+ commodities organized into segments, families, and classes
- **Regions**: 16 Chilean regions with proper accented display names
- **Municipalities**: 432 municipalities with geographic relationships
- **Suppliers**: 30K+ government suppliers
- **Purchases**: 620K+ procurement records with amounts and commodity classifications

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Cloudflare account (for deployment)

### Installation

```bash
# Install dependencies
pnpm install

# Generate municipality mapping
pnpm generate:mapping

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

#### 1. Seed UNSPSC Taxonomy

Populate the product classification hierarchy (segments, families, classes, commodities):

```bash
# Local database
pnpm db:seed

# Remote database
pnpm db:seed:remote
```

This seeds **70,332 commodities** organized into 5,288 classes, 461 families, and 57 segments from `schemas/data/clean_unspsc_data.csv`.

#### 2. Seed Data Tables

Populate regions, municipalities, and suppliers:

```bash
# Local database
pnpm db:seed:data

# Remote database
pnpm db:seed:data:remote
```

This seeds:
- **16 regions** with proper Spanish accents (e.g., "Región del Bío-Bío")
- **432 municipalities** with normalized names
- **30,638 suppliers** from procurement records

#### 3. Seed Purchases

Populate purchase records (requires previous steps completed):

```bash
# Local database
pnpm db:seed:purchases

# Remote database
pnpm db:seed:purchases:remote
```

This seeds **623,416 purchases** from `schemas/data/data_with_expensive_flag.csv` with validated foreign key relationships.

**Note**: The optimized script pre-resolves all IDs and skips ~78K purchases referencing non-existent UNSPSC commodity codes.

### Development

```bash
# Run dev server
pnpm dev

# Lint code
pnpm lint

# Open Drizzle Studio (database GUI)
pnpm drizzle:dev

# Generate Cloudflare types
pnpm cf-typegen

# Generate Drizzle migrations
pnpm drizzle:generate
```

## Deployment

### Build & Preview

```bash
# Build for production
pnpm build

# Preview locally
pnpm preview
```

### Deploy to Cloudflare Pages

```bash
# Deploy to Cloudflare
pnpm deploy
```

The application uses [@opennextjs/cloudflare](https://opennext.js.org/cloudflare) for seamless Next.js deployment on Cloudflare's edge network.

## Project Structure

```
app/
├── components/         # React components
│   ├── map/           # Map visualization components
│   ├── navigation/    # Header and navigation
│   └── ui/           # Reusable UI components
├── contexts/          # React contexts (MapContext)
├── data/             # Static data files (regions, municipalities)
├── lib/              # Utilities and data services
└── styles/           # Global styles

schemas/
├── drizzle.ts        # Database schema
└── data/            # CSV data sources

scripts/
├── seed-unspsc.ts              # Seed UNSPSC taxonomy
├── seed-data-tables.ts         # Seed regions/municipalities/suppliers
└── seed-purchases-optimized.ts # Seed purchases with ID pre-resolution

public/
└── data/
    ├── chile_regions.json              # GeoJSON for regions
    └── municipalities_by_region/       # GeoJSON for municipalities
```

## Data Sources

- **UNSPSC Taxonomy**: `schemas/data/clean_unspsc_data.csv` (71,502 rows)
- **Procurement Data**: `schemas/data/data_with_expensive_flag.csv` (703,181 rows)
- **Geographic Data**: GeoJSON files in `public/data/`

## Configuration

- `wrangler.toml` / `wrangler.jsonc`: Cloudflare Workers configuration
- `drizzle.config.ts`: Drizzle ORM configuration
- `next.config.ts`: Next.js configuration
- `open-next.config.ts`: OpenNext Cloudflare adapter config

## License

Private project

## Contributing

This is a private repository. For questions or contributions, please contact the maintainers.
