# Goalaris

AI-powered career goal tracking for enterprise professionals.

## Overview

Goalaris helps working professionals track progress on annual goals and prepare for self-assessments. With AI-powered coaching, employees can:

- Create SMART goals with AI guidance
- Break goals into actionable tasks
- Log progress and track achievements
- Generate self-assessment summaries

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: API Routes + Server Components
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude
- **UI Components**: Shadcn/ui + Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Anthropic API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Setup environment variables:

```bash
cp .env.example .env.local
```

Then update `.env.local` with:
- Supabase URL and keys
- Anthropic API key

3. Setup Supabase locally:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:reset` - Reset local database
- `npm run db:types` - Generate TypeScript types from Supabase schema

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.

## Contributing

This project uses:
- TypeScript for type safety
- Prettier for code formatting
- ESLint for code quality
- Tailwind CSS for styling

## License

ISC
