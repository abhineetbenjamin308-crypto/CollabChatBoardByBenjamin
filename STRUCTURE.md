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
│   │   │   └── Whiteboard.tsx
│   │   ├── pages/             # Route components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Room.tsx
│   │   │   └── Signup.tsx
│   │   ├── stores/            # Zustand state stores
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── rooms.ts
│   │   │   ├── socket.ts
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
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
├── server/                    # Express + Socket.IO backend
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── messages.ts
│   │   │   └── rooms.ts
│   │   ├── services/
│   │   │   ├── ai.ts
│   │   │   ├── auth.ts
│   │   │   ├── messages.ts
│   │   │   ├── rooms.ts
│   │   │   └── whiteboard.ts
│   │   ├── server.ts
│   │   └── socket.ts
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
- **State**: Zustand stores
- **Real-time**: Socket.IO client
- **Whiteboard**: Fabric.js

### Backend (server/)
- **Runtime**: Node.js + Express + TypeScript
- **Database**: Prisma ORM + PostgreSQL
- **Real-time**: Socket.IO
- **Auth**: JWT tokens
- **Validation**: Zod schemas

### Shared (packages/shared/)
- **Purpose**: Type-safe contracts between frontend/backend
- **Contents**: TypeScript interfaces, Zod schemas
- **Usage**: Imported by both client and server

## Development Workflow

1. **Root**: `npm install` - Installs all dependencies
2. **Database**: `npm run db:setup` - Initialize Prisma
3. **Dev**: `npm run dev` - Start all dev servers
4. **Build**: `npm run build` - Build for production

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.