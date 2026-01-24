# Project Structure

## Directory Organization

```
fact-checking-website/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/               # API route handlers
│   │   └── fact-check/    # Main fact-checking endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/ui component library
│   ├── hero.tsx          # Landing page hero section
│   └── search-results.tsx # Fact-check results display
├── lib/                  # Utility functions and helpers
│   └── utils.ts          # Common utilities (cn, formatDate)
├── public/               # Static assets
├── styles/               # Additional stylesheets
└── .kiro/               # Kiro configuration
```

## File Naming Conventions

- **Components**: PascalCase for React components (`Hero.tsx`, `SearchResults.tsx`)
- **Pages**: lowercase with hyphens for routes (`fact-check/`, `sentry-example-page/`)
- **API Routes**: `route.ts` for App Router API endpoints
- **Utilities**: camelCase for functions and variables
- **Types**: PascalCase for TypeScript interfaces/types

## Component Architecture

### UI Components (`components/ui/`)
- Shadcn/ui components with consistent API
- Use `cn()` utility for className merging
- Implement `cva` (class-variance-authority) for variants
- Forward refs and support `asChild` prop pattern

### Feature Components (`components/`)
- Business logic components
- Client-side components use `"use client"` directive
- Props interfaces defined inline or exported

## API Structure

### Route Handlers (`app/api/`)
- Use `route.ts` files for API endpoints
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Return `NextResponse.json()` for responses
- Handle FormData for file uploads

## Styling Patterns

- **Tailwind Classes**: Use utility classes directly
- **Component Variants**: Use `cva` for complex component styling
- **Responsive Design**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
- **Dark Mode**: Use `dark:` prefix for dark mode styles
- **CSS Variables**: Defined in `globals.css` for theme colors

## Import Patterns

```typescript
// Absolute imports using @ alias
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Relative imports for same directory
import "./globals.css"
```

## Configuration Files

- `components.json` - Shadcn/ui configuration
- `next.config.mjs` - Next.js configuration with Sentry
- `tsconfig.json` - TypeScript configuration with path aliases
- `tailwind.config.js` - Tailwind CSS configuration