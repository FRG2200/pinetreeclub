# Pine tree club - AI Image & Video Generation Platform

## Overview

Pine tree club is a full-stack AI content generation platform that enables users to create images and videos using various AI models. The application features a luxury brand-inspired editorial UI with warm dark tones and golden accent colors, offering multiple generation modes including text-to-image, image-edit, text-to-video, image-to-video, ref-image-to-video, and video-to-video transformations. The platform includes a credit-based system, task/achievement rewards, and a user gallery for managing generated content.

### Design Language
- **Aesthetic**: Luxury editorial - thin typography, generous whitespace, minimal ornamentation
- **Color Palette**: Warm dark background (hue 30) with golden/amber accent (hue 38, 75% saturation)
- **Typography**: Light font weights (300) for headings, uppercase tracked eyebrow labels, DM Sans font family
- **Layout**: Editorial magazine-style sections with generous spacing (space-y-28), grid-of-dividers for capability cards
- **Identity**: Distinctive from competitors - no colorful gradient card overlays, no flashy badges, refined minimalism

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, with custom hooks for auth and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration and CSS variables for theming
- **Path Aliases**: `@/` for client source, `@shared/` for shared code, `@assets/` for attached assets

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **Build System**: Custom build script using esbuild for server bundling and Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` with additional models in `shared/models/`
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Key Tables**: users, sessions, generations, userCredits, tasks, userTaskProgress, aiModels, apps, inspirations, creditPackages, conversations, messages

### Authentication Flow
- Dual authentication: Local email/password registration + Replit OIDC for admins
- Local auth: bcrypt password hashing (12 rounds), Zod validation, auto-login on register
- Session storage in PostgreSQL sessions table via connect-pg-simple
- `isAuthenticated` middleware supports both OIDC (with token refresh) and local sessions
- `getUserId(req)` / `getUserEmail(req)` helpers normalize user identity across auth types
- All generation endpoints enforce ownership checks (userId match)
- Admin routes enforce server-side admin authorization via `isAdmin()` check
- Admin check queries both `allowedUsers` and `users` tables for admin status

### AI Integrations
- **kie.ai API**: Primary AI backend (`server/kie-client.ts`) - supports 30+ models via https://api.kie.ai
  - Image models (14): GPT-Image-1, GPT-Image-1.5, Nano Banana, Nano Banana Pro, Flux Kontext Pro, Seedream 4.0/4.5, Midjourney V7/NIJI 7, Ideogram V3, Grok Imagine, Recraft V3, Qwen Image
  - Video models (16): Veo 3/3.1, Kling 3.0/2.6, Runway Aleph, Sora 2/Pro, Seedance 1.0/1.5, WAN 2.5, Hailuo 2.3 Pro, Vidu Q3 Pro, Midjourney Video
  - Async generation flow: submit task → poll status → download result
- **Model API endpoints**: GET /api/models/image, GET /api/models/video - all frontend pages fetch models dynamically
- **Replit AI Integrations**: OpenAI-compatible API for chat, audio, batch processing (in `server/replit_integrations/`)

### Credit System
- Users have plan credits and additional credits
- Different generation types cost varying credit amounts
- Tasks/achievements reward users with bonus credits
- Credit packages available for purchase

## External Dependencies

### Core Services
- **PostgreSQL Database**: Required for all data persistence (provisioned via Replit)
- **Replit Auth**: OpenID Connect authentication (configured via ISSUER_URL)
- **OpenAI API**: AI integrations via Replit's AI Integrations (AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL)

### Key npm Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `openid-client` / `passport`: Authentication
- `express-session` / `connect-pg-simple`: Session management
- `zod` / `drizzle-zod`: Schema validation
- `openai`: AI API client

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer (defaults to https://replit.com/oidc)
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key for AI features
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL