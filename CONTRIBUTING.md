# Guia de Contribucion

Gracias por tu interes en contribuir a RindeChile. Este documento proporciona las pautas y mejores practicas para contribuir al proyecto.

## Codigo de Conducta

Al participar en este proyecto, aceptas cumplir con nuestro [Codigo de Conducta](CODE_OF_CONDUCT.md). Por favor leelo antes de contribuir.

## Como Contribuir

### Reportar Bugs

Si encuentras un bug, por favor crea un issue en GitHub con la siguiente informacion:

1. **Titulo descriptivo**: Resume el problema de manera clara
2. **Descripcion del bug**: Explica que esta pasando vs. que deberia pasar
3. **Pasos para reproducir**: Lista los pasos exactos para reproducir el problema
4. **Capturas de pantalla**: Si aplica, agrega imagenes que muestren el problema
5. **Entorno**: Navegador, sistema operativo, version de Node.js

### Proponer Mejoras

Para proponer nuevas funcionalidades o mejoras:

1. Revisa los issues existentes para evitar duplicados
2. Crea un nuevo issue describiendo:
   - El problema que resuelve la mejora
   - La solucion propuesta
   - Alternativas consideradas
3. Espera retroalimentacion antes de comenzar a trabajar

### Enviar Pull Requests

1. **Fork el repositorio** y clona tu fork localmente
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/nombre-de-tu-feature
   # o
   git checkout -b fix/descripcion-del-bug
   ```
3. **Realiza tus cambios** siguiendo las convenciones de codigo
4. **Prueba tus cambios** localmente
5. **Commit tus cambios**:
   ```bash
   git commit -m "feat: descripcion breve del cambio"
   ```
6. **Push a tu fork**:
   ```bash
   git push origin feature/nombre-de-tu-feature
   ```
7. **Crea un Pull Request** en GitHub

## Configuracion del Entorno de Desarrollo

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

### Base de Datos Local

El proyecto usa Cloudflare D1 con un emulador local:

```bash
# Sembrar la base de datos (en orden)
pnpm db:seed          # Taxonomia UNSPSC
pnpm db:seed:data     # Regiones, municipalidades, proveedores
pnpm db:seed:purchases # Compras

# Ver base de datos
pnpm drizzle:dev
```

## Convenciones de Codigo

### Mensajes de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva funcionalidad
- `fix:` - Correccion de bug
- `docs:` - Documentacion
- `style:` - Formateo (sin cambios de codigo)
- `refactor:` - Reestructuracion de codigo
- `perf:` - Mejora de rendimiento
- `test:` - Agregar tests

Ejemplo:
```
feat: agregar filtro por categoria en mapa

- Implementar componente CategoryFilter
- Integrar con MapContext
- Agregar soporte de teclado
```

### TypeScript

- Modo estricto habilitado
- Tipos explicitos para parametros y retornos de funciones
- Usar `interface` para formas de objetos
- Evitar `any`, usar `unknown` o tipos apropiados

### Componentes React

- Un componente por archivo
- Usar `"use client"` solo cuando sea necesario
- Colocar hooks relacionados junto al componente
- Nombres en PascalCase para componentes

### Estilo de Codigo

- Ejecutar `pnpm lint` antes de hacer commit
- Usar Tailwind CSS para estilos
- Seguir patrones existentes en el codigo

## Estructura del Proyecto

```
app/
├── components/     # Componentes React
│   ├── map/       # Componentes del mapa
│   ├── navigation/# Navegacion
│   └── ui/        # Componentes reutilizables
├── contexts/      # Contextos de React
├── data/          # Datos estaticos
└── lib/           # Utilidades

schemas/
├── drizzle.ts     # Esquema de base de datos
└── data/          # Datos CSV fuente

scripts/           # Scripts de utilidad
public/data/       # Archivos GeoJSON
```

## Proceso de Revision

1. Un mantenedor revisara tu PR
2. Puede que se soliciten cambios
3. Una vez aprobado, se hara merge a `main`

## Preguntas

Si tienes preguntas, no dudes en:

- Abrir un issue con la etiqueta `question`
- Comentar en un issue o PR existente

---

Gracias por contribuir a la transparencia gubernamental en Chile.
