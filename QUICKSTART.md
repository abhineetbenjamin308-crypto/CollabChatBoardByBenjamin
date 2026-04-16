# Quick Start Guide

## Prerequisites Check
Before starting, verify you have installed:
- **Node.js 18+** from https://nodejs.org/
- **PostgreSQL 12+** or **Supabase account**

To verify:
```bash
node --version
npm --version
```

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd c:\Users\NIs\Desktop\clg
npm install
```

### 2. Set Up Database

**Using Supabase (Easiest):**
1. Create free account at https://supabase.com
2. Create a project
3. Copy connection string
4. In `/server/.env`, set: `DATABASE_URL=your-connection-string`

**Using Local PostgreSQL:**
```bash
createdb collabchat
# Update /server/.env with: DATABASE_URL=postgresql://user:password@localhost:5432/collabchat
```

### 3. Initialize Database
```bash
cd server
npm run db:generate
npm run db:push
cd ..
```

### 4. Start Development Servers
```bash
npm run dev
```

This starts:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## Next Steps

1. Open http://localhost:5173 in browser
2. Sign up with any email/password
3. Create a room
4. Copy invite code
5. Open another browser window/tab and login with different account
6. Join room with invite code
7. Start chatting and drawing!

## Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/

### "npm.ps1 cannot be loaded because running scripts is disabled"
- Use `npm.cmd` instead of `npm` in PowerShell, for example: `npm.cmd run dev`
- Or enable script execution for your user: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### "Port 3001 already in use"
```bash
npx kill-port 3001
```

### "Database connection refused"
- Check `DATABASE_URL` in `/server/.env`
- Ensure PostgreSQL is running

### "CORS error in browser console"
- Stop and restart server: `npm run dev`

## Need Help?

See [README.md](./README.md) for full documentation.
