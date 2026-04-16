# CollabChat Board - MVP

A production-ready web app for real-time collaboration: chat, whiteboard, and AI-powered insights.

## Features

- **Real-Time Chat**: Live messaging with typing indicators and message history
- **Collaborative Whiteboard**: Draw, annotate, and design together with Fabric.js
- **Presence & Cursors**: See who's online and track their cursors
- **Room-Based**: Create or join rooms with invite codes
- **AI Assistant**: Summarize discussions, extract action items, suggest diagrams, generate plans
- **Authentication**: Email/password signup and login with JWT
- **Persistent State**: Messages, room data, and whiteboard snapshots stored in database
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite for fast builds
- Zustand for state management
- Socket.IO client for real-time sync
- Fabric.js for collaborative whiteboard
- Tailwind CSS for styling

**Backend**
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL database
- Socket.IO for real-time events
- JWT authentication
- Zod for validation

**Shared**
- Typed event contracts
- Shared validation schemas
- TypeScript type definitions

## Prerequisites

- **Node.js** 18+ or 20+  
  Download from: https://nodejs.org/
- **npm** (comes with Node.js)
- **PostgreSQL** 12+ or **Supabase**  
  - PostgreSQL: https://www.postgresql.org/download/
  - Supabase: https://supabase.com (easier for MVP)

## Installation & Setup

### 1. Install Node.js

Download and install from https://nodejs.org/ (LTS recommended)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
cd c:\Users\NIs\Desktop\clg
npm install
```

This installs dependencies for all workspaces (server, client, shared).

### 3. Set Up Database

#### Option A: Supabase (Recommended for MVP)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Copy the connection string from Project Settings → Database
4. Update `.env` file in `/server` with your connection string

#### Option B: Local PostgreSQL
1. Install PostgreSQL
2. Create a database: `createdb collabchat`
3. Update `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/collabchat
   ```

### 4. Initialize Database

```bash
cd server
npm run db:generate
npm run db:push
```

### 5. Set Up Environment Variables

**Server** (`/server/.env`):
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-key-here  (optional for MVP, mocked)
CORS_ORIGIN=https://collab-chat-board-by-benjamin-clien.vercel.app/
```

**Client** (`/client/.env`):
```
VITE_API_URL=https://collabchatboardbybenjamin-production.up.railway.app
VITE_SOCKET_URL=https://collabchatboardbybenjamin-production.up.railway.app
```

## Running Locally

### Development Mode (Both Client & Server)

From the root directory:
```bash
npm run dev
```

This will start:
- **Backend**: https://collabchatboardbybenjamin-production.up.railway.app
- **Frontend**: https://collab-chat-board-by-benjamin-clien.vercel.app/

### Individual Commands

**Start only backend**:
```bash
cd server
npm run dev
```

**Start only frontend**:
```bash
cd client
npm run dev
```

**Build for production**:
```bash
npm run build
```

**Type checking**:
```bash
npm run typecheck
```

## Project Structure

```
clg/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Landing, Login, Signup, Dashboard, Room
│   │   ├── components/    # ChatPanel, Whiteboard, AISidebar
│   │   ├── stores/        # Zustand stores (auth, rooms, chat, whiteboard, ai, socket)
│   │   ├── App.tsx
│   │   ├── AppRoutes.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # auth, rooms, messages, ai
│   │   ├── services/      # auth, rooms, messages, whiteboard, ai
│   │   ├── middleware/    # auth, error handling
│   │   ├── server.ts
│   │   └── socket.ts
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── tsconfig.json
│   └── package.json
│
├── packages/
│   └── shared/             # Shared types and schemas
│       ├── src/
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
│
├── package.json           # Workspace config
└── README.md             # This file
```

## Core Features

### 1. Authentication
- Sign up with email and password
- Login with credentials
- JWT-based session management
- Protected routes

### 2. Rooms
- Create new rooms
- Join rooms with invite code
- View all member rooms on dashboard
- Copy invite code for sharing

### 3. Real-Time Chat
- Send and receive messages live
- Typing indicators
- Message history persistence
- Join/leave system messages
- Timestamps

### 4. Collaborative Whiteboard
- Draw, erase, add shapes (rect, circle, line, arrow)
- Add text
- Select and move objects
- Delete individual objects
- Clear entire board
- Save snapshots for persistence
- Real-time sync across participants
- Presence indicators

