# PlanDex

A minimal planning tool built with Next.js App Router, TypeScript, Tailwind CSS, Zod, and Prisma.

## Features

- Multiple planning boards
- Native drag and drop Kanban columns
- Custom labels and tags
- Task dependencies
- Planning and scheduling overview
- Todo checklist view

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

The Prisma schema is configured for SQL Server in `prisma/schema.prisma`.
Copy `.env.example` to `.env` and set `DATABASE_URL` before running Prisma commands.
