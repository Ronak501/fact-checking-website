# Technology Stack

## Core Framework
- **Next.js 16.1** with App Router
- **React 19.2** with TypeScript 5.9
- **Node.js 18+** runtime

## Styling & UI
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Component library (New York style)
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

## AI & APIs
- **Google Generative AI** - Gemini for text/image analysis
- **Google Fact Check API** - Fact verification
- **Vercel Analytics** - Usage tracking

## Development Tools
- **TypeScript** - Type safety with strict mode
- **ESLint** - Code linting (ignored during builds)
- **Sentry** - Error monitoring and performance tracking

## Build & Deployment
- **Vercel** - Hosting and deployment
- **pnpm/npm** - Package management

## Common Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
pnpm dev            # Alternative with pnpm

# Production
npm run build       # Build for production + Sentry sourcemaps
npm run start       # Start production server

# Code Quality
npm run lint        # Run ESLint

# Sentry Integration
npm run sentry:sourcemaps  # Upload sourcemaps to Sentry
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_GOOGLE_AI_API_KEY` - Google AI API key
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API key  
- `NEXT_PUBLIC_FACT_API` - Google Fact Check API endpoint
- `NEXT_PUBLIC_GEMINI_API` - Gemini API endpoint

## Key Dependencies

- Form handling: `react-hook-form` + `@hookform/resolvers` + `zod`
- Date utilities: `date-fns`
- Class management: `clsx` + `tailwind-merge` + `class-variance-authority`
- Charts: `recharts`
- Carousel: `embla-carousel-react`