# Project Structure

## Overview

CollabChat Board is a monorepo with three main packages:
- **client/** - React frontend
- **server/** - Node.js backend
- **packages/shared/** - Shared types and schemas

## Directory Structure

```
clg/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── AISidebar.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Whiteboard.tsx  # Whiteboard logic + Socket sync
│   │   ├── pages/             # Route components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Room.tsx       # Main room workspace
│   │   │   └── Signup.tsx
│   │   ├── stores/            # Zustand state stores
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── rooms.ts
│   │   │   ├── socket.ts
│   │   │   ├── subscription.ts # Plan gating logic
│   │   │   └── whiteboard.ts
│   │   ├── App.tsx
│   │   ├── AppRoutes.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── packages/
│   └── shared/                # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts
│       │   └── types.ts        # Zod schemas + Socket events
│       ├── package.json
│       └── tsconfig.json
├── server/                    # Express + Socket.IO backend
│   ├── prisma/
│   │   └── schema.prisma      # DB Model definitions
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.ts      # Centralized Prisma instance
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT auth middleware
│   │   ├── routes/            # API endpoints
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── messages.ts
│   │   │   └── rooms.ts
│   │   ├── services/          # Business logic
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── messages.ts
│   │   │   ├── rooms.ts
│   │   │   └── whiteboard.ts
│   │   ├── server.ts          # Main Express entry point
│   │   └── socket.ts          # Socket.IO event handlers
│   ├── package.json
│   └── tsconfig.json
├── BUILD_SUMMARY.md
├── DEPLOYMENT.md
├── package.json               # Workspace root package.json
├── PROJECT_MANIFEST.md
├── QUICKSTART.md
├── README.md
├── START_HERE.md
└── STRUCTURE.md               # This file
```

## Key Architecture Notes

### Frontend (client/)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand stores (Modular for Auth, Whiteboard, and Subscriptions)
- **Real-time**: Socket.IO client integrated into components for low-latency sync
- **Whiteboard**: Fabric.js with a fixed 1200x800 logical coordinate system

### Backend (server/)
- **Runtime**: Node.js + Express + TypeScript (ESM)
- **Database**: Prisma ORM + PostgreSQL (Centralized instance for deployment stability)
- **Real-time**: Socket.IO with room-scoped broadcasting
- **Auth**: JWT tokens
- **Validation**: Zod schemas (Imported from shared package)

### Shared (packages/shared/)
- **Purpose**: Type-safe contracts between frontend/backend
- **Contents**: TypeScript interfaces, Zod schemas, Socket Event constants
- **Usage**: Imported by both client and server via npm workspaces

## Development Workflow

1. **Root**: `npm install` - Installs all dependencies across workspaces
2. **Database**: `npm run db:setup` - Initialize Prisma and generate client
3. **Dev**: `npm run dev` - Start all dev servers (client + server) concurrently
4. **Build**: `npm run build` - Build all packages in correct order (shared -> server -> client)

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.
