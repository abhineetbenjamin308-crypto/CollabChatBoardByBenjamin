# Deployment Guide

## Prerequisites
- GitHub account for source control
- Vercel account (for frontend) - https://vercel.com
- Railway or Render account (for backend) - https://railway.app or https://render.com
- Supabase account (for database) - https://supabase.com

## Step 1: Database Setup (Supabase)

1. Create free project at https://supabase.com
2. Go to Project Settings → Database
3. Copy the "Connection Pooling" string
4. Save this URL - you'll need it for backend

## Step 2: Deploy Backend (Railway.app Recommended)

### Using Railway

1. Go to https://railway.app
2. Click "Get Started" → "Deploy from GitHub repo"
3. Connect GitHub and select your `clg` repo
4. Railway will auto-detect Node.js project
5. Add environment variables:
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=<your-supabase-connection-string>
   JWT_SECRET=<generate-random-secret>
   CORS_ORIGIN=<your-frontend-url-here>
   OPENAI_API_KEY=<optional-for-mvp>
   ```
6. Deploy
7. Note your backend URL (e.g., `https://app-name.railway.app`)

### Using Render

1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repo
4. Set:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
5. Add environment variables (same as above)
6. Deploy

## Step 3: Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Click "Import Project" → paste GitHub repo URL
3. Select `client` folder as root
4. Add environment variables:
   ```
   VITE_API_URL=<your-backend-url>
   VITE_SOCKET_URL=<your-backend-url>
   ```
5. Deploy

## Step 4: Update CORS

Update your backend's environment variable:
```
CORS_ORIGIN=<your-vercel-frontend-url>
```

Then redeploy backend.

## Step 5: Test

1. Open your Vercel frontend URL
2. Sign up and create a room
3. Open in another browser window
4. Join the room and test chat/whiteboard

## Monitoring

### Backend Logs (Railway)
- Go to your Railway project
- Click "Deployments" tab
- View logs

### Frontend Errors (Vercel)
- Go to your Vercel project
- Click "Analytics" or "Logs"

## Scaling Considerations

### Current Limits
- Supabase free tier: 500MB database, 2GB bandwidth/month
- Railway: 500 hours/month free
- Vercel: unlimited requests for hobby plan

### Upgrade Path
When you hit limits:
1. **Database**: Upgrade Supabase plan or move to AWS RDS
2. **Backend**: Upgrade Railway plan or move to AWS ECS
3. **Frontend**: Already unlimited on Vercel

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Backup database (Supabase auto-backups)
- Review user feedback

### Updating Code
1. Push changes to GitHub
2. Vercel auto-deploys frontend
3. Choose to auto-deploy backend or manually trigger

## Environment Variable Checklist

**Backend (.env)**
- [ ] DATABASE_URL (from Supabase)
- [ ] JWT_SECRET (random generated)
- [ ] CORS_ORIGIN (your frontend URL)
- [ ] PORT (usually 3001)
- [ ] NODE_ENV=production
- [ ] OPENAI_API_KEY (optional)

**Frontend (.env)**
- [ ] VITE_API_URL (your backend URL)
- [ ] VITE_SOCKET_URL (your backend URL, same as API_URL)

## Troubleshooting Deployment

### 502 Bad Gateway
- Check backend logs
- Verify DATABASE_URL is correct
- Ensure backend is running

### CORS Errors
- Check CORS_ORIGIN matches frontend URL exactly
- Include protocol (https://)
- Restart backend after changing

### Build Fails
- Check logs for errors
- Ensure all dependencies are in package.json
- Verify TypeScript compiles: `npm run typecheck`

### Database Connection Timeout
- Check DATABASE_URL format
- Verify Supabase project is active
- Try restarting backend service

## Cost Estimate (Monthly)

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Supabase | $0-25 | 500MB free, scales with usage |
| Railway | $0-20 | 500 hours free, generous limits |
| Vercel | $0 | Unlimited for frontend |
| **Total** | **$0/month** (with limits) | ~$50-100/month at scale |

For a small team MVP, you can stay on free/low-cost tiers indefinitely.

## Next Steps

After deploying:
1. Share your app URL with team
2. Set up custom domain (optional)
3. Add monitoring/alerting (optional)
4. Plan feature releases