### 5. AI Assistant (Sidebar)
Features (mock responses in MVP):
- **Summarize Chat**: Extract key points and decisions
- **Extract Action Items**: Identify tasks with priority and owner
- **Suggest Diagram**: Generate flowchart recommendations
- **Generate Plan**: Create implementation roadmap

### 6. Responsive UI
- Mobile-friendly layout with tabbed interface
- Desktop layout with side panels
- Real-time presence avatars
- Clean Tailwind styling

## API Endpoints

### Auth
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Rooms
- `POST /api/rooms` - Create room (protected)
- `GET /api/rooms` - List user's rooms (protected)
- `GET /api/rooms/:roomId` - Get room details (protected)
- `POST /api/rooms/join/:inviteCode` - Join room (protected)

### Messages
- `GET /api/messages/room/:roomId` - Get chat history (protected)

### AI
- `POST /api/ai/summarize-room` - Summarize room (protected)
- `POST /api/ai/extract-actions` - Extract action items (protected)
- `POST /api/ai/suggest-diagram` - Suggest diagram (protected)
- `POST /api/ai/generate-plan` - Generate plan (protected)

## Socket.IO Events

### Room Events
- `room:join` - Join a room
- `room:leave` - Leave a room
- `room:presence` - User presence update
- `room:error` - Room error

### Chat Events
- `chat:message:send` - Send message
- `chat:message:new` - New message received
- `chat:typing` - Typing indicator
- `chat:history` - Chat history on join

### Whiteboard Events
- `board:object:add` - Add object
- `board:object:update` - Update object
- `board:object:delete` - Delete object
- `board:clear` - Clear board
- `board:cursor` - Cursor position
- `board:state:init` - Initialize board state
- `board:snapshot:save` - Save snapshot

## Database Models

### User
- id, name, email, passwordHash, avatarColor, createdAt, updatedAt

### Room
- id, name, inviteCode, ownerId, createdAt, updatedAt

### RoomMember
- id, roomId, userId, role, joinedAt

### Message
- id, roomId, senderId, content, type, createdAt

### WhiteboardSnapshot
- id, roomId, canvasJson, createdById, createdAt

### AIActionLog
- id, roomId, userId, actionType, requestPayload, responsePayload, createdAt

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` in environment variables
4. Deploy

### Backend (Railway or Render)
1. Create account on Railway.com or Render.com
2. Connect GitHub repository
3. Set environment variables (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, etc.)
4. Deploy

### Database (Supabase)
- Use Supabase Postgres (included with free tier)
- Automatically backed up and maintained

## Development Workflow

### Adding Features
1. Update Prisma schema if needed
2. Run migrations: `npm run db:migrate` (server only)
3. Implement backend routes/services
4. Implement frontend components/stores
5. Update shared types if needed
6. Test locally with both browser windows

### Running Tests
Currently no tests; add with Jest/Vitest as needed

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run typecheck
```

## Known Limitations & Future Improvements

### MVP Limitations
- AI features use mock responses (not integrated with OpenAI yet)
- Whiteboard doesn't support all Fabric.js features (text editing, layers, etc.)
- No rate limiting on API calls
- No file uploads or attachments
- No rich text editor for chat
- Simple conflict resolution on concurrent edits

### Future Features
- OpenAI integration for real AI features
- File/image sharing in chat
- Whiteboard redo/undo stack
- Room permissions (admin, read-only)
- Chat search and filtering
- Activity log / audit trail
- Custom themes (light/dark mode)
- Mobile app (React Native)
- Recording/playback of sessions
- Integration with calendar/Slack

## Troubleshooting

### Port Already in Use
If port 3001 is busy:
```bash
# Kill process using port 3001
npx kill-port 3001
```

### Database Connection Error
- Verify DATABASE_URL is correct
- Ensure PostgreSQL server is running
- For Supabase, check connection string hasn't expired

### Socket.IO Connection Failed
- Ensure backend is running on port 3001
- Check CORS_ORIGIN in server .env matches frontend URL
- Check browser console for errors

### Build Errors
```bash
# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
npm run build
```

## Contributing

This MVP is a starting point. To add features:
1. Create a feature branch
2. Implement changes with types
3. Update tests if applicable
4. Create a PR with clear description

## Support

For issues or questions:
1. Check this README
2. Review code comments
3. Check TypeScript types for API contracts
4. Review Socket.IO events in types.ts

## License

MIT
